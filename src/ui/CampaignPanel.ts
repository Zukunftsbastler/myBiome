import type { CampaignManager } from '../interaction/CampaignManager';
import type { QuestProgress, Skill, SkillPath } from '@core/types/campaign';

export interface CampaignPanelCallbacks {
  onSkillPurchase?: (skillId: string) => void;
}

const PATH_ORDER: SkillPath[] = ['BIOLOGY', 'ENGINEERING', 'SCIENCE'];
const PATH_LABELS: Record<SkillPath, string> = {
  BIOLOGY: 'Biologie',
  ENGINEERING: 'Ingenieurskunst',
  SCIENCE: 'Wissenschaft',
};
const PATH_COLORS: Record<SkillPath, string> = {
  BIOLOGY: '#46C93A',
  ENGINEERING: '#FFD700',
  SCIENCE: '#00ADB5',
};

export class CampaignPanel {
  private root: HTMLElement;
  private visible = false;
  private callbacks: CampaignPanelCallbacks = {};
  private questContainer!: HTMLElement;
  private skillContainer!: HTMLElement;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'campaign-panel hud__panel';
    container.appendChild(this.root);
    this.build();
  }

  setCallbacks(cb: CampaignPanelCallbacks): void {
    this.callbacks = cb;
  }

  toggle(): void {
    this.visible = !this.visible;
    this.root.classList.toggle('campaign-panel--visible', this.visible);
  }

  show(): void {
    this.visible = true;
    this.root.classList.add('campaign-panel--visible');
  }

  hide(): void {
    this.visible = false;
    this.root.classList.remove('campaign-panel--visible');
  }

  isVisible(): boolean { return this.visible; }

  private build(): void {
    // Title
    const title = document.createElement('div');
    title.className = 'campaign-panel__title';
    title.textContent = 'Kampagne';
    this.root.appendChild(title);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'campaign-panel__close';
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', () => this.hide());
    title.appendChild(closeBtn);

    // Quest section
    const questSection = document.createElement('div');
    questSection.className = 'campaign-panel__section';
    const questTitle = document.createElement('div');
    questTitle.className = 'campaign-panel__section-title';
    questTitle.textContent = 'Aufgaben';
    questSection.appendChild(questTitle);
    this.questContainer = document.createElement('div');
    questSection.appendChild(this.questContainer);
    this.root.appendChild(questSection);

    // Skill tree section
    const skillSection = document.createElement('div');
    skillSection.className = 'campaign-panel__section';
    const skillTitle = document.createElement('div');
    skillTitle.className = 'campaign-panel__section-title';
    skillTitle.textContent = 'Skilltree';
    skillSection.appendChild(skillTitle);
    this.skillContainer = document.createElement('div');
    this.skillContainer.className = 'campaign-panel__skill-grid';
    skillSection.appendChild(this.skillContainer);
    this.root.appendChild(skillSection);
  }

  update(manager: CampaignManager, currentFlux: number): void {
    this.renderQuests(manager);
    this.renderSkills(manager, currentFlux);
  }

  private renderQuests(manager: CampaignManager): void {
    this.questContainer.innerHTML = '';
    const progress = manager.getQuestProgress();

    // Show active and recently completed quests
    const visible = progress.filter(p => p.status === 'active' || p.status === 'completed');
    // Sort: active first, then completed
    visible.sort((a, b) => {
      if (a.status === 'active' && b.status !== 'active') return -1;
      if (a.status !== 'active' && b.status === 'active') return 1;
      return 0;
    });

    for (const qp of visible.slice(0, 5)) {
      const quest = manager.getQuest(qp.questId);
      if (!quest) continue;
      this.questContainer.appendChild(this.createQuestItem(quest, qp));
    }

    if (visible.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'campaign-panel__empty';
      empty.textContent = 'Keine aktiven Aufgaben.';
      this.questContainer.appendChild(empty);
    }
  }

  private createQuestItem(quest: { title: string; description: string; trigger: { duration?: number } ; reward: { flux?: number } }, progress: QuestProgress): HTMLElement {
    const el = document.createElement('div');
    el.className = 'campaign-panel__quest';
    if (progress.status === 'completed') {
      el.classList.add('campaign-panel__quest--completed');
    }

    const name = document.createElement('div');
    name.className = 'campaign-panel__quest-name';
    name.textContent = progress.status === 'completed' ? `\u2713 ${quest.title}` : quest.title;
    el.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'campaign-panel__quest-desc';
    desc.textContent = quest.description;
    el.appendChild(desc);

    // Progress bar for STABILITY_CHECK
    if (progress.status === 'active' && quest.trigger.duration) {
      const bar = document.createElement('div');
      bar.className = 'campaign-panel__progress-bar';
      const fill = document.createElement('div');
      fill.className = 'campaign-panel__progress-fill';
      const pct = Math.min(100, (progress.stabilityTicks / quest.trigger.duration) * 100);
      fill.style.width = `${pct}%`;
      bar.appendChild(fill);
      el.appendChild(bar);

      const label = document.createElement('div');
      label.className = 'campaign-panel__progress-label';
      label.textContent = `${progress.stabilityTicks}/${quest.trigger.duration} Ticks`;
      el.appendChild(label);
    }

    // Reward preview
    if (quest.reward.flux && progress.status === 'active') {
      const reward = document.createElement('div');
      reward.className = 'campaign-panel__quest-reward';
      reward.textContent = `Belohnung: ${quest.reward.flux} Flux`;
      el.appendChild(reward);
    }

    return el;
  }

  private renderSkills(manager: CampaignManager, currentFlux: number): void {
    this.skillContainer.innerHTML = '';
    const skills = manager.getSkills();

    for (const path of PATH_ORDER) {
      const col = document.createElement('div');
      col.className = 'campaign-panel__skill-col';

      const header = document.createElement('div');
      header.className = 'campaign-panel__skill-path';
      header.style.color = PATH_COLORS[path];
      header.textContent = PATH_LABELS[path];
      col.appendChild(header);

      const pathSkills = skills
        .filter(s => s.path === path)
        .sort((a, b) => a.tier - b.tier);

      for (const skill of pathSkills) {
        col.appendChild(this.createSkillNode(skill, manager, currentFlux));
      }

      this.skillContainer.appendChild(col);
    }
  }

  private createSkillNode(skill: Skill, manager: CampaignManager, currentFlux: number): HTMLElement {
    const acquired = manager.isSkillAcquired(skill.id);
    const available = !acquired && manager.getAvailableSkills().some(s => s.id === skill.id);
    const canAfford = currentFlux >= skill.cost;

    const el = document.createElement('div');
    el.className = 'campaign-panel__skill';
    if (acquired) el.classList.add('campaign-panel__skill--acquired');
    else if (available && canAfford) el.classList.add('campaign-panel__skill--available');
    else el.classList.add('campaign-panel__skill--locked');

    const name = document.createElement('div');
    name.className = 'campaign-panel__skill-name';
    name.textContent = skill.name;
    el.appendChild(name);

    const desc = document.createElement('div');
    desc.className = 'campaign-panel__skill-desc';
    desc.textContent = skill.description;
    el.appendChild(desc);

    if (!acquired) {
      const cost = document.createElement('div');
      cost.className = 'campaign-panel__skill-cost';
      cost.textContent = `${skill.cost} Flux`;
      el.appendChild(cost);
    }

    if (available && canAfford) {
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => {
        this.callbacks.onSkillPurchase?.(skill.id);
      });
    }

    return el;
  }
}
