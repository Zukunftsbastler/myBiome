# Scenario Config: Welt-Parameter

Dieses Dokument definiert die globalen Metaparameter und Startbedingungen der Simulation **myBiome**.
**Architektur:** Diese Konfigurationen werden beim Start in das `WorldConfig`-Interface (`@core/types`) geladen. Sie steuern den Zufallsgenerator und die Randbedingungen.

---

## 1. Globale Entropie (Randomness)

Diese Werte steuern die Stabilität des Systems.

* **`mutationRate` (0.0 - 1.0)**
    * Wahrscheinlichkeit, dass bei `SPAWN` die Genome-Parameter leicht abweichen.
    * *Default:* `0.1` (Langsame Evolution).
    * *High:* `0.9` (Radioaktives Chaos).
* **`eventVolatility` (0.0 - 1.0)**
    * Frequenz von `SimulationEvent` (z.B. Hitzewelle, Sturm).
* **`entropySeed` (number)**
    * Der Startwert für den deterministischen Zufallsgenerator (wichtig für Replays).

---

## 2. Randbedingungen (Boundaries)

Definition der Interaktion mit der "Außenwelt" (außerhalb des Grids).

* **`bioConnectivity` (0.0 - 1.0)**
    * Wahrscheinlichkeit pro Tick, dass externe Biomasse eindringt.
    * `0.0`: Hermetisch abgeriegelt (Labor).
    * `1.0`: Offenes Ökosystem.
* **`externalSeedPressure` (string[])**
    * Liste von `genomeId`s, die zufällig auf leeren Feldern spawnen (definiert in `genes.json`).
    * *Beispiel:* `['WEED_COMMON', 'GRASS_WILD']`.
* **`ambientTemperature` (Base Value)**
    * Der globale Temperatur-Baseline, auf die `CellData.temperature` zurückfällt.

---

## 3. Scenario Presets (Die Welten)

Presets überschreiben die Defaults der `GridManager`-Initialisierung.

### Szenario A: "Red Planet" (Mars-Terraforming)
* **Description:** Totale Isolation. Kein Leben, toxischer Boden.
* **World Config:**
    * `bioConnectivity: 0.0`
    * `ambientTemperature: -0.5` (Eiskalt)
    * `radiationLevel: 0.8` (Hohe Mutation)
* **Initial CellData (Map-Generation):**
    * `granularity: 0.1` (Fels)
    * `organicSaturation: 0.0`
    * `toxin: 0.2` (Perchlorate)
* **Player Loadout:**
    * `flux: 500`
    * `unlockedTools`: [`TOOL_SEALED_GREENHOUSE`, `TOOL_LICHEN_SEED`]

### Szenario B: "Monoculture Battle" (Ackerland)
* **Description:** Kampf gegen invasive Arten und Nährstoff-Verlust.
* **World Config:**
    * `bioConnectivity: 1.0` (Maximal offen)
    * `externalSeedPressure`: [`WEED_INVASIVE`, `CROP_MONO`]
* **Initial CellData:**
    * `nutrients: 0.9` (Überdüngt)
    * `compaction: 0.7` (Verdichtet)
    * `biofilmIntegrity: 0.1` (Beschädigt durch Pflügen)

### Szenario C: "Post-Fire Recovery" (Phönix)
* **Description:** Nährstoff-Schock nach Waldbrand.
* **Initial CellData:**
    * `organicSaturation: 0.8` (Asche = Nährstoff-Bombe)
    * `water: 0.0` (Ausgetrocknet)
    * `occupancy: 0.0` (Alles tot)
* **Mechanic:** `dormantSeedsActivation: 1.0` (Feuer-Keimer im Boden erwachen).

---

## 4. Exposed Parameters (Setup-Schnittstelle)

Diese Parameter-Bereiche dürfen vom Spieler im "Custom Game"-Screen manipuliert werden.

1.  **Topography:** `GridManager.noiseFrequency` (Flach vs. Gebirge).
2.  **Isolation:** Steuert `bioConnectivity`.
3.  **Difficulty:** Steuert `fluxCap` und `eventVolatility`.
4.  **Starting Biome:** Wählt das Set der `externalSeedPressure`.

---

## 5. Starter Kits (Loadouts)

Definiert das Inventar für Szenarien mit `bioConnectivity: 0.0`.

* **Artifact: "Lander Module"**
    * *Type:* `Entity` (Statisches Gebäude).
    * *Effect:* Emittiert `water` und `heat` in Radius 2.
* **Item: "Exo-Seed Canister"**
    * *Content:* 100x `GENOME_PIONEER_LICHEN`.
    * *Trait:* Extrem hohe `radiationTolerance`.
* **Tool: "Nutrient Injector"**
    * *Effect:* Setzt `organicSaturation` auf 0.5.
    * *Cost:* Verbraucht Flux (Startkapital).