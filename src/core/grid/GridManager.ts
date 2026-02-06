import type { CellData, HexCoord, Entity, Genome } from '@core/types';
import type { GridInitConfig } from '@core/types/simulation';
import { hexKey, hexNeighbors, hexesInRadius, clamp, deriveShadeContribution } from '@core/math/simulationUtils';

export class GridManager {
  private cells: Map<string, CellData> = new Map();
  private entityIndex: Map<string, Set<number>> = new Map();

  /** Initialise a hex grid of given radius with default cell values. */
  init(config: GridInitConfig): void {
    this.cells.clear();
    this.entityIndex.clear();

    const allHexes = hexesInRadius({ q: 0, r: 0 }, config.radius);
    for (const pos of allHexes) {
      const key = hexKey(pos.q, pos.r);
      this.cells.set(key, {
        position: { q: pos.q, r: pos.r },
        granularity: config.defaultGranularity,
        compaction: 0,
        organicSaturation: config.defaultOrganicSaturation,
        biofilmIntegrity: 0.1,
        surfaceRoughness: config.defaultSurfaceRoughness,
        water: config.defaultWater,
        nutrients: config.defaultNutrients,
        toxin: 0,
        shade: 0,
        occupancy: 0,
      });
      this.entityIndex.set(key, new Set());
    }
  }

  // ── Cell Access ──

  getCell(q: number, r: number): CellData | undefined {
    return this.cells.get(hexKey(q, r));
  }

  getCellByKey(key: string): CellData | undefined {
    return this.cells.get(key);
  }

  hasCell(q: number, r: number): boolean {
    return this.cells.has(hexKey(q, r));
  }

  /** Apply partial updates to a cell, auto-clamping 0-1 fields. */
  mutateCell(q: number, r: number, updates: Partial<CellData>): void {
    const key = hexKey(q, r);
    const cell = this.cells.get(key);
    if (!cell) return;

    for (const [field, value] of Object.entries(updates)) {
      if (field === 'position') continue;
      if (typeof value !== 'number') continue;
      (cell as unknown as Record<string, number>)[field] = clamp(value, 0, 1);
    }
  }

  getNeighborCells(coord: HexCoord): CellData[] {
    const results: CellData[] = [];
    for (const n of hexNeighbors(coord)) {
      const cell = this.cells.get(hexKey(n.q, n.r));
      if (cell) results.push(cell);
    }
    return results;
  }

  getAllCells(): IterableIterator<CellData> {
    return this.cells.values();
  }

  get cellCount(): number {
    return this.cells.size;
  }

  // ── Entity Spatial Index ──

  addEntity(entityId: number, q: number, r: number): void {
    const key = hexKey(q, r);
    const set = this.entityIndex.get(key);
    if (set) set.add(entityId);
  }

  removeEntity(entityId: number, q: number, r: number): void {
    const key = hexKey(q, r);
    const set = this.entityIndex.get(key);
    if (set) set.delete(entityId);
  }

  moveEntity(entityId: number, fromQ: number, fromR: number, toQ: number, toR: number): void {
    this.removeEntity(entityId, fromQ, fromR);
    this.addEntity(entityId, toQ, toR);
  }

  getEntitiesAt(q: number, r: number): ReadonlySet<number> {
    return this.entityIndex.get(hexKey(q, r)) ?? new Set();
  }

  // ── Occupancy & Shade Recalculation ──

  recalculateOccupancy(entities: ReadonlyMap<number, Entity>, genomes: ReadonlyMap<string, Genome>): void {
    for (const cell of this.cells.values()) {
      cell.occupancy = 0;
    }

    for (const entity of entities.values()) {
      if (entity.isDead) continue;
      if (entity.type !== 'PLANT') continue;
      const key = hexKey(entity.position.q, entity.position.r);
      const cell = this.cells.get(key);
      if (!cell) continue;
      const genome = genomes.get(entity.genomeId);
      if (!genome) continue;
      cell.occupancy = clamp(cell.occupancy + genome.footprint, 0, 1);
    }
  }

  recalculateShade(entities: ReadonlyMap<number, Entity>, genomes: ReadonlyMap<string, Genome>): void {
    for (const cell of this.cells.values()) {
      cell.shade = 0;
    }

    for (const entity of entities.values()) {
      if (entity.isDead || entity.type !== 'PLANT') continue;
      const genome = genomes.get(entity.genomeId);
      if (!genome) continue;

      const contribution = deriveShadeContribution(genome, entity.biomass);
      if (contribution <= 0) continue;

      // Shade self cell
      const selfKey = hexKey(entity.position.q, entity.position.r);
      const selfCell = this.cells.get(selfKey);
      if (selfCell) {
        selfCell.shade = clamp(selfCell.shade + contribution, 0, 1);
      }

      // Shade neighbors (reduced)
      for (const n of hexNeighbors(entity.position)) {
        const nCell = this.cells.get(hexKey(n.q, n.r));
        if (nCell) {
          nCell.shade = clamp(nCell.shade + contribution * 0.5, 0, 1);
        }
      }
    }
  }
}
