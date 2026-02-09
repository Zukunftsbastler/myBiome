import type {
  Quest,
  Skill,
  QuestProgress,
  GameModifiers,
  CampaignEvent,
  SkillEffect,
} from '@core/types/campaign';
import type { UICapabilities } from '@core/types/ui';
import type { SimulationState } from '@core/types/simulation';
import type { TickResult } from '@core/types/simulation';
import questData from '@data/quests.json';
import skillData from '@data/skills.json';

export class CampaignManager {
  private quests: Quest[];
  private skills: Skill[];
  private questProgress: Map<string, QuestProgress> = new Map();
  private acquiredSkills: Set<string> = new Set();
  private unlockedSkills: Set<string> = new Set(); // available for purchase
  private modifiers: GameModifiers = {
    growthCostMultiplier: 1.0,
    toolCostMultiplier: 1.0,
    fluxGainMultiplier: 1.0,
  };
  private capabilities: UICapabilities = {
    showMoistureValues: false,
    showNutrientValues: false,
    showHiddenTraits: false,
    showGraphs: false,
    allowedLenses: ['OFF'],
  };
  private fluxCapBonus = 0;

  constructor() {
    this.quests = questData as Quest[];
    this.skills = skillData as Skill[];

    // Initialize quest progress
    for (const quest of this.quests) {
      const isLocked = !!quest.prerequisiteQuestId;
      this.questProgress.set(quest.id, {
        questId: quest.id,
        status: isLocked ? 'locked' : 'active',
        stabilityTicks: 0,
      });
    }
  }

  // ── Quest Evaluation (called every tick) ──

  evaluateQuests(state: SimulationState, tickResult: TickResult): CampaignEvent[] {
    const events: CampaignEvent[] = [];

    for (const [questId, progress] of this.questProgress) {
      if (progress.status !== 'active') continue;

      const quest = this.quests.find(q => q.id === questId);
      if (!quest) continue;

      const completed = this.checkTrigger(quest, state, progress);
      if (completed) {
        progress.status = 'completed';
        this.applyReward(quest);
        this.unlockDependents(questId);

        events.push({
          type: 'QUEST_COMPLETED',
          id: quest.id,
          title: quest.title,
          tick: tickResult.tick,
          reward: quest.reward,
        });
      }
    }

    return events;
  }

  private checkTrigger(quest: Quest, state: SimulationState, progress: QuestProgress): boolean {
    const { trigger } = quest;

    switch (trigger.type) {
      case 'THRESHOLD_REACHED': {
        const current = this.resolveMetric(trigger.target, state);
        return current >= trigger.value;
      }

      case 'STABILITY_CHECK': {
        const current = this.resolveMetric(trigger.target, state);
        if (current >= trigger.value) {
          progress.stabilityTicks++;
          return progress.stabilityTicks >= (trigger.duration ?? 0);
        }
        // Reset if condition not met
        progress.stabilityTicks = 0;
        return false;
      }

      case 'DISCOVERY': {
        if (!trigger.traitName) return false;
        for (const [, genome] of state.genomes) {
          const traitValue = (genome as unknown as Record<string, unknown>)[trigger.traitName];
          if (typeof traitValue === 'number' && traitValue > trigger.value) {
            return true;
          }
        }
        return false;
      }
    }
  }

  private resolveMetric(target: string, state: SimulationState): number {
    switch (target) {
      case 'entity_count': {
        let count = 0;
        for (const [, e] of state.entities) {
          if (!e.isDead) count++;
        }
        return count;
      }

      case 'total_biomass': {
        let total = 0;
        for (const [, e] of state.entities) {
          if (!e.isDead) total += e.biomass;
        }
        return total;
      }

      case 'unique_genomes': {
        const ids = new Set<string>();
        for (const [, e] of state.entities) {
          if (!e.isDead) ids.add(e.genomeId);
        }
        return ids.size;
      }

      case 'avg_water': {
        let sum = 0;
        let count = 0;
        for (const [, cell] of state.cells) {
          sum += cell.water;
          count++;
        }
        return count > 0 ? sum / count : 0;
      }

      case 'total_flux':
        return state.totalFlux;

      default:
        return 0;
    }
  }

  private applyReward(quest: Quest): void {
    // flux reward is handled externally via the event
    if (quest.reward.unlockSkill) {
      this.unlockedSkills.add(quest.reward.unlockSkill);
    }
  }

