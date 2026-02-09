# Soil Visualization: Parametrische Geologie

Dieses Dokument definiert die Darstellung des Untergrunds.
**Design-Ziel:** Der Boden liefert Kontext und Atmosphäre, darf aber visuell nicht mit der Flora konkurrieren. Er muss "lesbar" sein (ist das Sand oder Fels?), aber im Hintergrund bleiben.

---

## 1. Visuelle Philosophie

### Der "Hero"-Kontrast

Damit Pflanzen (die "Helden") immer sichtbar sind, gelten für den Boden folgende Restriktionen im Vergleich zur Flora:

* **Sättigung (Saturation):** Boden max. `0.3` (Flora ist `0.5 - 1.0`).
* **Helligkeit (Value):** Boden ist entweder sehr dunkel (Humus) oder sehr hell (Sand), aber selten im mittleren "Kanal", in dem Pflanzen-Details liegen.
* **Struktur:** Boden nutzt Rauschen (Noise) und harte Kanten (Risse). Pflanzen nutzen weiche Formen und klare Linien.

### Render-Modi

1. **Standard (Realism):** Zeigt die physische Beschaffenheit (Farbe, Textur, Feuchte).
2. **Data Lens (Overlay):** Wenn aktiviert (`Moisture`, `Nutrients`, `Toxin`), wird der Boden komplett schwarz gerendert und das farbige Data-Overlay darübergelegt (wie im aktuellen `Renderer`).

---

## 2. Der Parameter-zu-Pixel Algorithmus

Die Darstellung einer Kachel (Tile) setzt sich aus drei Schichten zusammen:

1. **Base Color:** Die Grundfarbe basierend auf chemischer Zusammensetzung.
2. **Texture Layer:** Körnung und Struktur basierend auf Physik.
3. **Surface Modifier:** Wetness, Biofilm und Risse.

### A. Base Color (Die Chemie)

Die Farbe wird durch Mischung von zwei Polen ermittelt: **Mineralisch** vs. **Organisch**.

