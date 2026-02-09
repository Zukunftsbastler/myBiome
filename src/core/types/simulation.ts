import type { Entity, CellData, Genome, SimulationEvent, WorldConfig } from './index';

/** Seeded pseudo-random number generator returning [0, 1). */
export type PRNG = () => number;

/** Per-tick weather snapshot. */
export interface WeatherState {
  light: number;
  wind: number;
  rain: number;
  temperature: number;
}

/** Configuration for initialising the hex grid. */
export interface GridInitConfig {
  radius: number;
  defaultWater: number;
  defaultNutrients: number;
  defaultGranularity: number;
  defaultOrganicSaturation: number;
  defaultSurfaceRoughness: number;
}

/** Result returned by each simulation tick. */
export interface TickResult {
  tick: number;
  entityCount: number;
  fluxGenerated: number;
  events: SimulationEvent[];
  weather: WeatherState;
  prunedGenomeIds?: string[];
}

/** Full simulation snapshot (read-only queries). */
export interface SimulationState {
  tick: number;
  weather: WeatherState;
  entities: ReadonlyMap<number, Entity>;
  cells: ReadonlyMap<string, CellData>;
  genomes: ReadonlyMap<string, Genome>;
  totalFlux: number;
  config: WorldConfig;
}
