import { Application, Container, Graphics, Sprite } from 'pixi.js';
import type { SimulationState } from '@core/types/simulation';
import type { HexCoord } from '@core/types';
import { hexToPixel, pixelToHex, hexCorners, HEX_SIZE } from './hexLayout';
import { Synthesizer, hslToHex } from './Synthesizer';

export type DataLens = 'MOISTURE' | 'NUTRIENTS' | 'TOXIN' | 'OFF';

export interface RendererCallbacks {
  onHexClick?: (hex: HexCoord) => void;
  onHexHover?: (hex: HexCoord | null) => void;
}

/**
 * Main PixiJS scene manager.
 * Renders the hex grid, entity sprites, and data-lens overlays.
 */
export class Renderer {
  private _app: Application;
  private worldContainer: Container;
  private gridLayer: Container;
  private entityLayer: Container;
  private overlayLayer: Container;

  private cellGraphics: Map<string, Graphics> = new Map();
  private overlayGraphics: Map<string, Graphics> = new Map();
  private entitySprites: Map<number, Sprite> = new Map();
  private entityOffsets: Map<number, { dx: number; dy: number }> = new Map();
  private synthesizer: Synthesizer;
  private currentLens: DataLens = 'OFF';

  // Camera drag state
  private isDragging = false;
  private dragStart = { x: 0, y: 0 };
  private worldStart = { x: 0, y: 0 };
  private dragDistance = 0;

  // Selection & hover
  private selectionGfx: Graphics;
  private hoverGfx: Graphics;
  private selectedHex: HexCoord | null = null;
  private callbacks: RendererCallbacks = {};

  constructor() {
    this._app = new Application();
    this.worldContainer = new Container();
    this.gridLayer = new Container();
    this.entityLayer = new Container();
    this.overlayLayer = new Container();
    this.selectionGfx = new Graphics();
    this.hoverGfx = new Graphics();
    this.synthesizer = new Synthesizer();
  }

  setCallbacks(cb: RendererCallbacks): void {
    this.callbacks = cb;
  }

  get app(): Application {
    return this._app;
  }

  async init(container: HTMLElement): Promise<void> {
    await this._app.init({
      backgroundColor: 0x0a0f14,
      resizeTo: window,
      antialias: false,
    });
    container.appendChild(this._app.canvas);

    // Scene graph
    this.worldContainer.addChild(this.gridLayer, this.entityLayer, this.overlayLayer, this.hoverGfx, this.selectionGfx);
    this._app.stage.addChild(this.worldContainer);

    // Center camera
    this.worldContainer.position.set(
      this._app.screen.width / 2,
      this._app.screen.height / 2,
    );

    this.setupCamera();
  }

  // ── Camera (manual pan/zoom) ──

