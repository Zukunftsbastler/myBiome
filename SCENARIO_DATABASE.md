Das ist der Ansatz für einen Map-Generator. Anstatt echtes Zufallsrauschen (White Noise) zu verwenden, definieren wir **Biome** oder **Szenarien** als "thematische Paletten".

Ein Szenario ist im Grunde eine gewichtete Liste von Bodentypen. Der Generator wählt dann basierend auf Noise-Mustern (z.B. Perlin Noise für weiche Übergänge) Böden aus dieser Palette aus.

Hier ist der Entwurf für die `SCENARIO_DATABASE.md`. Ich habe deine Liste erweitert und präzise Prozentangaben (Wahrscheinlichkeiten) hinzugefügt, die du direkt in einem `ScenarioConfig`-Objekt im Code verwenden kannst.

---

# Scenario & Terrain Database

Diese Datei definiert die "Rezepte" für die Kartengenerierung.
Jedes Szenario besteht aus:

* **Base Layer:** Der dominante Hintergrund-Boden (ca. 50-70%).
* **Patches:** Größere Flecken anderer Böden (ca. 20-30%).
* **Noise/Details:** Kleine Einsprengsel für Varianz (ca. 5-10%).

Die IDs beziehen sich auf die Liste der 40 Bodentypen (siehe oben).

---

## 1. Gemäßigte Zone (Zivilisation & Natur)

### **Szenario: Feldrand (The Field Edge)**

*Beschreibung:* Eine landwirtschaftlich genutzte Fläche, die in wilde Vegetation übergeht. Nährstoffreich, aber teilweise verdichtet oder überdüngt.

* **Dominant (60%):** `1 Lehmboden` (Der Standard-Acker).
* **Patches (30%):**
* `35 Acker (Überdüngt)` (In der Mitte des Feldes).
* `36 Parkweg` (Trampelpfade am Rand).
* `8 Löss` (Windgeschützte Ecken).


* **Details (10%):** `10 Kiesbett` (Lesesteinhaufen), `27 Ton-Grube` (Pfützen).

### **Szenario: Der Garten (The Garden)**

*Beschreibung:* Ein künstlich angelegtes Paradies. Sehr fruchtbar, aber stark heterogen durch Beete und Wege.

* **Dominant (40%):** `7 Garten-Erde`.
* **Patches (40%):**
* `6 Kompost` (Der "Super-Spot").
* `1 Lehmboden` (Rasenfläche).
* `34 Dachbegrünung` (Schuppendach/Hochbeet).


* **Details (20%):** `36 Parkweg` (Platten), `10 Kiesbett` (Zierkies), `29 Beton` (Fundamente).

### **Szenario: Waldrand (Forest Edge)**

*Beschreibung:* Der Übergang von offenem Land in tiefen Forst. Schattig, feucht und organisch.

* **Dominant (50%):** `3 Waldboden`.
* **Patches (30%):**
* `5 Torf` (Feuchte Senken).
* `8 Löss` (Offene Lichtungen).


* **Details (20%):** `12 Fels (Verwittert)` (Moosbewachsene Steine), `4 Flussschlamm` (Wildbach).

### **Szenario: Stadtpark (Urban Park)**

*Beschreibung:* Eine grüne Insel in der Stadt. Stark verdichtet durch Nutzung.

* **Dominant (50%):** `36 Parkweg` (Die Wiesen sind oft plattgetreten).
* **Patches (40%):**
* `7 Garten-Erde` (Blumenrabatten).
* `29 Beton` (Eingefasste Ränder).
* `33 Mülldeponie` (Versteckte Müllecken im Gebüsch).


* **Details (10%):** `30 Asphalt` (Angrenzende Straße).

---

## 2. Wilde & Raue Umgebungen

### **Szenario: Fluss-Aue (Riverbed)**

*Beschreibung:* Ein dynamisches Feuchtgebiet. Nährstoffe werden angespült, aber Wasser ist dominant.

* **Dominant (40%):** `4 Flussschlamm`.
* **Patches (40%):**
* `10 Kiesbett` (Uferbank).
* `27 Ton-Grube` (Stehendes Altwasser).
* `1 Lehmboden` (Trockenere Uferzonen).


* **Details (20%):** `25 Sumpf` (Schilfgürtel).

### **Szenario: Felshang (Rocky Slope)**

*Beschreibung:* Steil, trocken, kaum Erde. Hier wachsen nur Spezialisten in Ritzen.

* **Dominant (60%):** `12 Fels (Verwittert)`.
* **Patches (30%):**
* `14 Kalksteinboden` (Karst-Formationen).
* `10 Kiesbett` (Geröllhalden).


* **Details (10%):** `8 Löss` (Angewehte Erde in Spalten), `3 Waldboden` (Einzelne klammernde Kiefer).

### **Szenario: Hochplateau (High Plateau)**

*Beschreibung:* Exponiert, windig, karg. Eine Mischung aus Fels und zähem Grasland.

