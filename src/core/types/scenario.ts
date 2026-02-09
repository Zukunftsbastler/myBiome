// ── Scenario & Objective Types ──

export type ObjectiveType = 'COVERAGE' | 'DIVERSITY' | 'PURIFICATION' | 'SURVIVAL';

export interface WinCondition {
  type: ObjectiveType;
  target: string;         // e.g. genome ID for COVERAGE, or '' for general
  threshold: number;      // 0-1 fraction for COVERAGE/PURIFICATION, count for DIVERSITY
  duration?: number;      // ticks the condition must be sustained
}

export interface LoseCondition {
  type: 'INVASION_OVERRUN' | 'FLUX_BANKRUPT';
  threshold: number;      // fraction of cells for INVASION_OVERRUN, flux amount for FLUX_BANKRUPT
}

export interface InvasionConfig {
  speciesPool: string[];  // genome IDs of invasive species
  spawnRate: number;      // probability per tick (0-1)
  preferEdge: number;     // 0-1: bias toward spawning on map edges (wind vs bird dispersal)
}

export interface ScenarioMapConfig {
  biomeId: string;        // references ScenarioDefinition.id in scenarios.ts
  size: number;           // hex grid radius
  seed?: number;          // optional deterministic seed
}

export interface ScenarioConstraints {
  allowedGenomes?: string[];   // restrict player to these genome IDs (null = all)
  lockedTools?: string[];      // tool types to disable
}

export interface StartingPlacement {
  genomeId: string;
  position: { q: number; r: number };
  type: 'PLANT' | 'SEED';
}

export interface ScenarioConfig {
  id: string;
  tier: number;           // difficulty tier (1 = tutorial)
  title: string;
  description?: string;
  mapConfig: ScenarioMapConfig;
  invasion?: InvasionConfig;
  objectives: WinCondition[];
  loseConditions?: LoseCondition[];
  constraints?: ScenarioConstraints;
  startingGenomes: string[];          // genome IDs to register
  startingPlacements?: StartingPlacement[];
}

// ── Runtime State ──

export interface ObjectiveProgress {
  objective: WinCondition;
  currentValue: number;   // current measured value
  met: boolean;           // threshold met right now
  sustainedTicks: number; // consecutive ticks condition met
  completed: boolean;     // permanently done
}

export type ScenarioOutcome = 'IN_PROGRESS' | 'WON' | 'LOST';

export interface ScenarioStatus {
  outcome: ScenarioOutcome;
  objectives: ObjectiveProgress[];
  loseCause?: string;     // which lose condition triggered
}

// ── Speed Control ──

export type SpeedLevel = 'PAUSE' | 'PLAY' | 'FAST' | 'MAX';
