# System Parameters: Die funktionale DNA

Dieses Dokument definiert die Parameter aller Entitäten basierend auf dem `Genome`-Interface (`@core/types/genome.ts`).
**Konvention:** Alle Parameter sind normalisierte Floats (`0.0 - 1.0`). Es gibt keine Klassen, nur Parameter-Vektoren.

---

## 1. Flora Genom (Pflanzen & Pilze)

Diese Parameter steuern die `VegetationSystem`-Logik.

### A. Morphologie (Struktur & Kosten)
* **`ligninInvestment`**
    * *Funktion:* Energieaufwand für Stützstruktur (Holz).
    * `0.0`: Weich (Kraut/Liane). Billig, aber `maxHeight` limitiert.
    * `1.0`: Hart (Baum). Teuer, erlaubt Höhe und Resistenz gegen `PhysicalDamage`.
* **`stemGirth`**
    * *Funktion:* Verhältnis Dicke zu Höhe.
    * `1.0`: Speicherkapazität (`waterBuffer`) maximiert (Sukkulenten/Stamm).
* **`biomassDistribution`**
    * *Funktion:* Speicherort der Energie.
    * `0.0`: Wurzel-Speicher (Rübe). Sicher vor `Fire` und `Grazing`.
    * `1.0`: Kronen-Speicher. Effizient, aber riskant.
* **`footprint`**
    * *Funktion:* Platzbedarf auf der Kachel.
    * `0.1`: Zwergwuchs (Gräser). Hohe `Occupancy` erlaubt (10/Tile).
    * `1.0`: Solitär (Baum). Nimmt ganzes Tile ein.
    * *Regel:* `Spawn` nur möglich, wenn $\sum footprint \le 1.0$.

### B. Metabolismus (Energie & Resistenz)
* **`solarPanelStrategy`**
    * *Funktion:* Blattfläche vs. Risiko.
    * `0.0`: Nadeln. Wenig Wasserverlust (`transpiration`), sturmfest.
    * `1.0`: Segel. Hoher Gewinn, aber hoher Durst und Windanfälligkeit.
* **`radiationTolerance`**
    * *Funktion:* UV-Schutz (Anthocyane).
    * `1.0`: Rötliche Färbung. Schützt vor Schaden durch `WorldConfig.radiationLevel`, kostet aber ~20% Photosynthese-Effizienz.
* **`rootDepthStrategy`**
    * `0.0`: Flachwurzler. Hält `organicSaturation` fest (Erosionsschutz).
    * `1.0`: Pfahlwurzler. Erreicht Tiefenwasser, senkt `compaction`.
* **`nitrogenFixation`**
    * *Funktion:* Erzeugt `nutrients` aus Luft.
    * *Cost:* Extrem hoher permanenter `energy`-Upkeep.

### C. Reproduktion (Frucht & Samen)
* **`packagingInvestment`**
    * `0.0`: Sporen. Masse statt Klasse.
    * `1.0`: Fruchtfleisch. Lockt `Frugivore`-Tiere an.
* **`sugarContent`**
    * *Funktion:* Belohnungswert (`Utility`-Score für Tiere).
    * *Cost:* Zucker ist die teuerste Investition.
* **`signalingColor`**
    * `1.0`: Hoher Kontrast (Rot/Blau). Erhöht Sichtbarkeit für Scanner/Tiere.
* **`germinationVariance`**
    * `0.0`: Synchrones Keimen (Alles auf einmal).
    * `1.0`: Bet-Hedging (Zeitlich verteilt). Verhindert "Game Over" bei falschem Frühling.

---

## 2. Fauna Parameter (Tiere)

Tiere nutzen das `BehaviorSystem` und `UtilityAI`.

* **`locomotionMode`**
    * `0.0`: Boden (Kosten niedrig, Terrain-Abhängig).
    * `1.0`: Flug (Kosten hoch, Terrain-Unabhängig).
* **`dietSpecialization`**
    * `0.0`: Herbivore (Blätter).
    * `0.5`: Frugivore (Früchte/Samen).
    * `1.0`: Carnivore (Andere Tiere).
* **`sizeClass`**
    * `1.0`: Mega-Fauna. Zerstört Pflanzen mit `ligninInvestment < 0.5` beim Betreten.

---

## 3. Environment Variables (Boden & Klima)

Diese Werte gehören zu `CellData` oder `WorldConfig`.

* **`granularity`** (CellData)
    * `0.0`: Fels. Blockiert Wurzeln.
    * `1.0`: Lehm/Ton. Speichert Wasser.
* **`organicSaturation`** (CellData)
    * Humusgehalt. Steigt durch `EntityDeath`.
* **`surfaceRoughness`** (CellData)
    * "Grip" der Oberfläche.
    * `0.0`: Samen wehen bei Wind sofort weg.
    * `1.0`: Fängt Samen und Partikel ein (Klebefalle).
* **`biofilmIntegrity`** (CellData)
    * Biologische Kruste. Schützt vor Erosion, auch ohne Pflanzen.
* **`windVelocity`** (Global)
    * Selektionsdruck gegen große `solarPanelStrategy`.
* **`seasonalityIndex`** (Global)
    * Amplitude der Temperatur-Schwankungen (Winter/Sommer).