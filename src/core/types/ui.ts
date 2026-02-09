import type { HexCoord } from './vectors';

// ── Tool System ──

export type ToolType = 'HYDRATE' | 'DESICCATE' | 'ENRICH' | 'STERILIZE' | 'CULL' | 'SEED' | 'INSPECT';

export interface ToolConfig {
  name: string;
  fluxCost: number;
  description: string;
}

export const TOOL_CONFIGS: Record<ToolType, ToolConfig> = {
  INSPECT:    { name: 'Inspect',    fluxCost: 0,  description: 'View cell/entity details' },
  HYDRATE:    { name: 'Hydrate',    fluxCost: 5,  description: 'Add moisture to soil' },
  DESICCATE:  { name: 'Desiccate',  fluxCost: 5,  description: 'Remove moisture from soil' },
  ENRICH:     { name: 'Enrich',     fluxCost: 10, description: 'Add nutrients to soil' },
  STERILIZE:  { name: 'Sterilize',  fluxCost: 20, description: 'Remove biofilm and toxin' },
  CULL:       { name: 'Cull',       fluxCost: 15, description: 'Kill all entities on hex' },
  SEED:       { name: 'Seed',       fluxCost: 10, description: 'Plant a seed from inventory' },
};

// ── Selection ──

export interface SelectionState {
  type: 'cell' | 'entity';
  hex: HexCoord;
  entityId?: number;
}

/**
 * Der Status des Spielers (Meta-Game).
 * Entkoppelt vom Grid.
 */
export interface PlayerProfile {
  flux: number;           // Die Währung (Energie)
  fluxCap: number;        // Speicherlimit (zwingt zu Investition)
  
  // Inventar (Gespeicherte Genome / Samen)
  inventory: InventoryItem[];
  
  // Skilltree-Fortschritt (Was kann das UI anzeigen?)
  capabilities: UICapabilities;

  // Campaign progress
  acquiredSkills: string[];
  completedQuests: string[];
  researchPoints: number;
}

export interface InventoryItem {
  genomeId: string;
  count: number;
  label: string; // Cache für Anzeige (z.B. "Rotfarn-Samen")
}

/**
 * Feature-Flags für das Interface.
 * Siehe UI_UX_STRATEGY.md
 */
export interface UICapabilities {
  showMoistureValues: boolean; // Exakte % anzeigen?
  showNutrientValues: boolean; // NPK Werte anzeigen?
  showHiddenTraits: boolean;   // Gene im Inspector sichtbar?
  showGraphs: boolean;         // Historien-Graphen?
  
  // Welche Linsen sind freigeschaltet?
  allowedLenses: Array<'MOISTURE' | 'NUTRIENTS' | 'TOXIN' | 'OFF'>;
}

/**
 * Die Start-Konfiguration der Welt.
 * Siehe SCENARIO_CONFIG.md
 */
export interface WorldConfig {
  // Entropie
  mutationRate: number;      // 0.0 - 1.0
  eventVolatility: number;   // Wie oft passieren Katastrophen?
  
  // Grenzen
  bioConnectivity: number;   // Wie offen ist das System?
  ambientTemperature: number;// Basis-Temperatur
  
  // Limits
  mapSize: number;           // Radius des Hex-Grids
}