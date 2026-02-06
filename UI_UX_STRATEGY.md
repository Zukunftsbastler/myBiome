# UI & UX Strategy: The Interface Layer

Dieses Dokument definiert das Verhalten und die Architektur der Benutzeroberfläche.
**Architektur-Prinzip:** Das UI ist rein reaktiv. Es entscheidet nicht selbst, welche Informationen verfügbar sind, sondern rendert basierend auf einem injizierten `Capabilities`-Objekt.

---

## 1. Das "Causal Logging" System (Der Erzähler)

Das Log-System ist in der Lage, Ereignisse mit unterschiedlicher Detailtiefe darzustellen.

### A. Nachrichten-Struktur
Das UI akzeptiert Events im Format `SimulationEvent`. Die Darstellung hängt vom Detail-Level ab:
1.  **Level 0 (Physisch):** Nur das sichtbare Resultat.
    * *"Pflanze A gestorben."*
2.  **Level 1 (Analytisch):** Die direkte Ursache.
    * *"Pflanze A verdurstet."*
3.  **Level 2 (Kausal/Omniszient):** Die Wirkungskette.
    * *"Pflanze A verdurstet, weil Wurzel von B das Wasser entzog."*

### B. Filterung
Das UI implementiert client-seitige Filter (Relevance Score), um Spam zu vermeiden.
* **Floater:** Temporäre Texte an World-Koordinaten (verschwinden nach 2s).
* **Persistent Log:** Scrollbare Historie im HUD.

---

## 2. Visuelle Assistenz-Systeme

Diese Systeme unterstützen den Spieler bei der Analyse. Sie sind standardmäßig implementiert, aber deaktivierbar.

### A. Die "Geist-Projektion" (Predictive UI)
Berechnet die Simulation für eine Interaktion einen Tick in die Zukunft.
* **Input:** Aktuelles Tool + Mausposition.
* **Visual:**
    * Färbt den Cursor (Grün/Gelb/Rot).
    * Zeigt Tooltip mit Delta-Werten (`Wasser: -10%`).
* **Flag:** `showPrediction`

### B. Das Linsen-System (Overlay Layer)
Das Grid kann verschiedene Daten-Ebenen rendern.
* **Standard:** RGB-Werte der Entitäten (Pixel Art).
* **Data Overlays:** Färbt Zellen basierend auf numerischen Werten (`CellData.water`, `CellData.nutrients`).
* **Flag:** `availableLenses[]` (Array der erlaubten Linsen).

---

## 3. Die Schnittstelle: Capability Flags

Das UI erhält beim Start (und bei Updates) ein `UICapabilities` Objekt. Dies entkoppelt das UI vollständig von der Progressions-Logik.

| Flag / Property | Typ | Auswirkung auf das Rendering |
| :--- | :--- | :--- |
| `showMoistureValues` | `boolean` | Zeigt exakte %-Zahlen im Inspector und Tooltip. |
| `showNutrientValues` | `boolean` | Zeigt NPK-Werte an. |
| `showHiddenTraits` | `boolean` | Zeigt genetische Details (DNA) im Inspector. |
| `showDeathCause` | `boolean` | Schaltet Log-Level von 0 auf 1+. |
| `enablePrediction` | `boolean` | Aktiviert die Geist-Projektion bei Mouseover. |
| `allowedLenses` | `string[]` | Liste der Buttons, die in der Lens-Bar erscheinen (z.B. `['MOISTURE', 'TOXIN']`). |
| `showGraphs` | `boolean` | Rendert historische Verlaufs-Graphen im Inspector. |

**Standard-Verhalten (Sandbox):**
Wenn keine Konfiguration übergeben wird, fallen alle Flags auf `true` (Debug/God Mode).

---

## 4. Hooks für externe Steuerung (Der "Director")

Das UI stellt Schnittstellen bereit, um von außen (z.B. Tutorial-Skript) gesteuert zu werden. Das UI kennt das Skript nicht, es führt nur Befehle aus.

### A. Overlay-Elemente
Das UI muss folgende Komponenten bereitstellen, die per API sichtbar geschaltet werden können:
1.  **`BlockerLayer`:** Ein transparentes Div, das Mausklicks abfängt (außer auf erlaubten Elementen).
2.  **`Spotlight`:** Ein visueller Fokus (abgedunkelter Rest), der auf eine DOM-ID oder Grid-Koordinate zeigt.
3.  **`Pointer`:** Ein animierter Pfeil/Hand-Icon an einer Position.
4.  **`InstructionBox`:** Ein Textfenster (Modal oder Toast) für Anweisungen.

### B. Das Control-Interface
```typescript
interface DirectorAPI {
  setOverlay(active: boolean): void;
  highlightElement(selector: string): void; // Setzt Spotlight & Pointer
  showMessage(text: string): void;
  restrictInput(allowedSelectors: string[]): void; // Aktiviert Blocker
}
```

## 5. Layout-Komponenten (Referenz)
    * Inspector Panel: Rechts. Zeigt Daten basierend auf show... Flags.
    * Log Feed: Unten Links. Detailgrad basierend auf showDeathCause.
    * Toolbar: Unten Mitte. Zeigt verfügbare Tools.
    * Lens Switcher: Oben Rechts. Zeigt Buttons aus allowedLenses.
