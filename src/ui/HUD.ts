import type { ToolType } from '@core/types';
import type { TickResult, WeatherState } from '@core/types/simulation';
import type { SimulationEvent } from '@core/types';
import { TOOL_CONFIGS } from '@core/types/ui';
import type { DataLens } from '@vis/Renderer';

export interface HUDCallbacks {
  onToolSelected?: (tool: ToolType) => void;
  onLensChanged?: (lens: DataLens) => void;
}

const TOOL_ORDER: ToolType[] = ['INSPECT', 'HYDRATE', 'DESICCATE', 'ENRICH', 'STERILIZE', 'CULL', 'SEED'];
const LENS_OPTIONS: { lens: DataLens; label: string; key: string }[] = [
  { lens: 'MOISTURE',  label: 'Water',    key: '1' },
  { lens: 'NUTRIENTS', label: 'Nutri',    key: '2' },
  { lens: 'TOXIN',     label: 'Toxin',    key: '3' },
  { lens: 'OFF',       label: 'Off',      key: '0' },
];

export class HUD {
  private root: HTMLElement;
  private callbacks: HUDCallbacks = {};

  // DOM refs
  private tickEl!: HTMLElement;
  private entityCountEl!: HTMLElement;
  private fluxEl!: HTMLElement;
  private weatherEl!: HTMLElement;
  private eventList!: HTMLElement;
  private toolButtons: Map<ToolType, HTMLButtonElement> = new Map();
  private lensButtons: Map<DataLens, HTMLButtonElement> = new Map();

  private activeTool: ToolType = 'INSPECT';
  private activeLens: DataLens = 'OFF';
  private maxEvents = 50;

  constructor(container: HTMLElement) {
    this.root = document.createElement('div');
    this.root.className = 'hud';
    container.appendChild(this.root);
    this.buildStatusBar();
    this.buildLensBar();
    this.buildToolbar();
    this.buildEventLog();
  }

  setCallbacks(cb: HUDCallbacks): void {
    this.callbacks = cb;
  }

  // ── Builders ──

  private buildStatusBar(): void {
    const bar = document.createElement('div');
    bar.className = 'hud__status hud__panel';

    this.tickEl = this.createStatusItem('T:0');
    this.entityCountEl = this.createStatusItem('E:0');
    this.fluxEl = this.createStatusItem('F:100', 'hud__status-item--flux');
    this.weatherEl = this.createStatusItem('', 'hud__status-item--weather');

    bar.append(this.tickEl, this.entityCountEl, this.fluxEl, this.weatherEl);
    this.root.appendChild(bar);
  }

  private createStatusItem(text: string, extraClass?: string): HTMLElement {
    const el = document.createElement('span');
    el.className = 'hud__status-item' + (extraClass ? ' ' + extraClass : '');
    el.textContent = text;
    return el;
  }

  private buildLensBar(): void {
    const bar = document.createElement('div');
    bar.className = 'hud__lens-bar hud__panel';

    for (const opt of LENS_OPTIONS) {
      const btn = document.createElement('button');
      btn.className = 'hud__btn' + (opt.lens === this.activeLens ? ' hud__btn--active' : '');
      btn.textContent = `${opt.key}:${opt.label}`;
      btn.addEventListener('click', () => this.selectLens(opt.lens));
      bar.appendChild(btn);
      this.lensButtons.set(opt.lens, btn);
    }

    this.root.appendChild(bar);
  }

  private buildToolbar(): void {
    const bar = document.createElement('div');
    bar.className = 'hud__toolbar hud__panel';

    for (const toolType of TOOL_ORDER) {
      const cfg = TOOL_CONFIGS[toolType];
      const btn = document.createElement('button');
      btn.className = 'hud__btn' + (toolType === this.activeTool ? ' hud__btn--active' : '');

      btn.textContent = cfg.name;
      if (cfg.fluxCost > 0) {
        const costSpan = document.createElement('span');
        costSpan.className = 'hud__btn--cost';
        costSpan.textContent = `${cfg.fluxCost}`;
        btn.appendChild(costSpan);
      }

      btn.title = cfg.description;
      btn.addEventListener('click', () => this.selectTool(toolType));
      bar.appendChild(btn);
      this.toolButtons.set(toolType, btn);
    }

    this.root.appendChild(bar);
  }

  private buildEventLog(): void {
    const log = document.createElement('div');
    log.className = 'hud__event-log hud__panel';
    this.eventList = log;
    this.root.appendChild(log);
  }

  // ── Actions ──

  selectTool(tool: ToolType): void {
    this.activeTool = tool;
    for (const [t, btn] of this.toolButtons) {
      btn.classList.toggle('hud__btn--active', t === tool);
    }
    this.callbacks.onToolSelected?.(tool);
  }

  selectLens(lens: DataLens): void {
    this.activeLens = lens;
    for (const [l, btn] of this.lensButtons) {
      btn.classList.toggle('hud__btn--active', l === lens);
    }
    this.callbacks.onLensChanged?.(lens);
  }

  getActiveTool(): ToolType { return this.activeTool; }
  getActiveLens(): DataLens { return this.activeLens; }

  // ── Updates ──

  update(tickResult: TickResult, flux: number, fluxCap: number): void {
    this.tickEl.textContent = `T:${tickResult.tick}`;
    this.entityCountEl.textContent = `E:${tickResult.entityCount}`;
    this.setFlux(flux, fluxCap);
    this.updateWeather(tickResult.weather);

    for (const event of tickResult.events) {
      this.addEvent(event);
    }
  }

  setFlux(amount: number, cap: number): void {
    this.fluxEl.textContent = `F:${Math.floor(amount)}/${cap}`;
  }

  private updateWeather(w: WeatherState): void {
    const sun = w.light > 0.6 ? '☀' : w.light > 0.3 ? '⛅' : '☁';
    const rain = w.rain > 0.4 ? '🌧' : '';
    this.weatherEl.textContent = `${sun}${rain} ${(w.temperature).toFixed(0)}°`;
  }

  addEvent(event: SimulationEvent): void {
    const el = document.createElement('div');
    let cls = 'hud__event-item';
    if (event.type === 'ENTITY_SPAWNED') cls += ' hud__event-item--spawn';
    else if (event.type === 'ENTITY_DIED') cls += ' hud__event-item--death';
    else if (event.type === 'FLUX_GAINED') cls += ' hud__event-item--flux';
    el.className = cls;
    el.textContent = `[${event.tick}] ${event.messageKey}`;
    this.eventList.prepend(el);

    // Cap events
    while (this.eventList.children.length > this.maxEvents) {
      this.eventList.lastElementChild?.remove();
    }
  }
}
