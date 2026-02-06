# Style Guide & UX-Philosophy

Dieses Dokument definiert die visuelle Identität und die technischen Design-Regeln für **myBiome**.
**Ziel:** Maximale Modularität. Das Aussehen wird zentral über CSS-Variablen gesteuert, das Verhalten über getypte Interfaces.

---

## 1. Visuelle Identität (Look & Feel)

Wir unterscheiden visuell strikt zwischen der **organischen Welt** (Canvas/WebGL) und dem **digitalen Overlay** (DOM/HTML).

### A. Die Welt (Generated Pixel Art)
Die Simulation nutzt keine gezeichneten Assets. Der "Pixel-Look" entsteht technisch durch das Rendern auf eine kleine `RenderTexture` (z.B. 320x180), die dann "hart" (Nearest Neighbor) hochskaliert wird.

* **Farbpalette:** Organisch, generiert durch RGB-Mischung (siehe `UI_AND_VISUALIZATION.md`).
* **Animation:** Sub-Pixel-Bewegung im Shader ("Wabern"), keine Keyframe-Animationen.

### B. Das UI (Das Labor)
Das Interface liegt als HTML-Layer über dem Canvas. Es wirkt wie ein wissenschaftliches HUD auf einem Display.
* **Stil:** "Glassmorphism". Dunkle, halbtransparente Hintergründe (`backdrop-filter: blur`).
* **Schrift:** System-Monospace (für Daten) und System-Sans-Serif (für Texte), um Ladezeiten zu vermeiden.

---

## 2. Design Tokens (CSS Variables)

Dies ist die **einzige** Stelle, an der Farben definiert werden. Weder im TS-Code noch in lokalen CSS-Klassen dürfen Hex-Codes stehen.
Diese Variablen werden in `src/style.css` (Root) definiert.

```css
:root {
  /* --- Brand Colors (Synthetisch) --- */
  --color-ui-primary: #00ADB5;   /* Cyan: Rahmen, Neutrale Daten */
  --color-ui-highlight: #FFD700; /* Gold: Interaktion, Fokus */
  --color-ui-danger: #FF4B4B;    /* Rot: Warnung, Löschen */
  --color-ui-success: #46C93A;   /* Grün: Wachstum, Flux */
  --color-ui-bg-glass: rgba(10, 15, 20, 0.85);

  /* --- Typography --- */
  --font-mono: 'Menlo', 'Consolas', monospace;
  --font-sans: system-ui, -apple-system, sans-serif;

  /* --- Spacing (Grid System) --- */
  --spacing-xs: 4px;
  --spacing-s: 8px;
  --spacing-m: 16px;
  --spacing-l: 24px;
}
```

3. UI-Komponenten (Atomic Design)
Komponenten müssen stateless (so weit wie möglich) und streng typisiert sein.

A. Atome

Tag:

Akzeptiert: label: string, color: 'danger' | 'success' | 'neutral'.

Rendert: <span class="tag tag--danger">...</span>

ValueBar:

Akzeptiert: value: number (0.0 - 1.0).

Berechnet Farbe automatisch via CSS (calc()).

B. Organismen (Panels)

Diese Komponenten sind an die Core-Typen gebunden.

InspectorPanel:

Prop: data: Entity | CellData (Importiert aus @core/types).

Regel: Das Panel entscheidet selbst anhand von data.type, was es anzeigt (Polymorphes UI).

4. Interaktions-Prinzipien
Es darf keine Überraschungen geben ("Principle of Least Astonishment").

A. Maus-Belegung

Linksklick: Kontextabhängig (Tool anwenden ODER Selektieren).

Rechtsklick: Immer "Abbrechen" / "Reset Tool".

Hover: Zeigt immer eine Vorschau ("Ghost").

Tech: Der InteractionManager berechnet bei MouseMove einen "Predicted State" und das UI rendert diesen halbtransparent.

B. Feedback-Loops (Die 3 Phasen)

Vorschau: Roter Rahmen / Ghost-Sprite.

Aktion: Partikel-Effekt (generiert) / Sound (synthetisiert).

Resultat: Update der Zahlenwerte im Inspector.

5. Sprache & Wording (i18n Strategy)
Wir vermeiden Denglisch durch strikte Trennung.

A. Technische Umsetzung

Keine Strings im Code! Wir nutzen Keys.

Falsch: button.innerText = "Giessen"

Richtig: button.innerText = t('TOOL_WATER_ACTION')

B. Tonalität (Der "Erzähler")

Objektiv: "Pflanze verdurstet" (nicht "Die arme Pflanze stirbt").

Konsistente Begriffe:

Währung = Flux (Nicht Energie/Mana).

Spielfeld = Feld (Nicht Tile/Zelle).

Einheit = Spezies/Objekt (Nicht Mob/Unit).

C. Rich Text Formatting

Wichtige Keywords werden im Text eingefärbt, um Scannbarkeit zu erhöhen. Die Localization-JSON unterstützt HTML-Tags:

"HINT_NEED_WATER": "Benötigt <span class='text-water'>Feuchtigkeit</span>."

6. Coding Conventions (Maintainability)
Damit der Code sauber bleibt und die KI sich nicht verirrt:

CamelCase: Wir nutzen für alle Variablen CamelCase (waterLevel), passend zu den JSON-Daten aus @core/types.

Events: Handler-Namen beginnen mit on (onToolSelected).

CSS-Klassen: BEM-Konvention (.inspector__header--active).

Kommentare: Englisch (Code-Sprache), aber Inhalte (Strings) Deutsch via JSON.