import { HexCoord } from './vectors';

export type EntityType = 'PLANT' | 'ANIMAL' | 'OBSTACLE' | 'SEED';

export interface Entity {
  id: number;              // Laufzeit-ID (ECS Entity ID)
  type: EntityType;
  position: HexCoord;
  
  // Genetik (Verweis auf Datenbank)
  genomeId: string;
  
  // --- Vitalwerte (State) ---
  age: number;             // In Ticks
  hp: number;              // Struktur-Integrität (0 = Tod)
  biomass: number;         // Aktuelle Masse (Wachstumsfortschritt)
  energy: number;          // Gespeicherte Energie (ATP/Zucker)
  waterBuffer: number;     // Interner Wasserspeicher
  
  // --- Status-Flags ---
  isDormant: boolean;      // Inaktiv (Winter/Samen)
  isDead: boolean;         // Markiert für Cleanup
}