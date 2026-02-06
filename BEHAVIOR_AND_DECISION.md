# Behavior & Decision: Die Kognitive Architektur

Dieses Dokument beschreibt die Logik, nach der Entitäten Entscheidungen treffen.
**Design-Philosophie:** Radikale Entkopplung. Das Verhaltens-System weiß nicht, *wer* die Entität ist. Es verarbeitet lediglich Inputs (Sensoren) zu Outputs (Aktuatoren/Intents) basierend auf einer gewichteten Matrix.

Dies ist der Schlüssel für Sci-Fi-Szenarien: Eine **Wurzel**, ein **Insekt** und ein **Nanobot** nutzen denselben Code.
* Die Wurzel sucht `water` (Gradient).
* Der Nanobot sucht `uranium` (Gradient).
* Die Logik `Seek(Target)` ist identisch.

---

## 1. Architektur-Übersicht: Der Loop

Jede autonome Entität durchläuft pro Tick diesen Zyklus:

1.  **Sense (Wahrnehmung):** Filterung der Welt-Daten in lokale Reize.
2.  **Evaluate (Bewertung):** Umwandlung der Reize in Handlungs-Gewichte (Scoring).
3.  **Decide (Entscheidung):** Auswahl der besten Strategie (Winning Intent).
4.  **Act (Ausführung):** Senden eines abstrakten Kommandos (`Intent`) an die `PhysicsComponent`.

---

## 2. Layer 1: SENSE (Das Sensor-System)

Entitäten haben keinen Zugriff auf das globale `Grid`. Sie sehen nur das, was ihre Sensoren liefern.

### A. Reiz-Klassen (Stimuli)
Das System abstrahiert alle Welt-Informationen in drei Datentypen:

* **`GRADIENT` (Skalarfeld):** Ein Wert, der eine Intensität und Richtung hat.
    * *Bio:* Lichtstärke, Pheromon-Konzentration.
    * *Tech:* Strahlung, Funksignal, Hitze.
* **`SIGNATURE` (Objekt-Erkennung):** Diskrete Entitäten in Reichweite, identifiziert über dynamische Tags.
    * *Tags:* `[EDIBLE]`, `[THREAT]`, `[TARGET_MINERAL]`.
* **`INTERNAL` (Status):** Eigene Körperwerte.
    * *Bio:* Hunger, Schmerz (HP-Verlust).
    * *Tech:* Batterie-Stand, Struktur-Integrität.

### B. Sensor-Konfiguration
Sensoren werden durch Parameter beschränkt:
* `sensorRange`: Radius der Wahrnehmung in Zellen.
* `sensitivity`: Mindest-Schwellenwert (Rauschen filtern).
* `occlusionCheck`: Wird der Sensor durch Hindernisse blockiert? (Wichtig für Sicht vs. Geruch/Funk).

---

## 3. Layer 2: EVALUATE & DECIDE (Die Engines)

Abhängig von der `Genome.aiEngine` wird eine von zwei Logiken genutzt.

### Engine A: Tropismus (Vektor-Summierung)
*Ideal für: Wurzeln, Schwarm-Insekten, Nanobot-Schwärme.*

Hier wird nicht nachgedacht, sondern physikalisch reagiert. Jeder Reiz erzeugt einen Vektor.

**Die Logik:**
1.  Sammle alle Gradienten-Vektoren $\vec{v}_i$ (z.B. Richtung zum Ziel).
2.  Multipliziere jeden mit einem `weight`.
3.  Berechne die Resultante: $\vec{R} = \sum (\vec{v}_i \cdot w_i)$.

* *Beispiel Nanobot:* `{ "URANIUM": 1.0, "LAVA": -5.0 }` -> Sucht Erz, meidet Hitze.

### Engine B: Utility AI (Scoring-System)
*Ideal für: Tiere, komplexe Ernter.*

Das System bewertet mögliche **Handlungen** (Actions) nach Kosten-Nutzen.

**Die Formel pro Handlung:**
$$Score = (Desire \cdot Curve(Input)) - (Cost \cdot Risk)$$

* **Desire:** Dringlichkeit (z.B. `1.0 - energyLevel`).
* **Input:** Qualität des Ziels (z.B. `orePurity`).
* **Curve:** Reaktionskurve (z.B. `Logistic`).

---

## 4. Layer 3: ACT (Die Aktuatoren)

Das Gehirn sendet **Intents**. Der Körper (`PhysicsComponent`) interpretiert diese.

### Der Befehls-Satz (Abstract Interface)

1.  **`SEEK(TargetPosition | TargetID)`**
    * *Logik:* Setzt den `direction` Vektor.
    * *Bio:* Laufen/Schwimmen/Wachsen.
    * *Tech:* Kettenantrieb/Schubdüsen.
2.  **`AVOID(TargetPosition)`**
    * Bewegung vom Ziel weg.
3.  **`INTERACT(TargetID, InteractionType)`**
    * *Type `CONSUME`:* Fressen (Bio) ODER Abbauen/Laden (Tech).
    * *Type `POLLINATE`:* Bestäuben (Bio) ODER Daten-Upload (Tech).
    * *Type `ATTACK`:* Beißen (Bio) ODER Bohren/Lasern (Tech).
4.  **`EMIT(SignalType, Strength)`**
    * Pheromonspur legen oder Funksignal senden.
5.  **`SET_STATE(StateEnum)`**
    * `DORMANCY` (Winterschlaf / Energiesparmodus).

---

## 5. Das Behavior-Profil (Daten-Definition)

Verhalten wird in JSON/YAML definiert.

### Struktur-Beispiel

```yaml
# Profil: "Harvest Bot MK-1"
aiEngine: "UTILITY"

sensors:
  sensorRange: 10
  occlusionCheck: false # Scanner sieht durch Wände

actions:
  - name: "Harvest_Energy"
    verb: "INTERACT_CONSUME"
    considerations:
      - input: "INTERNAL:energyLevel"
        curve: "Invert_Quadratic" # Dringend wenn leer
        weight: 3.0
      - input: "SIGNATURE:CHARGING_STATION" # Tag [EDIBLE] für Bots
        weight: 1.0
    
  - name: "Avoid_Corrosion"
    verb: "AVOID"
    considerations:
      - input: "GRADIENT:ACIDITY"
        curve: "Linear"
        weight: 5.0
```

## 6. Passive Physik (Kein Gehirn)
Objekte ohne KI (Samen, Wrackteile) unterliegen nur der Physik.
Movement = Wind + Gravity + WaterFlow.