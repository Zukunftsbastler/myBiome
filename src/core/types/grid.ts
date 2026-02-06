import { HexCoord } from './vectors';

export interface CellData {
  // Topologie
  position: HexCoord;
  
  // Boden-Physik (0.0 - 1.0)
  granularity: number;       // 0.0 (Fels) - 1.0 (Lehm)
  compaction: number;        // Verdichtung (Wurzelwiderstand)
  organicSaturation: number; // Humusgehalt (Energiespeicher)
  biofilmIntegrity: number;  // Erosionsschutz durch Mikroben
  surfaceRoughness: number;  // "Grip" (Hält Samen bei Wind fest) <--- NEU
  
  // Ressourcen (Flüchtig)
  water: number;             // Aktuelle Feuchtigkeit
  nutrients: number;         // Verfügbare Nährstoffe
  toxin: number;             // Verschmutzungsgrad
  
  // Lokales Klima & Belegung
  shade: number;             // 0.0 (Sonne) - 1.0 (Vollschatten)
  occupancy: number;         // Summe der Footprints (0.0 - 1.0)
}