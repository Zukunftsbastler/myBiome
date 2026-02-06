# Campaign & Progression: Die Meta-Ebene

Dieses Dokument beschreibt das System für Spielfortschritt, Freischaltungen und langfristige Ziele.
**Architektur-Hinweis:** Dieses System liegt *außerhalb* der Core-Simulation. Es interagiert nur über definierte Schnittstellen (API) mit der Spielwelt. Wenn dieses Modul deaktiviert ist, läuft das Spiel als reiner "Sandbox-Modus".

---

## 1. Das Datenmodell: Profile & State

Der Fortschritt wird in einem persistenten `PlayerProfile` gespeichert (z.B. im LocalStorage oder einer Datenbank).

```typescript
interface PlayerProfile {
  // Was hat der Spieler bereits erreicht?
  unlockedScenarios: string[];  // ["mars_alpha", "forest_clearing"]
  unlockedTools: string[];      // ["brush_water", "brush_seed"]
  
  // Der Tech-Tree Status
  acquiredSkills: string[];     // ["tech_bio_1", "tech_atmos_2"]
  
  // Globale Währung für den Tree (optional, falls Flux nicht persitent ist)
  researchPoints: number; 

  // Die Wahrnehmungs-Matrix (Feature Flags)
  // Steuert, welche UI-Elemente gerendert werden dürfen.
  uiCapabilities: {
    canSeeMoisture: boolean;    // Zeigt Wasser-Werte im Inspector
    canSeeNutrients: boolean;   // Zeigt Nährstoffe
    canSeeGenetics: boolean;    // Zeigt DNA-Parameter (Late Game)
    canShowGhost: boolean;      // Zeigt die Zukunftsprognose bei Mouseover
    canShowDeathCause: boolean; // Zeigt detaillierte Todesursachen im Log
    canShowGraphs: boolean;     // Zeigt Verlaufs-Graphen
  }
}
```

2. Der Quest-Observer (Ziele & Trigger)
Damit das Spiel weiß, wann ein Ziel erreicht ist, nutzen wir ein Trigger-System. Es scannt den Zustand der Simulation, ohne die Physik zu beeinflussen.
A. Trigger-Typen
* THRESHOLD_REACHED: Variable X überschreitet Wert Y.
    * Bsp: Global.total_biomass > 1000.
* STABILITY_CHECK: Variable X bleibt für Zeit T über Wert Y.
    * Bsp: CellData.water > 0.3 für 500 Ticks (Nachweis eines stabilen Klimas).
* DISCOVERY: Ein bestimmter Gen-Parameter wurde gescannt.
    * Bsp: Spieler scannt Pflanze mit radiation_tolerance > 0.9.
B. Szenario-Definition (Quest-Log)
Ein Szenario (aus SCENARIO_CONFIG.md) kann eine optionale WinCondition haben.
YAML

scenario_id: "mars_terraforming_phase_1"
objectives:
  - id: "establish_bridgehead"
    type: "STABILITY_CHECK"
    target: "biofilm_integrity"
    value: 0.5
    duration: 300
    reward: 
      flux: 500
      unlock_tool: "brush_nutrient_paste"

3. Der Skilltree (Tech & Upgrades)
Der Skilltree ermöglicht das "Late Game". Er verändert nicht den Code, sondern injiziert Modifikatoren in die GAME_MATH oder schaltet UI-Elemente in INTERACTION_MECHANICS frei.
### A. Der Biologie-Pfad (Grüner Daumen)
* Tier 1: "Samen-Selektion"
    * Effect: Schaltet Tool: Seed_Picker frei (Samen von Karte sammeln).
* Tier 2: "Effizienz-Steigerung"
    * Effect: Globaler Modifier GROWTH_COST_FACTOR *= 0.9 (Pflanzen wachsen 10% billiger).
* Tier 3: "Gen-Labor"
    * Effect: Schaltet das UI-Panel Genetic Editor frei. Erlaubt Manipulation von SYSTEM_PARAMETERS.
