# myBiome: Emergenz-Simulation

> **"Form follows Function."** — In dieser Simulation gibt es keine festen Klassen. Alles ist das Resultat physikalischer Kompromisse, genetischer Parameter und energetischer Bilanzen.

Dies ist eine biologische Sandbox-Simulation – ein **digitales Vivarium**. Der Nutzer beobachtet, wie komplexe Ökosysteme aus fundamentalen Regeln entstehen, und greift als "Gärtner" subtil ein. Das System ist strikt **prozedural**: Es werden keine Grafiken oder Töne geladen, alles wird zur Laufzeit mathematisch generiert.

---

## 🏗 Die Architektur-Philosophie

Wir folgen einem strengen **"Types First"**-Ansatz, um Wartbarkeit zu garantieren.
Bevor Logik geschrieben wird, werden die Schnittstellen im **Central Type Bus** (`@core/types`) definiert.

* **No Static Assets:** Wir nutzen keine Bilder oder Samples. Grafik ist Shader-Code (GLSL), Audio ist Synthese (Web Audio API). Siehe [`TECH_MANIFESTO.md`](./TECH_MANIFESTO.md).
* **Data Driven:** Eine Pflanze ist kein Code-Objekt, sondern ein Parameter-Vektor (`lignin: 0.8`).
* **Modularität:** Die Simulation (ECS) läuft isoliert vom Rendering und der UI.

---

## 📚 Die Dokumentation (Single Source of Truth)

Das Projekt ist in logische Schichten unterteilt. Diese Dokumente sind bindend für die Implementierung.

### 1. Die Physische Realität (Core Simulation)
* **[`SYSTEM_PARAMETERS.md`](./SYSTEM_PARAMETERS.md)** – **Das Genom:** Definition aller Traits (z.B. `lignin_investment`, `sugar_content`). Was existiert?
* **[`GAME_MATH.md`](./GAME_MATH.md)** – **Die Physik:** Formeln für Stoffwechsel, Energieerhaltung und Wachstumskosten.
* **[`DESIGN_ECOSYSTEM.md`](./DESIGN_ECOSYSTEM.md)** – **Die Umwelt:** Bodendynamik, Erosion und Nährstoffkreisläufe.
* **[`SCENARIO_CONFIG.md`](./SCENARIO_CONFIG.md)** – **Die Welt:** Konfiguration von Szenarien (Mars, Wald) und globalen Konstanten.

### 2. Kognition & Verhalten (AI)
* **[`BEHAVIOR_AND_DECISION.md`](./BEHAVIOR_AND_DECISION.md)** – **Das Gehirn:** Eine abstrakte KI, die auf Reize (`[EDIBLE]`, `[THREAT]`) reagiert, statt auf konkrete Objekte.

### 3. Interaktion & Progression (Meta-Layer)
* **[`INTERACTION_MECHANICS.md`](./INTERACTION_MECHANICS.md)** – **Die Werkzeuge:** Pinsel-Logik, Flux-Ökonomie und das Gen-Labor.
* **[`CAMPAIGN_AND_PROGRESSION.md`](./CAMPAIGN_AND_PROGRESSION.md)** – **Die Reise:** Quests, Skilltrees, Tutorial-Skripte und die Steuerung der UI-Freischaltung (Feature Flags).

### 4. Präsentation (UI & Vibe)
* **[`UI_UX_STRATEGY.md`](./UI_UX_STRATEGY.md)** – **Der Lehrer:** Konzepte für "erklärende UI" (Geist-Projektion, kausale Logs) und Linsen-Systeme.
* **[`UI_AND_VISUALIZATION.md`](./UI_AND_VISUALIZATION.md)** – **Das Auge:** Generative Visualisierung und Namensgebung.
* **[`STYLE_GUIDE.md`](./STYLE_GUIDE.md)** – **Die Identität:** Design-Vorgaben, Farbpaletten und i18n-Strategie (Kein Denglisch!).
* **[`TECH_MANIFESTO.md`](./TECH_MANIFESTO.md)** – **Das Gesetz:** Regeln für Code-Qualität und prozedurale Generierung.

---

## 📂 Ordnerstruktur

Die Struktur ist darauf ausgelegt, dass KIs und Entwickler sich nicht verirren. Logik, Daten und Typen sind strikt getrennt.

```text
/src
  /core               # Die reine Simulations-Logik (UI-agnostisch)
    /types            # DER "BUS": Alle Interfaces (Entity, Grid, Events)
    /grid             # Hex-Grid Mathematik
    /math             # Implementierung von GAME_MATH
  /systems            # ECS Updates (SimulationLoop, Vegetation, Physics)
  /data               # JSON Konfigurationen & Locales (de.json)
  /interaction        # ToolManager, CampaignManager
  /vis                # PixiJS Renderer, Shader-Synthesizer, AudioEngine
  /ui                 # HTML Overlay, HUD, Inspector