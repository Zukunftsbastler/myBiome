import type { SimulationState } from '@core/types/simulation';
import type { Genome } from '@core/types';
import { hexKey, hexNeighbors, classifyMorphology, type MorphologyType } from '@core/math/simulationUtils';
import { hexToPixel, hexCorners, HEX_SIZE } from '@vis/hexLayout';
import { hslToHex } from '@vis/Synthesizer';

export interface BiomeZone {
  id: number;
  signature: string;
  name: string;
  color: number;
  cells: Set<string>;
  borderSegments: Array<[number, number, number, number]>;
}

const LANDSCAPE_NAMES: Record<MorphologyType, string[]> = {
  TEPPICH:  ['Matte', 'Moor', 'Rasen', 'Polster', 'Teppich'],
  STAB:     ['Flur', 'Wiese', 'Steppe', 'Feld', 'Krautflur'],
  GEFLECHT: ['Dickicht', 'Gestrüpp', 'Rankenfeld', 'Gespinst'],
  MONOLITH: ['Wald', 'Hain', 'Forst', 'Gehölz', 'Horst'],
  WEDEL:    ['Farngrund', 'Palmenhain', 'Schilfgürtel', 'Wedelfeld'],
};

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return h >>> 0;
}

function computeSignature(
  q: number, r: number,
  state: SimulationState,
): { signature: string; dominantGenome: Genome | null; count: number } {
  const key = hexKey(q, r);
  const counts = new Map<string, { count: number; genome: Genome }>();

  for (const entity of state.entities.values()) {
    if (entity.type !== 'PLANT') continue;
    if (hexKey(entity.position.q, entity.position.r) !== key) continue;
    const genome = state.genomes.get(entity.genomeId);
    if (!genome) continue;
    const existing = counts.get(genome.name);
    if (existing) {
      existing.count++;
    } else {
      counts.set(genome.name, { count: 1, genome });
    }
  }

  if (counts.size === 0) return { signature: '', dominantGenome: null, count: 0 };

  const sorted = Array.from(counts.entries())
    .sort((a, b) => b[1].count - a[1].count);

  const top = sorted.slice(0, 2);
  const names = top.map(([name]) => name).sort();
  return {
    signature: names.join('|'),
    dominantGenome: sorted[0][1].genome,
    count: sorted[0][1].count,
  };
}

function generateZoneName(signature: string, dominantGenome: Genome): string {
  const morph = classifyMorphology(dominantGenome);
  const names = LANDSCAPE_NAMES[morph];
  const h = hashString(signature);
  const landscapeType = names[h % names.length];

  const parts = signature.split('|');
  if (parts.length >= 2) {
    return `Misch-${landscapeType}`;
  }
  return `${parts[0]}-${landscapeType}`;
}

export class BiomeZoneSystem {
  private cachedZones: BiomeZone[] = [];
  private lastComputeTick = -1;

  computeZones(state: SimulationState): BiomeZone[] {
    if (state.tick === this.lastComputeTick) return this.cachedZones;
    this.lastComputeTick = state.tick;

    // Build signature map for all cells
    const sigMap = new Map<string, { signature: string; dominantGenome: Genome }>();
    for (const [key, cell] of state.cells) {
      const { signature, dominantGenome } = computeSignature(
        cell.position.q, cell.position.r, state,
      );
      if (signature && dominantGenome) {
        sigMap.set(key, { signature, dominantGenome });
      }
    }

    // Build entities-by-cell index for faster lookup (used above is fine for 91 tiles)
    // Flood-fill
    const assigned = new Set<string>();
    const zones: BiomeZone[] = [];
    let nextId = 0;

    for (const [startKey, { signature, dominantGenome }] of sigMap) {
      if (assigned.has(startKey)) continue;

      const cells = new Set<string>();
      const queue = [startKey];
      assigned.add(startKey);

      while (queue.length > 0) {
        const current = queue.pop()!;
        cells.add(current);

        const [cq, cr] = current.split(',').map(Number);
        for (const nb of hexNeighbors({ q: cq, r: cr })) {
          const nbKey = hexKey(nb.q, nb.r);
          if (assigned.has(nbKey)) continue;
          const nbSig = sigMap.get(nbKey);
          if (nbSig && nbSig.signature === signature) {
            assigned.add(nbKey);
            queue.push(nbKey);
          }
        }
      }

      // Skip single-cell zones
      if (cells.size < 2) continue;

      const zone: BiomeZone = {
        id: nextId++,
        signature,
        name: generateZoneName(signature, dominantGenome),
        color: hslToHex(dominantGenome.colorHue, 0.6, 0.55),
        cells,
        borderSegments: this.computeBorderSegments(cells),
      };
      zones.push(zone);
    }

    this.cachedZones = zones;
    return zones;
  }

  private computeBorderSegments(cells: Set<string>): Array<[number, number, number, number]> {
    const segments: Array<[number, number, number, number]> = [];

    // Pointy-top hex: edge i (corner[i]→corner[i+1]) faces neighbor direction (5-i)%6.
    // HEX_DIRECTIONS: 0=E, 1=NE, 2=NW, 3=W, 4=SW, 5=SE
    // hexCorners at 30°+60°*i: 0=BR, 1=B, 2=BL, 3=TL, 4=T, 5=TR
    // Edge 0 (BR→B)  → faces SE  = dir 5
    // Edge 1 (B→BL)  → faces SW  = dir 4
    // Edge 2 (BL→TL) → faces W   = dir 3
    // Edge 3 (TL→T)  → faces NW  = dir 2
    // Edge 4 (T→TR)  → faces NE  = dir 1
    // Edge 5 (TR→BR) → faces E   = dir 0
    const EDGE_TO_DIR = [5, 4, 3, 2, 1, 0];

    for (const key of cells) {
      const [q, r] = key.split(',').map(Number);
      const { x, y } = hexToPixel(q, r);
      const corners = hexCorners(x, y, HEX_SIZE);

      const neighbors = hexNeighbors({ q, r });
      for (let edge = 0; edge < 6; edge++) {
        const dir = EDGE_TO_DIR[edge];
        const nb = neighbors[dir];
        const nbKey = hexKey(nb.q, nb.r);
        if (!cells.has(nbKey)) {
          const x1 = corners[edge * 2];
          const y1 = corners[edge * 2 + 1];
          const ni = (edge + 1) % 6;
          const x2 = corners[ni * 2];
          const y2 = corners[ni * 2 + 1];
          segments.push([x1, y1, x2, y2]);
        }
      }
    }

    return segments;
  }
}
