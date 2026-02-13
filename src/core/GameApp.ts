import { SimulationLoop } from '@systems/SimulationLoop';
import { BiomeZoneSystem, type BiomeZone } from '@systems/BiomeZoneSystem';
import type { Entity, Genome, WorldConfig, HexCoord, SpeedLevel, ScenarioConfig } from '@core/types';
import type { TickResult } from '@core/types/simulation';
import starterGenomes from '@data/genes.json';
import { INVASION_GENOMES } from '@data/invasionGenomes';
import { Renderer } from '@vis/Renderer';
import type { DataLens } from '@vis/Renderer';
import { HUD } from '@ui/HUD';
import { Inspector, type InspectorEntityInfo } from '@ui/Inspector';
import { CampaignPanel } from '@ui/CampaignPanel';
import { MainMenu } from '@ui/MainMenu';
import { ToolManager } from '../interaction/ToolManager';
import { CampaignManager } from '../interaction/CampaignManager';
import { TimeManager } from '@core/time/TimeManager';
import { PlayerProfile } from '@core/profile/PlayerProfile';

export type AppState = 'MENU' | 'PLAYING';

const DEFAULT_WORLD_CONFIG: WorldConfig = {
  mutationRate: 0.1,
  eventVolatility: 0.2,
  bioConnectivity: 0.5,
  ambientTemperature: 22,
  mapSize: 5,
};

export class GameApp {
  private state: AppState = 'MENU';

  // DOM containers
  private appContainer: HTMLElement;
  private hudContainer: HTMLElement;

  // Persistent across sessions
  private profile: PlayerProfile;
  private renderer: Renderer;

  // UI (created once, shown/hidden)
  private mainMenu: MainMenu;
  private hud: HUD;
  private inspector: Inspector;
  private campaignPanel: CampaignPanel;

  // Per-session (created on game start, destroyed on quit)
  private sim: SimulationLoop | null = null;
  private timeManager: TimeManager | null = null;
  private toolManager: ToolManager;
  private campaignManager: CampaignManager;
  private zoneSystem: BiomeZoneSystem;
  private currentZones: BiomeZone[] = [];
  private selectedHex: HexCoord | null = null;
  private latestTickResult: TickResult | null = null;
  private activeScenarioConfig: ScenarioConfig | null = null;

  constructor() {
    this.appContainer = document.getElementById('app')!;
    this.hudContainer = document.getElementById('hud')!;

    this.profile = new PlayerProfile();
    this.renderer = new Renderer();
    this.toolManager = new ToolManager();
    this.campaignManager = new CampaignManager();
    this.zoneSystem = new BiomeZoneSystem();

    // Build UI
    this.hud = new HUD(this.hudContainer);
    this.inspector = new Inspector(this.hudContainer);
    this.campaignPanel = new CampaignPanel(this.hudContainer);
    this.mainMenu = new MainMenu(this.hudContainer, this.profile);

    this.wireCallbacks();
    this.wireKeyboard();
  }

  async init(): Promise<void> {
    await this.renderer.init(this.appContainer);

    // Start in menu
    this.showMenu();

    // Render loop always runs
    this.renderer.app.ticker.add(() => this.onFrame());
  }

  // ── State Transitions ──

  private showMenu(): void {
    this.state = 'MENU';
    this.hud.hide();
    this.inspector.hide();
    this.campaignPanel.hide();
    this.mainMenu.show();
  }

  private startGame(config: WorldConfig, scenario?: ScenarioConfig): void {
    this.mainMenu.hide();
    this.state = 'PLAYING';
    this.activeScenarioConfig = scenario ?? null;

    // Create fresh simulation
    const seed = scenario?.mapConfig.seed ?? Math.floor(Math.random() * 100000);
    this.sim = new SimulationLoop(config, seed);

    // Register genomes
    this.sim.registerGenomes(starterGenomes as Genome[]);
    this.sim.registerGenomes(INVASION_GENOMES);

    if (scenario) {
      // Campaign mode: load scenario
      this.sim.loadScenario(scenario, [...INVASION_GENOMES, ...(starterGenomes as Genome[])]);
    } else {
      // Sandbox mode: just spawn a starter plant
      this.sim.spawnEntity('PLANT', 'pioneer_clover', { q: 0, r: 0 });
    }

    // Build renderer grid
    const state = this.sim.getState();
    this.renderer.buildGrid(state);
    this.renderer.update(state);

    // Create time manager
    this.timeManager = new TimeManager(() => this.onTick());
    this.timeManager.setSpeed('PAUSE');

    // Reset UI state
    this.selectedHex = null;
    this.latestTickResult = null;
    this.currentZones = [];
    this.renderer.setSelection(null);
    this.hud.show();
    this.hud.setActiveSpeed('PAUSE');
    this.hud.setFlux(this.toolManager.getFlux(), this.toolManager.getFluxCap());

    if (scenario) {
      this.hud.updateObjectives(Array.from(this.sim.getObjectives()));
    }
  }