* **Organischer Anteil (`organicSaturation`):** Zieht die Farbe immer Richtung **Dunkelbraun/Schwarz** (#2a2018).
* **Mineralischer Anteil (1.0 - `organicSaturation`):** Die Farbe des "Gesteinsmehl" wird durch das Biom/Szenario bestimmt (da `Granularity` allein keine Farbe definiert).
* *Default:* Grau-Braun (Standard Erde).
* *Hohe Toxin:* Kann unnatürliche Farben einmischen (Lila-Grau, Neon-Sickern).



**Mischformel:**
`BaseColor = lerp(MineralTint, OrganicBlack, organicSaturation)`

**Mineral-Tints (Beispiele aus Bodentypen):**

* *Sand/Kies:* Beige/Ocker (#dccbba)
* *Lehm/Laterit:* Rötlich (#b36d4f)
* *Fels/Schutt:* Kaltes Grau (#7a8288)
* *Vulkan/Asche:* Fast Schwarz/Anthrazit (#202020)

### B. Texture Layer (Die Physik)

Hier bestimmt `Granularity` und `Compaction` das Muster. Wir nutzen **Noise** und **Primitives**.

| Parameter | Wert | Visueller Effekt | Implementierung |
| --- | --- | --- | --- |
| **Granularity** | `0.0 - 0.2` (Ton) | Glatt, fast poliert. | Solid Color. |
|  | `0.3 - 0.6` (Erde) | Feines Rauschen. | `NoiseFilter` (niedrige Intensität). |
|  | `0.7 - 0.9` (Kies) | Grobe Punkte/Flecken. | Sprites oder `Graphics.circle` randomisiert. |
|  | `1.0` (Geröll) | Große, eckige Formen. | Voronoi-Zellen oder Polygon-Overlay. |
| **Roughness** | `> 0.7` | Schattierung/Bump. | Leichter Gradient von NW nach SO (simuliert Tiefe). |

### C. Surface Modifier (Der Zustand)

Diese Modifikatoren werden *nach* der Textur angewandt.

1. **Nässe (`water`):**
* Macht den Boden **dunkler** (`Value *= (1 - water * 0.5)`).
* Erhöht bei `Granularity < 0.3` (Schlamm) den Glanz (Spekularität).
* *Wasser-Pfützen:* Wenn `water > 0.9`, zeichne blaue Reflexionen in die Mitte.


2. **Trockenrisse (Cracks):**
* Bedingung: `water < 0.2` UND `compaction > 0.6` (Trockener Lehm).
* Effekt: Zeichne dunkle, dünne Linien (Spinnennetz-Muster).


3. **Biofilm (`biofilmIntegrity`):**
* Bedingung: `biofilm > 0.3`.
* Effekt: Ein grünlicher/türkiser Schleier oder Kruste über dem Boden.
* *Wichtig:* Unterscheidet sich von Pflanzen durch fehlende Höhe. Es ist eine Textur, kein Objekt.



---

## 3. Visuelle Archetypen (Mapping der 40 Böden)

Wir mappen die 40 Bodentypen auf visuelle Klassen, damit der `Renderer` nicht 40 Einzelfälle braucht.

### Typ 1: "The Soil" (Der Standard)

* **IDs:** Lehm (1), Schwarzerde (2), Waldboden (3), Garten-Erde (7).
* **Look:** Dunkelbraun, mittleres Noise. Wirkt "weich".
* **Pflanzen-Kontrast:** Hervorragend für hellgrünes Gras.

### Typ 2: "The Barren" (Der Sand/Staub)

* **IDs:** Sanddüne (9), Staubwüste (13), Löss (8).
* **Look:** Hellbeige bis Gelb. Sehr feines Noise (Staub) oder Wellenmuster (Dünen).
* **Pflanzen-Kontrast:** Dunkle Pflanzen (Kakteen, Sträucher) heben sich gut ab.

### Typ 3: "The Hard" (Fels & Beton)

* **IDs:** Fels (12), Beton (29), Asphalt (30), Lava (19).
* **Look:** Grau/Blau-Grau. Keine Noise, sondern "Block"-Struktur oder komplett glatt (Beton). Risse sind hier hell (Kratzer) oder dunkel (Spalten).
* **Besonderheit:** Asphalt hat weiße Linien-Reste (Decals).

### Typ 4: "The Wet" (Schlamm & Sumpf)

* **IDs:** Flussschlamm (4), Moor (28), Ton-Grube (27).
* **Look:** Dunkelgrau-Braun bis Schwarz. Glänzend.
* **Effekt:** Wenn man darauf klickt (oder etwas wächst), gibt es "Ripple"-Effekte.

### Typ 5: "The Toxic" (Synthetisch)

* **IDs:** Salzpfanne (17), Öl-Sumpf (20), Mülldeponie (33), Kristall (38).
* **Look:**
* *Salz:* Weiß/Kristallin.
* *Öl:* Irisierender Schimmer (Regenbogen auf Schwarz).
* *Müll:* Bunte "Konfetti"-Pixel im Boden (Plastikteilchen).



---

## 4. Implementierung: `SoilRenderer` Klasse

Anstatt alles in `Renderer.ts` zu packen, lagern wir die Boden-Logik aus.

```typescript
// Pseudo-Code Idee für den Renderer

function getSoilColor(cell: CellData, biomeType: BiomeType): number {
  // 1. Determine Mineral Color based on Biome/ID mapping
  let mineralColor = 0x888888; // Default Grey
  if (isSandy(cell)) mineralColor = 0xdccbba;
  if (isClay(cell)) mineralColor = 0xb36d4f;
  
  // 2. Mix with Organic (Darkness)
  const organicFactor = cell.organicSaturation;
  const baseColor = mixColors(mineralColor, 0x2a2018, organicFactor);
  
  // 3. Apply Moisture Darkening
  const wetness = cell.water;
  return darken(baseColor, wetness * 0.4); 
}

function drawSoilTexture(g: Graphics, cell: CellData) {
  const color = getSoilColor(cell);
  
  // Base Fill
  g.rect(0,0, w, h).fill(color);
  
  // Granularity Noise
  if (cell.granularity > 0.5) {
     // Draw speckles
     g.texture(noiseTexture, { alpha: cell.granularity * 0.3 });
  }
  
  // Cracks
  if (cell.compaction > 0.7 && cell.water < 0.2) {
     drawCracks(g, 0x000000, 0.3); // Alpha 0.3
  }
  
  // Toxin Glow (Subtle)
  if (cell.toxin > 0.5) {
     g.rect(0,0,w,h).fill({ color: 0x8800ff, alpha: cell.toxin * 0.2, blendMode: 'ADD' });
  }
}

```

## 5. Selektion & UI Feedback

* **Hover-Effekt:** Da der Boden nun detailliert ist, darf der Hover-Rahmen nicht untergehen. Wir nutzen einen **hellen, pulsierenden Rand** (Cyan oder Weiß) statt einer transparenten Füllung.
* **Grid-Linien:** Im "Realism"-Modus sollten die Hex-Gitterlinien sehr subtil sein (Alpha 0.1) oder ganz verschwinden, damit die Landschaft organisch wirkt. Nur im "Data-Mode" werden sie hart gezeichnet.

---

### Zusammenfassung für den Prompt

Wenn du die KI beauftragst:

1. Der Boden muss dynamisch auf `water` (dunkler) und `organic` (brauner) reagieren.
2. Data-Lenses (`Renderer.setLens`) haben Vorrang und schalten auf den "Schwarzen Modus" zurück.
3. Die 40 Bodentypen sollen durch Farbtönung (Tint) unterscheidbar sein, nicht durch Laden von 40 Bitmaps. Nutze prozedurale Einfärbung.