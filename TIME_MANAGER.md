# Time Control & Game Loop Architecture

Dieses Dokument beschreibt die Implementierung einer variablen Zeitsteuerung.
**Problem:** Aktuell ist die Simulations-Geschwindigkeit an die Bildwiederholrate (FPS) gekoppelt.
**Lösung:** Ein **Accumulator-Pattern**, das Logik-Updates (`sim.step()`) von Rendering-Updates (`renderer.update()`) entkoppelt.

---

## 1. Die Geschwindigkeits-Stufen (Speed Levels)

Wir definieren vier Stufen, die den "Heartbeat" der Simulation steuern.

| Stufe | Name | Verhalten | Ticks pro Sekunde (TPS) | Implementierung |
| --- | --- | --- | --- | --- |
| **0** | **PAUSE** | Simulation stoppt. Interaktion (Tools, Inspektion) bleibt aktiv. | 0 | `update` wird übersprungen. |
| **1** | **PLAY (Observer)** | Langsam. Man kann Pflanzen beim Wachsen zusehen. | 5 - 10 | Accumulator wartet, bis Zeit vergangen ist. |
| **2** | **FAST (Simulation)** | Standard. Flüssiger Ablauf. | 30 - 60 | 1 Tick pro Frame (bei 60Hz). |
| **3** | **MAX (Benchmark)** | "Skip Ahead". Berechnet so viel wie die CPU erlaubt. | ∞ (Cap: 10-20/Frame) | Multiple Steps pro Render-Frame (Batching). |

---

## 2. Technische Umsetzung: Der Loop

Wir ändern die Logik in `main.ts`. Statt `sim.step()` stur in jedem Frame aufzurufen, führen wir einen `TimeManager` ein.

### A. Der TimeManager (Logik-Klasse)

```typescript
// src/core/time/TimeManager.ts (Pseudo-Code)

export type SpeedLevel = 'PAUSE' | 'PLAY' | 'FAST' | 'MAX';

export class TimeManager {
  private speed: SpeedLevel = 'PLAY';
  private accumulator = 0;
  private lastTime = 0;
  
  // Konfiguration der Geschwindigkeiten (in ms pro Tick)
  private readonly TICK_RATES = {
    PAUSE: Infinity,
    PLAY: 1000 / 10,  // 10 TPS (alle 100ms ein Tick)
    FAST: 1000 / 60,  // 60 TPS (ca. 16ms)
    MAX: 0            // Spezialfall
  };

  constructor(private callbacks: { onTick: () => void }) {}

  update(currentTime: number) {
    if (this.speed === 'PAUSE') {
      this.lastTime = currentTime;
      return;
    }

    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    if (this.speed === 'MAX') {
      // MAX-Logik: Führe X Ticks pro Frame aus (z.B. 5), egal wie viel Zeit verging
      // Begrenzt durch ein Zeit-Budget (z.B. max 10ms rechnen, damit UI nicht friert)
      const startTime = performance.now();
      while (performance.now() - startTime < 12) { // 12ms Budget
        this.callbacks.onTick();
      }
    } else {
      // Fixed Timestep Logik für PLAY/FAST
      const stepSize = this.TICK_RATES[this.speed];
      this.accumulator += deltaTime;

      // Wenn die Simulation zu weit zurückfällt (Lag-Spike), 
      // cappen wir den Accumulator, um "Spiral of Death" zu verhindern.
      if (this.accumulator > 200) this.accumulator = 200;

      while (this.accumulator >= stepSize) {
        this.callbacks.onTick();
        this.accumulator -= stepSize;
      }
    }
  }

  setSpeed(level: SpeedLevel) {
    this.speed = level;
    this.accumulator = 0; // Reset um "Fast-Forward"-Effekt beim Umschalten zu vermeiden
  }
}

```

### B. Integration in `main.ts`

```typescript
// main.ts

const timeManager = new TimeManager({
  onTick: () => {
    const result = sim.step();
    // Flux Manager update...
    hud.update(result, ...);
  }
});

renderer.app.ticker.add((ticker) => {
  // 1. Physik/Logik updaten (entkoppelt)
  timeManager.update(performance.now());
  
  // 2. Rendering updaten (immer, damit Hover/Selektion flüssig bleibt)
  // Wir übergeben interpolate-Werte, falls wir Animationen glätten wollen (optional)
  renderer.update(sim.getState()); 
  
  // 3. UI-Interaktion
  updateInspector(); 
});

```

---

## 3. Progression & Unlocks (Feature Flags)

Damit der Spieler die Geschwindigkeit nicht sofort ändern kann, nutzen wir das `PlayerProfile` (siehe `CAMPAIGN_AND_PROGRESSION.md`).

### A. Capability-Erweiterung (`ui.ts`)

```typescript
export interface UICapabilities {
  // ... bestehende Flags
  timeControl: {
    canPause: boolean;      // Start: true
    canChangeSpeed: boolean; // Start: false (nur PLAY)
    canFastForward: boolean; // Unlock Tier 1
    canMaxSpeed: boolean;    // Unlock Tier 2 (God Mode)
  }
}

```

### B. UI-Darstellung (HUD)

Das HUD rendert die Buttons basierend auf den Flags.

* **Zustand "Locked":** Buttons sind ausgegraut oder gar nicht sichtbar.
* **Default (Start):** Nur der "Pause"-Knopf und "Play" sind aktiv.
* **Tutorial:** Das Tutorial zwingt den Spieler oft in `PAUSE`, um Texte zu lesen.

### C. Szenario-Hooks

* **Szenario "Beobachtung":** Startet mit Speed `PLAY`, Controls gesperrt.
* **Szenario "Terraforming":** Schaltet `FAST` frei, da man Jahrhunderte simulieren muss.

---

## 4. UI-Design (Controls)

Im HUD (unten Mitte oder oben Mitte) kommt eine neue Leiste:

`[ || ]  [ > ]  [ >> ]  [ >>> ]`

* **[ || ] Pause:** Immer verfügbar. Spacebar-Shortcut.
* **[ > ] Play:** Standard. 10 TPS.
* **[ >> ] Fast:** 60 TPS. Wenn gesperrt: Icon mit Schloss / Tooltip "Benötigt Chrono-Modul".
* **[ >>> ] Max:** Uncapped. Wenn gesperrt: Unsichtbar.

### Feedback

Wenn `MAX` aktiv ist, zeigt das UI statt FPS die **TPS** (Ticks per Second) an, um dem Spieler zu zeigen, wie leistungsfähig seine "Welt-Maschine" ist.

---

## 5. Nächste Schritte zur Implementierung

1. **Core:** `TimeManager.ts` erstellen (Code oben).
2. **Types:** `UICapabilities` in `@core/types/ui.ts` erweitern.
3. **UI:** `HUD.ts` um `buildTimeControls()` erweitern, das Buttons generiert und Events feuert.
4. **Integration:** `main.ts` Loop umbauen.