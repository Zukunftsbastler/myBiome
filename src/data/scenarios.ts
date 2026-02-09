export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  composition: {
    base: number[];     // soil archetype IDs (noise < baseThreshold)
    patches: number[];  // soil archetype IDs (baseThreshold <= noise < patchThreshold)
    details: number[];  // soil archetype IDs (noise >= patchThreshold)
  };
  baseThreshold: number;   // noise boundary between base and patches (default 0.6)
  patchThreshold: number;  // noise boundary between patches and details (default 0.9)
  noiseScale: number;      // Perlin noise frequency multiplier
}

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  FELDRAND: {
    id: 'feldrand',
    name: 'Feldrand',
    description: 'Fruchtbares Ackerland mit wilden Raendern.',
    composition: {
      base: [1],
      patches: [35, 36, 8],
      details: [10, 27],
    },
    baseThreshold: 0.6,
    patchThreshold: 0.9,
    noiseScale: 0.1,
  },
  GARDEN: {
    id: 'garden',
    name: 'Garten',
    description: 'Kuenstlich angelegtes Paradies mit Beeten und Wegen.',
    composition: {
      base: [7],
      patches: [6, 1, 34],
      details: [36, 10, 29],
    },
    baseThreshold: 0.4,
    patchThreshold: 0.8,
    noiseScale: 0.3,
  },
  WALDRAND: {
    id: 'waldrand',
    name: 'Waldrand',
    description: 'Uebergang von offenem Land in tiefen Forst.',
    composition: {
      base: [3],
      patches: [5, 8],
      details: [12, 4],
    },
    baseThreshold: 0.5,
    patchThreshold: 0.8,
    noiseScale: 0.15,
  },
  STADTPARK: {
    id: 'stadtpark',
    name: 'Stadtpark',
    description: 'Gruene Insel in der Stadt. Stark verdichtet.',
    composition: {
      base: [36],
      patches: [7, 29, 33],
      details: [30],
    },
    baseThreshold: 0.5,
    patchThreshold: 0.9,
    noiseScale: 0.4,
  },
  FLUSS_AUE: {
    id: 'fluss_aue',
    name: 'Fluss-Aue',
    description: 'Dynamisches Feuchtgebiet mit angespuelten Naehrstoffen.',
    composition: {
      base: [4],
      patches: [10, 27, 1],
      details: [25],
    },
    baseThreshold: 0.4,
    patchThreshold: 0.8,
    noiseScale: 0.2,
  },
  FELSHANG: {
    id: 'felshang',
    name: 'Felshang',
    description: 'Steil, trocken, kaum Erde. Nur Spezialisten in Ritzen.',
    composition: {
      base: [12],
      patches: [14, 10],
      details: [8, 3],
    },
    baseThreshold: 0.6,
    patchThreshold: 0.9,
    noiseScale: 0.25,
  },
  HOCHPLATEAU: {
    id: 'hochplateau',
    name: 'Hochplateau',
    description: 'Exponiert, windig, karg.',
    composition: {
      base: [14],
      patches: [11, 5],
      details: [16, 12],
    },
    baseThreshold: 0.5,
    patchThreshold: 0.8,
    noiseScale: 0.2,
  },
  WUESTE: {
    id: 'wueste',
    name: 'Wueste',
    description: 'Lebensfeindliche Trockenheit.',
    composition: {
      base: [9],
      patches: [13, 11],
      details: [12, 17],
    },
    baseThreshold: 0.7,
    patchThreshold: 0.9,
    noiseScale: 0.15,
  },
  INDUSTRIE: {
    id: 'industrie',
    name: 'Industriebrache',
    description: 'Beton, Schutt und Altlasten.',
    composition: {
      base: [32],
      patches: [29, 30, 31],
      details: [21, 20],
    },
    baseThreshold: 0.4,
    patchThreshold: 0.8,
    noiseScale: 0.8,
  },
  VULKAN: {
    id: 'vulkan',
    name: 'Vulkan',
    description: 'Frische Geologie. Naehrstoffreich aber gefaehrlich.',
    composition: {
      base: [19],
      patches: [18, 22],
      details: [12, 38],
    },
    baseThreshold: 0.5,
    patchThreshold: 0.9,
    noiseScale: 0.3,
  },
  MUELLKIPPE: {
    id: 'muellkippe',
    name: 'Muellkippe',
    description: 'Naehrstoffe im Ueberfluss, aber toxisch.',
    composition: {
      base: [33],
      patches: [21, 6],
      details: [20, 29],
    },
    baseThreshold: 0.6,
    patchThreshold: 0.8,
    noiseScale: 0.5,
  },
};
