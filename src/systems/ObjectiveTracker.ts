import type { Entity, Genome, ScenarioConfig, WinCondition, LoseCondition, ObjectiveProgress, ScenarioStatus } from '@core/types';
import { GridManager } from '@core/grid/GridManager';

export class ObjectiveTracker {
  private objectives: ObjectiveProgress[] = [];
  private loseConditions: LoseCondition[] = [];
  private scenarioId: string | null = null;

  loadScenario(config: ScenarioConfig): void {
    this.scenarioId = config.id;
    this.loseConditions = config.loseConditions ?? [];
    this.objectives = config.objectives.map(obj => ({
      objective: obj,
      currentValue: 0,
      met: false,
      sustainedTicks: 0,
      completed: false,
    }));
  }

  reset(): void {
    this.scenarioId = null;
    this.objectives = [];
    this.loseConditions = [];
  }

  isActive(): boolean {
    return this.scenarioId !== null;
  }

  /**
   * Evaluate objectives and lose conditions.
   * Returns ScenarioStatus if outcome changed (WON or LOST), null otherwise.
   */
  check(
    _tick: number,
    grid: GridManager,
    entities: ReadonlyMap<number, Entity>,
    genomes: ReadonlyMap<string, Genome>,
    playerFlux: number,
  ): ScenarioStatus | null {
    if (!this.scenarioId) return null;

    const totalCells = grid.cellCount;

    // Check lose conditions first
    for (const lc of this.loseConditions) {
      if (this.checkLoseCondition(lc, entities, genomes, playerFlux, totalCells)) {
        return {
          outcome: 'LOST',
          objectives: this.objectives,
          loseCause: lc.type,
        };
      }
    }

    // Evaluate each objective
    let allCompleted = true;
    for (const op of this.objectives) {
      if (op.completed) continue;

      op.currentValue = this.measureObjective(op.objective, grid, entities, genomes, totalCells);
      op.met = op.currentValue >= op.objective.threshold;

      if (op.met) {
        op.sustainedTicks++;
        const requiredDuration = op.objective.duration ?? 0;
        if (op.sustainedTicks >= requiredDuration) {
          op.completed = true;
        }
      } else {
        op.sustainedTicks = 0;
      }

      if (!op.completed) allCompleted = false;
    }

    if (allCompleted && this.objectives.length > 0) {
      return {
        outcome: 'WON',
        objectives: this.objectives,
      };
    }

    return null;
  }

  getStatus(): ScenarioStatus {
    return {
      outcome: 'IN_PROGRESS',
      objectives: this.objectives,
    };
  }

  getObjectives(): readonly ObjectiveProgress[] {
    return this.objectives;
  }

  private measureObjective(
    obj: WinCondition,
    grid: GridManager,
    entities: ReadonlyMap<number, Entity>,
    _genomes: ReadonlyMap<string, Genome>,
    totalCells: number,
  ): number {
    switch (obj.type) {
      case 'COVERAGE': {
        // Fraction of cells occupied by target species
        let count = 0;
        for (const entity of entities.values()) {
          if (entity.isDead || entity.type !== 'PLANT') continue;
          // Match base genome ID (strip variant suffix)
          const baseId = entity.genomeId.replace(/_v[0-9a-f]+$/, '');
          if (baseId === obj.target || entity.genomeId === obj.target) {
            count++;
          }
        }
        return totalCells > 0 ? count / totalCells : 0;
      }
      case 'DIVERSITY': {
        // Count unique base genome IDs among living plants
        const uniqueIds = new Set<string>();
        for (const entity of entities.values()) {
          if (entity.isDead || entity.type !== 'PLANT') continue;
          const baseId = entity.genomeId.replace(/_v[0-9a-f]+$/, '');
          uniqueIds.add(baseId);
        }
        return uniqueIds.size;
      }
      case 'PURIFICATION': {
        // Fraction of cells with toxin < 0.1
        let cleanCount = 0;
        for (const cell of grid.getAllCells()) {
          if (cell.toxin < 0.1) cleanCount++;
        }
        return totalCells > 0 ? cleanCount / totalCells : 0;
      }
      case 'SURVIVAL': {
        // Fraction of total plant biomass surviving (measured as entity count vs threshold)
        let livingPlants = 0;
        for (const entity of entities.values()) {
          if (!entity.isDead && entity.type === 'PLANT') livingPlants++;
        }
        return livingPlants;
      }
    }
  }

  private checkLoseCondition(
    lc: LoseCondition,
    entities: ReadonlyMap<number, Entity>,
    _genomes: ReadonlyMap<string, Genome>,
    playerFlux: number,
    totalCells: number,
  ): boolean {
    switch (lc.type) {
      case 'FLUX_BANKRUPT':
        return playerFlux <= lc.threshold;
      case 'INVASION_OVERRUN': {
        // Count cells occupied by invasive species (IDs starting with 'weed_')
        let invasiveCells = 0;
        const occupiedPositions = new Set<string>();
        for (const entity of entities.values()) {
          if (entity.isDead || entity.type !== 'PLANT') continue;
          if (entity.genomeId.startsWith('weed_')) {
            const key = `${entity.position.q},${entity.position.r}`;
            if (!occupiedPositions.has(key)) {
              occupiedPositions.add(key);
              invasiveCells++;
            }
          }
        }
        return totalCells > 0 && (invasiveCells / totalCells) >= lc.threshold;
      }
    }
  }
}
