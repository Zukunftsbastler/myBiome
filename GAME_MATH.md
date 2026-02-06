# Game Math: Der Metabolische Energie-Zyklus

Dieses Dokument definiert die mathematischen Formeln für den Energiehaushalt basierend auf den Interfaces in `@core/types`. Es folgt dem **Ersten Hauptsatz der Thermodynamik**: Energie kann nicht erschaffen werden, nur umgewandelt.

Alle Entitäten besitzen einen internen Speicher: `energy` (ATP/Zucker). 
Ist dieser Speicher leer und die Bilanz negativ, beginnt der Sterbeprozess.

---

## 1. Die Haupt-Gleichung (Der Tick)

In jedem Simulations-Tick wird folgende Bilanz gezogen:

$$E_{neu} = E_{alt} + Input - (Upkeep + Aktivität)$$

* **Input:** Photosynthese, Verdauung, Reserve-Abbau.
* **Upkeep (Fixkosten):** Atmung (BMR), Erhalt von Strukturen, aktive chemische Prozesse.
* **Aktivität (Variable Kosten):** Wachstum, Fortpflanzung, Bewegung, Heilung.

---

## 2. Der Speicher (Die Batterie)

Wie viel Energie kann eine Pflanze puffern? Das hängt von ihrem Volumen und ihrer Dichte ab.

$$MaxStorage = Volumen \times (0.1 + (stemGirth \times 0.5) + (biomassDistribution \times 0.4))$$

* **Interpretation:**
    * Dicke Stämme (`stemGirth` ~ 1.0) und Speicherwurzeln (`biomassDistribution` nahe 0) wirken als massive Batterien.
    * Dünne Gräser haben kaum Speicher -> sterben schnell ohne Licht.

---

## 3. Die Einnahmen (Input)

### A. Photosynthese (Pflanzen)
Die Einnahme ist abhängig von Licht, Fläche und Wasserverfügbarkeit.

$$Gain_{Photo} = Licht_{lokal} \times Blattfläche \times Effizienz \times WasserFaktor$$

Wobei:
* `Licht_lokal`: Globales Licht minus Schatten (`CellData.shade`).
* `Blattfläche`: $Size \times leafSize \times solarPanelStrategy$.
* `Effizienz`: $photosynthesisEfficiency \times (1.0 - radiationTolerance \times 0.2)$.
    * *Hinweis:* `radiationTolerance` (Rotfärbung) wirkt wie eine Sonnenbrille -> kostet ca. 20% Lichtausbeute.
* `WasserFaktor`: $min(1.0, \frac{CellData.water}{Need_{water}})$. Ohne Wasser stoppt die Photosynthese sofort.

### B. Verdauung (Tiere / Karnivore Pflanzen)
$$Gain_{Eat} = Biomasse_{Opfer} \times sugarContent_{Opfer} \times digestiveEfficiency$$

---

## 4. Die Ausgaben (Upkeep & Tax)

Das sind die Kosten, die **immer** anfallen (Basal Metabolic Rate).

### A. Gewebe-Erhaltung
Lebendes Gewebe verbraucht Energie. Totes Holz nicht.

$$Cost_{BMR} = Größe \times (1.0 - (ligninInvestment \times 0.8)) \times BaseRate$$

* **Der Holz-Vorteil:** Eine Pflanze mit `ligninInvestment: 1.0` (Baum) hat 80% "totes" Gewebe (Stützstruktur). Ihr Grundumsatz pro kg ist extrem niedrig.
* **Der Kraut-Nachteil:** Eine Pflanze mit `ligninInvestment: 0.0` (Kürbis) besteht zu 100% aus aktivem Zellgewebe. Sie "brennt" heißer.

### B. Die "Luxus-Steuern" (Trait Upkeep)
Spezialfähigkeiten kosten permanente Miete.

1.  **Stickstoff-Fixierung:** $nitrogenFixation \times 2.0$ (Bakterien füttern ist teuer).
2.  **Toxin-Produktion:** $toxinTolerance \times 0.5$.
3.  **Sonnenschutz:** $radiationTolerance \times 0.2$.

---

## 5. Die Investitionen (Wachstum & Sex)

Variable Kosten für Expansion.

### A. Wachstumskosten (Construction Cost)
Wie teuer ist es, 1 Volumeneinheit größer zu werden?

$$Cost_{Grow} = \Delta Vol \times (1.0 + (ligninInvestment \times 5.0) + (biomassDensity \times 2.0))$$

* **Der Lignin-Hammer:** Holz zu bauen ist **6x bis 8x teurer** als Wasser-Gewebe.
* **Konsequenz:** Bäume wachsen langsamer als Gräser bei gleicher Energie.

### B. Reproduktions-Kosten (Das Früchte-Paket)
Eine Frucht ist ein Energie-Geschenk an die Welt.

$$Cost_{Fruit} = (packagingInvestment \times 1.0) + (sugarContent \times 3.0) + (signalingColor \times 0.5)$$

* **Zucker-Schock:** Hoher `sugarContent` ist die teuerste Investition.

---

## 6. Die Ökonomie (Flux Generation)

Dies verbindet die Physik mit dem Spiel-Fortschritt (`INTERACTION_MECHANICS`).
Der Spieler erhält **Flux**, wenn das Ökosystem erfolgreich Energie umsetzt (Entropie-Ernte).

$$Flux_{Gain} = \sum_{Entities} (Cost_{Grow} + Cost_{Fruit}) \times 0.1$$

* **Logik:** Der Spieler wird nicht für das *Haben* von Pflanzen belohnt, sondern für deren *Aktivität* (Wachstum & Vermehrung). Ein statischer, alter Wald bringt wenig Flux. Ein wachsender Wald bringt viel.

---

## 7. Der Tod (Starvation Logic)

Wenn $E_{neu} \le 0$:

1.  **Phase 1: Kannibalismus (Notstrom)**
    * Pflanze baut eigene `biomass` ab.
    * Rückgewinnung: $50\%$ der Baukosten fließen zurück in den Speicher.
2.  **Phase 2: Struktur-Versagen**
    * Wenn keine "weiche" Masse mehr da ist, sinken die `hp` (Vitality).
    * Wenn `hp <= 0` -> Entity stirbt und wird zu `CellData.organicSaturation`.

---

## 8. Physik der Erosion & Haftung

#### A. Die Samen-Haftung (Seed Retention)
Bleibt ein Samen (`Entity`) auf der Zelle liegen?

$$RetentionChance = CellData.granularity + (1.0 - Global.windVelocity) \times 0.5$$

#### B. Der Erosions-Widerstand
Wie schnell verliert der Boden `organicSaturation`?

$$Erosion = RainIntensity \times (1.0 - (RootDensity \times 0.8) - (CellData.biofilmIntegrity \times 0.5))$$

#### C. Tile Capacity (Space Management)
Kann eine neue Pflanze keimen?

$$Occupancy_{Total} = \sum (Entity.footprint)$$
* Bedingung: Keimung nur möglich, wenn $Occupancy_{Total} + NewFootprint \le 1.0$.