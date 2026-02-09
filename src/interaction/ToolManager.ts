import type { ToolType, HexCoord } from '@core/types';
import type { GameModifiers } from '@core/types/campaign';
import { TOOL_CONFIGS } from '@core/types/ui';
import { SIM_CONSTANTS as C } from '@core/math/constants';
import type { SimulationLoop } from '@systems/SimulationLoop';

export class ToolManager {
  private activeTool: ToolType = 'INSPECT';
  private flux: number;
  private fluxCap: number;
  private modifiers: GameModifiers = {
    growthCostMultiplier: 1.0,
    toolCostMultiplier: 1.0,
    fluxGainMultiplier: 1.0,
  };

  constructor() {
    this.flux = C.STARTING_FLUX;
    this.fluxCap = C.STARTING_FLUX_CAP;
  }

  setModifiers(m: GameModifiers): void {
    this.modifiers = m;
  }

  setFluxCapBonus(bonus: number): void {
    this.fluxCap = C.STARTING_FLUX_CAP + bonus;
  }

  selectTool(tool: ToolType): void {
    this.activeTool = tool;
  }

  getActiveTool(): ToolType { return this.activeTool; }
  getFlux(): number { return this.flux; }
  getFluxCap(): number { return this.fluxCap; }

  addFlux(amount: number): void {
    const modified = amount * this.modifiers.fluxGainMultiplier;
    this.flux = Math.min(this.flux + modified, this.fluxCap);
  }

  deductFlux(amount: number): void {
    this.flux = Math.max(0, this.flux - amount);
  }

  canAfford(tool: ToolType): boolean {
    return this.flux >= TOOL_CONFIGS[tool].fluxCost;
  }

  /**
   * Apply the active tool at the given hex. Returns true if applied successfully.
   */
  applyTool(hex: HexCoord, sim: SimulationLoop): boolean {
    const tool = this.activeTool;
    if (tool === 'INSPECT') return false;

    const cost = Math.floor(TOOL_CONFIGS[tool].fluxCost * this.modifiers.toolCostMultiplier);
    if (this.flux < cost) return false;

    const cell = sim.getGrid().getCell(hex.q, hex.r);
    if (!cell) return false;

    switch (tool) {
      case 'HYDRATE':
        sim.mutateCellAt(hex.q, hex.r, { water: cell.water + C.TOOL_HYDRATE_AMOUNT });
        break;
      case 'DESICCATE':
        sim.mutateCellAt(hex.q, hex.r, { water: cell.water - C.TOOL_DESICCATE_AMOUNT });
        break;
      case 'ENRICH':
        sim.mutateCellAt(hex.q, hex.r, { nutrients: cell.nutrients + C.TOOL_ENRICH_AMOUNT });
        break;
      case 'STERILIZE':
        sim.mutateCellAt(hex.q, hex.r, { biofilmIntegrity: 0, toxin: 0 });
        break;
      case 'CULL': {
        const entities = sim.getEntitiesAt(hex.q, hex.r);
        for (const e of entities) {
          sim.killEntity(e.id);
        }
        break;
      }
      case 'SEED': {
        // Spawn first registered genome as seed (placeholder until inventory UI)
        const state = sim.getState();
        const firstGenomeId = state.genomes.keys().next().value;
        if (firstGenomeId) {
          sim.spawnEntity('SEED', firstGenomeId, hex);
        }
        break;
      }
    }

    this.flux -= cost;
    return true;
  }
}
