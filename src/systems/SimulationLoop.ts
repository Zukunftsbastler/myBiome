import type { Entity, Genome, SimulationEvent, WorldConfig, HexCoord, CellData } from '@core/types';
import type { PRNG, WeatherState, TickResult, SimulationState, GridInitConfig } from '@core/types/simulation';
import { GridManager } from '@core/grid/GridManager';
import { EnvironmentSystem } from './EnvironmentSystem';
import { VegetationSystem } from './VegetationSystem';
import { createPRNG } from '@core/math/simulationUtils';
import { SIM_CONSTANTS as C } from '@core/math/constants';

export class SimulationLoop {
  private tick = 0;
  private totalFlux = 0;
  private nextEntityId = 1;
  private rng: PRNG;

  private entities: Map<number, Entity> = new Map();
  private genomes: Map<string, Genome> = new Map();
  private grid: GridManager;
  private weather: WeatherState = { light: C.BASE_LIGHT, wind: C.BASE_WIND, rain: C.BASE_RAIN, temperature: 20 };

  private environmentSystem: EnvironmentSystem;
  private vegetationSystem: VegetationSystem;

  private config: WorldConfig;

  constructor(config: WorldConfig, seed: number = 42) {
    this.config = config;
    this.rng = createPRNG(seed);
    this.grid = new GridManager();
    this.environmentSystem = new EnvironmentSystem();
    this.vegetationSystem = new VegetationSystem();

    // Initialise grid
    const gridConfig: GridInitConfig = {
      radius: config.mapSize,
      defaultWater: C.DEFAULT_WATER,
      defaultNutrients: C.DEFAULT_NUTRIENTS,
      defaultGranularity: C.DEFAULT_GRANULARITY,
      defaultOrganicSaturation: C.DEFAULT_ORGANIC_SATURATION,
      defaultSurfaceRoughness: C.DEFAULT_SURFACE_ROUGHNESS,
    };
    this.grid.init(gridConfig);
  }

  // ── Genome Registry ──

  registerGenome(genome: Genome): void {
    this.genomes.set(genome.id, genome);
  }

  registerGenomes(genomeList: Genome[]): void {
    for (const g of genomeList) {
      this.registerGenome(g);
    }
  }

  // ── Entity Spawning ──

  spawnEntity(type: Entity['type'], genomeId: string, position: HexCoord): Entity | null {
    if (!this.grid.hasCell(position.q, position.r)) return null;
    const genome = this.genomes.get(genomeId);
    if (!genome) return null;

    const id = this.nextEntityId++;
    const isSeed = type === 'SEED';

    const entity: Entity = {
      id,
      type,
      position: { q: position.q, r: position.r },
      genomeId,
      age: 0,
      hp: isSeed ? C.SEED_BASE_HP : C.DEFAULT_HP,
      biomass: isSeed ? 0.01 : C.DEFAULT_INITIAL_BIOMASS,
      energy: isSeed ? C.SEED_INITIAL_ENERGY : C.DEFAULT_INITIAL_ENERGY,
      waterBuffer: isSeed ? 0 : C.DEFAULT_INITIAL_WATER,
      isDormant: isSeed,
      isDead: false,
    };

    this.entities.set(id, entity);
    this.grid.addEntity(id, position.q, position.r);

    return entity;
  }

  // ── Main Tick ──

  step(): TickResult {
    this.tick++;
    const events: SimulationEvent[] = [];

    // 1. Weather
    this.weather = this.environmentSystem.computeWeather(this.tick, this.config.ambientTemperature);

    // 2. Environment system
    this.environmentSystem.update(this.grid, this.entities, this.genomes, this.weather, this.rng);

    // 3. Vegetation system
    const vegResult = this.vegetationSystem.update(
      this.entities,
      this.genomes,
      this.grid,
      this.weather,
      this.tick,
      this.rng,
    );

    this.totalFlux += vegResult.fluxGenerated;
    events.push(...vegResult.events);

    // Process spawns (seeds from reproduction / germination)
    for (const spawn of vegResult.entitiesToSpawn) {
      if (spawn.type === 'SEED') {
        // If this came from germination (the seed itself is being removed),
        // spawn a PLANT. Otherwise spawn a SEED.
        // Determine: if there's a matching removal for a seed at this position, it's germination
        const isGermination = vegResult.entitiesToRemove.some(rid => {
          const e = this.entities.get(rid);
          return e && e.type === 'SEED' && e.position.q === spawn.position.q && e.position.r === spawn.position.r;
        });

        if (isGermination) {
          this.spawnEntity('PLANT', spawn.genomeId, spawn.position);
        } else {
          this.spawnEntity('SEED', spawn.genomeId, spawn.position);
        }
      }
    }

    // Remove dead / consumed entities
    for (const id of vegResult.entitiesToRemove) {
      const entity = this.entities.get(id);
      if (entity) {
        this.grid.removeEntity(id, entity.position.q, entity.position.r);
        this.entities.delete(id);
      }
    }

    // Also clean up entities flagged as dead but not in removal list
    for (const entity of this.entities.values()) {
      if (entity.isDead) {
        this.grid.removeEntity(entity.id, entity.position.q, entity.position.r);
        this.entities.delete(entity.id);
      }
    }

    return {
      tick: this.tick,
      entityCount: this.entities.size,
      fluxGenerated: vegResult.fluxGenerated,
      events,
      weather: { ...this.weather },
    };
  }

  // ── Read-Only Queries ──

  getState(): SimulationState {
    return {
      tick: this.tick,
      weather: { ...this.weather },
      entities: this.entities,
      cells: this.grid['cells'] as ReadonlyMap<string, any>,
      genomes: this.genomes,
      totalFlux: this.totalFlux,
      config: this.config,
    };
  }

  getEntity(id: number): Entity | undefined {
    return this.entities.get(id);
  }

  getEntityCount(): number {
    return this.entities.size;
  }

  getTotalFlux(): number {
    return this.totalFlux;
  }

  getCurrentTick(): number {
    return this.tick;
  }

  getWeather(): WeatherState {
    return { ...this.weather };
  }

  // ── Tool API ──

  getGrid(): GridManager {
    return this.grid;
  }

  getGenome(id: string): Genome | undefined {
    return this.genomes.get(id);
  }

  mutateCellAt(q: number, r: number, updates: Partial<CellData>): void {
    this.grid.mutateCell(q, r, updates);
  }

  killEntity(id: number): boolean {
    const entity = this.entities.get(id);
    if (!entity) return false;
    entity.isDead = true;
    this.grid.removeEntity(id, entity.position.q, entity.position.r);
    this.entities.delete(id);
    return true;
  }

  getEntitiesAt(q: number, r: number): Entity[] {
    const ids = this.grid.getEntitiesAt(q, r);
    const result: Entity[] = [];
    for (const id of ids) {
      const e = this.entities.get(id);
      if (e) result.push(e);
    }
    return result;
  }
}