### B. Der Ingenieurs-Pfad (Terraforming)
* Tier 1: "Wasser-Kondensatoren"
    * Effect: Brush: Hydrate kostet 20% weniger Flux.
* Tier 2: "Atmosphären-Wandler" (Late Game)
    * Effect: Schaltet Gebäude Atmo-Generator frei.
    * Physik: Erhöht global humidity und temperature langsam pro Tick.
* Tier 3: "Orbital-Spiegel"
    * Effect: Tool Global_Heat. Kann Eis schmelzen (Scenario Mars).
### C. Der Wissenschafts-Pfad (Die Sinne)
Verbessert nicht die Welt, sondern das Verständnis des Spielers über die Welt.

* **Tier 1: "Basis-Sensorik"**
    * *Kosten:* 100 Flux
    * *Effect:* Setzt `uiCapabilities.canSeeMoisture = true`.
    * *UX:* Inspector zeigt nun Feuchtigkeitswerte an.
* **Tier 2: "Kausale Logik"**
    * *Kosten:* 300 Flux
    * *Effect:* Setzt `uiCapabilities.canShowDeathCause = true`.
    * *UX:* Statt "Pflanze tot" steht im Log nun "Pflanze verhungert wegen Nährstoffmangel".
* **Tier 3: "Präkognition (Simulation)"**
    * *Kosten:* 1000 Flux
    * *Effect:* Setzt `uiCapabilities.canShowGhost = true`.
    * *UX:* Die "Geist-Projektion" (Vorhersage) wird bei Mouseover aktiviert.

4. Integration: Wie es gekapselt bleibt
Das Core-System muss "Hookable" sein, darf aber nichts vom Skilltree wissen. Wir nutzen das Modifier-Pattern.
In GAME_MATH.ts (Core):
TypeScript

// Statt hardcoded Werten nutzen wir einen Context
function calculateGrowthCost(volume: number, context: GameContext) {
  let cost = volume * CONSTANTS.BASE_COST;
  // Der Context enthält alle aktiven Modifier aus dem Skilltree
  cost *= context.modifiers.growthCostMultiplier; 
  return cost;
}
Im Campaign Manager:
* Wenn Spieler Skill "Effizienz" kauft -> Setze context.modifiers.growthCostMultiplier = 0.9.
* Die Simulation rechnet einfach weiter, aber die Werte ändern sich.

5. Late Game: Totale Kontrolle
Im Endspiel ("God Mode") verschwimmen die Grenzen zwischen Gärtner und Ingenieur.
* Globale Parameter-Kontrolle:
    * Statt einzelner Zellen (brush) kann der Spieler globale Regler verschieben (World.temperature).
    * Kosten: Extrem hoher Flux-Verbrauch pro Sekunde ("Upkeep").
* Automatisierung:
    * Der Spieler kann "Drohnen" (KI-Entitäten) programmieren (BEHAVIOR_AND_DECISION), die automatisch düngen oder ernten. Das Spiel spielt sich fast von selbst (Factorio-Style).

6. Zusammenfassung der UI-Freischaltung

Das UI ist vollständig implementiert, aber standardmäßig "blind". Es prüft bei jedem Rendern das `PlayerProfile`.

**Das Prinzip:**
* **Sandbox-Modus:** Das Spiel startet mit einem `PlayerProfile`, in dem alle `uiCapabilities` auf `true` stehen. Das UI ist voll sichtbar.
* **Kampagnen-Modus:** Das Spiel startet mit `false`. Das UI blendet Elemente aus (zeigt "???").

**Der Flow:**
1.  **Action:** Spieler kauft Skill "Basis-Sensorik".
2.  **State Change:** CampaignManager setzt `profile.uiCapabilities.canSeeMoisture = true`.
3.  **Event:** Feuert `PROFILE_UPDATED`.
4.  **Reaction:** Der `Inspector` (UI-Komponente) empfängt das Event, rendert neu und zeigt den Feuchtigkeits-Balken an, der vorher versteckt war.

