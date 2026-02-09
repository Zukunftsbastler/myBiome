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
import { ToolManager } from './interaction/ToolManager';
import { CampaignManager } from './interaction/CampaignManager';
import { TimeManager } from '@core/time/TimeManager';

// ── World Configuration ──
const worldConfig: WorldConfig = {
  mutationRate: 0.1,
  eventVolatility: 0.2,
  bioConnectivity: 0.5,
  ambientTemperature: 22,
  mapSize: 5,
};

// ── Initialise Simulation ──
const sim = new SimulationLoop(worldConfig, 12345);
sim.registerGenomes(starterGenomes as Genome[]);
sim.spawnEntity('PLANT', 'pioneer_clover', { q: 0, r: 0 });

// ── Initialise Systems ──
const renderer = new Renderer();
const zoneSystem = new BiomeZoneSystem();
let currentZones: BiomeZone[] = [];
const toolManager = new ToolManager();
const campaignManager = new CampaignManager();
const appContainer = document.getElementById('app')!;
const hudContainer = document.getElementById('hud')!;
const hud = new HUD(hudContainer);
const inspector = new Inspector(hudContainer);
const campaignPanel = new CampaignPanel(hudContainer);

let selectedHex: HexCoord | null = null;
let latestTickResult: TickResult | null = null;

// ── Time Manager ──
const timeManager = new TimeManager(() => {
  const tickResult = sim.step();
  latestTickResult = tickResult;

  // Accumulate flux from simulation
  toolManager.addFlux(tickResult.fluxGenerated);

  // Evaluate campaign quests
  const state = sim.getState();
  const campaignEvents = campaignManager.evaluateQuests(state, tickResult);
  for (const evt of campaignEvents) {
    if (evt.reward?.flux) {
      toolManager.addFlux(evt.reward.flux);
    }
    toolManager.setModifiers(campaignManager.getModifiers());
    hud.addEvent({
      tick: evt.tick,
      type: 'QUEST_COMPLETED',
      messageKey: `Aufgabe abgeschlossen: ${evt.title}`,
    });
  }

  // Auto-pause on scenario completion/failure
  for (const event of tickResult.events) {
    if (event.type === 'LEVEL_COMPLETED' || event.type === 'LEVEL_FAILED') {
      timeManager.setSpeed('PAUSE');
      hud.setActiveSpeed('PAUSE');
    }
  }
});

// ── Hex Click Handler ──
function handleHexClick(hex: HexCoord): void {
  const cell = sim.getGrid().getCell(hex.q, hex.r);
  if (!cell) {
    // Clicked outside grid — deselect
    selectedHex = null;
    renderer.setSelection(null);
    inspector.hide();
    return;
  }

  // If active tool is not INSPECT, apply tool first
  if (toolManager.getActiveTool() !== 'INSPECT') {
    toolManager.applyTool(hex, sim);
    hud.setFlux(toolManager.getFlux(), toolManager.getFluxCap());
  }

  selectedHex = hex;
  renderer.setSelection(hex);
  updateInspector();
}

function updateInspector(): void {
  if (!selectedHex) {
    inspector.hide();
    return;
  }

  const cell = sim.getGrid().getCell(selectedHex.q, selectedHex.r);
  if (!cell) {
    inspector.hide();
    return;
  }

  // Always re-query entities at this hex
  const entities = sim.getEntitiesAt(selectedHex.q, selectedHex.r);
  const plants = entities.filter(e => e.type === 'PLANT');

  if (plants.length > 0) {
    // Group by genomeId, find top 2 most common species
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
      const genome = sim.getGenome(genomeId);
      if (genome) {
        // Pick the largest entity as representative
        const rep = members.reduce((a, b) => a.biomass >= b.biomass ? a : b);
        speciesInfos.push({ entity: rep, genome, count: members.length });
      }
    }

    const zone = currentZones.find(z => z.cells.has(`${selectedHex!.q},${selectedHex!.r}`));
    inspector.show(cell, speciesInfos, zone?.name, zone?.color);
  } else {
    inspector.show(cell);
  }
}

// ── Scenario Loading ──
function loadScenario(scenarioConfig: ScenarioConfig): void {
  // Register invasion genomes
  sim.registerGenomes(INVASION_GENOMES);
  // Register starter genomes
  sim.registerGenomes(starterGenomes as Genome[]);
  // Load scenario (resets sim, applies terrain, places starting entities)
  sim.loadScenario(scenarioConfig, [...INVASION_GENOMES, ...(starterGenomes as Genome[])]);

  // Rebuild grid visuals
  const state = sim.getState();
  renderer.buildGrid(state);
  renderer.update(state);

  // Reset UI state
  selectedHex = null;
  renderer.setSelection(null);
  inspector.hide();
  hud.setFlux(toolManager.getFlux(), toolManager.getFluxCap());
  hud.updateObjectives(Array.from(sim.getObjectives()));

  // Start paused so player can survey the terrain
  timeManager.setSpeed('PAUSE');
  hud.setActiveSpeed('PAUSE');
}

