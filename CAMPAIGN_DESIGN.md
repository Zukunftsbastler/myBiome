# Campaign & Scenario Design

Dieses Dokument definiert die Kampagnen-Struktur, die Siegbedingungen und die spezifischen Szenarien für *myBiome*.
Es erweitert die Konzepte aus `CAMPAIGN_AND_PROGRESSION.md` um konkrete Level-Designs und die Mechanik des "Fremdsaat-Eintrags".

---

## 1. Kern-Mechanik: Das Szenario-System

Ein Szenario ist mehr als nur eine Map. Es ist eine Regelwerk-Instanz mit folgenden Komponenten:

### A. Die Konfiguration (`ScenarioConfig`)

Jedes Level wird durch ein JSON-Objekt definiert:

* **Map Gen Strategy:** Welches Biome-Rezept wird genutzt? (siehe `SCENARIO_CONFIG.md`).
* **Starting Resources:** Wieviel Flux, welche Tools sind freigeschaltet?
* **Restrictions:** Welche Pflanzen/Gene sind *verboten* oder *noch nicht erforscht*?
* **External Factors:** Windstärke, Strahlung, Regenwahrscheinlichkeit.

### B. "Invasive Pressure" (Der Antagonist)

Pflanzen wachsen nicht nur durch Spieler-Interaktion. Der Wind trägt fremde Samen in die Karte.

* **`foreignSeedPool`**: Eine Liste von Genom-IDs, die "angreifen" (z.B. Löwenzahn, Distel).
* **`invasionRate`**: Wahrscheinlichkeit pro Tick, dass ein fremder Samen am Kartenrand oder zufällig landet.
* **Ziel:** Der Spieler muss Jäten (Weeding) oder Nischen besetzen, um die Invasion abzuwehren.

### C. Sieg- & Niederlage-Bedingungen

* **Victory:** Erreiche `targetBiomass`, `targetDiversity` (Anzahl Spezies) oder `targetPurification` (0 Toxin).
* **Defeat:** `flux` < 0 (Bankrott) oder `invasiveCoverage` > 80% (Überwuchert).

---

## 2. Tier 1: Der Gärtner (The Gardener)

**Fokus:** Micro-Management, Ästhetik, Jäten. Lernen der Basics.

### Szenario 1.1: "Der Englische Rasen" (Tutorial)

* **Map:** `GARDEN` (Dominant: `Lehmboden`, `Garten-Erde`).
* **Aufgabe:** Halte den Garten rein. Es soll nur *Ziergras* wachsen.
* **Start:** Eine kleine Fläche Gras.
* **Bedrohung (Invasion):** `Pioneer Clover` (Klee) und `Dandelion` (Löwenzahn) wehen herein.
* **Sieg:** Halte 90% der Fläche mit Gras bedeckt für 2 Jahre (Ticks). Keine Disteln erlaubt.
* **Lerneffekt:** Umgang mit dem `Weeder` (Jät-Tool) und Wasser-Management.

### Szenario 1.2: "Der Bunte Rabatt"

* **Map:** `PARK` (Wege und Beete).
* **Aufgabe:** Erzeuge hohe Biodiversität in den Beeten, halte die Wege frei.
* **Start:** Leere Beete.
* **Bedrohung:** `Knotgrass` (wächst gerne auf `Parkweg`-Boden).
* **Sieg:** Etabliere mind. 5 verschiedene Spezies gleichzeitig.
* **Mechanik:** Der Spieler muss Pflanzen kreuzen/mutieren lassen, um neue Farben zu erhalten.

---

## 3. Tier 2: Der Restaurator (The Healer)

**Fokus:** Flux-Ökonomie, Sanierung, Expansion.

### Szenario 2.1: "Die Industriebrache" (Wasteland Reclamation)

* **Map:** `INDUSTRY` (Dominant: `Bauschutt`, `Beton`, `Öl-Sumpf`).
* **Situation:** Die Karte ist fast tot. Es gibt nur wenige `Kompost`-Inseln (verrotteter Müll), auf denen etwas wächst.
* **Resource Loop:**
1. Pflanze extrem robusten `Pionier-Klee` auf den kleinen fruchtbaren Inseln.
2. Ernte Flux durch Photosynthese.
3. Kaufe das **"Decontaminator"**-Tool (kostet viel Flux).
4. Wandle `Öl-Sumpf` in `Lehmboden` um.
5. Expandiere.


