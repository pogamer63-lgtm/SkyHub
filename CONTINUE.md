# SkyHub — Continuation State

**Last updated:** 2026-04-07
**Session status:** Pass 10 COMPLETE — Interview-driven recommendation engine overhaul (money/farming/dungeons/slayer/mining)

---

## Pass 10 — Was gemacht wurde

### Recommendation Engine (`lib/recommendations/engine.ts`) — Interview-driven overhaul

#### Money-Making
| Was | Details |
|-----|---------|
| Gemstone mining tiered | Was flat "27–30M/hr"; now: HOTM 7+ mid: 10–20M/hr; late (Divan+drill): 30–45M/hr; hypermaxed: 60–110M/hr. Added Pristine stat, Peridot vs Jade explanation. |
| Kuudra income tiers | Was "30–50M/hr entry" (WRONG). Now: T1-T2: 5–15M/hr, T3: 20–30M/hr, T4: 35–50M/hr, T5: 60–120M+/hr. Added key cost note. |
| Rift Berberis grinding | NEW: 10–20M/hr, near-zero investment, fires at SkyBlock 12+ with mid/late stage |

#### Farming/Garden
| Was | Details |
|-----|---------|
| Farming armor path | Was Lotus→Pesthunter→Fermento→Helianthus (WRONG). Now: Melon→Cropie→Squash→Fermento→Helianthus (5 tiers with correct skill gates). |
| Pest farming income | Was 40–50M/hr flat. Now: 30–40M/hr mid (Fermento), up to 70M/hr maxed (Helianthus + Green Thumb 5 + Pest Chance 300+). Added Beetle/Slug/Fly pest explanations, Sprayonator tip. |

#### Dungeons/Slayer
| Was | Details |
|-----|---------|
| Slayer unlock comment | Comment said Wolf T2→Enderman, Enderman T2→Blaze. Corrected to Wolf T4→Enderman, Enderman T3→Blaze. |
| Vampire Slayer unlock | Was tied to Blaze T3 (WRONG). Now: Rift-based — enter Rift, progress to Stillgore Château, find Maddox, requires Rift gear. Cat 30 gate removed. |
| Class meta | Was "Berserker early, Archer/Mage at Cat 30" (oversimplified). Now: F1-F3 Berserker/Mage; F4-F6 Archer (Juju)/Berserker; F7 Mage(Hyperion)/Archer(Terminator); MM Tank/Archer. Added weapon-gate logic. |

#### Mining/HOTM
| Was | Details |
|-----|---------|
| HOTM node priority | Was "Mining Fortune first, Cheapskate". Now: Phase 1 (foundation): Efficient Miner + Speed/Fortune (skip Star Powder/Cheapskate — traps); Phase 2 (HOTM 7): Great Explorer #1; Phase 3 (HOTM 8+): Surveyor. |
| Pristine stat recommendation | NEW: "Rush HOTM 10 — Pristine is #1 gemstone profit driver". Fires for HOTM 7-9. |

---

## Pass 9 — Was gemacht wurde

### Recommendation Engine (`lib/recommendations/engine.ts`)

| Was | Details |
|-----|---------|
| `checkMinionSlots()` | Fires when `profile.minions.length` hasn't hit the next threshold (5/10/15/20…130). Shows unique count, how many to go, which slot number unlocks next. `best_roi` type, early/mid/late stages. |
| `checkForagingProgression()` | 4 sub-checks: skill <15 (unlock Whispers), unspent Whispers, no Ocelot pet at level 10+, zero tokens spent at level 15+. Foraging category in engine for first time. |

### Recommendations Panel (`app/player/[username]/recommendations-panel.tsx`)

| Was | Details |
|-----|---------|
| Progression + Long-term filter tabs | 2 new tabs exposing the existing `'progression'` and `'longterm'` `type` fields — were parsed but not filterable. Covers spec 9 scoring views C and E. |
| Expanded details: Requires / Unlocks | When a rec is expanded, shows `r.dependsOn` as "Requires:" and `r.unlocks` as "Unlocks:" beneath `whyItMatters`. |

### README (`README.md`)

| Was | Details |
|-----|---------|
| Roadmap updated | Stale TODO items (FF calculator, HOTM optimizer etc.) moved to "What's Implemented" ✅. New roadmap reflects actual remaining work (PostgreSQL, Redis, Garden Chip). |

---

## Pass 8 — Was gemacht wurde

### Recommendation Engine (`lib/recommendations/engine.ts`)

| Was | Details |
|-----|---------|
| SkyBlock Level 7 Bazaar gate | `checkCriticalBlockers`: fires when `skyblockLevel < 7 && >= 2` — critical/blocker, gameStage early, shows XP needed |
| Jacob's Contest rec | `checkFarmingProgression`: fires when `farmSkill >= 10 && totalMedals === 0` — high/best_roi, explains Anita +60 FF perk |
| Booster Cookie early exit | `checkBoosterCookie`: returns early if `tempStatBuffs` already contains `booster_cookie` |
| Finnegan election context | `checkPestFarming(profile, election?)`: urgency/roi scales up when Finnegan is active mayor |
| Chocolate Factory fix | Two distinct cases: cps===0 "Start /cf" vs cps<5 "Upgrade Workers" |

### Farming Page (`app/player/[username]/farming/page.tsx`)

| Was | Details |
|-----|---------|
| Bandana detection | Green bandana: +4 FF × gardenLevel; Yellow bandana: +30 FF flat — from `pet.heldItem` |
| Active buffs | Cookie (+15 FF) from `tempStatBuffs`; God Potion (+20 FF) from `activeEffects` |
| No-API sources | Crop Shot Chip (max +100), Celestial Mason Jar (max +15) shown with `[No API]` tag, excluded from totals |

