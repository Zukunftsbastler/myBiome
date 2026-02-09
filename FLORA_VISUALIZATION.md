# Flora Visualization: Parametrische Morphologie

Dieses Dokument definiert, wie die abstrakten Genom-Parameter (`Genome`) in visuelle Repräsentationen (`Graphics`/`Texture`) übersetzt werden.
**Design-Ziel:** Das System nutzt keine vorgefertigten Sprites. Das Aussehen jeder Pflanze wird zur Laufzeit prozedural aus ihrer "DNA" synthetisiert. Jede Parameter-Kombination muss ein gültiges, visuell unterscheidbares Ergebnis liefern.

---

## 1. Die Morphologische Taxonomie

Wir klassifizieren Pflanzen nicht nach Namen (z.B. "Baum"), sondern nach ihrer topologischen Struktur, die sich aus `ligninInvestment` (Härte) und `stemGirth` (Dicke) ergibt.

| Struktur-Typ | Parameter-Profil | Visuelles Merkmal | Beispiele |
| --- | --- | --- | --- |
| **Der Monolith** | `lignin > 0.8`, `stemGirth > 0.6` | Dicker, zentraler Stamm. Äste erst weit oben. | Mammutbaum, Eiche |
| **Der Stab** | `lignin > 0.5`, `stemGirth < 0.3` | Dünner, harter Stängel. Wenig Verzweigung. | Bambus, Sonnenblume, Bärenklau |
| **Das Geflecht** | `lignin < 0.3`, `stemGirth < 0.2` | Weich, flexibel. Braucht Stütze oder kriecht. | Efeu, Liane, Kürbis |
| **Der Teppich** | `maxHeight < 0.2` | Flächig am Boden. Keine vertikale Struktur. | Moos, Flechte, Klee |
| **Der Wedel** | `lignin > 0.6`, `biomassDistribution > 0.9` | Nackter Stamm, Blätter nur an der absoluten Spitze. | Ölpalme, Banane |

---

## 2. Der Bauplan (Synthesizer-Logik)

Der `Synthesizer` baut die Pflanze aus generierten Primitiven zusammen.

### A. Der Stamm (Stem)

Der Stamm ist der Ankerpunkt (`anchor: 0.5, 1.0`).

* **Form:** Trapez oder Bézier-Kurve.
* **Farbe:** Interpolation zwischen `GREEN` (Kraut) und `BROWN/GREY` (Holz) basierend auf `ligninInvestment`.
* **Parameter-Mapping:**
* `Height` = `genome.maxHeight` (Skaliert mit `entity.biomass`).
* `Width` = `genome.stemGirth` (Basis-Dicke).
* `Curve` = Invers zu `ligninInvestment`. (Hohes Lignin = Gerade/Starr; Niedriges Lignin = Kurvig/Wellig -> Liane).



### B. Die Verzweigung (Branching)

Wie teilt sich die Biomasse auf?

* **Algorithmus:** Rekursives L-System oder Fraktal.
* **Parameter-Mapping:**
* `biomassDistribution` (0.0 - 1.0):
* `0.0 - 0.3`: **Basal.** Verzweigung direkt am Boden (Busch/Gras/Hasel).
* `0.4 - 0.7`: **Verteilt.** Klassische Baumkrone (Apfel/Fichte).
* `0.8 - 1.0`: **Apikal.** Nur an der Spitze (Palme/Löwenzahn).


* `stemGirth`: Bestimmt, wie oft verzweigt werden kann (Dicke Äste erlauben mehr Child-Nodes).



### C. Das Blattwerk (Foliage)

Die "Solar Panels".

* **Formen (Primitive):**
* `NEEDLE` (Nadel): Wenn `solarPanelStrategy < 0.3` (Fichte, Kiefer).
* `ROUND` (Rund/Oval): Wenn `solarPanelStrategy 0.3 - 0.7` (Apfel, Klee).
* `FROND` (Wedel/Segel): Wenn `solarPanelStrategy > 0.7` (Banane, Farn).


* **Farbe:**
* Basis: Grün (Sättigung via `photosynthesisEfficiency`).
* Modifikator: Rotstich via `radiationTolerance` (Sonnenschutz).
* Modifikator: Blaustich/Weiß via `droughtResistance` (Wachsschicht/Härchen).


* **Dichte:** Anzahl der Blatt-Sprites pro Ast-Node skaliert mit `photosynthesisEfficiency`.

### D. Reproduktions-Organe (Blüten & Früchte)

Werden nur gerendert, wenn `entity.energy > threshold` (Blüte) oder nach erfolgreicher Bestäubung (Frucht).

* **Blüte:**
* Erscheint, wenn Pflanze geschlechtsreif (`age > X`) und Energie für Reproduktion sammelt.
* **Farbe:** Definiert durch `signalingColor` (0.0 = Grün/Unscheinbar -> Gräser; 1.0 = Knallig Rot/Blau/Gelb -> Tulpe).


