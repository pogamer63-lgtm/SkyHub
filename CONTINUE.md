# SkyHub — Continuation State

**Last updated:** 2026-04-03
**Session status:** Pass 5 COMPLETE — API-Fixes + Research-Integration (NotebookLM 199 Fragen)

---

## Pass 5 — Was gemacht wurde

### Farming-Page (`app/player/[username]/farming/page.tsx`)

| Was | Vorher | Nachher |
|-----|--------|---------|
| Crop-API-Keys | CARROT, POTATO, MUSHROOM, COCOA_BEANS, NETHER_WART | CARROT_ITEM, POTATO_ITEM, MUSHROOM_COLLECTION, INK_SACK:3, NETHER_STALK |
| Garden-Plots-Max | `MAX_PLOTS = 24` → +72 FF | `MAX_PLOTS = 25` → +75 FF |
| Elephant-Pet-FF | +1.5/Level (max 150) | +1.8/Level (max 180) — research-bestätigt |
| Mooshroom-Cow-FF | Falsche Formel `level + 10` | 0 + Hinweis "+1 FF per 20 Strength (stat-abhängig)" |
| Jacob-FF-API-Key | `farming_fortune` | `farming_level_cap` (mit Fallback) |
| Medaillen-UI | Zeigte Medaillen im Beutel | Zeigt `jacobMedalsEarned` + "in bag" als Unterzeile |
| Plot-Kommentar | "24 plots max = +72 FF" | "25 plots max = +75 FF" |

### Parser (`lib/hypixel/parser.ts`)

- Jacob `claimed_medal` direkt aus API gelesen (war vorher ignoriert)
- Medaillen-Schwellenwerte: Diamond=2%, Platinum=5%, Gold=10%, Silver=30%, Bronze=60%
- `platinum` zu `jacobMedalsEarned` hinzugefügt

### Bestiary (`app/player/[username]/bestiary/page.tsx`)

- `getKills()`: Sucht jetzt Kleinbuchstaben-Keys (zombie_1, zombie_2…) statt Großbuchstaben

### Mining (`app/player/[username]/mining/page.tsx`)

- HOTM-Node-Key: `quick_forge` → `forge_time`

### Recommendations Engine (`lib/recommendations/engine.ts`)

**5 neue Funktionen** (basierend auf NotebookLM-Research, 2026-Q1 Meta):

| Funktion | Trigger | Empfehlung |
|----------|---------|-----------|
| `checkBoosterCookie` | early/mid + ≥8M Coins | Cookie kaufen (~10M) — #1 mid-game Investment |
| `checkGreenhousePlots` | Garden 12+ + ≥50M Coins | Greenhouse-Plots (~100M) — 40–50M/hr aktiv |
| `checkPestFarming` | Garden 5+ + Farming 30+ | Pest Farming fokussieren — 80–90M/hr bei Finnegan |
| `checkChocolateFactory` | SkyBlock Level 20+, Farming <10 | /cf täglich öffnen (free passive) |
| `checkMinionOptimization` | mid/late/endgame | Compactors (~20k) auf alle Minions |

**2 verbesserte Empfehlungen:**

- `slayer_enderman_3`: Hinweis dass Enderman 2026 schlechte coin/hr hat (Judgement Core gefallen), primär Blaze-Unlock-Zweck
- `slayer_blaze_4`: Korrekt als profitabelster Slayer (50M+/hr) markiert, ROI/Urgency erhöht

---

## Offene Punkte / Nächste Schritte

### Nicht lesbare API-Daten (NBT / zusätzliche Endpoints nötig)
- Spieler-Strength-Wert (für Mooshroom-Cow-FF)
- Crop-Shot-Chip-Level (Garden Chips API unbekannt)
- Greenhouse-Mutation-Status
- Aktiver Mayor (für Finnegan-Buff-Hinweis in Empfehlungen)

### Farming-Page — noch fehlende FF-Quellen (research-bestätigt, aber nicht in API)
- **Crop Shot Chip**: +100 FF max (Garden Chip)
- **Booster Cookie Buff**: +15–20 FF (temporär)
- **God Potion**: +20 FF (temporär)
- **Celestial Mason Jar Mixin**: +15 FF (Harvest Feast)
- **Green Bandana** (Pet Item auf Elephant): +4 FF pro Garden-Level
- **Yellow Bandana** (Pet Item): +30 FF

### Recommendation Engine — mögliche Erweiterungen
- Erkennen ob Booster Cookie aktiv ist
- Mayor-Finnegan-Erkennung für Pest/Pelt-Boost-Hinweise
- Chocolate-Factory-Fortschritt prüfen

---

## Research-Quelle

`research_youtube_money.md` — NotebookLM, 199 Fragen/Antworten, generiert 2026-04-01  
Abgedeckt: Q1–Q50 gründlich gelesen, Q51–Q199 gescannt.  
Gespeichert in Memory: `memory/project_skyblock_meta_2026.md`

---

## TypeScript-Status

`npx tsc --noEmit` nach allen Änderungen: **0 Fehler**
