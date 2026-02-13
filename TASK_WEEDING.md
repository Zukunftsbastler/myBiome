# Task: Implement "Bio-Extractor" Tool

**Context:**
Players need a way to selectively remove specific plants (weeding) to shape the environment. This action should cost Flux based on the difficulty of removing the plant.

**Requirements:**

1. **Tool Implementation (`src/interaction/ToolManager.ts`):**
* Add a new tool mode: `'EXTRACTOR'`.
* Implement `handleInteraction(x, y)`:
* Check if a plant entity exists at the target hex.
* Calculate removal cost using the formula: `Base + Biomass * (1 + Lignin + RootDepth)`.
* Check if Player has enough Flux.




2. **Logic & Math (`simulationUtils.ts`):**
* Create a helper function `calculateRemovalCost(entity, genome)`.
* *Parameter weighting:*
* `Base`: 2 Flux.
* `Biomass Factor`: 10.
* `Lignin/Root Multiplier`: Full 0.0-1.0 range adds to resistance.




3. **Execution (`SimulationLoop.ts` / `VegetationSystem.ts`):**
* If the interaction is successful:
* Deduct Flux.
* **Recycle:** Convert the entity's biomass into `organicSaturation` on the grid cell (`grid.mutateCell`).
* Remove the entity (add to `entitiesToRemove`).
* Spawn a particle effect (optional placeholder logic).




4. **UI Feedback:**
* When the Extractor tool is active, hovering over a plant should display the projected cost in the Inspector or a tooltip.