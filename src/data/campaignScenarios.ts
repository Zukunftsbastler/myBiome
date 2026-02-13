import type { ScenarioConfig } from '@core/types';

/**
 * Campaign scenario definitions.
 * Each is a complete ScenarioConfig ready for SimulationLoop.loadScenario().
 */
export const CAMPAIGN_SCENARIOS: ScenarioConfig[] = [
  // ── Tier 1: Tutorial ──
  {
    id: 'tutorial_garden',
    tier: 1,
    title: 'Der Englische Rasen',
    description: 'Begrüne einen gepflegten Garten. Halte die Löwenzahn-Invasion unter Kontrolle.',
    mapConfig: {
      biomeId: 'GARDEN',
      size: 4,
      seed: 101,
    },
    invasion: {
      speciesPool: ['weed_dandelion'],
      spawnRate: 0.03,
      preferEdge: 0.8,
    },
    objectives: [
      { type: 'COVERAGE', target: 'pioneer_clover', threshold: 0.15 },
    ],
    loseConditions: [
      { type: 'INVASION_OVERRUN', threshold: 0.5 },
    ],
    startingGenomes: ['pioneer_clover', 'network_fungus'],
    startingPlacements: [
      { genomeId: 'pioneer_clover', position: { q: 0, r: 0 }, type: 'PLANT' },
      { genomeId: 'pioneer_clover', position: { q: 1, r: 0 }, type: 'SEED' },
      { genomeId: 'pioneer_clover', position: { q: 0, r: 1 }, type: 'SEED' },
    ],
    constraints: {
      allowedGenomes: ['pioneer_clover', 'network_fungus'],
    },
  },

  // ── Tier 2: Intermediate ──
  {
    id: 'wasteland_reclaim',
    tier: 2,
    title: 'Industriebrache',
    description: 'Begrüne eine verlassene Industriefläche. Senke die Bodenvergiftung.',
    mapConfig: {
      biomeId: 'INDUSTRIE',
      size: 5,
      seed: 202,
    },
    invasion: {
      speciesPool: ['weed_thistle', 'weed_knotgrass'],
      spawnRate: 0.02,
      preferEdge: 0.6,
    },
    objectives: [
      { type: 'PURIFICATION', target: '', threshold: 0.6 },
      { type: 'DIVERSITY', target: '', threshold: 3 },
    ],
    loseConditions: [
      { type: 'INVASION_OVERRUN', threshold: 0.4 },
    ],
    startingGenomes: ['pioneer_clover', 'forest_giant', 'network_fungus'],
    startingPlacements: [
      { genomeId: 'pioneer_clover', position: { q: 0, r: 0 }, type: 'PLANT' },
    ],
  },

  // ── Tier 3: Hard ──
  {
    id: 'volcano_pioneer',
    tier: 3,
    title: 'Vulkanpionier',
    description: 'Besiedle erkaltete Lavafelder. Überlebe mit minimalen Ressourcen.',
    mapConfig: {
      biomeId: 'VULKAN',
      size: 5,
      seed: 303,
    },
    invasion: {
      speciesPool: ['weed_dandelion', 'weed_thistle', 'weed_knotgrass'],
      spawnRate: 0.04,
      preferEdge: 0.5,
    },
    objectives: [
      { type: 'COVERAGE', target: 'pioneer_clover', threshold: 0.1, duration: 120 },
      { type: 'SURVIVAL', target: '', threshold: 10 },
    ],
    loseConditions: [
      { type: 'INVASION_OVERRUN', threshold: 0.35 },
    ],
    startingGenomes: ['pioneer_clover', 'forest_giant', 'network_fungus'],
    startingPlacements: [
      { genomeId: 'pioneer_clover', position: { q: 0, r: 0 }, type: 'PLANT' },
      { genomeId: 'network_fungus', position: { q: -1, r: 1 }, type: 'SEED' },
    ],
  },
];

/** Lookup by scenario ID. */
export const CAMPAIGN_BY_ID: ReadonlyMap<string, ScenarioConfig> = new Map(
  CAMPAIGN_SCENARIOS.map(s => [s.id, s])
);
