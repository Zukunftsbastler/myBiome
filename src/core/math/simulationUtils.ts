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
  // Height-dependent shade: tall plants escape canopy shade
  const plantHeight = Math.min(entity.biomass, genome.maxHeight);
  const heightRatio = cell.canopyHeight > 0 ? Math.min(1, plantHeight / cell.canopyHeight) : 1.0;
  const effectiveShade = cell.shade * (1.0 - heightRatio);
  const localLight = Math.max(0, weather.light * (1.0 - effectiveShade));

  const leafArea = deriveLeafArea(genome, entity.biomass);
  const efficiency = genome.photosynthesisEfficiency * (1.0 - genome.radiationTolerance * C.RADIATION_PHOTO_PENALTY);
  const waterNeed = deriveWaterNeed(genome, entity.biomass);
  const waterFactor = waterNeed > 0 ? Math.min(1.0, cell.water / waterNeed) : 1.0;
  return localLight * leafArea * efficiency * waterFactor;
}

export function calculateBMR(genome: Genome, entity: Entity): number {
  let bmr = entity.biomass * (1.0 - genome.ligninInvestment * C.LIGNIN_BMR_REDUCTION) * C.BASE_METABOLIC_RATE;
  // Extra upkeep for saprophytes (non-photosynthetic organisms)
  if (genome.photosynthesisEfficiency <= 0.1) {
    bmr += entity.biomass * C.SAPROPHYTE_BMR_PENALTY;
  }
  return bmr;
}

export function calculateTraitUpkeep(genome: Genome, entity: Entity): number {
  return entity.biomass * (
    genome.nitrogenFixation * C.NITROGEN_FIXATION_COST +
    genome.toxicity * C.TOXIN_UPKEEP_COST +
    genome.radiationTolerance * C.RADIATION_UPKEEP_COST
  );
}

export function calculateSaprophyteGain(genome: Genome, entity: Entity, cell: CellData): number {
  if (genome.photosynthesisEfficiency > 0.1) return 0; // Nur für echte Saprophyten
  return entity.biomass * cell.organicSaturation * C.SAPROPHYTE_RATE;
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
  if (cell.toxin > 0.5) return false;
  // Check layer-specific occupancy
  const layerOccupancy = genome.maxHeight >= 1.0 ? cell.canopyOccupancy : cell.understoryOccupancy;
  if (layerOccupancy + genome.footprint > 1.0) return false;
  return true;
}

// ──────────────────────────────────────────────
// Utility: clamp
// ──────────────────────────────────────────────

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ──────────────────────────────────────────────
// Morphology Classification
// ──────────────────────────────────────────────

export type MorphologyType = 'MONOLITH' | 'STAB' | 'GEFLECHT' | 'TEPPICH' | 'WEDEL';

export function classifyMorphology(genome: Genome): MorphologyType {
  if (genome.maxHeight < 0.2) return 'TEPPICH';
  if (genome.ligninInvestment < 0.3 && genome.stemGirth < 0.2) return 'GEFLECHT';
  if (genome.ligninInvestment > 0.6 && genome.biomassDistribution > 0.8) return 'WEDEL';
  if (genome.ligninInvestment > 0.8 && genome.stemGirth > 0.6) return 'MONOLITH';
  return 'STAB';
}

// ──────────────────────────────────────────────
// Speciation
// ──────────────────────────────────────────────

const SPECIATION_THRESHOLD = 0.15;

// Deskriptive Namenslisten (deutsch)
const NAME_PREFIXES = [
  'Zwerg', 'Riesen', 'Gift', 'Rot', 'Grau', 'Dunkel', 'Licht', 'Dorn',
  'Stein', 'Fels', 'Moor', 'Sand', 'Wind', 'Schatten', 'Flamm', 'Frost',
  'Gold', 'Silber', 'Blut', 'Nacht', 'Samt', 'Seiden', 'Eisen', 'Kupfer',
  'Nebel', 'Tau', 'Stern', 'Mond', 'Sonnen', 'Regen', 'Salz', 'Asch',
];

const KERN_BY_MORPHOLOGY: Record<MorphologyType, string[]> = {
  TEPPICH: ['moos', 'flechte', 'gras', 'klee', 'binse'],
  GEFLECHT: ['ranke', 'winde', 'wicke', 'riedgras', 'malve'],
  MONOLITH: ['baum', 'eiche', 'tanne', 'linde', 'ulme', 'ahorn'],
  WEDEL: ['farn', 'dolde', 'schilf', 'halm'],
  STAB: ['kraut', 'halm', 'distel', 'strauch', 'busch'],
};

const NAME_SUFFIXES = ['chen', 'ling', 'wurz', 'blüte', 'bart', 'herz', 'nadel', 'schopf'];

export function calculateGeneticDistance(a: Genome, b: Genome): number {
  const traits: (keyof Genome)[] = [
    'ligninInvestment', 'stemGirth', 'biomassDistribution',
    'photosynthesisEfficiency', 'solarPanelStrategy', 'rootDepthStrategy',
    'nitrogenFixation', 'radiationTolerance', 'droughtResistance',
    'toxicity', 'packagingInvestment', 'sugarContent', 'signalingColor',
    'germinationVariance', 'footprint',
  ];

  let sumSq = 0;
  for (const trait of traits) {
    const va = a[trait] as number;
    const vb = b[trait] as number;
    sumSq += (va - vb) * (va - vb);
  }
  // Normalized maxHeight difference (scale to 0-1 range via /10)
  const hDiff = (a.maxHeight - b.maxHeight) / 10;
  sumSq += hDiff * hDiff;

  return Math.sqrt(sumSq);
}

