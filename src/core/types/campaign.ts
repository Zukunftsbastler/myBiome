import type { ToolType, UICapabilities } from './ui';

// ── Trigger Types ──

export type TriggerType = 'THRESHOLD_REACHED' | 'STABILITY_CHECK' | 'DISCOVERY';

export interface QuestTrigger {
  type: TriggerType;
  target: string;          // e.g. 'total_biomass', 'entity_count', 'unique_genomes'
  value: number;           // threshold
  duration?: number;       // ticks for STABILITY_CHECK
  traitName?: string;      // for DISCOVERY: which genome trait
}

export interface QuestReward {
  flux?: number;
  unlockSkill?: string;    // skill ID to make available
  unlockTool?: ToolType;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  trigger: QuestTrigger;
  reward: QuestReward;
  prerequisiteQuestId?: string;
}

// ── Runtime Quest Tracking ──

export type QuestStatus = 'locked' | 'active' | 'completed';

export interface QuestProgress {
  questId: string;
  status: QuestStatus;
  stabilityTicks: number;  // accumulated ticks for STABILITY_CHECK
}

// ── Skill Tree ──

export type SkillPath = 'BIOLOGY' | 'ENGINEERING' | 'SCIENCE';

export type SkillEffect =
  | { type: 'MODIFIER'; target: string; value: number }
  | { type: 'UNLOCK_TOOL'; toolType: ToolType }
  | { type: 'UNLOCK_CAPABILITY'; capability: keyof UICapabilities; value: boolean | string[] }
  | { type: 'UNLOCK_FLUX_CAP'; amount: number };

export interface Skill {
  id: string;
  path: SkillPath;
  tier: number;
  name: string;
  description: string;
  cost: number;
  prerequisiteSkillId?: string;
  effects: SkillEffect[];
}

// ── Game Modifiers ──

export interface GameModifiers {
  growthCostMultiplier: number;     // default 1.0
  toolCostMultiplier: number;       // default 1.0
  fluxGainMultiplier: number;       // default 1.0
}

// ── Campaign Events ──

export interface CampaignEvent {
  type: 'QUEST_COMPLETED' | 'SKILL_ACQUIRED';
  id: string;
  title: string;
  tick: number;
  reward?: QuestReward;
}