  private quitToMenu(): void {
    if (this.timeManager) {
      this.timeManager.setSpeed('PAUSE');
    }
    this.sim = null;
    this.timeManager = null;
    this.activeScenarioConfig = null;
    this.latestTickResult = null;
    this.showMenu();
  }

  // ── Per-Tick Logic ──

  private onTick(): void {
    if (!this.sim) return;

    const tickResult = this.sim.step();
    this.latestTickResult = tickResult;

    // Accumulate flux
    this.toolManager.addFlux(tickResult.fluxGenerated);

    // Campaign quests
    const simState = this.sim.getState();
    const campaignEvents = this.campaignManager.evaluateQuests(simState, tickResult);
    for (const evt of campaignEvents) {
      if (evt.reward?.flux) {
        this.toolManager.addFlux(evt.reward.flux);
      }
      this.toolManager.setModifiers(this.campaignManager.getModifiers());
      this.hud.addEvent({
        tick: evt.tick,
        type: 'QUEST_COMPLETED',
        messageKey: `Aufgabe abgeschlossen: ${evt.title}`,
      });
    }

    // Auto-pause on scenario end
    for (const event of tickResult.events) {
      if (event.type === 'LEVEL_COMPLETED' || event.type === 'LEVEL_FAILED') {
        this.timeManager?.setSpeed('PAUSE');
        this.hud.setActiveSpeed('PAUSE');

        // Persist completion
        if (event.type === 'LEVEL_COMPLETED' && this.activeScenarioConfig) {
          this.profile.completeScenario(
            this.activeScenarioConfig.id,
            tickResult.tick,
            this.activeScenarioConfig.objectives.map(o => o.type),
          );
          // Unlock next scenario if available
          // (simple: unlock all scenarios with tier <= current tier + 1)
        }
      }
    }
  }

  // ── Per-Frame Logic ──

  private onFrame(): void {
    if (this.state !== 'PLAYING' || !this.sim) return;

    // Run accumulated ticks
    this.timeManager?.update(performance.now());

    const simState = this.sim.getState();

    if (this.latestTickResult) {
      // Zones
      if (simState.tick % 10 === 0) {
        this.currentZones = this.zoneSystem.computeZones(simState);
        this.renderer.updateZones(this.currentZones);
      }

      this.renderer.update(simState, this.latestTickResult.prunedGenomeIds);
      this.hud.update(this.latestTickResult, this.toolManager.getFlux(), this.toolManager.getFluxCap());

      if (this.sim.hasActiveScenario()) {
        this.hud.updateObjectives(Array.from(this.sim.getObjectives()));
      }

      if (this.campaignPanel.isVisible()) {
        this.campaignPanel.update(this.campaignManager, this.toolManager.getFlux());
      }

      this.updateInspector();
      this.latestTickResult = null;
    }
  }

  // ── Hex Click ──

  private handleHexClick(hex: HexCoord): void {
    if (!this.sim) return;

    const cell = this.sim.getGrid().getCell(hex.q, hex.r);
    if (!cell) {
      this.selectedHex = null;
      this.renderer.setSelection(null);
      this.inspector.hide();
      return;
    }

    if (this.toolManager.getActiveTool() !== 'INSPECT') {
      this.toolManager.applyTool(hex, this.sim);
      this.hud.setFlux(this.toolManager.getFlux(), this.toolManager.getFluxCap());
    }

    this.selectedHex = hex;
    this.renderer.setSelection(hex);
    this.updateInspector();
  }