### Foraging Page (`app/player/[username]/foraging/page.tsx`)

| Was | Details |
|-----|---------|
| Equipment reforge detection | `FORAGING_REFORGE_FF` map (bountiful +5, lush +4); loops `profile.equipmentItems` checking `item.reforge` |

### Money Page (`app/player/[username]/money/page.tsx`)

| Was | Details |
|-----|---------|
| Finnegan banner | Orange alert banner when election mayor === Finnegan |
| Pest farming income | 40M base/hr + 500k × (gardenLevel-5), requires Garden 5 + Farming 30 |
| Greenhouse plots income | 45M/hr + 1M × (gardenLevel-12), requires Garden 12 |
| Slayer Wolf / Vampire | Wolf 500k–3M/hr; Vampire 150k–800k/hr (Rift) |

---

## Pass 7 — Was gemacht wurde

### Recommendations Panel (`app/player/[username]/recommendations-panel.tsx`)

| Was | Details |
|-----|---------|
| Game stage filter tabs | Added Early / Mid / Late / Endgame tabs — filter recs by `r.gameStage.includes(stage)` |
| `Filter` type extended | Now includes `GameStage` union (`'early' \| 'mid' \| 'late' \| 'endgame'`) |
| `STAGE_KEYS` set | Guards against category-tab collision in filter logic |

### Foraging Planner (`app/player/[username]/foraging/page.tsx`)

New dedicated page — follows the same pattern as fishing/page.tsx and farming/page.tsx.

| Section | Details |
|---------|---------|
| Skill level banner | Level badge, XP progress bar (uses `SKILL_XP_TABLE` from `lib/data/xp-tables.ts`), known FF total |
| Foraging Fortune sources table | Skill (+4/level, max 200), Active Pet (Ocelot +0.3/level, Rabbit +0.3/level, Bee +0.2/level), Equipment [NBT] |
| Foraging Skill Tree | Whispers available/spent, tokens spent, nodes unlocked chips, daily trees cut, daily effect badge |
| Best Foraging Pets card | All 4 best pets — owned/active/not-owned states, current FF shown if owned |
| Foraging Tips | 5 practical tips (Park/Spruce biome, Whispers, Ocelot pet, daily cap, money caveat) |

### Player Profile Nav (`app/player/[username]/page.tsx`)

| Was | Details |
|-----|---------|
| 🌲 Foraging nav link | Added after 🌾 Farming — lime-500 color theme, links to /foraging |

---

## spec.md Compliance

All spec.md sections now implemented:
- ✅ Section 8.4: Farming Planner
- ✅ Section 8.5: Mining Planner
- ✅ Section 8.6: Dungeon Planner
- ✅ Section 8.7: Slayer Planner
- ✅ Section 8.8: Accessory / MP Optimizer
- ✅ Section 8.9: Gear Analyzer
- ✅ Section 8.10: Money Making
- ✅ Section 8.11: Research / Data Transparency
- ✅ Section 8.12: Admin / Data Sync page
- ✅ Section 8.3: Recommendations panel — all filter types including Early/Mid/Late/Endgame

Foraging planner fills the last missing dedicated planner page.

---

## Offene Punkte / Nächste Schritte

### Strukturell unmöglich (kein API-Feld)
- Spieler-Strength-Wert (Mooshroom-Cow-FF)
- Greenhouse-Mutation-Status
- Garden Chip-Level (Crop Shot, Vermin Vaporizer)
- Aktive Mixins (Mason Jar, Melon Juice)

### Optional / Nice-to-have
- Accessory count: `parser.ts:521` TODO — bleibt 0; NBT-Fallback funktioniert
- Enderman income note könnte bazaar-linked sein (Judgement Core price)
- ~~Foraging Fortune: Equipment reforges (Bountiful) nicht aus NBT extrahiert — zeigt 0~~ ✅ Fixed Pass 8

---

## TypeScript-Status

`npx tsc --noEmit` nach allen Änderungen: **0 Fehler**

---

## Spec Compliance Summary (Pass 9)

All spec.md sections implemented:

| Spec Section | Status |
|---|---|
| 8.1 Landing Page | ✅ Hero, search, feature groups, demo stats |
| 8.2 Player Profile | ✅ Stats overview, recommendations, nav |
| 8.3 Upgrade Advisor / Recs Panel | ✅ All filter tabs incl. Progression/Long-term/Stages |
| 8.4 Farming Planner | ✅ FF sources, Garden, buffs, bandana, no-API |
| 8.5 Mining Planner | ✅ HOTM tree, powder, gear |
| 8.6 Dungeon Planner | ✅ Gear checks, class meta, floor gates |
| 8.7 Slayer Planner | ✅ All 6 bosses |
| 8.8 Accessory Optimizer | ✅ MP ranking, missing accessories |
| 8.9 Gear Analyzer | ✅ Tier ratings, slot checks, item modal |
| 8.10 Money Making | ✅ 10+ methods, Finnegan awareness |
| 8.11 Research Transparency | ✅ Source tags on all recs |
| 8.12 Admin / Data Sync | ✅ Admin page |
| 9 Recommendation Engine | ✅ 29 check functions, 6 scoring views, stage filters |
| 10 Item Textures | ✅ FurfSky local + CDN fallback + animated sprites |
| 11 Player Skins | ✅ mc-heads.net + NameMC profile links |
| 12 Provider Architecture | ✅ lib/providers/skins + lib/providers/textures |
| 18 README | ✅ Full setup, hosting, asset notes, roadmap |
