# UI & Visualization: Der prozedurale Ansatz

Dieses Dokument beschreibt die generative Darstellung von **myBiome**.
**Core-Prinzip:** Es werden keine statischen Assets geladen. Sowohl Grafiken als auch Namen werden zur Laufzeit aus den Parametern (`Genome`, `CellData`) synthetisiert.

---

## 1. Der Visual Synthesizer (Generative Graphics)

Wir nutzen **Composite Rendering** basierend auf Code-Primitiven.

### A. Die Asset-Basis (Code-Generated Primitives)
Statt eines Sprite-Sheets (`.png`) generiert der `Synthesizer` beim Systemstart (`Init`) einmalig Texturen mittels der Grafik-API (z.B. `Pixi.Graphics`) und cached diese als `RenderTexture`.

1.  **`PRIMITIVE_STEM`:** Ein langgezogenes Trapez.
2.  **`PRIMITIVE_LEAF_ROUND`:** Ein Kreis oder Tropfen (Bezier-Kurve).
3.  **`PRIMITIVE_LEAF_NEEDLE`:** Ein spitzes Dreieck.
4.  **`PRIMITIVE_ROOT`:** Eine fraktale Linie (rekursiver Branching-Algorithmus).
5.  **`PRIMITIVE_SPORE`:** Ein simpler Kreis mit Noise-Rand (Shader).

### B. Der Bau-Prozess (Runtime Assembly)

Wenn eine Entität (`Entity`) sichtbar wird, baut der Renderer ihr Sprite aus den Primitiven.

**Schritt 1: Die Palette (Chemische Färbung)**
Farben repräsentieren chemische Eigenschaften (RGB-Addition):
* **Basis:** Braun (`ligninInvestment` > 0.5) oder Grün.
* **Modifikator Chlorophyll:** Sättigung steigt mit `photosynthesisEfficiency`.
* **Modifikator Anthocyan:** Rot-Verschiebung durch `toxicity` oder `radiationTolerance` (Sonnenschutz).
* **Modifikator Wachs:** Blau-Stich (Specular Highlight) durch `droughtResistance`.

**Schritt 2: Die Morphologie (Transformation)**
Die Primitives werden transformiert:
* **Stamm:** Skalierung X nach `stemGirth`, Y nach `biomass`.
* **Blattwerk:**
    * *Typ:* `LEAF_ROUND` (`solarPanelStrategy` > 0.5) vs. `LEAF_NEEDLE`.
    * *Dichte:* `foliageDensity` bestimmt Anzahl der Sprites.
    * *Jitter:* Zufällige Rotation für organischen Look.

**Schritt 3: Caching**
Das fertige Komposit wird in eine temporäre Textur gebacken (Batch Rendering).

---

## 2. Der Taxonomie-Generator (Namensgebung)

Namen werden on-the-fly generiert und folgen der Localization-Strategie.

### Logik: `[AdjektivKey] + [SubstantivKey]`

Das System prüft Parameter-Schwellenwerte und wählt den passendsten **Translation Key**.

**Mapping-Tabelle (Beispiele):**

| Bedingung (`Genome`) | Typ | Generierter Key | Eintrag in `de.json` |
| :--- | :--- | :--- | :--- |
| `toxicity > 0.6` | Adjektiv | `TAXON_ADJ_TOXIC` | "Gallen-", "Bitter-" |
| `droughtResistance > 0.7` | Adjektiv | `TAXON_ADJ_WAXY` | "Wachs-", "Fleisch-" |
| `rootDepthStrategy > 0.8` | Adjektiv | `TAXON_ADJ_DEEP` | "Anker-", "Tief-" |
| --- | --- | --- | --- |
| `maxHeight > 0.8` | Substantiv | `TAXON_NOUN_GIANT` | "-Riese", "-Titan" |
| `seedDispersalMode == WIND` | Substantiv | `TAXON_NOUN_SAILOR` | "-Segler", "-Feder" |
| Default | Substantiv | `TAXON_NOUN_GENERIC` | "-Kraut", "-Busch" |

*Ergebnis:* `{ adj: 'TAXON_ADJ_TOXIC', noun: 'TAXON_NOUN_GIANT' }` -> "Bitter-Titan".

---

## 3. Das UI-Layout (Der Inspector)

Das UI reagiert reaktiv auf die `uiCapabilities` (Skilltree). Elemente werden nur gerendert, wenn der Spieler sie freigeschaltet hat.

### Panel: "Scanner-Resultat"

**1. Header (Immer sichtbar)**
* **Visual:** Großaufnahme des generierten Sprites.
* **Name:** Generierter Name (oder "Unbekannte Spezies" wenn `showTaxonomy == false`).

**2. Parameter-Visualisierung (Bedingt)**
* **Flag:** `showGraphs`
* **Darstellung:** Radar-Chart (Dominanz, Resistenz, Metabolismus).

**3. Textliche Analyse (Bedingt)**
* **Flag:** `showHiddenTraits`
* **Funktion:** Interpreter für Zahlenwerte.
* *Beispiel:* "Warnung: Hohe Allelopathie (`toxicity`). Tötet Nachbarn."

### Panel: "Boden-Analyse"

Zeigt die `CellData` des gewählten Hex-Feldes.

* **Schicht 1 (Oberfläche):** `organicSaturation` (Humus).
* **Schicht 2 (Feuchte):** Nur sichtbar wenn `showMoistureValues` == `true`.
* **Schicht 3 (Gestein):** Visualisierung von `granularity` und `compaction`.