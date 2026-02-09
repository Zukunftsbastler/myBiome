import type { Entity, Genome } from '@core/types';
import type { PRNG, WeatherState } from '@core/types/simulation';
import { GridManager } from '@core/grid/GridManager';
import { SIM_CONSTANTS as C } from '@core/math/constants';
import { calculateErosion, deriveRootDensity, hexNeighbors, hexKey } from '@core/math/simulationUtils';

export class EnvironmentSystem {
  /**
   * Compute weather for the current tick (deterministic sinusoidal cycles).
   */
  computeWeather(tick: number, baseTemp: number): WeatherState {
    const lightPhase = (tick / C.WEATHER_CYCLE_LENGTH) * Math.PI * 2;
    const rainPhase = lightPhase + Math.PI; // offset by half cycle
    const windPhase = (tick / C.WIND_CYCLE_LENGTH) * Math.PI * 2;

    return {
      light: C.BASE_LIGHT + Math.sin(lightPhase) * C.LIGHT_AMPLITUDE,
      rain: Math.max(0, C.BASE_RAIN + Math.sin(rainPhase) * C.RAIN_AMPLITUDE),
      wind: Math.max(0, C.BASE_WIND + Math.sin(windPhase) * C.WIND_AMPLITUDE),
      temperature: baseTemp + Math.sin(lightPhase) * 5,
    };
  }

  /**
   * Run all abiotic updates for one tick.
   */
  update(
    grid: GridManager,
    entities: ReadonlyMap<number, Entity>,
    genomes: ReadonlyMap<string, Genome>,
    weather: WeatherState,
    _rng: PRNG,
  ): void {
    // Pass 1: Per-cell abiotic dynamics
    for (const cell of grid.getAllCells()) {
      const { q, r } = cell.position;

      // Rain → adds water
      const rainWater = weather.rain * C.RAIN_ABSORPTION_RATE;
      const newWater = cell.water + rainWater;

      // Evaporation (reduced by shade)
      const evapFactor = 1.0 - cell.shade * C.SHADE_EVAPORATION_REDUCTION;
      const evaporation = C.EVAPORATION_RATE * evapFactor * Math.max(0, weather.temperature / 25);
      const afterEvap = Math.max(0, newWater - evaporation);

      // Drainage (high granularity = fast drainage)
      const drainage = C.DRAINAGE_RATE * cell.granularity;
      const finalWater = Math.max(0, afterEvap - drainage);

      // Decomposition: organic → nutrients (requires moisture)
      const moistureFactor = Math.min(1.0, cell.water * 2);
      const decomposed = cell.organicSaturation * C.DECOMPOSITION_RATE * moistureFactor;
      const newOrganic = cell.organicSaturation - decomposed;
      const newNutrients = cell.nutrients + decomposed;

      // Erosion: loses organic matter
      const entityIds = grid.getEntitiesAt(q, r);
      let totalRootDensity = 0;
      for (const eid of entityIds) {
        const ent = entities.get(eid);
        if (!ent || ent.isDead || ent.type !== 'PLANT') continue;
        const g = genomes.get(ent.genomeId);
        if (g) totalRootDensity += deriveRootDensity(g, ent.biomass);
      }
      totalRootDensity = Math.min(1, totalRootDensity);

      const erosion = calculateErosion(cell, weather, totalRootDensity);
      const organicAfterErosion = Math.max(0, newOrganic - erosion * 0.01);

      // Biofilm dynamics
      let newBiofilm = cell.biofilmIntegrity;
      if (cell.water > 0.3 && cell.organicSaturation > 0.1) {
        newBiofilm += C.BIOFILM_GROWTH_RATE;
      } else {
        newBiofilm -= C.BIOFILM_DECAY_RATE;
      }

      // Toxin decay
      const newToxin = cell.toxin * (1.0 - C.TOXIN_DECAY_RATE);

      // Nitrogen fixation from entities on this cell
      let fixedNutrients = 0;
      for (const eid of entityIds) {
        const ent = entities.get(eid);
        if (!ent || ent.isDead || ent.type !== 'PLANT') continue;
        const g = genomes.get(ent.genomeId);
        if (g && g.nitrogenFixation > 0) {
          fixedNutrients += g.nitrogenFixation * C.NITROGEN_FIXATION_NUTRIENT_RATE * ent.biomass;
        }
      }

      // Toxin injection from toxic plants
      let toxinInjection = 0;
      for (const eid of entityIds) {
        const ent = entities.get(eid);
        if (!ent || ent.isDead || ent.type !== 'PLANT') continue;
        const g = genomes.get(ent.genomeId);
        if (g && g.toxicity > 0) {
          toxinInjection += g.toxicity * 0.01 * ent.biomass;
        }
      }

      grid.mutateCell(q, r, {
        water: finalWater,
        nutrients: newNutrients + fixedNutrients,
        organicSaturation: organicAfterErosion,
        biofilmIntegrity: newBiofilm,
        toxin: newToxin + toxinInjection,
      });
    }

    // Pass 2: Nutrient diffusion — surplus > 0.5 spreads 10% to neighbors
    const diffusionDeltas = new Map<string, number>();
    for (const cell of grid.getAllCells()) {
      if (cell.nutrients > 0.5) {
        const surplus = cell.nutrients - 0.5;
        const diffuseAmount = surplus * 0.1;
        const neighbors = hexNeighbors(cell.position);
        let validCount = 0;
        for (const n of neighbors) {
          if (grid.getCell(n.q, n.r)) validCount++;
        }
        if (validCount > 0) {
          const perNeighbor = diffuseAmount / validCount;
          const sourceKey = hexKey(cell.position.q, cell.position.r);
          diffusionDeltas.set(sourceKey, (diffusionDeltas.get(sourceKey) ?? 0) - diffuseAmount);
          for (const n of neighbors) {
            const nKey = hexKey(n.q, n.r);
            if (grid.getCell(n.q, n.r)) {
              diffusionDeltas.set(nKey, (diffusionDeltas.get(nKey) ?? 0) + perNeighbor);
            }
          }
        }
      }
    }
    for (const [key, delta] of diffusionDeltas) {
      const cell = grid.getCellByKey(key);
      if (cell) {
        grid.mutateCell(cell.position.q, cell.position.r, {
          nutrients: cell.nutrients + delta,
        });
      }
    }

    // Pass 3: Recalculate shade and occupancy from entities
    grid.recalculateShade(entities, genomes);
    grid.recalculateOccupancy(entities, genomes);
  }
}
