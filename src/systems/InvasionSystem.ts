import type { Entity, SimulationEvent, HexCoord, InvasionConfig } from '@core/types';
import type { PRNG } from '@core/types/simulation';
import { GridManager } from '@core/grid/GridManager';

export interface InvasionResult {
  entitiesToSpawn: Array<{ type: 'SEED'; genomeId: string; position: HexCoord }>;
  events: SimulationEvent[];
}

export class InvasionSystem {
  private config: InvasionConfig | null = null;
  private gridRadius = 0;

  setConfig(config: InvasionConfig | null, gridRadius: number): void {
    this.config = config;
    this.gridRadius = gridRadius;
  }

  reset(): void {
    this.config = null;
    this.gridRadius = 0;
  }

  update(
    grid: GridManager,
    _entities: ReadonlyMap<number, Entity>,
    tick: number,
    rng: PRNG,
  ): InvasionResult {
    const result: InvasionResult = { entitiesToSpawn: [], events: [] };
    if (!this.config) return result;

    // Roll for spawn
    if (rng() >= this.config.spawnRate) return result;

    // Pick genome from pool
    const pool = this.config.speciesPool;
    if (pool.length === 0) return result;
    const genomeId = pool[Math.floor(rng() * pool.length)];

    // Determine spawn position: edge (wind) vs random (bird)
    let target: HexCoord | null = null;

    if (rng() < this.config.preferEdge) {
      // Edge spawn: pick random edge cell that is unoccupied
      const edgeCells = grid.getEdgeCells(this.gridRadius);
      if (edgeCells.length > 0) {
        // Shuffle attempt up to 5 times to find empty cell
        for (let attempt = 0; attempt < 5; attempt++) {
          const candidate = edgeCells[Math.floor(rng() * edgeCells.length)];
          const occupants = grid.getEntitiesAt(candidate.position.q, candidate.position.r);
          if (occupants.size === 0) {
            target = candidate.position;
            break;
          }
        }
      }
    } else {
      // Bird spawn: random cell anywhere
      const allCells = Array.from(grid.getAllCells());
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = allCells[Math.floor(rng() * allCells.length)];
        const occupants = grid.getEntitiesAt(candidate.position.q, candidate.position.r);
        if (occupants.size === 0) {
          target = candidate.position;
          break;
        }
      }
    }

    if (!target) return result;

    result.entitiesToSpawn.push({ type: 'SEED', genomeId, position: target });
    result.events.push({
      tick,
      type: 'INVASION_SEED',
      location: target,
      messageKey: `Invasive Saat: ${genomeId}`,
    });

    return result;
  }
}
