import { HexCoord } from './vectors';

export type SimulationEventType = 
  | 'ENTITY_SPAWNED' 
  | 'ENTITY_DIED' 
  | 'CLIMATE_CHANGE' 
  | 'INTERACTION'
  | 'FLUX_GAINED'; // <--- NEU: Für UI-Feedback

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