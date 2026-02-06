# Design-Konzept: Das Lebende Ökosystem

Dieses Dokument beschreibt die biologischen und physikalischen Regeln der Simulation **myBiome**.
**Ziel:** Ein emergentes System, das sich wie ein echtes Terrarium verhält. Es basiert auf den Datenstrukturen aus `@core/types/grid.ts` und `@core/types/genome.ts`.

---

## 1. Der Boden als Daten-Vektor (CellData)

Der Boden ist kein statisches "Tile", sondern ein dynamischer Datensatz. Sein Zustand (`CellData`) bestimmt, was wachsen kann.

### Die Bodenzustände (Mapping zu `CellData`)

Wir unterscheiden Bodentypen rein mathematisch:

* **Sand (Der tote Start):**
    * `granularity: 1.0` (Grobkörnig)
    * `organicSaturation: 0.0` (Kein Humus)
    * *Effekt:* Wasser fließt sofort ab (`drainage: high`), Nährstoffe werden ausgewaschen.
* **Erde/Humus (Das Ziel):**
    * `organicSaturation: > 0.5`
    * *Entstehung:* Durch Zersetzung von Biomasse (Dead Entities).
    * *Effekt:* Speichert Wasser (`waterBuffer`), bindet Nährstoffe.
* **Fels/Stein (Die Barriere):**
    * `compaction: > 0.8`
    * *Entstehung:* Durch Austrocknung (`water < 0.1` über lange Zeit) oder Druck.
    * *Effekt:* Blockiert Wurzeln (`RootResistance` extrem hoch).

### Die Dynamik (Simulation Loop)
* **Erosion:** Wenn `occupancy == 0` (keine Wurzeln) und `wind > 0.5`, sinkt `organicSaturation` (Humus weht weg).
* **Terraforming:** Sterbende Pflanzen hinterlassen keine Grafik, sondern erhöhen `organicSaturation` in der Zelle.

---

## 2. Die Pflanze als Agent (Active Agency)

Pflanzen sind keine Objekte, sondern **Modifikatoren** ihrer Umgebung. Ihre Existenz verändert die `CellData` ihrer eigenen und benachbarter Zellen.

### Einfluss auf die Umwelt
Definiert durch `Genome`-Parameter:

* **Der Wasser-Hüter (`transpiration: low`, `canopy: high`):**
    * Erzeugt `shade` in Nachbarzellen.
    * Senkt lokale Temperatur -> Reduziert Verdunstung des Bodens (`water`-Verlust sinkt).
* **Der Boden-Ingenieur (`root_strength: high`):**
    * Reduziert aktiv `compaction` (lockert Fels auf).
    * Verhindert Erosion (Wurzeln halten `organicSaturation` fest).
* **Der Chemiker (`allelopathy: > 0.0`):**
    * Injiziert `toxin` in die Zelle, um Konkurrenz-Keimung zu blockieren.

---

## 3. Der Stoffwechsel & Die Ökonomie (Metabolic Ledger)

Ein zentrales Problem ist die Endlichkeit. Die Lösung ist ein geschlossener Kreislauf, der **Flux** für den Spieler generiert.

### A. Phase 1: Wachstum (Kosten)
* **Jugendphase:** Hoher Verbrauch von `nutrients` und `water` für Aufbau von `biomass`.
* **Adultphase:** Verbrauch sinkt auf "Wartungs-Level" (nur Energie).

### B. Phase 2: Der Recycling-Loop
Pflanzen werfen permanent Biomasse ab (simuliert durch Senkung von `biomass` bei gleichbleibender `size`).
1.  **Litterfall:** `biomass` wandert in den Boden -> erhöht `organicSaturation`.
2.  **Zersetzung:** Mikroben (oder Pilz-Entitäten) wandeln `organicSaturation` zurück in `nutrients`.

### C. Der Spieler-Gewinn (Flux)
Ein gesundes Ökosystem generiert überschüssige Energie.
* Jedes Mal, wenn ein Stoffwechsel-Zyklus erfolgreich abgeschlossen wird (z.B. "Nährstoff -> Pflanze -> Boden -> Nährstoff"), erhält der Spieler **Flux**.
* *Merksatz:* "Der Spieler erntet die Entropie-Effizienz des Systems."

---

## 4. Zeit & Balance (Abstraktionen)

Damit die Simulation spielbar bleibt und nicht nach 5 Minuten kollabiert:

* **Weiden statt Töten:** Wenn ein Pflanzenfresser frisst, reduziert er `entity.biomass`, setzt aber `isDead` nicht sofort auf `true`. Die Pflanze kann sich regenerieren.
* **Die Samenbank:** Der Boden speichert eine Liste von `genomeIds` im Hintergrund (`dormantSeeds`). Wenn eine Katastrophe alles tötet, keimen diese bei Regen neu.

---

## 5. Genome Presets (Die Archetypen)

Es gibt keine Klassen. Diese "Archetypen" sind lediglich JSON-Konfigurationen in `genes.json`, um ein funktionierendes Start-System zu garantieren.


**A. Preset: "Forest Giant" (Struktur)**
* `lignin: 0.9` (Hart)
* `growth_speed: 0.1` (Langsam)
* `shade_casting: 1.0` (Kühlt die Umgebung)

**B. Preset: "Pioneer Clover" (Schnellstarter)**
* `growth_speed: 0.9`
* `nitrogen_fixation: 0.8` (Erzeugt Nährstoffe aus dem Nichts/Luft)
* `shade_tolerance: 0.0` (Stirbt sofort unter Bäumen)

**C. Preset: "Network Fungus" (Der Vermittler)**
* `photosynthesis: 0.0` (Braucht kein Licht)
* `decomposition_efficiency: 1.0` (Wandelt Humus extrem schnell in Nährstoffe)
* `root_radius: 5` (Kann Nährstoffe weit transportieren)

---

## 6. Emergenz-Szenarien (Kipppunkte)

Das System testet sich selbst durch physikalische Limits.

* **Die Nährstoff-Falle:** Zu trocken -> Zersetzer (Pilze) sterben -> Humus stapelt sich, aber keine Nährstoffe werden frei -> Wald verhungert.
* **Die Albedo-Spirale:** Pflanzen sterben -> `shade` sinkt -> Boden heizt auf -> Wasser verdampft schneller -> noch mehr Pflanzen sterben.