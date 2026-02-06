export interface Vector2 {
  x: number;
  y: number;
}

/**
 * Axiale Koordinaten für das Hex-Grid.
 * q = Spalte (Column)
 * r = Zeile (Row)
 * s = Optional (da q + r + s = 0)
 */
export interface HexCoord {
  q: number;
  r: number;
}