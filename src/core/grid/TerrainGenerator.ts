import type { PRNG } from '@core/types/simulation';
import type { ScenarioMapConfig } from '@core/types/scenario';
import { GridManager } from './GridManager';
import { createNoise2D } from '@core/math/noise';
import { SCENARIOS, type ScenarioDefinition } from '@data/scenarios';
import { SOIL_BY_ID } from '@data/soilTypes';

export class TerrainGenerator {
  /**
   * Applies biome-specific soil types to an already-initialized grid.
   * Uses Perlin noise + scenario composition to assign soil properties per cell.
   */
  static generate(grid: GridManager, mapConfig: ScenarioMapConfig, rng: PRNG): void {
    const scenario = SCENARIOS[mapConfig.biomeId.toUpperCase()] as ScenarioDefinition | undefined;
    if (!scenario) return;

    const noise = createNoise2D(rng);

    for (const cell of grid.getAllCells()) {
      const { q, r } = cell.position;

      // Sample noise at cell position, scaled by scenario frequency
      const n = noise(q * scenario.noiseScale + 100, r * scenario.noiseScale + 100);

      // Select soil pool based on noise thresholds
      let pool: number[];
      if (n < scenario.baseThreshold) {
        pool = scenario.composition.base;
      } else if (n < scenario.patchThreshold) {
        pool = scenario.composition.patches;
      } else {
        pool = scenario.composition.details;
      }

      // Pick a soil type from the pool using PRNG
      const soilId = pool[Math.floor(rng() * pool.length)];
      const soil = SOIL_BY_ID.get(soilId);
      if (!soil) continue;

      // Apply soil properties to cell
      grid.mutateCell(q, r, {
        granularity: soil.granularity,
        compaction: soil.compaction,
        organicSaturation: soil.organic,
        biofilmIntegrity: soil.biofilm,
        surfaceRoughness: soil.roughness,
        water: soil.water,
        nutrients: soil.nutrients,
        toxin: soil.toxin,
      });
    }
  }
}
