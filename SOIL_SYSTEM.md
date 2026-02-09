Ich habe dir eine Liste mit **40 Boden-Typen** zusammengestellt. Diese definieren unterschiedliche Startbedingungen für die `CellData`-Werte.

### Erklärung der Parameter (zur Erinnerung)

* **Granularity (0-1):** 0 = Fels/Ton (Dicht), 1 = Sand/Kies (Durchlässig).
* **Compaction (0-1):** 0 = Locker (gut für Wurzeln), 1 = Betonhart (schlecht für Wurzeln).
* **Organic (0-1):** Humusgehalt. Speichert Wasser/Nährstoffe.
* **Biofilm (0-1):** "Klebkraft" des Bodens (Schutz gegen Erosion).
* **Roughness (0-1):** Oberflächenstruktur. Wichtig, damit Samen nicht vom Wind weggeweht werden.
* **Water/Nutrients/Toxin:** Initiale Füllstände.

---

### Die 40 Boden-Archetypen

Ich habe sie in Kategorien unterteilt. Die Extremfälle sind markiert.

#### Kategorie A: Fruchtbare Böden (Der "Easy Mode")

Hier wächst fast alles. Gute Balance.

| Nr | Name | Gran | Compact | Organic | Biofilm | Rough | Water | Nutr | Toxin | Beschreibung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **Lehmboden (Ideal)** | 0.5 | 0.4 | 0.6 | 0.5 | 0.5 | 0.6 | 0.6 | 0.0 | Der perfekte Ackerboden. |
| 2 | **Schwarzerde** | 0.4 | 0.3 | 0.9 | 0.6 | 0.4 | 0.7 | 0.9 | 0.0 | Extrem nährstoffreich (Tschernosem). |
| 3 | **Waldboden** | 0.6 | 0.2 | 0.8 | 0.8 | 0.7 | 0.5 | 0.5 | 0.0 | Locker, voller Wurzeln und Laub. |
| 4 | **Flussschlamm** | 0.2 | 0.6 | 0.5 | 0.4 | 0.3 | 1.0 | 0.8 | 0.1 | Sehr nass, sehr fett, aber etwas dicht. |
| 5 | **Torf** | 0.3 | 0.1 | 1.0 | 0.3 | 0.6 | 0.9 | 0.4 | 0.2 | Sauer, extrem organisch, speichert Wasser. |
| 6 | **Kompost** | 0.7 | 0.1 | 1.0 | 0.9 | 0.8 | 0.6 | 1.0 | 0.0 | "Pures Leben". Sehr locker. |
| 7 | **Garten-Erde** | 0.5 | 0.3 | 0.5 | 0.5 | 0.4 | 0.5 | 0.7 | 0.0 | Von Menschen bearbeitet. |
| 8 | **Löss** | 0.3 | 0.4 | 0.4 | 0.3 | 0.2 | 0.4 | 0.6 | 0.0 | Feiner Staub, fruchtbar, aber erosionsanfällig. |

#### Kategorie B: Mineralische & Trockene Böden (Herausforderung: Wasser)

Hier überleben nur Spezialisten (Sukkulenten, Gräser).

| Nr | Name | Gran | Compact | Organic | Biofilm | Rough | Water | Nutr | Toxin | Beschreibung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 9 | **Sanddüne** | 1.0 | 0.2 | 0.0 | 0.0 | 0.1 | 0.1 | 0.1 | 0.0 | Wasser fließt sofort weg. Samen wehen weg. |
| 10 | **Kiesbett** | 0.9 | 0.5 | 0.0 | 0.1 | 0.6 | 0.1 | 0.1 | 0.0 | Grobe Steine. Hält Samen gut, aber kein Wasser. |
| 11 | **Trockenlehm** | 0.3 | 0.8 | 0.1 | 0.2 | 0.2 | 0.1 | 0.3 | 0.0 | Hart wie Stein wenn trocken. |
| 12 | **Fels (Verwittert)** | 0.8 | 0.9 | 0.1 | 0.3 | 0.7 | 0.0 | 0.2 | 0.0 | Ritzen im Stein. Nur für robuste Wurzeln. |
| 13 | **Staubwüste** | 0.1 | 0.3 | 0.0 | 0.0 | 0.0 | 0.0 | 0.1 | 0.0 | Extrem fein. Ein Windstoß und alles ist weg. |
| 14 | **Kalksteinboden** | 0.7 | 0.6 | 0.1 | 0.2 | 0.5 | 0.2 | 0.2 | 0.0 | Basisch, trocken. |
| 15 | **Laterit (Roterde)** | 0.4 | 0.7 | 0.1 | 0.4 | 0.4 | 0.3 | 0.1 | 0.1 | Tropisch, ausgewaschen, hart (Eisenoxid). |
| 16 | **Permafrost (T)** | 0.5 | 0.9 | 0.4 | 0.8 | 0.3 | 1.0 | 0.2 | 0.0 | Gefroren (simuliert durch hohe Compaction). |

#### Kategorie C: Extreme & Lebensfeindliche Böden (Hardcore)

Hier stirbt fast alles sofort. Benötigt Mutationen (Toxin-Resistenz, etc.).

