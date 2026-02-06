/** Hex layout utilities for pointy-top axial coordinates. */

export const HEX_SIZE = 32;

const SQRT3 = Math.sqrt(3);

/** Convert axial hex (q, r) to pixel center. */
export function hexToPixel(q: number, r: number): { x: number; y: number } {
  return {
    x: HEX_SIZE * (SQRT3 * q + (SQRT3 / 2) * r),
    y: HEX_SIZE * (3 / 2) * r,
  };
}

/** Convert pixel to fractional axial hex, then round to nearest hex. */
export function pixelToHex(px: number, py: number): { q: number; r: number } {
  const q = ((SQRT3 / 3) * px - (1 / 3) * py) / HEX_SIZE;
  const r = ((2 / 3) * py) / HEX_SIZE;
  return cubeRound(q, r);
}

/** Cube rounding for hex coordinate snapping. */
function cubeRound(q: number, r: number): { q: number; r: number } {
  const s = -q - r;
  let rq = Math.round(q);
  let rr = Math.round(r);
  const rs = Math.round(s);

  const dq = Math.abs(rq - q);
  const dr = Math.abs(rr - r);
  const ds = Math.abs(rs - s);

  if (dq > dr && dq > ds) {
    rq = -rr - rs;
  } else if (dr > ds) {
    rr = -rq - rs;
  }

  return { q: rq, r: rr };
}

/** Return flat number[] of hex corner vertices for Graphics.poly(). */
export function hexCorners(cx: number, cy: number, size: number): number[] {
  const corners: number[] = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-top: first corner at 30°
    const angle = (Math.PI / 180) * (60 * i + 30);
    corners.push(cx + size * Math.cos(angle), cy + size * Math.sin(angle));
  }
  return corners;
}