  private clientToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this._app.canvas.getBoundingClientRect();
    const scale = this.worldContainer.scale.x;
    return {
      x: (clientX - rect.left - this.worldContainer.position.x) / scale,
      y: (clientY - rect.top - this.worldContainer.position.y) / scale,
    };
  }

  private setupCamera(): void {
    const canvas = this._app.canvas;
    const CLICK_THRESHOLD = 5;

    canvas.addEventListener('pointerdown', (e: PointerEvent) => {
      this.isDragging = true;
      this.dragDistance = 0;
      this.dragStart.x = e.clientX;
      this.dragStart.y = e.clientY;
      this.worldStart.x = this.worldContainer.position.x;
      this.worldStart.y = this.worldContainer.position.y;
    });

    canvas.addEventListener('pointermove', (e: PointerEvent) => {
      // Hover detection
      const world = this.clientToWorld(e.clientX, e.clientY);
      const hex = pixelToHex(world.x, world.y);
      this.drawHover(hex);
      this.callbacks.onHexHover?.(hex);

      if (!this.isDragging) return;
      const dx = e.clientX - this.dragStart.x;
      const dy = e.clientY - this.dragStart.y;
      this.dragDistance = Math.sqrt(dx * dx + dy * dy);
      this.worldContainer.position.set(
        this.worldStart.x + dx,
        this.worldStart.y + dy,
      );
    });

    canvas.addEventListener('pointerup', (e: PointerEvent) => {
      if (this.isDragging && this.dragDistance < CLICK_THRESHOLD) {
        const world = this.clientToWorld(e.clientX, e.clientY);
        const hex = pixelToHex(world.x, world.y);
        this.callbacks.onHexClick?.(hex);
      }
      this.isDragging = false;
    });

    canvas.addEventListener('pointerleave', () => {
      this.isDragging = false;
      this.hoverGfx.clear();
      this.callbacks.onHexHover?.(null);
    });

    canvas.addEventListener('wheel', (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const oldScale = this.worldContainer.scale.x;
      const newScale = Math.max(0.2, Math.min(5, oldScale * zoomFactor));

      // Zoom toward cursor
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const wx = this.worldContainer.position.x;
      const wy = this.worldContainer.position.y;

      this.worldContainer.scale.set(newScale);
      this.worldContainer.position.set(
        mx - (mx - wx) * (newScale / oldScale),
        my - (my - wy) * (newScale / oldScale),
      );
    }, { passive: false });
  }

  // ── Grid Rendering ──

  buildGrid(state: SimulationState): void {
    this.gridLayer.removeChildren();
    this.cellGraphics.clear();
    this.overlayLayer.removeChildren();
    this.overlayGraphics.clear();

    for (const [key, cell] of state.cells) {
      const { x, y } = hexToPixel(cell.position.q, cell.position.r);
      const corners = hexCorners(x, y, HEX_SIZE);

      // Cell background
      const gfx = new Graphics();
      gfx.poly(corners).fill(this.cellColor(cell.water, cell.nutrients, cell.organicSaturation, cell.shade, cell.toxin));
      gfx.poly(corners).stroke({ width: 1, color: 0x1a2a3a });
      this.gridLayer.addChild(gfx);
      this.cellGraphics.set(key, gfx);

      // Overlay (initially invisible)
      const ov = new Graphics();
      ov.alpha = 0;
      this.overlayLayer.addChild(ov);
      this.overlayGraphics.set(key, ov);
    }
  }

  private cellColor(water: number, nutrients: number, organic: number, shade: number, toxin: number): number {
    // Base: dark earth
    let r = 20 + organic * 60;
    let g = 25 + nutrients * 80;
    let b = 20 + water * 90;

    // Toxin tints red
    r += toxin * 60;
    g -= toxin * 20;

    // Shade darkens
    const shadeFactor = 1 - shade * 0.4;
    r *= shadeFactor;
    g *= shadeFactor;
    b *= shadeFactor;

    return (Math.round(Math.max(0, Math.min(255, r))) << 16)
      | (Math.round(Math.max(0, Math.min(255, g))) << 8)
      | Math.round(Math.max(0, Math.min(255, b)));
  }

  // ── Update ──

  update(state: SimulationState): void {
    // Update cell colors
    for (const [key, cell] of state.cells) {
      const gfx = this.cellGraphics.get(key);
      if (!gfx) continue;
      const { x, y } = hexToPixel(cell.position.q, cell.position.r);
      const corners = hexCorners(x, y, HEX_SIZE);
      gfx.clear();
      gfx.poly(corners).fill(this.cellColor(cell.water, cell.nutrients, cell.organicSaturation, cell.shade, cell.toxin));
      gfx.poly(corners).stroke({ width: 1, color: 0x1a2a3a });
    }

    // Update overlays if lens active
    if (this.currentLens !== 'OFF') {
      this.updateOverlays(state);
    }

    // Diff-based entity sprite management
    const activeIds = new Set<number>();

    for (const [id, entity] of state.entities) {
      activeIds.add(id);
      const genome = state.genomes.get(entity.genomeId);
      if (!genome) continue;

      let sprite = this.entitySprites.get(id);

      if (!sprite) {
        // Create new sprite
        const tex = entity.type === 'SEED'
          ? this.synthesizer.getSeedTexture(genome, this._app.renderer)
          : this.synthesizer.getTexture(genome, this._app.renderer);
        sprite = new Sprite(tex);
        sprite.anchor.set(0.5, 1.0);
        this.entityLayer.addChild(sprite);
        this.entitySprites.set(id, sprite);

        // Stable random offset within hex (deterministic from entity ID)
        const hash = ((id * 2654435761) >>> 0) / 0xffffffff;
        const hash2 = (((id * 340573321 + 7) * 2654435761) >>> 0) / 0xffffffff;
        const radius = HEX_SIZE * 0.35;
        const angle = hash * Math.PI * 2;
        const dist = Math.sqrt(hash2) * radius;
        this.entityOffsets.set(id, { dx: Math.cos(angle) * dist, dy: Math.sin(angle) * dist });
      }

      // Position with per-entity offset to avoid overlap
      const { x, y } = hexToPixel(entity.position.q, entity.position.r);
      const offset = this.entityOffsets.get(id)!;
      sprite.position.set(x + offset.dx, y + offset.dy);

      if (entity.type === 'SEED') {
        sprite.scale.set(0.8);
      } else {
        const scale = 0.3 + (entity.biomass / (genome.maxHeight * 2)) * 1.7;
        sprite.scale.set(Math.min(scale, 2.0));
      }
    }

    // Remove sprites for dead entities
    for (const [id, sprite] of this.entitySprites) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.entitySprites.delete(id);
        this.entityOffsets.delete(id);
      }
    }
  }

  // ── Data Lens ──

  setLens(lens: DataLens): void {
    this.currentLens = lens;
    if (lens === 'OFF') {
      for (const ov of this.overlayGraphics.values()) {
        ov.alpha = 0;
      }
    }
  }

  private updateOverlays(state: SimulationState): void {
    for (const [key, cell] of state.cells) {
      const ov = this.overlayGraphics.get(key);
      if (!ov) continue;

      const { x, y } = hexToPixel(cell.position.q, cell.position.r);
      const corners = hexCorners(x, y, HEX_SIZE * 0.9);

      let value: number;
      let color: number;

      switch (this.currentLens) {
        case 'MOISTURE':
          value = cell.water;
          color = hslToHex(210, 0.8, 0.3 + value * 0.3);
          break;
        case 'NUTRIENTS':
          value = cell.nutrients;
          color = hslToHex(120, 0.7, 0.2 + value * 0.4);
          break;
        case 'TOXIN':
          value = cell.toxin;
          color = hslToHex(0, 0.8, 0.3 + value * 0.3);
          break;
        default:
          value = 0;
          color = 0;
      }

      ov.clear();
      ov.poly(corners).fill(color);
      ov.alpha = value * 0.5;
    }
  }

  // ── Selection & Hover ──

  setSelection(hex: HexCoord | null): void {
    this.selectedHex = hex;
    this.selectionGfx.clear();
    if (!hex) return;
    const { x, y } = hexToPixel(hex.q, hex.r);
    const corners = hexCorners(x, y, HEX_SIZE);
    this.selectionGfx.poly(corners).stroke({ width: 2, color: 0x00adb5 });
  }

  private drawHover(hex: HexCoord): void {
    this.hoverGfx.clear();
    // Don't draw hover on selected hex
    if (this.selectedHex && hex.q === this.selectedHex.q && hex.r === this.selectedHex.r) return;
    const { x, y } = hexToPixel(hex.q, hex.r);
    const corners = hexCorners(x, y, HEX_SIZE);
    this.hoverGfx.poly(corners).stroke({ width: 1, color: 0x00adb5, alpha: 0.4 });
  }

  // ── Cleanup ──

  destroy(): void {
    this.synthesizer.destroy();
    for (const sprite of this.entitySprites.values()) sprite.destroy();
    this.entitySprites.clear();
    this.entityOffsets.clear();
    this._app.destroy(true);
  }
}
