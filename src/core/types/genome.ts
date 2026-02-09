export interface Genome {
  id: string;      // Eindeutige ID (z.B. "seed_fern_v1")
  name: string;    // Generierter Name (z.B. "Rotfarn")
  parentSpeciesId?: string; // Basis-Art für Speziations-Tracking
  
  // --- A. Morphologie (Struktur & Kosten) ---
  ligninInvestment: number;    // 0.0 (Weich) - 1.0 (Holz)
  stemGirth: number;           // Wasserspeicher-Kapazität
  biomassDistribution: number; // 0.0 (Wurzel/Knolle) - 1.0 (Krone)
  
  // --- B. Metabolismus (Energie) ---
  photosynthesisEfficiency: number; 
  solarPanelStrategy: number;  // 0.0 (Nadel) - 1.0 (Segel/Blatt)
  rootDepthStrategy: number;   // 0.0 (Teppich) - 1.0 (Pfahl)
  nitrogenFixation: number;    // 0.0 (Nein) - 1.0 (Ja, kostet Energie)
  
  // --- C. Resistenzen & Anpassung ---
  radiationTolerance: number;  // UV-Schutz (Anthocyane)
  droughtResistance: number;   // Wachsschicht / Wassersparen
  toxicity: number;            // Allelopathie (Giftproduktion)
  
  // --- D. Reproduktion ---
  packagingInvestment: number; // 0.0 (Spore) - 1.0 (Fruchtfleisch)
  sugarContent: number;        // Belohnung für Tiere
  signalingColor: number;      // 0.0 (Tarnung) - 1.0 (Signalrot)
  germinationVariance: number; // 0.0 (Synchron) - 1.0 (Verteilt)
  
  // --- E. Physik & Rendering ---
  footprint: number;           // Platzbedarf (0.1 - 1.0)
  colorHue: number;            // Basis-Farbton (0-360)
  maxHeight: number;           // Maximale Wuchshöhe (Simulation & Vis)
}