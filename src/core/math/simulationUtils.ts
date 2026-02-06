import type { HexCoord, Genome, CellData, Entity } from '@core/types';
import type { PRNG, WeatherState } from '@core/types/simulation';
import { SIM_CONSTANTS as C } from './constants';

// ──────────────────────────────────────────────
// PRNG (mulberry32)
// ──────────────────────────────────────────────

export function createPRNG(seed: number): PRNG {
  let s = seed | 0;
  return (): number => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ──────────────────────────────────────────────
// Hex Math (axial coordinates, pointy-top)
// ──────────────────────────────────────────────

const HEX_DIRECTIONS: ReadonlyArray<HexCoord> = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -dq - dr;
  return Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds));
}

export function hexNeighbors(coord: HexCoord): HexCoord[] {
  return HEX_DIRECTIONS.map(d => ({ q: coord.q + d.q, r: coord.r + d.r }));
}

export function hexRing(center: HexCoord, radius: number): HexCoord[] {
  if (radius <= 0) return [center];
  const results: HexCoord[] = [];
  let current: HexCoord = { q: center.q + radius, r: center.r };
  for (let side = 0; side < 6; side++) {
    for (let step = 0; step < radius; step++) {
      results.push(current);
      current = {
        q: current.q + HEX_DIRECTIONS[(side + 2) % 6].q,
        r: current.r + HEX_DIRECTIONS[(side + 2) % 6].r,
      };
    }
  }
  return results;
}

export function hexesInRadius(center: HexCoord, radius: number): HexCoord[] {
  const results: HexCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}

// ──────────────────────────────────────────────
// Derived Properties (from Genome)
// ──────────────────────────────────────────────

export function deriveLeafArea(genome: Genome, biomass: number): number {
  return biomass * genome.solarPanelStrategy * C.LEAF_AREA_SCALE;
}

export function deriveWaterNeed(genome: Genome, biomass: number): number {
  return biomass * (C.WATER_NEED_BASE + genome.solarPanelStrategy * C.WATER_NEED_SOLAR_FACTOR);
}

export function deriveShadeContribution(genome: Genome, biomass: number): number {
  return biomass * genome.biomassDistribution * C.SHADE_CONTRIBUTION_SCALE;
}

export function deriveRootDensity(genome: Genome, biomass: number): number {
  return biomass * (1.0 - genome.rootDepthStrategy) * C.ROOT_DENSITY_SCALE;
}

export function deriveGrowthSpeed(genome: Genome): number {
  return C.GROWTH_SPEED_BASE + (1.0 - genome.ligninInvestment) * C.GROWTH_SPEED_LIGNIN_PENALTY;
}

// ──────────────────────────────────────────────
// Energy Calculations (GAME_MATH.md §3-4)
// ──────────────────────────────────────────────

export function calculatePhotosynthesis(
  genome: Genome,
  entity: Entity,
  cell: CellData,
  weather: WeatherState,
): number {
  const localLight = Math.max(0, weather.light * (1.0 - cell.shade));
  const leafArea = deriveLeafArea(genome, entity.biomass);
  const efficiency = genome.photosynthesisEfficiency * (1.0 - genome.radiationTolerance * C.RADIATION_PHOTO_PENALTY);
  const waterNeed = deriveWaterNeed(genome, entity.biomass);
  const waterFactor = waterNeed > 0 ? Math.min(1.0, cell.water / waterNeed) : 1.0;
  return localLight * leafArea * efficiency * waterFactor;
}

export function calculateBMR(genome: Genome, entity: Entity): number {
  return entity.biomass * (1.0 - genome.ligninInvestment * C.LIGNIN_BMR_REDUCTION) * C.BASE_METABOLIC_RATE;
}

export function calculateTraitUpkeep(genome: Genome, entity: Entity): number {
  return entity.biomass * (
    genome.nitrogenFixation * C.NITROGEN_FIXATION_COST +
    genome.toxicity * C.TOXIN_UPKEEP_COST +
    genome.radiationTolerance * C.RADIATION_UPKEEP_COST
  );
}

export function calculateMaxStorage(genome: Genome, entity: Entity): number {
  return 1.0 + entity.biomass * 10.0 * (C.STORAGE_BASE + genome.stemGirth * C.STORAGE_STEM_FACTOR + genome.biomassDistribution * C.STORAGE_DISTRIBUTION_FACTOR);
}

// ──────────────────────────────────────────────
// Investment Costs (GAME_MATH.md §5)
// ──────────────────────────────────────────────

export function calculateGrowthCost(genome: Genome, deltaVolume: number): number {
  return deltaVolume * (1.0 + genome.ligninInvestment * C.LIGNIN_GROWTH_MULTIPLIER + genome.biomassDistribution * C.DENSITY_GROWTH_MULTIPLIER);
}

export function calculateFruitCost(genome: Genome): number {
  return (
    genome.packagingInvestment * C.PACKAGING_COST_FACTOR +
    genome.sugarContent * C.SUGAR_COST_FACTOR +
    genome.signalingColor * C.SIGNALING_COST_FACTOR
  );
}

export function calculateFluxGain(growthCost: number, fruitCost: number): number {
  return (growthCost + fruitCost) * C.FLUX_RATE;
}

// ──────────────────────────────────────────────
// Environment Calculations (GAME_MATH.md §8)
// ──────────────────────────────────────────────

export function calculateSeedRetention(cell: CellData, weather: WeatherState): number {
  return Math.min(1.0, cell.surfaceRoughness + (1.0 - weather.wind) * 0.5);
}

export function calculateErosion(cell: CellData, weather: WeatherState, rootDensity: number): number {
  const raw = weather.rain * (1.0 - rootDensity * C.EROSION_ROOT_PROTECTION - cell.biofilmIntegrity * C.EROSION_BIOFILM_PROTECTION);
  return Math.max(0, raw);
}

export function canGerminate(cell: CellData, genome: Genome): boolean {
  if (cell.water < 0.2) return false;
  if (cell.occupancy + genome.footprint > 1.0) return false;
  if (cell.toxin > 0.5) return false;
  return true;
}

// ──────────────────────────────────────────────
// Utility: clamp
// ──────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