  private unlockDependents(completedQuestId: string): void {
    for (const quest of this.quests) {
      if (quest.prerequisiteQuestId === completedQuestId) {
        const progress = this.questProgress.get(quest.id);
        if (progress && progress.status === 'locked') {
          progress.status = 'active';
        }
      }
    }
  }

  // ── Skill Purchase ──

  purchaseSkill(skillId: string, currentFlux: number): { success: boolean; cost: number; event?: CampaignEvent } {
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) return { success: false, cost: 0 };

    // Already acquired?
    if (this.acquiredSkills.has(skillId)) return { success: false, cost: 0 };

    // Check prerequisite
    if (skill.prerequisiteSkillId && !this.acquiredSkills.has(skill.prerequisiteSkillId)) {
      return { success: false, cost: 0 };
    }

    // Check availability (unlocked via quest or no prerequisite quest needed)
    if (!this.isSkillAvailable(skillId)) return { success: false, cost: 0 };

    // Check cost
    if (currentFlux < skill.cost) return { success: false, cost: 0 };

    // Apply
    this.acquiredSkills.add(skillId);
    this.applySkillEffects(skill);

    return {
      success: true,
      cost: skill.cost,
      event: {
        type: 'SKILL_ACQUIRED',
        id: skill.id,
        title: skill.name,
        tick: 0, // caller sets tick
      },
    };
  }

  private isSkillAvailable(skillId: string): boolean {
    // Tier 1 skills with no prerequisiteSkillId are available if unlocked by quest
    // or if they have no quest gating
    const skill = this.skills.find(s => s.id === skillId);
    if (!skill) return false;

    // If it's unlocked via quest reward
    if (this.unlockedSkills.has(skillId)) return true;

    // Tier 1 skills that aren't gated by any quest: always available
    // (We only gate tier 1 skills behind quests via unlockSkill rewards)
    // If it has a prerequisiteSkillId, check if that's acquired
    if (skill.prerequisiteSkillId) {
      return this.acquiredSkills.has(skill.prerequisiteSkillId);
    }

    return false;
  }

  private applySkillEffects(skill: Skill): void {
    for (const effect of skill.effects) {
      switch (effect.type) {
        case 'MODIFIER':
          this.applyModifier(effect.target, effect.value);
          break;
        case 'UNLOCK_CAPABILITY':
          this.applyCapability(effect as Extract<SkillEffect, { type: 'UNLOCK_CAPABILITY' }>);
          break;
        case 'UNLOCK_FLUX_CAP':
          this.fluxCapBonus += effect.amount;
          break;
        case 'UNLOCK_TOOL':
          // Tool unlocks are handled at UI level
          break;
      }
    }
  }

  private applyModifier(target: string, value: number): void {
    if (target in this.modifiers) {
      (this.modifiers as unknown as Record<string, number>)[target] *= value;
    }
  }

  private applyCapability(effect: Extract<SkillEffect, { type: 'UNLOCK_CAPABILITY' }>): void {
    const cap = effect.capability;
    if (cap === 'allowedLenses') {
      if (Array.isArray(effect.value)) {
        for (const lens of effect.value) {
          if (!this.capabilities.allowedLenses.includes(lens as UICapabilities['allowedLenses'][number])) {
            this.capabilities.allowedLenses.push(lens as UICapabilities['allowedLenses'][number]);
          }
        }
      }
    } else if (typeof effect.value === 'boolean') {
      (this.capabilities as unknown as Record<string, boolean>)[cap] = effect.value;
    }
  }

  // ── Getters ──

  getModifiers(): GameModifiers { return { ...this.modifiers }; }
  getCapabilities(): UICapabilities { return { ...this.capabilities }; }
  getFluxCapBonus(): number { return this.fluxCapBonus; }

  getQuestProgress(): QuestProgress[] {
    return Array.from(this.questProgress.values());
  }

  getQuest(id: string): Quest | undefined {
    return this.quests.find(q => q.id === id);
  }

  getSkills(): Skill[] {
    return this.skills;
  }

  getAvailableSkills(): Skill[] {
    return this.skills.filter(s =>
      !this.acquiredSkills.has(s.id) && this.isSkillAvailable(s.id)
    );
  }

  getAcquiredSkills(): string[] {
    return Array.from(this.acquiredSkills);
  }

  isSkillAcquired(skillId: string): boolean {
    return this.acquiredSkills.has(skillId);
  }
}
