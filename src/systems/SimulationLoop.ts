import type { Entity, Genome, SimulationEvent, WorldConfig, HexCoord, CellData, ScenarioConfig, ScenarioStatus, ObjectiveProgress } from '@core/types';
import type { PRNG, WeatherState, TickResult, SimulationState, GridInitConfig } from '@core/types/simulation';
import { GridManager } from '@core/grid/GridManager';
import { TerrainGenerator } from '@core/grid/TerrainGenerator';
import { EnvironmentSystem } from './EnvironmentSystem';
import { VegetationSystem } from './VegetationSystem';
import { InvasionSystem } from './InvasionSystem';
import { ObjectiveTracker } from './ObjectiveTracker';
import { createPRNG, generateRandomGenome } from '@core/math/simulationUtils';
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
  private invasionSystem: InvasionSystem;
  private objectiveTracker: ObjectiveTracker;

  private config: WorldConfig;
  private activeScenario: ScenarioConfig | null = null;
  private lastScenarioStatus: ScenarioStatus | null = null;

  constructor(config: WorldConfig, seed: number = 42) {
    this.config = config;
    this.rng = createPRNG(seed);
    this.grid = new GridManager();
    this.environmentSystem = new EnvironmentSystem();
    this.vegetationSystem = new VegetationSystem();
    this.invasionSystem = new InvasionSystem();
    this.objectiveTracker = new ObjectiveTracker();

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

  // ── Scenario Lifecycle ──

  loadScenario(scenarioConfig: ScenarioConfig, extraGenomes?: Genome[]): void {
    // Reset state
    this.tick = 0;
    this.totalFlux = 0;
    this.nextEntityId = 1;
    this.entities.clear();
    this.genomes.clear();
    this.lastScenarioStatus = null;
    this.activeScenario = scenarioConfig;

    // Re-seed PRNG
    this.rng = createPRNG(scenarioConfig.mapConfig.seed ?? 42);

    // Re-init grid with scenario size
    const gridConfig: GridInitConfig = {
      radius: scenarioConfig.mapConfig.size,
      defaultWater: C.DEFAULT_WATER,
      defaultNutrients: C.DEFAULT_NUTRIENTS,
      defaultGranularity: C.DEFAULT_GRANULARITY,
      defaultOrganicSaturation: C.DEFAULT_ORGANIC_SATURATION,
      defaultSurfaceRoughness: C.DEFAULT_SURFACE_ROUGHNESS,
    };
    this.grid.init(gridConfig);

    // Apply terrain
    TerrainGenerator.generate(this.grid, scenarioConfig.mapConfig, this.rng);

    // Update config map size
    this.config = { ...this.config, mapSize: scenarioConfig.mapConfig.size };

    // Register extra genomes (invasion genomes, etc.)
    if (extraGenomes) {
      this.registerGenomes(extraGenomes);
    }

    // Register starting genomes — they must be already in the genome registry
    // (caller should register them before or pass via extraGenomes)

    // Configure invasion system
    this.invasionSystem.setConfig(
      scenarioConfig.invasion ?? null,
      scenarioConfig.mapConfig.size,
    );

    // Configure objective tracker
    this.objectiveTracker.loadScenario(scenarioConfig);

    // Place starting entities
    if (scenarioConfig.startingPlacements) {
      for (const placement of scenarioConfig.startingPlacements) {
        this.spawnEntity(placement.type, placement.genomeId, placement.position);
      }
    }
  }

  unloadScenario(): void {
    this.activeScenario = null;
    this.lastScenarioStatus = null;
    this.invasionSystem.reset();
    this.objectiveTracker.reset();
  }

  getScenarioStatus(): ScenarioStatus | null {
    if (!this.objectiveTracker.isActive()) return null;
    return this.lastScenarioStatus ?? this.objectiveTracker.getStatus();
  }

  getObjectives(): readonly ObjectiveProgress[] {
    return this.objectiveTracker.getObjectives();
  }

  hasActiveScenario(): boolean {
    return this.activeScenario !== null;
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
      this.config,
    );

    if (vegResult.newGenomes.length > 0) {
      this.registerGenomes(vegResult.newGenomes);
    }

    this.totalFlux += vegResult.fluxGenerated;
    events.push(...vegResult.events);

    // Process spawns (seeds from reproduction / germination)
    for (const spawn of vegResult.entitiesToSpawn) {
      if (spawn.type === 'SEED') {
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

    // 4. Invasion system (after vegetation, deterministic PRNG order)
    const invasionResult = this.invasionSystem.update(
      this.grid,
      this.entities,
      this.tick,
      this.rng,
    );

    for (const spawn of invasionResult.entitiesToSpawn) {
      this.spawnEntity('SEED', spawn.genomeId, spawn.position);
    }
    events.push(...invasionResult.events);

    // Natural seed arrival ("Sporen im Wind") — only base genomes (no _v variants)
    if (this.rng() < C.NATURAL_SEED_CHANCE) {
      const baseIds = Array.from(this.genomes.keys()).filter(id => !id.includes('_v') && !id.startsWith('exotic_'));
      if (baseIds.length > 0) {
        const genomeId = baseIds[Math.floor(this.rng() * baseIds.length)];
        const allCells = Array.from(this.grid.getAllCells());
        const target = allCells[Math.floor(this.rng() * allCells.length)];
        this.spawnEntity('SEED', genomeId, target.position);
      }
    }

    // Exotic seed arrival — completely random new species, spawned as plant
    if (this.tick % C.EXOTIC_SEED_INTERVAL === 0 && this.rng() < C.EXOTIC_SEED_CHANCE) {
      const exotic = generateRandomGenome(this.rng);
      this.registerGenome(exotic);
      const allCells = Array.from(this.grid.getAllCells());
      const target = allCells[Math.floor(this.rng() * allCells.length)];
      this.spawnEntity('PLANT', exotic.id, target.position);
      events.push({
        tick: this.tick,
        type: 'ENTITY_SPAWNED',
        location: target.position,
        messageKey: `Fremdeintrag: ${exotic.name}`,
      });
    }

    // Also clean up entities flagged as dead but not in removal list
    for (const entity of this.entities.values()) {
      if (entity.isDead) {
        this.grid.removeEntity(entity.id, entity.position.q, entity.position.r);
        this.entities.delete(entity.id);
      }
    }

    // 5. Objective tracking (periodic check)
    if (this.objectiveTracker.isActive() && this.tick % C.OBJECTIVE_CHECK_INTERVAL === 0) {
      const outcome = this.objectiveTracker.check(
        this.tick,
        this.grid,
        this.entities,
        this.genomes,
        this.totalFlux,
      );
      if (outcome) {
        this.lastScenarioStatus = outcome;
        if (outcome.outcome === 'WON') {
          events.push({
            tick: this.tick,
            type: 'LEVEL_COMPLETED',
            messageKey: 'Szenario abgeschlossen!',
          });
        } else if (outcome.outcome === 'LOST') {
          events.push({
            tick: this.tick,
            type: 'LEVEL_FAILED',
            messageKey: `Szenario verloren: ${outcome.loseCause}`,
          });
        }
      }
    }

    // Genome garbage collection every 100 ticks
    let prunedGenomeIds: string[] | undefined;
    if (this.tick % 100 === 0) {
      prunedGenomeIds = this.pruneOrphanGenomes();
    }

    return {
      tick: this.tick,
      entityCount: this.entities.size,
      fluxGenerated: vegResult.fluxGenerated,
      events,
      weather: { ...this.weather },
      prunedGenomeIds,
    };
  }

  // ── Genome GC ──

  private pruneOrphanGenomes(): string[] {
    const activeGenomeIds = new Set<string>();
    for (const entity of this.entities.values()) {
      activeGenomeIds.add(entity.genomeId);
    }

    const pruned: string[] = [];
    for (const id of this.genomes.keys()) {
      // Prune variant and exotic genomes with no living entities, keep base genomes
      if ((id.includes('_v') || id.startsWith('exotic_')) && !activeGenomeIds.has(id)) {
        this.genomes.delete(id);
        pruned.push(id);
      }
    }
    return pruned;
  }

  // ── Read-Only Queries ──

  getState(): SimulationState {
    return {
      tick: this.tick,
      weather: { ...this.weather },
      entities: this.entities,
      cells: this.grid['cells'] as ReadonlyMap<string, CellData>,
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