* **Bedrohung:** Das Toxin breitet sich aus, wenn nicht eingedämmt (`diffusingToxin: true`).
* **Sieg:** Konvertiere 50% der Karte in fruchtbaren Boden (`Nutrients > 0.5`, `Toxin < 0.1`).

### Szenario 2.2: "Die Flut" (River Delta)

* **Map:** `RIVER` (Viel Wasser, `Sumpf`, `Flussschlamm`).
* **Aufgabe:** Befestige das Ufer.
* **Herausforderung:** Periodische Überschwemmungen spülen unbefestigte Pflanzen weg (hohe Erosion).
* **Strategie:** Züchte Pflanzen mit tiefen Wurzeln (`rootDepthStrategy`), um den Boden zu halten (`Compaction` erhöhen).
* **Sieg:** Verhindere Erosion für 5 Jahre.

---

## 4. Tier 3: Der Schöpfer (The Terraformer)

**Fokus:** Gentechnik, Macro-Management, Extreme Bedingungen.

### Szenario 3.1: "Vulkaninsel" (Primordial Soup)

* **Map:** `VOLCANO` (`Lava`, `Asche`, `Fels`).
* **Aufgabe:** Erschaffe Leben aus dem Nichts.
* **Herausforderung:** Der Boden ist extrem nährstoffreich (`Asche`), aber es gibt kein Wasser (nur Regen). Die Lava verbrennt angrenzende Pflanzen.
* **Tool:** **"Cloud Seeder"** (kostet massiv Flux, lässt es regnen).
* **Sieg:** Decke die schwarze Asche mit einem grünen Teppich.

### Szenario 3.2: "Projekt: Roter Hoffnung" (Mars)

* **Map:** `MARS` (`Mars-Regolith`, `Permafrost`).
* **Atmosphäre:** `Light: 0.6` (weiter weg von der Sonne), `Radiation: High`.
* **Start-Bedingung:** `Temperature: -60°C`. Pflanzen wachsen nicht.
* **Aufgabe:** Terraforming.
* **Phase 1:** Baue "Gewächshaus-Kuppeln" (teure Strukturen), um lokale Wärme zu erzeugen.
* **Phase 2:** Züchte "Xeno-Flechten", die Kälte und Strahlung tolerieren (`radiationTolerance > 0.9`).
* **Phase 3:** Die Pflanzen geben O2 ab (simuliert durch `Atmosphere`-Score). Wenn Score hoch genug -> Temperatur steigt global.
* **Sieg:** Erreiche eine stabile Durchschnittstemperatur von > 0°C und pflanze den ersten Baum.

---

## 5. Implementierungs-Guide (Technical)

### Datenstruktur für `Campaign.json`

```json
{
  "scenarios": [
    {
      "id": "scenario_garden_01",
      "tier": 1,
      "title": "Der erste Spatenstich",
      "mapConfig": {
        "biomeId": "GARDEN",
        "size": 32
      },
      "constraints": {
        "allowedGenes": ["grass_simple", "flower_basic"],
        "lockedTools": ["decontaminator", "genetic_splicer"]
      },
      "invasion": {
        "active": true,
        "speciesPool": ["weed_dandelion"],
        "rate": 0.05
      },
      "objectives": [
        { "type": "COVERAGE", "targetSpecies": "grass_simple", "threshold": 0.8 },
        { "type": "ABSENCE", "targetSpecies": "weed_dandelion", "threshold": 0.05 }
      ]
    }
  ]
}

```

### Notwendige System-Erweiterungen

1. **`InvasionSystem.ts`**: Ein neues System, das parallel zum `VegetationSystem` läuft und basierend auf der Config zufällig Samen in Rand-Tiles ("Wind") oder leere Tiles ("Vogelkot") spawnt.
2. **`ObjectiveTracker.ts`**: Prüft jeden Tick (oder jeden 100. Tick), ob die Siegbedingungen erfüllt sind.
3. **`ToolUnlocks`**: Das UI muss Tools ausblenden, die im Szenario nicht verfügbar sind.