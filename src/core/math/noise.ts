import type { PRNG } from '@core/types/simulation';

/**
 * Deterministic 2D Perlin noise generator.
 * Uses PRNG to build permutation table, ensuring reproducibility.
 * Returns values in [0, 1] range.
 */
export function createNoise2D(rng: PRNG): (x: number, y: number) => number {
  // Build permutation table using PRNG
  const perm = new Uint8Array(512);
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;

  // Fisher-Yates shuffle with PRNG
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }

  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  // Gradient vectors (8 directions)
  const grad2 = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, 1], [1, -1], [-1, -1],
  ];

  function dot(gi: number, x: number, y: number): number {
    const g = grad2[gi & 7];
    return g[0] * x + g[1] * y;
  }

  function fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  function lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  return function noise2D(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = fade(xf);
    const v = fade(yf);

    const aa = perm[perm[xi] + yi];
    const ab = perm[perm[xi] + yi + 1];
    const ba = perm[perm[xi + 1] + yi];
    const bb = perm[perm[xi + 1] + yi + 1];

    const x1 = lerp(dot(aa, xf, yf), dot(ba, xf - 1, yf), u);
    const x2 = lerp(dot(ab, xf, yf - 1), dot(bb, xf - 1, yf - 1), u);

    // Map from [-1, 1] to [0, 1]
    return (lerp(x1, x2, v) + 1) * 0.5;
  };
}