| Nr | Name | Gran | Compact | Organic | Biofilm | Rough | Water | Nutr | Toxin | Beschreibung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 17 | **Salzpfanne** | 0.2 | 0.8 | 0.0 | 0.1 | 0.1 | 0.0 | 0.0 | 0.8 | **Extrem:** Tötet durch Toxin + Durst. |
| 18 | **Vulkanasche** | 0.6 | 0.2 | 0.0 | 0.0 | 0.4 | 0.0 | 0.8 | 0.3 | Frisch, nährstoffreich, aber schwefelig. |
| 19 | **Lava (Erkaltet)** | 0.1 | 1.0 | 0.0 | 0.0 | 0.9 | 0.0 | 0.5 | 0.2 | **Extrem:** Purer Fels. Nur Flechten schaffen das. |
| 20 | **Öl-Sumpf** | 0.1 | 0.5 | 1.0 | 0.0 | 0.2 | 0.2 | 0.0 | 1.0 | **Extrem:** Maximale Toxizität. Erstickt Wurzeln. |
| 21 | **Schwermetallhalde** | 0.8 | 0.6 | 0.0 | 0.0 | 0.5 | 0.2 | 0.0 | 0.9 | Industrieabfall. Tödlich. |
| 22 | **Säureboden** | 0.4 | 0.5 | 0.2 | 0.1 | 0.3 | 0.4 | 0.1 | 0.6 | Chemisch verseucht (pH extrem niedrig). |
| 23 | **Atommüll-Endlager** | 0.5 | 0.7 | 0.0 | 0.0 | 0.2 | 0.2 | 0.0 | 1.0 | **Extrem:** Strahlung (als Toxin simuliert). |
| 24 | **Tote Erde** | 0.5 | 0.5 | 0.0 | 0.0 | 0.5 | 0.0 | 0.0 | 0.0 | Absolutes Vakuum an Ressourcen. |

#### Kategorie D: Nassgebiete & Gewässer

Für Pflanzen, die viel Wasser brauchen (Weiden, Reis, Algen).

| Nr | Name | Gran | Compact | Organic | Biofilm | Rough | Water | Nutr | Toxin | Beschreibung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 25 | **Sumpf** | 0.1 | 0.2 | 0.9 | 0.7 | 0.2 | 1.0 | 0.7 | 0.1 | Stehendes Wasser, Faulgase. |
| 26 | **Mangroven-Schlick** | 0.1 | 0.4 | 0.6 | 0.5 | 0.1 | 1.0 | 0.6 | 0.3 | Salziges Wasser (leicht toxisch). |
| 27 | **Ton-Grube** | 0.0 | 0.8 | 0.0 | 0.2 | 0.1 | 0.8 | 0.2 | 0.0 | Wasserundurchlässig, Staunässe. |
| 28 | **Moor-Auge** | 0.1 | 0.0 | 0.8 | 0.2 | 0.0 | 1.0 | 0.1 | 0.1 | Fast nur Wasser, kaum fester Boden. |

#### Kategorie E: Urbane & Künstliche Flächen

Der "Anthropozän"-Mix.

| Nr | Name | Gran | Compact | Organic | Biofilm | Rough | Water | Nutr | Toxin | Beschreibung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 29 | **Beton** | 0.2 | 1.0 | 0.0 | 0.0 | 0.1 | 0.0 | 0.0 | 0.1 | **Extrem:** Versiegelt. Wachstum unmöglich. |
| 30 | **Asphalt (Rissig)** | 0.1 | 0.9 | 0.1 | 0.0 | 0.3 | 0.1 | 0.0 | 0.4 | Teer ist giftig. Nur in Rissen wächst was. |
| 31 | **Schottergleis** | 1.0 | 0.8 | 0.0 | 0.1 | 0.8 | 0.1 | 0.0 | 0.5 | Herbizid-belastet, extrem drainiert. |
| 32 | **Bauschutt** | 0.9 | 0.6 | 0.1 | 0.1 | 0.9 | 0.2 | 0.3 | 0.2 | Kalkhaltig, staubig, chaotisch. |
| 33 | **Mülldeponie** | 0.5 | 0.4 | 0.5 | 0.5 | 0.7 | 0.4 | 0.8 | 0.7 | Nährstoffreich, aber giftig (Plastik/Chemie). |
| 34 | **Dachbegrünung** | 0.8 | 0.3 | 0.2 | 0.4 | 0.5 | 0.2 | 0.1 | 0.0 | Dünne Schicht, trocknet extrem schnell aus. |
| 35 | **Acker (Überdüngt)** | 0.4 | 0.5 | 0.3 | 0.2 | 0.2 | 0.5 | 1.0 | 0.3 | Zuviel des Guten (Toxin durch Nitrat). |
| 36 | **Parkweg** | 0.8 | 0.9 | 0.1 | 0.1 | 0.2 | 0.1 | 0.1 | 0.0 | Festgetrampelt. |

#### Kategorie F: Exotisches & Experimentelles

Für spätere Sci-Fi Szenarien.

| Nr | Name | Gran | Compact | Organic | Biofilm | Rough | Water | Nutr | Toxin | Beschreibung |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 37 | **Mars-Regolith** | 0.7 | 0.4 | 0.0 | 0.0 | 0.4 | 0.0 | 0.4 | 0.6 | Perchlorate (Giftig), kein Leben. |
| 38 | **Kristallboden** | 1.0 | 1.0 | 0.0 | 0.0 | 0.8 | 0.0 | 0.0 | 0.0 | Glasartig, extrem scharfkantig. |
| 39 | **Pilz-Myzel-Matte** | 0.3 | 0.1 | 1.0 | 1.0 | 0.5 | 0.6 | 0.9 | 0.0 | Der Boden *lebt* komplett. |
| 40 | **Nanobot-Schwarm** | 0.5 | 0.0 | 0.0 | 1.0 | 0.0 | 0.5 | 1.0 | 0.0 | Künstlich intelligent (ändert sich ständig). |

---

### Integration ins Spiel

Wir können das sehr einfach einbauen. In der `GridManager.init()` oder einer neuen `TerrainGenerator`-Klasse könnten wir Perlin-Noise nutzen, um diese 40 Typen (oder eine Auswahl davon) über die Map zu verteilen.