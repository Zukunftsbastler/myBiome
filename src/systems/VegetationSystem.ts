import type { Entity, Genome, SimulationEvent, HexCoord } from '@core/types';
import type { PRNG, WeatherState } from '@core/types/simulation';
import { GridManager } from '@core/grid/GridManager';
import { SIM_CONSTANTS as C } from '@core/math/constants';
import {
  calculatePhotosynthesis,
  calculateBMR,
  calculateTraitUpkeep,
  calculateMaxStorage,
  calculateGrowthCost,
  calculateFruitCost,
  calculateFluxGain,
  calculateSeedRetention,
  canGerminate,
  deriveGrowthSpeed,
  deriveWaterNeed,
  hexNeighbors,
} from '@core/math/simulationUtils';

export interface VegetationTickResult {
  fluxGenerated: number;
  events: SimulationEvent[];
  entitiesToSpawn: Array<{ type: 'SEED'; genomeId: string; position: HexCoord }>;
  entitiesToRemove: number[];
}

export class VegetationSystem {
  update(
    entities: Map<number, Entity>,
    genomes: ReadonlyMap<string, Genome>,
    grid: GridManager,
    weather: WeatherState,
    tick: number,
    rng: PRNG,
  ): VegetationTickResult {
    let fluxGenerated = 0;
    const events: SimulationEvent[] = [];
    const entitiesToSpawn: VegetationTickResult['entitiesToSpawn'] = [];
    const entitiesToRemove: number[] = [];

    for (const entity of entities.values()) {
      if (entity.isDead) continue;

      if (entity.type === 'SEED') {
        this.processSeed(entity, genomes, grid, weather, tick, rng, events, entitiesToSpawn, entitiesToRemove);
      } else if (entity.type === 'PLANT') {
        const result = this.processPlant(entity, genomes, grid, weather, tick, rng, events, entitiesToSpawn);
        fluxGenerated += result.flux;
        if (result.dead) {
          entitiesToRemove.push(entity.id);
        }
      }
    }

    return { fluxGenerated, events, entitiesToSpawn, entitiesToRemove };
  }

  private processSeed(
    entity: Entity,
    genomes: ReadonlyMap<string, Genome>,
    grid: GridManager,
    weather: WeatherState,
    tick: number,
    rng: PRNG,
    events: SimulationEvent[],
    spawns: VegetationTickResult['entitiesToSpawn'],
    removals: number[],
  ): void {
    const genome = genomes.get(entity.genomeId);
    if (!genome) return;

    entity.age++;

    // Dormancy countdown
    if (entity.age < C.SEED_DORMANCY_TICKS) return;

    // Germination variance: some seeds wait longer
    const extraDormancy = genome.germinationVariance * C.SEED_DORMANCY_TICKS * 2;
    if (entity.age < C.SEED_DORMANCY_TICKS + rng() * extraDormancy) return;

    const cell = grid.getCell(entity.position.q, entity.position.r);
    if (!cell) return;

    // Retention check: wind might blow seed away
    const retention = calculateSeedRetention(cell, weather);
    if (rng() > retention) {
      // Seed lost to wind
      removals.push(entity.id);
      return;
    }

    // Germination conditions
    if (!canGerminate(cell, genome)) return;

    // Germinate: convert seed to spawn request for a plant
    spawns.push({
      type: 'SEED', // signals "germinate into plant"
      genomeId: entity.genomeId,
      position: { q: entity.position.q, r: entity.position.r },
    });
    removals.push(entity.id);

    events.push({
      tick,
      type: 'ENTITY_SPAWNED',
      location: entity.position,
      subjectId: entity.id,
      cause: 'germination',
      messageKey: 'event.germination',
    });
  }

