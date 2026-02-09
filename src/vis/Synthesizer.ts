import { Graphics, Texture, type Renderer } from 'pixi.js';
import type { Genome } from '@core/types';
import { classifyMorphology, type MorphologyType } from '@core/math/simulationUtils';

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

type LeafShape = 'NEEDLE' | 'ROUND' | 'FROND';

function classifyLeafShape(genome: Genome): LeafShape {
  if (genome.solarPanelStrategy < 0.3) return 'NEEDLE';
  if (genome.solarPanelStrategy > 0.7) return 'FROND';
  return 'ROUND';
}

/**
 * Procedural texture generator — creates plant/seed textures from Genome parameters.
 * Uses morphology classification for distinct visual archetypes.
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

    hue += (genome.toxicity + genome.radiationTolerance) * -20;
    hue += genome.droughtResistance * 10;

    lightness = Math.max(0.2, Math.min(0.6, lightness));
    hue = ((hue % 360) + 360) % 360;

    return hslToHex(hue, sat, lightness);
  }

  private deriveStemColor(genome: Genome): number {
    // Interpolate green→brown based on ligninInvestment
    const hue = 90 - genome.ligninInvestment * 60; // 90 (green) → 30 (brown)
    const sat = 0.3 + genome.ligninInvestment * 0.2;
    const lightness = 0.2 + genome.ligninInvestment * 0.15;
    return hslToHex(hue, sat, lightness);
  }

  private getTextureDimensions(morph: MorphologyType): { w: number; h: number } {
    switch (morph) {
      case 'TEPPICH': return { w: 32, h: 16 };
      case 'MONOLITH': return { w: 48, h: 80 };
      default: return { w: 48, h: 64 };
    }
  }

  private generatePlantTexture(genome: Genome, renderer: Renderer): Texture {
    const g = new Graphics();
    const morph = classifyMorphology(genome);
    const { w: texW, h: texH } = this.getTextureDimensions(morph);
    const cx = texW / 2;

    const stemColor = this.deriveStemColor(genome);
    const leafColor = this.deriveLeafColor(genome);
    const leafShape = classifyLeafShape(genome);
    const leafCount = 3 + Math.floor(genome.photosynthesisEfficiency * 5);

    // Stem height as fraction of texture
    const stemH = Math.min(texH * 0.75, texH * 0.3 + genome.maxHeight * 5);
    const stemW = 2 + genome.stemGirth * 6;

    // Branch anchor points (y positions along stem where branches/leaves attach)
    const branchAnchors = this.computeBranchAnchors(genome, morph, texH, stemH);

    // Draw stem
    this.drawStem(g, morph, genome, cx, texW, texH, stemH, stemW, stemColor);

    // Draw branches + foliage
    this.drawBranchesAndFoliage(g, morph, genome, cx, texH, stemH, stemW, branchAnchors, leafColor, leafShape, leafCount);

    return renderer.generateTexture({ target: g, resolution: 1 });
  }

  private computeBranchAnchors(
    genome: Genome, morph: MorphologyType,
    texH: number, stemH: number,
  ): number[] {
    const stemTop = texH - stemH;
    const stemBot = texH;

    if (morph === 'TEPPICH') return [texH - 2]; // flat on ground

    const dist = genome.biomassDistribution;
    const count = morph === 'MONOLITH' || morph === 'STAB'
      ? 1 + Math.floor(genome.stemGirth * 4)
      : 3;

    const anchors: number[] = [];
    for (let i = 0; i < count; i++) {
      let t: number; // 0=top, 1=bottom
      if (dist < 0.3) {
        // Basal: lower 2/3
        t = 0.33 + (i / Math.max(1, count - 1)) * 0.67;
      } else if (dist > 0.7) {
        // Apikal: upper 1/3
        t = (i / Math.max(1, count - 1)) * 0.33;
      } else {
        // Distributed
        t = (i / Math.max(1, count - 1));
      }
      anchors.push(stemTop + t * (stemBot - stemTop));
    }
    return anchors;
  }

  private drawStem(
    g: Graphics, morph: MorphologyType, genome: Genome,
    cx: number, _texW: number, texH: number,
    stemH: number, stemW: number, stemColor: number,
  ): void {
    const stemTop = texH - stemH;

    switch (morph) {
      case 'TEPPICH':
        // No visible stem
        break;

      case 'MONOLITH': {
        // Wide trapezoid with slight taper
        const baseW = stemW * 1.3;
        const topW = stemW * 0.5;
        g.poly([
          cx - baseW / 2, texH,
          cx + baseW / 2, texH,
          cx + topW / 2, stemTop,
          cx - topW / 2, stemTop,
        ]).fill(stemColor);
        break;
      }

      case 'GEFLECHT': {
        // Wavy curve (2 sine waves along height)
        g.moveTo(cx, texH);
        const segments = 12;
        const amplitude = 4 + (1 - genome.ligninInvestment) * 4;
        for (let i = 1; i <= segments; i++) {
          const t = i / segments;
          const y = texH - t * stemH;
          const x = cx + Math.sin(t * Math.PI * 2) * amplitude;
          g.lineTo(x, y);
        }
        g.stroke({ width: Math.max(1, stemW * 0.5), color: stemColor });
        break;
      }

      case 'WEDEL':
      case 'STAB': {
        // Thin straight stalk, slight taper
        const topW = Math.max(1, stemW * 0.4);
        g.poly([
          cx - stemW / 2, texH,
          cx + stemW / 2, texH,
          cx + topW / 2, stemTop,
          cx - topW / 2, stemTop,
        ]).fill(stemColor);
        break;
      }
    }
  }

  private drawBranchesAndFoliage(
    g: Graphics, morph: MorphologyType, genome: Genome,
    cx: number, texH: number, stemH: number, stemW: number,
    anchors: number[], leafColor: number, leafShape: LeafShape, leafCount: number,
  ): void {
    const stemTop = texH - stemH;

    switch (morph) {
      case 'TEPPICH':
        this.drawCarpetFoliage(g, cx, texH, genome, leafColor, leafShape, leafCount);
        break;

      case 'GEFLECHT':
        this.drawGeflechtFoliage(g, cx, texH, stemH, genome, leafColor, leafShape, leafCount);
        break;

      case 'MONOLITH':
      case 'STAB':
      case 'WEDEL': {
        // Draw branches as short lines from stem, then leaves at tips
        const stemColor = this.deriveStemColor(genome);
        for (let i = 0; i < anchors.length; i++) {
          const ay = anchors[i];
          const side = i % 2 === 0 ? -1 : 1;
          const branchLen = 4 + genome.stemGirth * 8;

          // For WEDEL: only draw branches near the very top
          if (morph === 'WEDEL' && ay > stemTop + stemH * 0.3) continue;

          // Branch line
          if (morph !== 'WEDEL') {
            const bx = cx + side * branchLen;
            g.moveTo(cx, ay);
            g.lineTo(bx, ay - 2);
            g.stroke({ width: Math.max(1, stemW * 0.3), color: stemColor });
          }

          // Leaves at branch tip (or directly at anchor for WEDEL)
          const tipX = morph === 'WEDEL' ? cx + side * 3 : cx + side * branchLen;
          const tipY = morph === 'WEDEL' ? ay : ay - 2;
          const leavesPerBranch = Math.max(1, Math.ceil(leafCount / anchors.length));
          this.drawLeafCluster(g, tipX, tipY, leavesPerBranch, leafColor, leafShape, genome, side);
        }
        break;
      }
    }
  }

  private drawCarpetFoliage(
    g: Graphics, cx: number, texH: number,
    genome: Genome, leafColor: number, leafShape: LeafShape, leafCount: number,
  ): void {
    // Flat cluster on the ground
    const spread = 8 + genome.footprint * 8;
    for (let i = 0; i < leafCount; i++) {
      const angle = (i / leafCount) * Math.PI * 2;
      const dist = 2 + (i % 3) * (spread / 3);
      const lx = cx + Math.cos(angle) * dist;
      const ly = texH - 3 + Math.sin(angle) * 2;
      this.drawLeaf(g, lx, ly, leafColor, leafShape, genome, 0.7);
    }
  }

  private drawGeflechtFoliage(
    g: Graphics, cx: number, texH: number, stemH: number,
    genome: Genome, leafColor: number, leafShape: LeafShape, leafCount: number,
  ): void {
    // Leaves along the wavy curve
    const amplitude = 4 + (1 - genome.ligninInvestment) * 4;
    for (let i = 0; i < leafCount; i++) {
      const t = (i + 1) / (leafCount + 1);
      const y = texH - t * stemH;
      const x = cx + Math.sin(t * Math.PI * 2) * amplitude;
      const side = i % 2 === 0 ? -1 : 1;
      this.drawLeaf(g, x + side * 4, y, leafColor, leafShape, genome, 0.8);
    }
  }

  private drawLeafCluster(
    g: Graphics, x: number, y: number, count: number,
    color: number, shape: LeafShape, genome: Genome, side: number,
  ): void {
    for (let i = 0; i < count; i++) {
      const spread = 3;
      const angle = (i / count) * Math.PI - Math.PI / 2;
      const lx = x + Math.cos(angle) * spread * side;
      const ly = y + Math.sin(angle) * spread;
      this.drawLeaf(g, lx, ly, color, shape, genome, 1.0);
    }
  }

  private drawLeaf(
    g: Graphics, x: number, y: number,
    color: number, shape: LeafShape, genome: Genome, scale: number,
  ): void {
    switch (shape) {
      case 'NEEDLE': {
        // Short thin strokes, slightly spread
        const len = (3 + genome.solarPanelStrategy * 2) * scale;
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.6;
        g.moveTo(x, y);
        g.lineTo(x + Math.cos(angle) * len, y + Math.sin(angle) * len);
        g.stroke({ width: 1, color });
        break;
      }
      case 'ROUND': {
        // Ellipse
        const r = (3 + genome.solarPanelStrategy * 3) * scale;
        g.circle(x, y, r).fill(color);
        break;
      }
      case 'FROND': {
        // Teardrop/frond shape via quadratic curve
        const len = (6 + genome.solarPanelStrategy * 4) * scale;
        const w = len * 0.4;
        g.moveTo(x, y);
        g.quadraticCurveTo(x - w, y - len * 0.6, x, y - len);
        g.quadraticCurveTo(x + w, y - len * 0.6, x, y);
        g.fill(color);
        break;
      }
    }
  }

  private generateSeedTexture(genome: Genome, renderer: Renderer): Texture {
    const g = new Graphics();
    const seedColor = hslToHex(genome.colorHue, 0.3, 0.4);

    if (genome.packagingInvestment < 0.3) {
      // Spore — tiny dot
      g.circle(4, 4, 2).fill(seedColor);
    } else if (genome.packagingInvestment > 0.7) {
      // Fruit-seed — larger circle with colored ring
      const ringColor = hslToHex(genome.colorHue, 0.5, 0.5);
      g.circle(5, 5, 4.5).fill(ringColor);
      g.circle(5, 5, 3).fill(seedColor);
      g.circle(5, 4, 1.5).fill(hslToHex(genome.colorHue, 0.2, 0.6));
    } else {
      // Standard seed
      g.circle(4, 4, 3).fill(seedColor);
      g.circle(4, 3, 1.5).fill(hslToHex(genome.colorHue, 0.2, 0.55));
    }

    return renderer.generateTexture({ target: g, resolution: 1 });
  }

  pruneTextures(ids: string[]): void {
    for (const id of ids) {
      const tex = this.textureCache.get(id);
      if (tex) { tex.destroy(); this.textureCache.delete(id); }
      const seedTex = this.seedTextureCache.get(id);
      if (seedTex) { seedTex.destroy(); this.seedTextureCache.delete(id); }
    }
  }

  destroy(): void {
    for (const tex of this.textureCache.values()) tex.destroy();
    for (const tex of this.seedTextureCache.values()) tex.destroy();
    this.textureCache.clear();
    this.seedTextureCache.clear();
  }
}
