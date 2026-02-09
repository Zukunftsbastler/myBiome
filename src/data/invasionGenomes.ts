import type { Genome } from '@core/types';

export const INVASION_GENOMES: Genome[] = [
  {
    id: 'weed_dandelion',
    name: 'Loewenzahn',
    ligninInvestment: 0.1,
    stemGirth: 0.15,
    biomassDistribution: 0.4,
    photosynthesisEfficiency: 0.75,
    solarPanelStrategy: 0.8,
    rootDepthStrategy: 0.8,      // deep taproot
    nitrogenFixation: 0.0,
    radiationTolerance: 0.15,
    droughtResistance: 0.5,
    toxicity: 0.0,
    packagingInvestment: 0.05,   // light seeds (spores in wind)
    sugarContent: 0.0,
    signalingColor: 0.8,         // bright yellow
    germinationVariance: 0.2,
    footprint: 0.2,
    colorHue: 55,                // yellow
    maxHeight: 0.4,
  },
  {
    id: 'weed_thistle',
    name: 'Kratzdistel',
    ligninInvestment: 0.3,
    stemGirth: 0.3,
    biomassDistribution: 0.5,
    photosynthesisEfficiency: 0.65,
    solarPanelStrategy: 0.6,
    rootDepthStrategy: 0.6,
    nitrogenFixation: 0.0,
    radiationTolerance: 0.2,
    droughtResistance: 0.6,
    toxicity: 0.4,               // allelopathic
    packagingInvestment: 0.1,
    sugarContent: 0.0,
    signalingColor: 0.6,
    germinationVariance: 0.15,
    footprint: 0.25,
    colorHue: 300,               // purple
    maxHeight: 1.2,
  },
  {
    id: 'weed_knotgrass',
    name: 'Knoeterich',
    ligninInvestment: 0.15,
    stemGirth: 0.2,
    biomassDistribution: 0.6,
    photosynthesisEfficiency: 0.85,
    solarPanelStrategy: 0.9,
    rootDepthStrategy: 0.3,      // carpet roots, fast spread
    nitrogenFixation: 0.0,
    radiationTolerance: 0.1,
    droughtResistance: 0.3,
    toxicity: 0.1,
    packagingInvestment: 0.2,
    sugarContent: 0.1,
    signalingColor: 0.3,
    germinationVariance: 0.1,    // fast synchronous germination
    footprint: 0.3,
    colorHue: 90,                // yellow-green
    maxHeight: 0.8,
  },
];
