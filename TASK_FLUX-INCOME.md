### Das Konzept: "Bio-Rente"

Der Spieler erhält kontinuierlich Flux basierend auf der **Qualität** und **Masse** der Biomasse. Wir belohnen "teure" Strukturen (Holz/Lignin) und "nützliche" Strukturen (Früchte/Blüten) höher als "billige" Biomasse (einfache Blätter/Unkraut).

#### Die Formel

Der Flux-Ertrag pro Pflanze pro "Eco-Tick" (z.B. 1x pro Sekunde) berechnet sich wie folgt:

Warum diese Parameter?

1. **Biomasse^1.1 (Exponentiell):** Ein großer Baum mit 5.0 Masse bringt *mehr* als 10 kleine Büsche mit je 0.5 Masse. Das fördert "große" Ambitionen und verhindert, dass man einfach alles mit billigem Gras zupflastert (Spamming).
2. **Lignin (`ligninInvestment`):** Holz ist energetisch teuer herzustellen. Eine verholzte Pflanze (Baum) ist "wertvoller" und beständiger als ein weicher Stängel (Löwenzahn).
3. **Reproduktions-Invest (`packagingInvestment` + `signalingColor`):** Pflanzen, die Früchte und Blüten bilden, unterstützen (abstrakt) die Fauna (Insekten/Vögel). Das ist ein "Dienst an der Natur" und bringt extra Flux.
4. **Gesundheit (`hp`):** Eine sterbende Pflanze liefert keinen Flux mehr. Das zwingt den Spieler, auf die Bedürfnisse (Wasser/Licht) zu achten.

---

### Umsetzung im Code

Hier ist die konkrete Funktion für `simulationUtils.ts` und wie sie eingebunden wird.

#### 1. Die Berechnungs-Logik (`src/core/math/simulationUtils.ts`)

Füge diese Funktion hinzu:

```typescript
export function calculateEcologicalValue(entity: Entity, genome: Genome): number {
  // 1. Basis-Wert: Nur lebende Pflanzen zählen
  if (entity.isDead || entity.hp <= 0) return 0;

  // 2. Gesundheits-Malus: Wenn HP < 50%, sinkt der Ertrag linear auf 0
  let healthFactor = 1.0;
  const maxHP = 100; // Annahme, oder aus Constants
  if (entity.hp < maxHP * 0.5) {
    healthFactor = Math.max(0, (entity.hp / (maxHP * 0.5)));
  }

  // 3. Komplexitäts-Multiplikator
  // Basis = 1.0
  // Holz-Bonus (Lignin): Bis zu +100% für harte Bäume
  // Frucht-Bonus (Packaging + Color): Bis zu +50% für blühende/fruchtende Pflanzen
  const complexityMultiplier = 1.0 
    + (genome.ligninInvestment * 1.0) 
    + ((genome.packagingInvestment + genome.signalingColor) * 0.25);

  // 4. Biomasse mit leichtem Exponenten (belohnt Riesenwuchs)
  // Ein Strauch (0.5) -> 0.46
  // Ein Baum (5.0) -> 5.8 (statt 5.0)
  const biomassValue = Math.pow(entity.biomass, 1.1);

  // 5. Globaler Skalierungsfaktor (Balancing!)
  // Damit wir handhabbare Zahlen kriegen (z.B. 0.1 Flux pro Tick statt 0.0001)
  const FLUX_SCALAR = 0.1; 

  return biomassValue * complexityMultiplier * healthFactor * FLUX_SCALAR;
}

```

#### 2. Integration in das System (`src/systems/VegetationSystem.ts`)

Wir sollten Flux nicht in jedem einzelnen Simulations-Tick (der 60x pro Sekunde laufen könnte) berechnen, sondern akkumulieren. Aber der Einfachheit halber integrieren wir es in den `update`-Loop und nutzen den `FLUX_SCALAR` zum Balancen.

Ersetze/Erweitere die Flux-Berechnung in `update()`:

```typescript
// In VegetationSystem.ts -> update()

// ... innerhalb der entity Schleife ...
if (entity.type === 'PLANT') {
    const genome = genomes.get(entity.genomeId);
    
    // --- NEU: Passive Income ---
    if (genome) {
        const passiveFlux = calculateEcologicalValue(entity, genome);
        fluxGenerated += passiveFlux;
        
        // Optional: Visualisierung des Ertrags bei MouseOver
        // entity.lastFluxGain = passiveFlux; (müsste in Entity Type ergänzt werden)
    }
    
    // Bestehende Logik (Wachstum etc.) ...
    const result = this.processPlant(...);
    fluxGenerated += result.flux; // (Das ist der Flux aus Wachstum/Frucht, den wir evtl. reduzieren sollten)
}

```

### Die Auswirkungen auf das Gameplay

1. **Unkraut vs. Baum:**
* **Löwenzahn (Weed):** Klein (Biomasse 0.2), kein Holz (Lignin 0). Ertrag: **Sehr gering.**
* **Eiche (Tree):** Groß (Biomasse 4.0), viel Holz (Lignin 0.8). Ertrag: **Massiv.**
* *Strategie:* Unkraut ist am Anfang gut für schnelles "Kleingeld", aber für die großen Upgrades braucht man Bäume.


2. **Der "Gärtner"-Aspekt:**
* Wenn Pflanzen vertrocknen (Health sinkt), versiegt der Flux-Strom. Der Spieler muss also bewässern (`Cloud Seeder` Tool) oder Nährstoffe nachfüllen, um sein "Einkommen" zu sichern.


3. **Events (Bonus):**
* Zusätzlich zu dieser passiven Rente solltest du **Einmal-Boni** beibehalten:
* **Keimung:** +5 Flux (Ein neues Leben beginnt).
* **Frucht abwerfen:** +20 Flux (Erfolgreiche Reproduktion).





### Task-Ergänzung

Ich füge dies direkt als Sub-Task in die `task.md` ein, damit die KI das Balancing mit übernimmt.

Möchtest du, dass ich die `task.md` jetzt komplett ausgebe, inklusive dieser Flux-Logik, der Menü-Struktur und dem Bio-Extraktor?