  private processPlant(
    entity: Entity,
    genomes: ReadonlyMap<string, Genome>,
    grid: GridManager,
    weather: WeatherState,
    tick: number,
    rng: PRNG,
    events: SimulationEvent[],
    spawns: VegetationTickResult['entitiesToSpawn'],
  ): { flux: number; dead: boolean } {
    const genome = genomes.get(entity.genomeId);
    if (!genome) return { flux: 0, dead: false };

    entity.age++;

    const cell = grid.getCell(entity.position.q, entity.position.r);
    if (!cell) return { flux: 0, dead: false };

    let tickFlux = 0;

    // --- Income ---
    const photoGain = calculatePhotosynthesis(genome, entity, cell, weather);
    entity.energy += photoGain;

    // Water consumption
    const waterNeed = deriveWaterNeed(genome, entity.biomass) * C.WATER_CONSUMPTION_RATE;
    const waterConsumed = Math.min(cell.water, waterNeed);
    grid.mutateCell(cell.position.q, cell.position.r, {
      water: cell.water - waterConsumed,
    });

    // Nutrient consumption
    const nutrientNeed = entity.biomass * C.NUTRIENT_CONSUMPTION_RATE;
    const nutrientConsumed = Math.min(cell.nutrients, nutrientNeed);
    grid.mutateCell(cell.position.q, cell.position.r, {
      nutrients: cell.nutrients - nutrientConsumed,
    });

    // --- Expenses ---
    const bmr = calculateBMR(genome, entity);
    const traitUpkeep = calculateTraitUpkeep(genome, entity);
    const totalUpkeep = bmr + traitUpkeep;
    entity.energy -= totalUpkeep;

    // Cap energy at max storage
    const maxStorage = calculateMaxStorage(genome, entity);
    entity.energy = Math.min(entity.energy, maxStorage);

    // --- Growth ---
    const growthSpeed = deriveGrowthSpeed(genome);
    const energyRatio = maxStorage > 0 ? entity.energy / maxStorage : 0;

    if (entity.biomass < genome.maxHeight && energyRatio > 0.3) {
      const deltaVol = C.BASE_GROWTH_INCREMENT * growthSpeed;
      const growCost = calculateGrowthCost(genome, deltaVol);

      if (entity.energy >= growCost) {
        entity.energy -= growCost;
        entity.biomass += deltaVol;
        tickFlux += calculateFluxGain(growCost, 0);
      }
    }

    // --- Reproduction ---
    if (
      energyRatio > C.REPRODUCTION_ENERGY_THRESHOLD &&
      entity.biomass / genome.maxHeight > C.REPRODUCTION_BIOMASS_THRESHOLD
    ) {
      const fruitCost = calculateFruitCost(genome);
      if (entity.energy >= fruitCost) {
        entity.energy -= fruitCost;
        tickFlux += calculateFluxGain(0, fruitCost);

        // Disperse seed to a neighbor cell
        const neighbors = hexNeighbors(entity.position);
        const validTargets = neighbors.filter(n => grid.hasCell(n.q, n.r));
        if (validTargets.length > 0) {
          const target = validTargets[Math.floor(rng() * validTargets.length)];
          spawns.push({
            type: 'SEED',
            genomeId: entity.genomeId,
            position: target,
          });
        }
      }
    }

    // --- Starvation ---
    if (entity.energy <= 0) {
      // Phase 1: Cannibalism — consume own biomass
      const recoverable = entity.biomass * 0.1;
      if (entity.biomass > 0.05) {
        const cannibalised = Math.min(recoverable, entity.biomass - 0.05);
        entity.biomass -= cannibalised;
        entity.energy += cannibalised * C.CANNIBALISM_RECOVERY;
      } else {
        // Phase 2: HP loss
        entity.hp -= C.HP_LOSS_PER_TICK;
      }
    }

    // --- Death ---
    if (entity.hp <= 0) {
      entity.isDead = true;

      // Biomass returns to soil as organic matter
      grid.mutateCell(cell.position.q, cell.position.r, {
        organicSaturation: cell.organicSaturation + entity.biomass * 0.5,
      });

      events.push({
        tick,
        type: 'ENTITY_DIED',
        location: entity.position,
        subjectId: entity.id,
        cause: 'starvation',
        messageKey: 'event.plant_died',
      });

      return { flux: tickFlux, dead: true };
    }

    return { flux: tickFlux, dead: false };
  }
}