* **Dominant (50%):** `14 Kalksteinboden` (Oder Granit).
* **Patches (30%):**
* `11 Trockenlehm` (Sonnenseite).
* `5 Torf` (Hochmoor-Senken).


* **Details (20%):** `16 Permafrost` (Schattenseiten/Gipfel), `12 Fels`.

### **Szenario: Wüste (Desert)**

*Beschreibung:* Lebensfeindliche Trockenheit.

* **Dominant (70%):** `9 Sanddüne` (Wandert, begräbt Pflanzen).
* **Patches (20%):**
* `13 Staubwüste` (Salt Flats).
* `11 Trockenlehm` (Ausgetrocknete Flussbetten/Wadis).


* **Details (10%):** `12 Fels` (Zeugenberge), `17 Salzpfanne` (Tödliche Senken).

---

## 3. Extreme & Industrie

### **Szenario: Industriebrache (Industrial Wasteland)**

*Beschreibung:* Verlassenes Fabrikgelände. Ein Mosaik aus Beton und Kontamination, das langsam von der Natur zurückerobert wird.

* **Dominant (40%):** `32 Bauschutt`.
* **Patches (40%):**
* `29 Beton` (Fundamente).
* `30 Asphalt (Rissig)` (Alte Parkplätze).
* `31 Schottergleis` (Alter Gleisanschluss).


* **Details (20%):** `21 Schwermetallhalde` (Altlasten), `20 Öl-Sumpf` (Ausgelaufene Tanks).

### **Szenario: Vulkan (Volcano)**

*Beschreibung:* Frische Geologie. Nährstoffreich aber gefährlich oder steinhart.

* **Dominant (50%):** `19 Lava (Erkaltet)` (Schwarzer Basalt).
* **Patches (40%):**
* `18 Vulkanasche` (Sehr fruchtbar, wenn bewässert!).
* `22 Säureboden` (Solfataren-Felder/Schwefel).


* **Details (10%):** `12 Fels`, `38 Kristallboden` (Geoden/Obsidian).

### **Szenario: Müllkippe (Landfill)**

*Beschreibung:* Das Anthropozän pur. Nährstoffe im Überfluss, aber toxisch.

* **Dominant (60%):** `33 Mülldeponie`.
* **Patches (20%):**
* `21 Schwermetallhalde` (Batterien/Elektronik).
* `6 Kompost` (Organischer Müll verrottet).


* **Details (20%):** `20 Öl-Sumpf`, `29 Beton`.

---

## 4. Technische Implementierung (Datenstruktur)

Du kannst diese Szenarien direkt in eine JSON/TypeScript-Struktur gießen. Der Map-Generator wählt dann pro Tile basierend auf einem Noise-Wert (`value 0.0 - 1.0`) den Boden aus.

Beispiel für die Datenstruktur:

```typescript
// src/data/scenarios.ts

export interface ScenarioDefinition {
  id: string;
  name: string;
  description: string;
  // Die Verteilung funktioniert über Schwellenwerte im Noise (0-1)
  // 0.0 - 0.6: Base
  // 0.6 - 0.9: Patch
  // 0.9 - 1.0: Detail
  composition: {
    base: number[];    // Liste von IDs für den Hauptboden
    patches: number[]; // Liste von IDs für Flecken
    details: number[]; // Liste von IDs für Details
  };
  // Wie chaotisch ist der Boden? (Skalierung für den Noise)
  noiseScale: number; 
}

export const SCENARIOS: Record<string, ScenarioDefinition> = {
  FELDRAND: {
    id: 'feldrand',
    name: 'Feldrand',
    description: 'Fruchtbares Ackerland mit wilden Rändern.',
    composition: {
      base: [1], // Lehm
      patches: [35, 36, 8], // Überdüngt, Weg, Löss
      details: [10, 27] // Kies, Ton
    },
    noiseScale: 0.1 // Große, zusammenhängende Flächen
  },
  INDUSTRIE: {
    id: 'industrie',
    name: 'Industriebrache',
    description: 'Beton, Schutt und Altlasten.',
    composition: {
      base: [32, 29], // Schutt, Beton
      patches: [30, 31], // Asphalt, Schotter
      details: [21, 20], // Schwermetall, Öl
    },
    noiseScale: 0.8 // Sehr unruhig, viele kleine Flecken
  }
  // ... weitere Szenarien
};

```

### Der Generierungs-Algorithmus (Kurzfassung)

1. Wähle ein Szenario (z.B. `INDUSTRIE`).
2. Iteriere über alle Hex-Zellen.
3. Berechne `n = perlin(x * scale, y * scale)`.
4. Entscheidung:
* Ist `n < 0.6`: Wähle zufälligen Boden aus `composition.base`.
* Ist `n < 0.9`: Wähle zufälligen Boden aus `composition.patches`.
* Ist `n >= 0.9`: Wähle zufälligen Boden aus `composition.details`.


5. (Optional) Glättung: Entferne einzelne Pixel ("Salt & Pepper noise"), wenn gewünscht, oder lass sie stehen für mehr Realismus.