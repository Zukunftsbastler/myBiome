import { HexCoord } from './vectors';

export type SimulationEventType =
  | 'ENTITY_SPAWNED'
  | 'ENTITY_DIED'
  | 'CLIMATE_CHANGE'
  | 'INTERACTION'
  | 'FLUX_GAINED'
  | 'QUEST_COMPLETED'
  | 'SKILL_ACQUIRED'
  | 'LEVEL_COMPLETED'
  | 'LEVEL_FAILED'
  | 'INVASION_SEED';

export interface SimulationEvent {
  tick: number;
  type: SimulationEventType;
  location?: HexCoord;
  
  // Details
  subjectId?: number;
  targetId?: number;
  cause?: string;
  value?: number;          // Z.B. Menge an gewonnenem Flux
  messageKey: string;      // i18n Key
}