*Vorteil:* Das UI muss nichts über Quests oder Skilltrees wissen. Es kennt nur seinen eigenen Sichtbarkeits-Status.

7. Das Tutorial-System (Der Regisseur)
Das Tutorial ist ein spezialisierter Modus der Kampagnen-Logik. Es ist eine State Machine, die den Spieler Schritt für Schritt durch definierte Szenarien führt.
Architektur: Das Tutorial liegt im CampaignManager. Es ist standardmäßig inaktiv (null). Wenn aktiv, legt es einen "Layer" über das Spiel, der Inputs abfangen und UI-Elemente hervorheben kann.
A. Die Datenstruktur (Das Skript)
Ein Tutorial besteht aus einer linearen Liste von Steps.
TypeScript

interface TutorialStep {
  id: string;
  
  // 1. Die Inszenierung (Was sieht der Spieler?)
  message: string;          // "Klicke auf den Geschwindigkeits-Regler."
  narratorMood?: 'neutral' | 'excited' | 'warning';
  highlightElementId?: string; // UI-ID (z.B. "#speed-slider") für blinkenden Rahmen/Pfeil
  restrictInput?: boolean;  // Wenn true: Alle anderen Buttons sind deaktiviert (Focus)

  // 2. Die Bedingung (Wann geht es weiter?)
  completionTrigger: {
    type: 'UI_ACTION' | 'SIMULATION_EVENT' | 'TIMER';
    target: string;         // z.B. "speed_setting" oder "entity_growth"
    value?: any;            // z.B. 3 oder "fruit_produced"
  };

  // 3. Der Effekt (Optional: Gott-Eingriff beim Start des Steps)
  onStart?: {
    action: 'SPAWN_ENTITY' | 'SET_FLUX' | 'FORCE_PARAMETER';
    details: any;           // z.B. { id: "seed_wheat", x: 5, y: 5 }
  };
}
B. Beispiel-Ablauf (Dein Szenario)
Das Tutorial-System arbeitet diese Liste ab:
1. Step 1: Zeit-Kontrolle
    * Message: "Hier wird die Geschwindigkeit eingestellt. Setze sie auf 3."
    * Highlight: #speed-control
    * Trigger: UI_ACTION: speed_changed -> Value >= 3.
2. Step 2: Pause
    * Message: "Sehr gut. Das Leben rast. Setze sie nun auf Pause, um genauer hinzusehen."
    * Highlight: #pause-btn
    * Trigger: UI_ACTION: paused -> Value true.
3. Step 3: Der Samen (Gescriptetes Event)
    * OnStart: SPAWN_ENTITY { type: "seed_bush", pos: [0,0] } (System erzwingt Spawn).
    * Message: "Oh, ein Samen hat seinen Weg auf dein Feld gefunden! Aber er ist durstig."
    * Highlight: #world-grid (Zelle 0,0).
    * Trigger: TIMER: 5s (Lass dem Spieler Zeit zum Gucken).
4. Step 4: Interaktion
    * Message: "Wähle das Wasser-Werkzeug und hilf ihm."
    * Highlight: #tool-water
    * Trigger: TOOL_SELECTED: water.
C. Integration in die UI
Damit das funktioniert, müssen wir im UI (HUD.ts) eine Schnittstelle für den "Regisseur" bereitstellen:
* TutorialOverlay: Ein unsichtbares Div über dem gesamten Screen.
* Spotlight: Schneidet ein Loch in das Overlay an der Position von highlightElementId (macht den Rest dunkel).
* Textbox: Zeigt die message des aktuellen Steps an.
Deaktivierbarkeit: Der Spieler kann im Menü jederzeit "Tutorial beenden" wählen. Der CampaignManager setzt dann currentTutorial = null, das Overlay verschwindet, und die Sandbox läuft normal weiter.