  private updateInspector(): void {
    if (!this.selectedHex || !this.sim) {
      this.inspector.hide();
      return;
    }

    const cell = this.sim.getGrid().getCell(this.selectedHex.q, this.selectedHex.r);
    if (!cell) {
      this.inspector.hide();
      return;
    }

    const entities = this.sim.getEntitiesAt(this.selectedHex.q, this.selectedHex.r);
    const plants = entities.filter(e => e.type === 'PLANT');

    if (plants.length > 0) {
      const groups = new Map<string, Entity[]>();
      for (const e of plants) {
        const arr = groups.get(e.genomeId);
        if (arr) arr.push(e);
        else groups.set(e.genomeId, [e]);
      }

      const sorted = Array.from(groups.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .slice(0, 2);

      const speciesInfos: InspectorEntityInfo[] = [];
      for (const [genomeId, members] of sorted) {
        const genome = this.sim.getGenome(genomeId);
        if (genome) {
          const rep = members.reduce((a, b) => a.biomass >= b.biomass ? a : b);
          speciesInfos.push({ entity: rep, genome, count: members.length });
        }
      }

      const zone = this.currentZones.find(z =>
        z.cells.has(`${this.selectedHex!.q},${this.selectedHex!.r}`)
      );
      this.inspector.show(cell, speciesInfos, zone?.name, zone?.color);
    } else {
      this.inspector.show(cell);
    }
  }

  // ── Wiring ──

  private wireCallbacks(): void {
    this.renderer.setCallbacks({
      onHexClick: (hex) => this.handleHexClick(hex),
    });

    this.hud.setCallbacks({
      onToolSelected: (tool) => this.toolManager.selectTool(tool),
      onLensChanged: (lens: DataLens) => this.renderer.setLens(lens),
      onCampaignToggle: () => {
        this.campaignPanel.toggle();
        if (this.campaignPanel.isVisible()) {
          this.campaignPanel.update(this.campaignManager, this.toolManager.getFlux());
        }
      },
      onSpeedChanged: (speed: SpeedLevel) => {
        this.timeManager?.setSpeed(speed);
      },
      onQuitToMenu: () => this.quitToMenu(),
    });

    this.campaignPanel.setCallbacks({
      onSkillPurchase: (skillId) => {
        const result = this.campaignManager.purchaseSkill(skillId, this.toolManager.getFlux());
        if (result.success) {
          this.toolManager.deductFlux(result.cost);
          this.toolManager.setModifiers(this.campaignManager.getModifiers());
          this.toolManager.setFluxCapBonus(this.campaignManager.getFluxCapBonus());
          this.hud.setFlux(this.toolManager.getFlux(), this.toolManager.getFluxCap());
          if (result.event) {
            result.event.tick = this.sim?.getState().tick ?? 0;
            this.hud.addEvent({
              tick: result.event.tick,
              type: 'SKILL_ACQUIRED',
              messageKey: `Skill freigeschaltet: ${result.event.title}`,
            });
          }
          this.campaignPanel.update(this.campaignManager, this.toolManager.getFlux());
        }
      },
    });

    this.mainMenu.setCallbacks({
      onStartCampaign: (scenario) => {
        const config: WorldConfig = {
          ...DEFAULT_WORLD_CONFIG,
          mapSize: scenario.mapConfig.size,
        };
        this.startGame(config, scenario);
      },
      onStartSandbox: (biomeId, mapSize) => {
        const config: WorldConfig = {
          ...DEFAULT_WORLD_CONFIG,
          mapSize,
        };
        // For sandbox, create a minimal scenario to get terrain generation
        // but without objectives/invasion
        const sandboxScenario: ScenarioConfig = {
          id: `sandbox_${biomeId}`,
          tier: 0,
          title: 'Sandbox',
          mapConfig: { biomeId, size: mapSize },
          objectives: [],
          startingGenomes: ['pioneer_clover', 'forest_giant', 'network_fungus'],
          startingPlacements: [
            { genomeId: 'pioneer_clover', position: { q: 0, r: 0 }, type: 'PLANT' },
          ],
        };
        this.startGame(config, sandboxScenario);
      },
    });
  }

  private wireKeyboard(): void {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'SELECT') return;

      // Menu-state shortcuts
      if (this.state === 'MENU') return;

      switch (e.key) {
        case '1': this.hud.selectLens('MOISTURE'); this.renderer.setLens('MOISTURE'); break;
        case '2': this.hud.selectLens('NUTRIENTS'); this.renderer.setLens('NUTRIENTS'); break;
        case '3': this.hud.selectLens('TOXIN'); this.renderer.setLens('TOXIN'); break;
        case '0': this.hud.selectLens('OFF'); this.renderer.setLens('OFF'); break;
        case 'Escape':
          if (this.campaignPanel.isVisible()) {
            this.campaignPanel.hide();
          } else {
            this.selectedHex = null;
            this.renderer.setSelection(null);
            this.inspector.hide();
          }
          break;
        case ' ':
          e.preventDefault();
          if (this.timeManager) {
            const current = this.timeManager.getSpeed();
            const next: SpeedLevel = current === 'PAUSE' ? 'PLAY' : 'PAUSE';
            this.timeManager.setSpeed(next);
            this.hud.setActiveSpeed(next);
          }
          break;
        case 'Tab':
          e.preventDefault();
          this.campaignPanel.toggle();
          if (this.campaignPanel.isVisible()) {
            this.campaignPanel.update(this.campaignManager, this.toolManager.getFlux());
          }
          break;
      }
    });

    // Auto-pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.state === 'PLAYING' && this.timeManager) {
        this.timeManager.setSpeed('PAUSE');
        this.hud.setActiveSpeed('PAUSE');
      }
    });
  }
}