// Expose for console/future UI
(window as unknown as Record<string, unknown>).loadScenario = loadScenario;

// ── Connect Callbacks ──
renderer.setCallbacks({
  onHexClick: handleHexClick,
});

hud.setCallbacks({
  onToolSelected: (tool) => {
    toolManager.selectTool(tool);
  },
  onLensChanged: (lens: DataLens) => {
    renderer.setLens(lens);
  },
  onCampaignToggle: () => {
    campaignPanel.toggle();
    if (campaignPanel.isVisible()) {
      campaignPanel.update(campaignManager, toolManager.getFlux());
    }
  },
  onSpeedChanged: (speed: SpeedLevel) => {
    timeManager.setSpeed(speed);
  },
});

campaignPanel.setCallbacks({
  onSkillPurchase: (skillId) => {
    const result = campaignManager.purchaseSkill(skillId, toolManager.getFlux());
    if (result.success) {
      toolManager.deductFlux(result.cost);
      // Update modifiers
      toolManager.setModifiers(campaignManager.getModifiers());
      toolManager.setFluxCapBonus(campaignManager.getFluxCapBonus());
      hud.setFlux(toolManager.getFlux(), toolManager.getFluxCap());
      // Fire event to log
      if (result.event) {
        result.event.tick = sim.getState().tick;
        hud.addEvent({
          tick: result.event.tick,
          type: 'SKILL_ACQUIRED',
          messageKey: `Skill freigeschaltet: ${result.event.title}`,
        });
      }
      // Refresh panel
      campaignPanel.update(campaignManager, toolManager.getFlux());
    }
  },
});

// ── Keyboard Shortcuts ──
document.addEventListener('keydown', (e: KeyboardEvent) => {
  // Ignore if typing in an input
  if ((e.target as HTMLElement).tagName === 'INPUT') return;

  switch (e.key) {
    case '1': hud.selectLens('MOISTURE'); renderer.setLens('MOISTURE'); break;
    case '2': hud.selectLens('NUTRIENTS'); renderer.setLens('NUTRIENTS'); break;
    case '3': hud.selectLens('TOXIN'); renderer.setLens('TOXIN'); break;
    case '0': hud.selectLens('OFF'); renderer.setLens('OFF'); break;
    case 'Escape':
      selectedHex = null;
      renderer.setSelection(null);
      inspector.hide();
      break;
    case ' ':
      e.preventDefault();
      {
        const current = timeManager.getSpeed();
        const next: SpeedLevel = current === 'PAUSE' ? 'PLAY' : 'PAUSE';
        timeManager.setSpeed(next);
        hud.setActiveSpeed(next);
      }
      break;
    case 'Tab':
      e.preventDefault();
      campaignPanel.toggle();
      if (campaignPanel.isVisible()) {
        campaignPanel.update(campaignManager, toolManager.getFlux());
      }
      break;
  }
});

// ── Main Loop ──
async function main() {
  await renderer.init(appContainer);

  const initialState = sim.getState();
  renderer.buildGrid(initialState);
  renderer.update(initialState);

  // Initial flux display
  hud.setFlux(toolManager.getFlux(), toolManager.getFluxCap());

  renderer.app.ticker.add(() => {
    // 1. Run simulation ticks (decoupled from framerate)
    timeManager.update(performance.now());

    // 2. Always render latest state (even when paused, for smooth interactions)
    const state = sim.getState();

    // Process latest tick result events for HUD
    if (latestTickResult) {
      // Update zones every 10 ticks
      if (state.tick % 10 === 0) {
        currentZones = zoneSystem.computeZones(state);
        renderer.updateZones(currentZones);
      }

      // Update renderer
      renderer.update(state, latestTickResult.prunedGenomeIds);

      // Update HUD
      hud.update(latestTickResult, toolManager.getFlux(), toolManager.getFluxCap());

      // Update objectives display
      if (sim.hasActiveScenario()) {
        hud.updateObjectives(Array.from(sim.getObjectives()));
      }

      // Live-update campaign panel if visible
      if (campaignPanel.isVisible()) {
        campaignPanel.update(campaignManager, toolManager.getFlux());
      }

      // Live-update inspector if selection active
      updateInspector();

      latestTickResult = null;
    }
  });

  // Auto-pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      timeManager.setSpeed('PAUSE');
      hud.setActiveSpeed('PAUSE');
    }
  });
}

main();