* **Frucht:**
* **Größe:** `packagingInvestment` (0.0 = Sporen/Staub -> Flechte; 1.0 = Apfel/Kürbis).
* **Position:**
* Hängt an Ästen (Apfel), wenn `lignin > 0.5`.
* Liegt am Boden (Kürbis), wenn `lignin < 0.3`.





---

## 3. Algorithmische Mapping-Tabelle (Beispiele)

Hier wird gezeigt, wie Parameter konkrete Pflanzenarten erzeugen.

### Beispiel 1: "Die Fichte" (Conifer)

* `maxHeight`: 1.0 (Hoch)
* `ligninInvestment`: 0.9 (Harter, gerader Stamm)
* `biomassDistribution`: 0.5 (Kegelförmige Verteilung der Äste)
* `solarPanelStrategy`: 0.1 (Nadeln)
* `signalingColor`: 0.1 (Kaum sichtbare Blüten/Zapfen)
* **Visual:** Dunkelgrüner, gerader Strich mit vielen kleinen horizontalen Strichen (Nadeln).

### Beispiel 2: "Der Kürbis" (Creeper)

* `maxHeight`: 0.2 (Niedrig)
* `ligninInvestment`: 0.1 (Kein Holz -> Stamm "liegt" oder mäandert)
* `stemGirth`: 0.2 (Dünne Ranken)
* `solarPanelStrategy`: 0.9 (Riesige Blätter)
* `packagingInvestment`: 1.0 (Massive Frucht)
* **Visual:** Chaotische grüne Kurven am Boden, große runde Blätter, riesige farbige Kreise (Früchte) im Spätsommer.

### Beispiel 3: "Der Löwenzahn" (Weed)

* `maxHeight`: 0.3 (Mittel)
* `ligninInvestment`: 0.0 (Weich)
* `biomassDistribution`: 0.1 (Blätter) UND 1.0 (Blüte) -> Rosette am Boden + Stängel.
* `rootDepthStrategy`: 1.0 (Pfahlwurzel -> unsichtbar, aber relevant für Logik).
* `signalingColor`: 1.0 (Grell Gelb).
* **Visual:** Blatt-Cluster am Boden (`y=0`), ein einzelner vertikaler Strich, oben ein farbiger Kreis.

### Beispiel 4: "Die Alge/Flechte" (Carpet)

* `maxHeight`: 0.05 (Flach)
* `footprint`: 1.0 (Füllt Kachel komplett)
* `ligninInvestment`: 0.0
* `solarPanelStrategy`: 0.5
* **Visual:** Textur-Overlay auf dem Boden (Noise-Muster), keine Stiele. Farbe variiert stark (Grün/Gelb/Rot) je nach `toxicity`.

---

## 4. Dynamik & Lebenszyklus

Das Aussehen ist nicht statisch, sondern reagiert auf `Entity`-State.

### A. Wachstum (Ontogenese)

* **Keimling:** Nur 2 kleine Blätter (`primitive: LEAF_ROUND`), kein Stamm sichtbar.
* **Jugend:** Stamm wächst in die Höhe (`scale.y`), aber `stemGirth` hinkt hinterher.
* **Adult:** Volle Ausprägung gemäß Parametern.
* **Seneszenz (Tod):** Farbe entsättigt (Grau/Braun). Blätter fallen ab (Alpha = 0).

### B. Saisonale Zyklen (Phenologie)

Basierend auf `WeatherState`.

* **Frühling:** Blüten-Sprites erscheinen (wenn `signalingColor > 0.3`).
* **Sommer:** Früchte wachsen (skalieren mit `energy`-Buffer).
* **Herbst:** Blatt-Farbe shiftet ins Rote/Braune (wenn `lignin < 0.5` -> Laubbäume).
* **Winter:** Laubabwurf (nur Stamm bleibt), außer `solarPanelStrategy < 0.2` (Nadeln).

---

## 5. Implementierungs-Hinweise für Synthesizer

Erweiterung der `Synthesizer.ts`:

1. **`drawStem()`**: Muss `Curve`-Parameter akzeptieren.
* *Linear* für Bäume.
* *Sinus/Perlin Noise* für Lianen/Algen.


2. **`drawFoliage()`**: Muss Cluster bilden können.
* Statt einzelner Blätter: `LeafCluster` Objekte an definierten Ankerpunkten des Stammes.


3. **`ColorPalette`**:
* Berechnung der Blattfarbe muss `cell.toxin` (Lila-Stich?) und `cell.water` (Gelb bei Mangel) einbeziehen.



---

## 6. Grenzfälle & Mischformen

Das System erlaubt "unmögliche" Pflanzen, was gewollt ist (Xeno-Botanik).

* **"Holz-Klee":** `lignin: 1.0`, `maxHeight: 0.1`. -> Sieht aus wie kleine Stümpfe/Stacheln am Boden.
* **"Himmels-Alge":** `lignin: 0.0`, `maxHeight: 1.0`. -> Kollabiert visuell zu einem Haufen (da physikalisch instabil), wird als "Haufen" gerendert.