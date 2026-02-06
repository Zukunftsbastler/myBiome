# Interaction Mechanics: Die Schnittstelle des Gärtners

Dieses Dokument beschreibt, wie der Spieler mit der Simulation **myBiome** interagiert.
**Architektur:** Der `ToolManager` (`@interaction`) modifiziert `CellData` oder `Entity`-States. Er respektiert die Kapselung und nutzt Energiekosten (**Flux**).

---

## 1. Die Ökonomie (Flux)

Damit Eingriffe Bedeutung haben, sind sie durch eine Energiewährung limitiert.

### A. Einnahmen (Metabolic Ledger)
Flux wird generiert, wenn das Ökosystem produktive Arbeit leistet (Entropie-Ernte). Die Formel folgt `GAME_MATH.md`:

$$Flux_{Gain} = \sum_{Entities} (Cost_{Grow} + Cost_{Fruit}) \times 0.1$$

* *Bedeutung:* Ein statischer Wald bringt keinen Gewinn. Nur ein wachsendes, sich regenerierendes System liefert Energie für Eingriffe.
* *Cap:* Es gibt ein Speicherlimit (`Flux_Cap`), das zur Reinvestition zwingt.

### B. Ausgaben (Interventionskosten)
Jede Nutzung eines Tools kostet Flux. Die Kosten skalieren mit dem `brushRadius` und der `intensity`.

---

## 2. Die Werkzeuge (Field Tools)

Der Spieler nutzt "Pinsel", die physikalische Werte direkt im Grid ändern.

| Tool | Effekt auf `CellData` / `Entity` | Flux-Kosten | Beschreibung |
| :--- | :--- | :--- | :--- |
| **Hydrate** | `water += 0.2` | Gering | Simuliert Regen/Bewässerung. |
| **Desiccate** | `water -= 0.2` | Gering | Verdunstung (Hitzestrahl). |
| **Enrich** | `nutrients += 0.2` | Mittel | Dünger. Risiko von Überdüngung (Toxin-Build-up). |
| **Sterilize** | `biofilmIntegrity = 0`, `toxin = 0` | Hoch | Reinigt Boden, tötet aber das Mikrobiom. |
| **Cull** | `Entity.hp = 0`, `isDead = true` | Mittel | Tötet Entitäten (werden sofort zu Humus). |
| **Smash** | `compaction += 0.5` | Mittel | Verdichtet Boden (zerstört Wurzeln). |
| **Seed** | `Spawn(InventoryItem)` | Variabel | Setzt eine Entität (Kosten = `Genome.seedCost`). |

---

## 3. Der Scanner (Die Tagging-Brücke)

Die Simulation rechnet mit Floats (`sugarContent: 0.8`), die KI (`BEHAVIOR`) und das UI (`Inspector`) benötigen aber semantische Tags.

Der Scanner übersetzt zur Laufzeit Rohdaten in Tags.

### A. Tagging-Regeln (Mapping)

Diese Tags werden dynamisch berechnet und dienen als Input für die Sensoren (`SIGNATURE`-Reiz).

| Tag | Bedingung (`Genome` / `Entity` Werte) | Bedeutung für KI |
| :--- | :--- | :--- |
| **`[EDIBLE]`** | `sugarContent > 0.2` AND `toxicity < 0.3` | Ziel für `INTERACT_CONSUME`. |
| **`[HIGH_ENERGY]`**| `sugarContent > 0.7` | Hoher Utility-Score für Hungernde. |
| **`[TOXIC]`** | `toxicity > 0.4` | Löst `AVOID`-Verhalten aus. |
| **`[OBSTACLE]`** | `ligninInvestment > 0.6` | Blockiert Bewegung. |
| **`[SHELTER]`** | `canopySpread > 0.5` | Reduziert Wetterschaden. |
| **`[PREDATOR]`** | `isCarnivore == true` | Löst Flucht bei Beute aus. |

### B. Visualisierung (UI)
* **Overlay:** Tags schweben über den Entitäten, wenn der Scanner aktiv ist.
* **Prognose:** Mouseover zeigt "Geist-Projektion" (z.B. "Wird von Hasen gefressen werden").

---

## 4. Das Labor (Genetic Engineering)

Hier manipuliert der Spieler die `Genome`-Daten. Er erstellt **Baupläne (Seeds)**.

### A. Der Workflow
1.  **Basis:** Start mit Template oder gescannter Spezies.
2.  **Mutation:** Spieler ändert Parameter (z.B. `rootDepthStrategy` erhöhen).
3.  **Simulation (Pre-Calc):** Das UI berechnet Konsequenzen basierend auf `GAME_MATH`:
    * *Feedback:* "Kosten steigen um 200%. Benötigt tiefen Boden."
4.  **Synthese:** Flux bezahlen -> `Genome` wird in `genes.json` (oder Savegame) gespeichert -> Samen im Inventar.

### B. Forschung (Unlocks)
Bestimmte Gene (z.B. `radiationTolerance`) sind gesperrt, bis der Spieler:
* Eine Pflanze scannt, die das Gen natürlich besitzt (Mutation).
* Flux in den Skilltree "Biologie" investiert.

---

## 5. Welt-Management (Chunking)

Optimierung für große Welten.

* **Fog of War:** Unbesuchte Chunks zeigen keine `CellData`-Werte.
* **Unlock:** Kostet Flux. Simuliert die Erschließung neuen Territoriums (z.B. durch Drohnen).