# Technology Manifesto: The Procedural Philosophy

> **"Compute over Storage. Clarity over Brevity."**

Dieses Dokument definiert die technischen Gebote des Projekts **myBiome**. Es ist eine bewusste Entscheidung für eine generative Ästhetik, aber gegen unlesbaren "Spaghetti-Code".

## 1. Die Goldene Regel: No Static Assets
Wir vermeiden binäre Blobs ("Asset Golfing").
* **Keine Bilder:** Keine `.png`, `.jpg` Dateien.
* **Kein Audio:** Keine Samples.
* **Lösung:** Alle Assets werden zur Laufzeit generiert (Procedural Generation) oder synthetisiert (Web Audio API).
* **Ausnahme:** Favicon & Webfonts (für Lesbarkeit).

## 2. Code-Qualität: Types & Constraints
Wir setzen auf strikte Architektur statt syntaktisches Code-Golfing.
* **Types First:** Schnittstellen (`@core/types`) werden *vor* der Logik definiert.
* **Readable Names:** `photosynthesisRate`, nicht `p`.
* **No Magic Strings:** Texte sind verboten. Nutzung von Localization-Keys ist Pflicht (`t('KEY_NAME')`).
* **Optimization:** Minifizierung macht der Compiler (Vite), nicht der Entwickler.

## 3. Architektur: Simulation First
* **Worker-Ready:** Der Core-Code (`src/core`) darf **keine** DOM-Abhängigkeiten haben.
* **Deterministic Lockstep:** Gleicher Seed = Exakt gleiche Welt.

## 4. Grafik & Sound
* **VFX:** Custom GLSL Shaders für Effekte (Wasser, Nebel).
* **Primitives:** Sprites werden aus Code-Formen gezeichnet und in `RenderTextures` gebacken (Caching).
* **SFX:** Prozedurale Synthese (Oszillatoren/Noise) statt MP3s.

## 5. Deployment: The Lightweight Goal
Das Ziel ist ein Spiel, das sich "instant" anfühlt.
* Der einzige Ladebalken ist "Generating World...".
* Zielgröße des Bundles: < 2 MB.