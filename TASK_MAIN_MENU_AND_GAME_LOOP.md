# Task: Main Menu, Game Loop Refactoring & Flux UI

**Context:**
The core simulation is functional. We now need to wrap it into a proper game structure. Currently, the simulation starts immediately upon loading. We need a **Main Menu** to select between Campaign and Sandbox modes, a **Progression System** to handle unlocks, and a **Flux UI** to visualize the economy.
Additionally, the base simulation speed needs to be slowed down for a more meditative experience.

**Goal:**
Refactor `main.ts` into a state-managed `GameApp`, implement the Main Menu UI, visualize Flux, and apply specific balancing changes.

---

## 1. Architectural Changes (Refactoring `main.ts`)

We need to move away from the linear execution in `main.ts`.

### A. Create `src/core/GameApp.ts`

This class controls the high-level application state.

* **States:** `MENU`, `CAMPAIGN_SELECT`, `LOADING`, `PLAYING`, `PAUSED`.
* **Responsibilities:**
* Initialize `Renderer` (but keep screen black/background until game starts).
* Manage the DOM overlay for the Menu.
* Instantiate `SimulationLoop` only when a scenario is started.
* Handle the "Quit to Menu" logic (destroying the current simulation).



### B. Update `src/main.ts`

* Should only instantiate `GameApp` and call `app.init()`.

---

## 2. The Time Manager (Speed Adjustment)

Implement the `TimeManager` as discussed in previous designs, but with updated timing constants.

* **File:** `src/core/time/TimeManager.ts`
* **Requirement:** Decouple logic ticks from render frames.
* **Speed Settings:**
* `PAUSE`: 0 TPS
* `PLAY`: **2 TPS** (Changed from 10! This is the new default).
* `FAST`: 20 TPS
* `MAX`: Uncapped (as fast as CPU allows, up to 60 TPS).



---

## 3. UI Implementation

### A. Main Menu (`src/ui/MainMenu.ts`)

Create a DOM-based overlay (z-index > 10) covering the canvas.

* **Style:** Minimalist, consistent with `STYLE_GUIDE.md`. Dark background.
* **Structure:**
* **Title:** "myBiome" (Large typography).
* **Campaign Button:** Opens Level Selector.
* *Level Selector:* Lists scenarios from `CAMPAIGN_DESIGN.md`. Locked scenarios appear greyed out.


* **Sandbox Button:** Opens Custom Game Config (Biome type, Map size).
* **Settings Button:** (Placeholder for now).


* **Behavior:** Clicking "Start" hides the menu, initializes `SimulationLoop` with the chosen config, and fades in the `Renderer`.

### B. Flux Visualization (`HUD.ts`)

The player needs to see their resources.

* **Location:** Top-Left or Top-Center (distinct from the bottom Toolbar).
* **Display:**
* **Current Flux:** Large number (e.g., "1,250 ◈").
* **Trend:** Small indicator (+12/sec) based on the last tick's gain.


* **Animation:** When Flux is spent or gained in large amounts, flash the text (Green for gain, Red for spend).

---

## 4. Scenario & Progression Data

### A. Scenario Database (`src/data/scenarios.ts`)

Translate the `CAMPAIGN_DESIGN.md` into a TypeScript constant/registry.

* Define the data structure for `ScenarioConfig` (Biome, Win Conditions, Restrictions).
* Implement the first 3 scenarios defined in the design doc (Garden, Wasteland, etc.).

### B. Player Profile (`src/core/profile/PlayerProfile.ts`)

* **Responsibility:** Persist progress to `localStorage`.
* **Data:**
* `unlockedScenarios`: Array of Scenario IDs.
* `completedObjectives`: Record of achievements.
* *Note:* Flux is per-session, not persistent here.



---

## 5. Balancing & Constants

**Crucial:** We need to balance the economy so it feels rewarding but not broken.

### A. Centralize Constants (`src/core/math/constants.ts`)

Ensure all Flux-related values are here, not magic numbers in code.

```typescript
export const ECO_BALANCE = {
  // Flux Generation
  FLUX_PER_PHOTOSYNTHESIS: 0.1, // Base value
  FLUX_PER_FRUIT_GROWTH: 0.5,   // Bonus for fruiting
  
  // Costs (Reference for UI)
  COST_DNA_MODIFICATION: 100,
  COST_SEED_SPAWN: 10,
  COST_TERRAFORM_TOOL: 500,

  // Thresholds
  STARVATION_THRESHOLD: 0,
};

```

### B. Adjust `simulationUtils.ts`

* Update `calculateFluxGain` to use `ECO_BALANCE`.
* *Dev Note:* Ensure that a stable population of ~50 plants generates enough Flux in ~2 minutes (at 2 TPS) to buy a basic upgrade.
* Calculation: 50 plants * 2 ticks/sec * 0.1 flux = 10 Flux/sec.
* 2 minutes = 1200 Flux. This seems reasonable for a `COST_DNA_MODIFICATION` of 100-500.



---

## Summary of Deliverables

1. `TimeManager` implemented with **2 TPS** default.
2. `GameApp` class replacing the logic in `main.ts`.
3. `MainMenu` UI class (HTML/CSS).
4. `Scenario` data structure & `PlayerProfile` for persistence.
5. `HUD` updated with Flux Counter.
6. `constants.ts` updated for Flux balancing.