import { Graphics, Texture, type Renderer } from 'pixi.js';
import type { Genome } from '@core/types';

/** Convert HSL (h: 0-360, s: 0-1, l: 0-1) to 0xRRGGBB. */
export function hslToHex(h: number, s: number, l: number): number {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(color * 255);
  };
  return (f(0) << 16) | (f(8) << 8) | f(4);
}

/**
 * Procedural texture generator — creates plant/seed textures from Genome parameters.
 * Caches by genomeId so each species only generates once.
 */
export class Synthesizer {
  private textureCache: Map<string, Texture> = new Map();
  private seedTextureCache: Map<string, Texture> = new Map();

  getTexture(genome: Genome, renderer: Renderer): Texture {
    const cached = this.textureCache.get(genome.id);
    if (cached) return cached;

    const tex = this.generatePlantTexture(genome, renderer);
    this.textureCache.set(genome.id, tex);
    return tex;
  }

  getSeedTexture(genome: Genome, renderer: Renderer): Texture {
    const cached = this.seedTextureCache.get(genome.id);
    if (cached) return cached;

    const tex = this.generateSeedTexture(genome, renderer);
    this.seedTextureCache.set(genome.id, tex);
    return tex;
  }

  private deriveLeafColor(genome: Genome): number {
    let hue = genome.colorHue;
    const sat = 0.4 + genome.photosynthesisEfficiency * 0.4;
    let lightness = 0.35 + genome.photosynthesisEfficiency * 0.15;

    // Anthocyan red-shift from toxicity / radiation tolerance
    hue += (genome.toxicity + genome.radiationTolerance) * -20;
    // Wax blue-tint from drought resistance
    hue += genome.droughtResistance * 10;

    lightness = Math.max(0.2, Math.min(0.6, lightness));
    hue = ((hue % 360) + 360) % 360;

    return hslToHex(hue, sat, lightness);
  }

  private deriveStemColor(genome: Genome): number {
    const lightness = 0.2 + genome.ligninInvestment * 0.15;
    return hslToHex(30, 0.4, lightness);
  }

  private generatePlantTexture(genome: Genome, renderer: Renderer): Texture {
    const g = new Graphics();
    const texW = 48;
    const texH = 64;
    const cx = texW / 2;

    // Stem — trapezoid from bottom-center upward
    const stemW = 2 + genome.stemGirth * 6;
    const stemH = texH * 0.4 + genome.maxHeight * 4;
    const clampedStemH = Math.min(stemH, texH * 0.7);
    const stemColor = this.deriveStemColor(genome);

    g.poly([
      cx - stemW / 2, texH,
      cx + stemW / 2, texH,
      cx + stemW / 4, texH - clampedStemH,
      cx - stemW / 4, texH - clampedStemH,
    ]).fill(stemColor);

    // Leaves
    const leafColor = this.deriveLeafColor(genome);
    const leafCount = 2 + Math.floor(genome.biomassDistribution * 4);
    const leafTop = texH - clampedStemH;
    const isRound = genome.solarPanelStrategy > 0.5;

    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2;
      const spread = 6 + genome.footprint * 8;
      const lx = cx + Math.cos(angle) * spread;
      const ly = leafTop + Math.sin(angle) * spread * 0.5 - 2;

      if (isRound) {
        const r = 4 + genome.solarPanelStrategy * 4;
        g.circle(lx, ly, r).fill(leafColor);
      } else {
        const s = 3 + genome.solarPanelStrategy * 3;
        g.poly([lx, ly - s, lx - s * 0.6, ly + s * 0.5, lx + s * 0.6, ly + s * 0.5]).fill(leafColor);
      }
    }

    return renderer.generateTexture({ target: g, resolution: 1 });
  }

  private generateSeedTexture(genome: Genome, renderer: Renderer): Texture {
    const g = new Graphics();
    const seedColor = hslToHex(genome.colorHue, 0.3, 0.4);
    g.circle(4, 4, 3).fill(seedColor);
    g.circle(4, 3, 1.5).fill(hslToHex(genome.colorHue, 0.2, 0.55));
    return renderer.generateTexture({ target: g, resolution: 1 });
  }

  destroy(): void {
    for (const tex of this.textureCache.values()) tex.destroy();
    for (const tex of this.seedTextureCache.values()) tex.destroy();
    this.textureCache.clear();
    this.seedTextureCache.clear();
  }
}
