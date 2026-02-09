Prompt: Implementierung der Kampagnen-Systeme (Invasion & Objectives)
Kontext: Wir haben das Game-Design um eine Kampagnen-Struktur erweitert (siehe CAMPAIGN_DESIGN.md). Nun müssen die technischen Systeme implementiert werden, die (A) das Szenario laden, (B) fremde Samen in die Welt "wehen" lassen (Invasion) und (C) prüfen, ob das Level gewonnen oder verloren wurde (Objectives).

Bitte implementiere die folgenden Komponenten in TypeScript:

1. Typ-Definitionen (src/core/types/scenario.ts)

Erstelle neue Interfaces, um ein Szenario zu beschreiben.

ObjectiveType: Enum/Union Type: 'COVERAGE' | 'DIVERSITY' | 'PURIFICATION' | 'SURVIVAL'.

WinCondition: Objekt mit type, target (z.B. Species-Name oder Toxin-Level) und threshold (z.B. 0.8 für 80%).

InvasionConfig: Objekt mit speciesPool (Array von Genom-IDs) und spawnRate (Wahrscheinlichkeit pro Tick, 0.0 - 1.0).

ScenarioConfig: Das Root-Objekt, das biomeId, initialFlux, invasion und objectives enthält.

2. Das Invasions-System (src/systems/InvasionSystem.ts)

Erstelle eine Klasse InvasionSystem, die parallel zum VegetationSystem läuft.

Input: ScenarioConfig, GridManager, PRNG.

Logik:

Prüfe in jedem Tick basierend auf spawnRate, ob eine Invasion stattfindet.

Wenn JA: Wähle eine zufällige Genom-ID aus dem speciesPool.

Wind-Mechanik: Wähle bevorzugt ein leeres Hex-Feld am Kartenrand (Grid Edge) oder ein zufälliges leeres Feld (Vogelkot-Mechanik).

Output: Rückgabe von entitiesToSpawn (Liste von SEEDs), ähnlich wie VegetationSystem.

3. Der Objective-Tracker (src/systems/ObjectiveTracker.ts)

Erstelle ein System, das den Fortschritt überwacht.

Input: ScenarioConfig, GridManager, EntityManager.

Methoden:

checkObjectives(): Iteriert über alle definierten Ziele.

Coverage: Zählt Pflanzen einer bestimmten Art / Gesamtzahl Tiles.

Diversity: Zählt Anzahl einzigartiger genomeIds auf der Karte.

Purification: Zählt Tiles mit toxin < 0.1 / Gesamtzahl Tiles.

Output: Ein Status-Objekt { completed: boolean, failed: boolean, progress: number }.

4. Integration in den Loop (src/systems/SimulationLoop.ts)

Erweitere die SimulationLoop Klasse:

Load Scenario: Füge eine Methode loadScenario(config: ScenarioConfig) hinzu, die den State resetet und die Config speichert.

Update Step:

Rufe this.invasionSystem.update() auf und füge die resultierenden Samen der Welt hinzu.

Rufe this.objectiveTracker.checkObjectives() auf.

Game State: Wenn objectiveTracker "Completed" meldet, pausiere die Simulation und feuere ein LEVEL_COMPLETED Event (für das UI). Bei "Failed" feuere LEVEL_FAILED.

Hinweise:

Nutze die existierenden Typen aus @core/types.

Achte darauf, dass das InvasionSystem keine Pflanzen auf besetzte Felder setzt (nutze grid.getOccupancy oder prüfe Entitäten).

Halte die Architektur performant (Objective-Checks evtl. nur alle 60 Ticks ausführen, nicht jeden Frame).