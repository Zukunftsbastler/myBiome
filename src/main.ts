import { SimulationLoop } from '@systems/SimulationLoop';
import type { Genome, WorldConfig, HexCoord, SelectionState } from '@core/types';
import starterGenomes from '@data/genes.json';
import { Renderer } from '@vis/Renderer';
import type { DataLens } from '@vis/Renderer';
import { HUD } from '@ui/HUD';
import { Inspector } from '@ui/Inspector';
import { ToolManager } from './interaction/ToolManager';

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
const toolManager = new ToolManager();
const appContainer = document.getElementById('app')!;
const hudContainer = document.getElementById('hud')!;
const hud = new HUD(hudContainer);
const inspector = new Inspector(hudContainer);

let paused = false;
let selection: SelectionState | null = null;

// ── Hex Click Handler ──
function handleHexClick(hex: HexCoord): void {
  const cell = sim.getGrid().getCell(hex.q, hex.r);
  if (!cell) {
    // Clicked outside grid — deselect
    selection = null;
    renderer.setSelection(null);
    inspector.hide();
    return;
  }

  // If active tool is not INSPECT, apply tool first
  if (toolManager.getActiveTool() !== 'INSPECT') {
    toolManager.applyTool(hex, sim);
    hud.setFlux(toolManager.getFlux(), toolManager.getFluxCap());
  }

  // Update selection
  const entities = sim.getEntitiesAt(hex.q, hex.r);
  const topEntity = entities.length > 0 ? entities[0] : undefined;

  if (topEntity) {
    selection = { type: 'entity', hex, entityId: topEntity.id };
  } else {
    selection = { type: 'cell', hex };
  }

  renderer.setSelection(hex);
  updateInspector();
}

function updateInspector(): void {
  if (!selection) {
    inspector.hide();
    return;
  }

  const cell = sim.getGrid().getCell(selection.hex.q, selection.hex.r);
  if (!cell) {
    inspector.hide();
    return;
  }

  if (selection.entityId) {
    const entity = sim.getEntity(selection.entityId);
    if (entity) {
      const genome = sim.getGenome(entity.genomeId);
      inspector.show(cell, entity, genome);
      return;
    }
    // Entity died — fall back to cell
    selection = { type: 'cell', hex: selection.hex };
  }

  inspector.show(cell);
}

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
      selection = null;
      renderer.setSelection(null);
      inspector.hide();
      break;
    case ' ':
      e.preventDefault();
      paused = !paused;
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
    if (paused) return;

    const tickResult = sim.step();

    // Accumulate flux from simulation
    toolManager.addFlux(tickResult.fluxGenerated);

    // Update renderer
    renderer.update(sim.getState());

    // Update HUD
    hud.update(tickResult, toolManager.getFlux(), toolManager.getFluxCap());

    // Live-update inspector if selection active
    updateInspector();
  });

  // Auto-pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });
}

main();