function pickRandom<T>(arr: readonly T[], rng: PRNG): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateSpeciesName(rng: PRNG, genome: Genome): string {
  // Prefix based on dominant trait
  let prefix: string;
  if (genome.maxHeight > 3.0) prefix = 'Riesen';
  else if (genome.maxHeight < 0.2) prefix = 'Zwerg';
  else if (genome.toxicity > 0.5) prefix = rng() < 0.5 ? 'Gift' : 'Dorn';
  else if (genome.droughtResistance > 0.7) prefix = rng() < 0.5 ? 'Sand' : 'Stein';
  else if (genome.nitrogenFixation > 0.5) prefix = rng() < 0.5 ? 'Moor' : 'Licht';
  else if (genome.radiationTolerance > 0.5) prefix = rng() < 0.5 ? 'Flamm' : 'Rot';
  else prefix = pickRandom(NAME_PREFIXES, rng);

  // Kern based on morphology
  const morph = classifyMorphology(genome);
  const kern = pickRandom(KERN_BY_MORPHOLOGY[morph], rng);

  // Optional suffix (30% chance)
  let suffix = '';
  if (rng() < 0.3) {
    suffix = pickRandom(NAME_SUFFIXES, rng);
  }

  return prefix + kern + suffix;
}

export function mutateGenome(parent: Genome, rate: number, rng: PRNG, baseGenomes?: ReadonlyMap<string, Genome>): Genome {
  const newGenome = { ...parent };
  
  // Neue ID generieren, damit es keine Referenz-Probleme gibt
  newGenome.id = `${parent.id}_v${Math.floor(rng() * 1000000).toString(16)}`;
  newGenome.name = `${parent.name}`; // Name bleibt vorerst gleich (oder hier ändern)

  // Liste der mutierbaren Eigenschaften (Floats 0.0 - 1.0)
  const traits: (keyof Genome)[] = [
    'ligninInvestment', 'stemGirth', 'biomassDistribution', 
    'photosynthesisEfficiency', 'solarPanelStrategy', 'rootDepthStrategy', 
    'nitrogenFixation', 'radiationTolerance', 'droughtResistance', 
    'toxicity', 'packagingInvestment', 'sugarContent', 'signalingColor', 
    'germinationVariance', 'footprint'
  ];

  for (const trait of traits) {
    if (rng() < rate) {
      // Drift um +/- 20%
      const drift = (rng() - 0.5) * 0.4;
      const val = newGenome[trait];
      if (typeof val === 'number') {
        // @ts-ignore: Dynamischer Zugriff ist hier sicher
        newGenome[trait] = clamp(val + drift, 0.0, 1.0);
      }
    }
  }

  // maxHeight mutiert proportional (nicht auf 0-1 geclampt)
  if (rng() < rate) {
    newGenome.maxHeight *= 1 + (rng() - 0.5) * 0.5; // ±25%
    newGenome.maxHeight = clamp(newGenome.maxHeight, 0.05, 10.0);
  }

  // Farbe mutiert separat (Hue 0-360)
  if (rng() < rate) {
    newGenome.colorHue = (newGenome.colorHue + (rng() - 0.5) * 20 + 360) % 360;
  }

  // Speciation check: compare to base genome
  if (baseGenomes) {
    const baseId = parent.parentSpeciesId ?? parent.id.replace(/_v[0-9a-f]+$/, '');
    const baseGenome = baseGenomes.get(baseId);
    if (baseGenome) {
      const distance = calculateGeneticDistance(newGenome, baseGenome);
      if (distance > SPECIATION_THRESHOLD) {
        newGenome.name = generateSpeciesName(rng, newGenome);
        newGenome.parentSpeciesId = parent.parentSpeciesId ?? parent.id;
      } else {
        newGenome.parentSpeciesId = parent.parentSpeciesId;
      }
    }
  }

  return newGenome;
}

/**
 * Generate a completely random genome — used for exotic seed arrival.
 * Creates diverse parameter combinations that differ from existing base species.
 */
export function generateRandomGenome(rng: PRNG): Genome {
  // Random traits biased toward viable plants (photoEfficiency > 0.2)
  const genome: Genome = {
    id: `exotic_${Math.floor(rng() * 1000000).toString(16)}`,
    name: '', // filled below
    ligninInvestment: rng(),
    stemGirth: rng(),
    biomassDistribution: rng(),
    photosynthesisEfficiency: 0.2 + rng() * 0.8, // at least 0.2 to survive
    solarPanelStrategy: rng(),
    rootDepthStrategy: rng(),
    nitrogenFixation: rng() < 0.3 ? rng() * 0.8 : 0, // 30% chance of N-fixer
    radiationTolerance: rng() < 0.2 ? rng() * 0.6 : rng() * 0.15,
    droughtResistance: rng(),
    toxicity: rng() < 0.15 ? rng() * 0.6 : 0, // 15% chance of toxic
    packagingInvestment: rng(),
    sugarContent: rng(),
    signalingColor: rng(),
    germinationVariance: rng(),
    footprint: 0.1 + rng() * 0.4, // 0.1 - 0.5
    colorHue: rng() * 360,
    maxHeight: 0.1 + rng() * rng() * 8, // bias toward smaller, occasional giants
  };

  genome.name = generateSpeciesName(rng, genome);
  return genome;
}