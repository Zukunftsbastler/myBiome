export interface SoilArchetype {
  id: number;
  name: string;
  granularity: number;
  compaction: number;
  organic: number;
  biofilm: number;
  roughness: number;
  water: number;
  nutrients: number;
  toxin: number;
}

export const SOIL_ARCHETYPES: readonly SoilArchetype[] = [
  // A: Fruchtbare Boeden
  { id: 1,  name: 'Lehmboden',         granularity: 0.5, compaction: 0.4, organic: 0.6, biofilm: 0.5, roughness: 0.5, water: 0.6, nutrients: 0.6, toxin: 0.0 },
  { id: 2,  name: 'Schwarzerde',       granularity: 0.4, compaction: 0.3, organic: 0.9, biofilm: 0.6, roughness: 0.4, water: 0.7, nutrients: 0.9, toxin: 0.0 },
  { id: 3,  name: 'Waldboden',         granularity: 0.6, compaction: 0.2, organic: 0.8, biofilm: 0.8, roughness: 0.7, water: 0.5, nutrients: 0.5, toxin: 0.0 },
  { id: 4,  name: 'Flussschlamm',      granularity: 0.2, compaction: 0.6, organic: 0.5, biofilm: 0.4, roughness: 0.3, water: 1.0, nutrients: 0.8, toxin: 0.1 },
  { id: 5,  name: 'Torf',              granularity: 0.3, compaction: 0.1, organic: 1.0, biofilm: 0.3, roughness: 0.6, water: 0.9, nutrients: 0.4, toxin: 0.2 },
  { id: 6,  name: 'Kompost',           granularity: 0.7, compaction: 0.1, organic: 1.0, biofilm: 0.9, roughness: 0.8, water: 0.6, nutrients: 1.0, toxin: 0.0 },
  { id: 7,  name: 'Garten-Erde',       granularity: 0.5, compaction: 0.3, organic: 0.5, biofilm: 0.5, roughness: 0.4, water: 0.5, nutrients: 0.7, toxin: 0.0 },
  { id: 8,  name: 'Loess',             granularity: 0.3, compaction: 0.4, organic: 0.4, biofilm: 0.3, roughness: 0.2, water: 0.4, nutrients: 0.6, toxin: 0.0 },
  // B: Mineralische & Trockene Boeden
  { id: 9,  name: 'Sandduene',         granularity: 1.0, compaction: 0.2, organic: 0.0, biofilm: 0.0, roughness: 0.1, water: 0.1, nutrients: 0.1, toxin: 0.0 },
  { id: 10, name: 'Kiesbett',          granularity: 0.9, compaction: 0.5, organic: 0.0, biofilm: 0.1, roughness: 0.6, water: 0.1, nutrients: 0.1, toxin: 0.0 },
  { id: 11, name: 'Trockenlehm',       granularity: 0.3, compaction: 0.8, organic: 0.1, biofilm: 0.2, roughness: 0.2, water: 0.1, nutrients: 0.3, toxin: 0.0 },
  { id: 12, name: 'Fels (Verwittert)', granularity: 0.8, compaction: 0.9, organic: 0.1, biofilm: 0.3, roughness: 0.7, water: 0.0, nutrients: 0.2, toxin: 0.0 },
  { id: 13, name: 'Staubwueste',       granularity: 0.1, compaction: 0.3, organic: 0.0, biofilm: 0.0, roughness: 0.0, water: 0.0, nutrients: 0.1, toxin: 0.0 },
  { id: 14, name: 'Kalksteinboden',    granularity: 0.7, compaction: 0.6, organic: 0.1, biofilm: 0.2, roughness: 0.5, water: 0.2, nutrients: 0.2, toxin: 0.0 },
  { id: 15, name: 'Laterit',           granularity: 0.4, compaction: 0.7, organic: 0.1, biofilm: 0.4, roughness: 0.4, water: 0.3, nutrients: 0.1, toxin: 0.1 },
  { id: 16, name: 'Permafrost',        granularity: 0.5, compaction: 0.9, organic: 0.4, biofilm: 0.8, roughness: 0.3, water: 1.0, nutrients: 0.2, toxin: 0.0 },
  // C: Extreme & Lebensfeindliche Boeden
  { id: 17, name: 'Salzpfanne',        granularity: 0.2, compaction: 0.8, organic: 0.0, biofilm: 0.1, roughness: 0.1, water: 0.0, nutrients: 0.0, toxin: 0.8 },
  { id: 18, name: 'Vulkanasche',       granularity: 0.6, compaction: 0.2, organic: 0.0, biofilm: 0.0, roughness: 0.4, water: 0.0, nutrients: 0.8, toxin: 0.3 },
  { id: 19, name: 'Lava (Erkaltet)',   granularity: 0.1, compaction: 1.0, organic: 0.0, biofilm: 0.0, roughness: 0.9, water: 0.0, nutrients: 0.5, toxin: 0.2 },
  { id: 20, name: 'Oel-Sumpf',         granularity: 0.1, compaction: 0.5, organic: 1.0, biofilm: 0.0, roughness: 0.2, water: 0.2, nutrients: 0.0, toxin: 1.0 },
  { id: 21, name: 'Schwermetallhalde', granularity: 0.8, compaction: 0.6, organic: 0.0, biofilm: 0.0, roughness: 0.5, water: 0.2, nutrients: 0.0, toxin: 0.9 },
  { id: 22, name: 'Saeureboden',       granularity: 0.4, compaction: 0.5, organic: 0.2, biofilm: 0.1, roughness: 0.3, water: 0.4, nutrients: 0.1, toxin: 0.6 },
  { id: 23, name: 'Atommuell-Endlager',granularity: 0.5, compaction: 0.7, organic: 0.0, biofilm: 0.0, roughness: 0.2, water: 0.2, nutrients: 0.0, toxin: 1.0 },
  { id: 24, name: 'Tote Erde',         granularity: 0.5, compaction: 0.5, organic: 0.0, biofilm: 0.0, roughness: 0.5, water: 0.0, nutrients: 0.0, toxin: 0.0 },
  // D: Nassgebiete
  { id: 25, name: 'Sumpf',             granularity: 0.1, compaction: 0.2, organic: 0.9, biofilm: 0.7, roughness: 0.2, water: 1.0, nutrients: 0.7, toxin: 0.1 },
  { id: 26, name: 'Mangroven-Schlick', granularity: 0.1, compaction: 0.4, organic: 0.6, biofilm: 0.5, roughness: 0.1, water: 1.0, nutrients: 0.6, toxin: 0.3 },
  { id: 27, name: 'Ton-Grube',         granularity: 0.0, compaction: 0.8, organic: 0.0, biofilm: 0.2, roughness: 0.1, water: 0.8, nutrients: 0.2, toxin: 0.0 },
  { id: 28, name: 'Moor-Auge',         granularity: 0.1, compaction: 0.0, organic: 0.8, biofilm: 0.2, roughness: 0.0, water: 1.0, nutrients: 0.1, toxin: 0.1 },
  // E: Urbane & Kuenstliche Flaechen
  { id: 29, name: 'Beton',             granularity: 0.2, compaction: 1.0, organic: 0.0, biofilm: 0.0, roughness: 0.1, water: 0.0, nutrients: 0.0, toxin: 0.1 },
  { id: 30, name: 'Asphalt (Rissig)',  granularity: 0.1, compaction: 0.9, organic: 0.1, biofilm: 0.0, roughness: 0.3, water: 0.1, nutrients: 0.0, toxin: 0.4 },
  { id: 31, name: 'Schottergleis',     granularity: 1.0, compaction: 0.8, organic: 0.0, biofilm: 0.1, roughness: 0.8, water: 0.1, nutrients: 0.0, toxin: 0.5 },
  { id: 32, name: 'Bauschutt',         granularity: 0.9, compaction: 0.6, organic: 0.1, biofilm: 0.1, roughness: 0.9, water: 0.2, nutrients: 0.3, toxin: 0.2 },
  { id: 33, name: 'Muelldeponie',      granularity: 0.5, compaction: 0.4, organic: 0.5, biofilm: 0.5, roughness: 0.7, water: 0.4, nutrients: 0.8, toxin: 0.7 },
  { id: 34, name: 'Dachbegruenung',    granularity: 0.8, compaction: 0.3, organic: 0.2, biofilm: 0.4, roughness: 0.5, water: 0.2, nutrients: 0.1, toxin: 0.0 },
  { id: 35, name: 'Acker (Ueberduengt)',granularity: 0.4, compaction: 0.5, organic: 0.3, biofilm: 0.2, roughness: 0.2, water: 0.5, nutrients: 1.0, toxin: 0.3 },
  { id: 36, name: 'Parkweg',           granularity: 0.8, compaction: 0.9, organic: 0.1, biofilm: 0.1, roughness: 0.2, water: 0.1, nutrients: 0.1, toxin: 0.0 },
  // F: Exotisches
  { id: 37, name: 'Mars-Regolith',     granularity: 0.7, compaction: 0.4, organic: 0.0, biofilm: 0.0, roughness: 0.4, water: 0.0, nutrients: 0.4, toxin: 0.6 },
  { id: 38, name: 'Kristallboden',     granularity: 1.0, compaction: 1.0, organic: 0.0, biofilm: 0.0, roughness: 0.8, water: 0.0, nutrients: 0.0, toxin: 0.0 },
  { id: 39, name: 'Pilz-Myzel-Matte',  granularity: 0.3, compaction: 0.1, organic: 1.0, biofilm: 1.0, roughness: 0.5, water: 0.6, nutrients: 0.9, toxin: 0.0 },
  { id: 40, name: 'Nanobot-Schwarm',   granularity: 0.5, compaction: 0.0, organic: 0.0, biofilm: 1.0, roughness: 0.0, water: 0.5, nutrients: 1.0, toxin: 0.0 },
] as const;

export const SOIL_BY_ID: ReadonlyMap<number, SoilArchetype> = new Map(
  SOIL_ARCHETYPES.map(s => [s.id, s])
);
