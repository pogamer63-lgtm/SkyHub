# SkyHub — Continuation State

**Last updated:** 2026-04-01
**Session status:** Phase 6 Meta Audit Pass 4 IN PROGRESS — wiki fetch complete, code fixes applied, NotebookLM Part A running

---

## ✅ Completed (all phases)

### Phase 6 — Meta Audit Pass 4B/4C (2026-04-01) — Wiki Fetch + Code Fixes
- [x] `wiki_content.md` (1233 lines): 15 wiki pages fetched via Fandom API (direct URLs blocked, API worked)
  - Skills, SkyBlock Level, Slayer, Dungeons, HOTM, Magical Power, Pets, Garden, Farming Fortune, Hunting, Kuudra, Rift, Fairy Soul, Reforge, Minions + Money-Making
- [x] **CRITICAL FIX**: Enderman unlock requires Wolf **Tier IV** (not T2 as coded) — `engine.ts` corrected
- [x] **CRITICAL FIX**: Blaze now requires Enderman Level 3 prerequisite — `engine.ts` corrected + `dependsOn` added
- [x] **CRITICAL FIX**: Dungeon floor entry requirements corrected across all 7 normal + 7 MM floors — `dungeons/page.tsx`
  - Was: F2=Cat5, F3=Cat10, F4=Cat15, F5=Cat20, F6=Cat24, F7=Cat28
  - Now: F2=Cat4, F3=Cat7, F4=Cat11, F5=Cat16, F6=Cat21, F7=Cat26 (wiki entrance reqs + buffer)
- [x] Vampire Slayer rec: now requires SkyBlock Level 12 + explains Globulate Timecharm requirement
- [x] `UPGRADE_RULES.json` v1.4: `dungeon_floor_entry_requirements`, `skills_max_levels` (all 13 skills with correct caps), `magical_power.formula` added
- [x] `DISPUTED_FACTS.md`: 4 new resolved facts (Garden L15, Fairy Souls no stats, Rift access, no accessory reforges)
- [x] `LAST_META_REFRESH.md`: Pass 4B entry added
- [x] Build: ✅ PASSING (0 TS errors)

### Phase 6 — Meta Audit Pass 4B (2026-04-01) — NotebookLM Economy & Content
- [x] `research_pass4_economy.md` (610+ lines): Garden, Farming Fortune, Jacob's, Fishing, Foraging/Hunting, Kuudra, Rift, Money-making, Reforges, Enchants, Minions, Fairy Souls
- [x] `lib/hypixel/parser.ts`: gardenTable corrected (max level 15, was 20)
- [x] `lib/recommendations/engine.ts`: Fairy Souls description corrected (stat bonuses removed Sept 2022)
- [x] `UPGRADE_RULES.json` v1.3: fairy_souls + rift_access sections; garden.levels.max = 15

### Phase 6 — Meta Audit Pass 3 (2026-04-01) — NotebookLM
- [x] NotebookLM notebook created; 10 wiki sources added and processed
- [x] 9 targeted questions answered via NotebookLM chat
- [x] `notebooklm_pass3_raw.md` — full Q&A saved
- [x] **CRITICAL FIX**: Slayer unlock chain corrected — Spider before Wolf (was wrong in Pass 2)
  - Correct chain: Zombie T2 → Spider → Spider T2 → Wolf → Wolf T2 → Enderman → Enderman T2 → Blaze
  - `engine.ts`: Added `checkSlayerProgression` rules for Spider (L4) and Wolf (L4) with correct unlock dependencies
- [x] **Bazaar unlock level RESOLVED**: Definitively Level 7 (wiki-confirmed, was disputed)
- [x] **"Erythrocyte currency" CORRECTED**: Not confirmed in wiki; Vampire Slayer uses Motes + Coven Seals/Bloodbadges
- [x] New findings documented: Hunting skill (max L25), Foraging Update scope, HOTM T10 nodes (7 nodes), Swappable Pet Items fee table, Greenhouse mutations (Sunflower/Moonflower/Wild Rose confirmed; Soggybud/Bambloom unconfirmed)
- [x] `UPGRADE_RULES.json` v1.2: hunting_skill, foraging_update, greenhouse, hotm_t10_nodes, vampire_slayer_mechanics, money_making_2026 sections added; slayer order corrected; vampire currency corrected
- [x] `DISPUTED_FACTS.md`: Bazaar level resolved, 5 new disputes (17–21), 8 new resolved facts
- [x] `META_SOURCES.md`: 9 new sources (27–35), Pass 3 findings section

### Phase 6 — Meta Audit Pass 2 (2026-04-01)
- [x] Research Pass 2: 13 new sources, 8 new UPGRADE_RULES.json sections (v1.1)
- [x] New engine rules: `checkDungeonClassMeta`, `checkEquipmentSlots`, `checkGlaciteTunnels` (20 modules total)
- [x] Key findings: Vampire slayer (6th), Dungeon class transitions, Equipment slots meta, Glacite Tunnels requirements, Farming Fortune formula, money-making ladder, beginner mistakes
- [x] NotebookLM-py confirmed installed; Google session expired — fallback direct web research used

### Phase 6 — Meta Audit Pass 1 (2026-04-01)
- [x] Created `META_SOURCES.md` — 13 sources, findings by category
- [x] Created `UPGRADE_RULES.json` — structured rules with confidence levels
- [x] Created `DISPUTED_FACTS.md` — uncertain/disputed facts, resolved facts
- [x] Created `LAST_META_REFRESH.md` — audit log with fix status
- [x] `lib/recommendations/engine.ts`:
  - Garden unlock: "SB Level 12" → "SkyBlock Level 5"
  - Revenant armor: "Level 5 unlocks armor" → "Level 4 wear / Level 5 craft"
  - MP thresholds: 200/400 replaced with 250/500/750 (logarithmic, no hard breakpoints)
  - Dungeon path: added F5 milestone (Shadow Assassin unlock) before F6
  - `checkMuseumValue`: removed MP-from-museum language; updated to Bits/Bank reward system
- [x] `app/player/[username]/museum/page.tsx`: Complete rewrite for post-patch 0.20.7:
  - Removed all Magical Power-from-museum logic and VALUE_TIERS
  - Added 30-milestone system (+1% Bits Multiplier, +2% Bank Interest per milestone)
  - Visual milestone grid (30 cells) + progress bar to next milestone
  - Kept item donation tracking (weapons/armor/fishing/rarities still relevant)

### Phase 5 — Part 5 (2026-03-31)
- [x] `lib/types/player.ts` + `lib/hypixel/parser.ts`: added `uniqueGolds`, `contestsParticipated` to FarmingProgress
- [x] `farming/page.tsx`: Jacob's Farming panel (medals bronze→diamond, gold medal crop badges, contests count)
- [x] `components/ItemIcon.tsx`: color fallback square for missing images (deterministic color + first-letter initial)
- [x] `dungeons/page.tsx`: Fastest S+ Times grid + class XP shown per class

### Phase 5 — Part 4 (2026-03-31)
- [x] `app/compare/page.tsx`: Champion Badges panel (8 categories, color-coded, A/B win tallies)
- [x] `app/player/[username]/money/page.tsx`: Live Bazaar price status banner (timestamp, item count, animate-pulse)
- [x] `components/ItemIcon.tsx`: skip 1-frame animated items (render as static)

### Phase 5 — Part 3 (2026-03-31)
- [x] `lib/recommendations/engine.ts` — 2 new rules (17 total): `checkGardenUpgrades`, `checkAccessoryPower`
  - `checkGardenUpgrades`: Garden Lv 7 milestone + crop upgrade leveling recommendations
  - `checkAccessoryPower`: critical blocker if MP ≥ 50 but no Power selected; low-prio if < 3 powers unlocked
- [x] `app/player/[username]/farming/page.tsx` — Crop Upgrades panel (per-crop level, FF contribution, progress bar)
- [x] 22 routes, 17 recommendation modules, 0 TS errors

### Phase 5 — Part 2 (2026-03-31)
- [x] `app/player/[username]/bestiary/page.tsx` — Bestiary Tracker (33 mob families, milestone progress bars, completion %)
- [x] `app/player/[username]/page.tsx` — fixed profile switcher on cache hit (getSkyBlockProfiles now always called)
- [x] 22 routes, 14 planner links per profile, 0 TS errors

### Phase 5 — Part 1 (2026-03-31)
- [x] `components/ItemIcon.tsx` — Smart item icon component with 3 modes:
  - Helmet/armor: uses `*_model.png` pre-rendered 3D preview (60 helmets)
  - Animated items: JS-driven sprite-sheet animation via `setInterval` + `backgroundPosition`
  - Static icons: plain `<img>` with `pixelated` rendering and `onError` hide
- [x] `lib/data/animated-items.ts` — Auto-generated from mcmeta files: 245 animated items with `{frames, frametime}` data
- [x] Updated `gear/page.tsx`, `accessories/page.tsx`, `slayer/page.tsx` — all use `ItemIcon` instead of raw `<img>` + `getItemIconUrl`
- [x] `app/player/[username]/museum/page.tsx` — Museum Tracker:
  - Shows donated items from `profile.museum.members[uuid].items`
  - Curated list of 35+ notable museum items with value estimates
  - Museum value tier progress (Starter → Transcendent)
  - Magical Power earned from museum milestones
  - Categorized by Weapons / Armor / Fishing / Rarities
  - Donated vs Missing layout with icons
- [x] `lib/types/hypixel.ts` — Added `SkyBlockMuseum`, `MuseumMember`, `MuseumItem` types; `museum?` field on `SkyBlockProfile`
- [x] `lib/recommendations/engine.ts` — 2 new rule modules (15 total):
  - `checkPetItems`: detects active LEGENDARY/MYTHIC pets without held items
  - `checkMuseumValue`: recommends donating to museum for mid-game+ players
- [x] Navigation: added 🏛 Museum link to player profile page (13 planner links total)
- [x] `app/page.tsx` — updated stats (21 routes, 13+ planners, 15 rules)
- [x] Build: **PASSES** (21 routes, 0 TS errors)

### Phase 4 (2026-03-31)
- [x] Fishing, Admin, Collections, Pets, Skills, Networth pages
- [x] Snapshot persistence, recommendations filter panel
- [x] 13 recommendation modules → 15 now
- [x] 3349 item PNGs in `public/items/` from FurfSky Reborn texture pack

### Phase 3 — Part 2 (2026-03-31)
- [x] Research page, Prisma 7 + PostgreSQL, DB snapshots, Compare page

### Phase 3 — Part 1 (2026-03-30)
- [x] Gear Analyzer, Money Making pages

### Phase 2 (2026-03-30)
- [x] NBT parser, enrichWithNBT, accessory optimizer, dungeon planner, slayer planner
- [x] Farming Fortune planner, HOTM planner, Bazaar + AH price APIs, XP tables, pets panel, networth estimate

### Phase 1 (2026-03-29)
- [x] Full Next.js 16 app scaffold, all core infrastructure, player profile page
- [x] Recommendation engine (MVP), skin provider, landing page, API routes

---

## 🔄 Currently In Progress

- NotebookLM Part A script (`scripts/notebooklm_pass4a.py`) running — 8 wiki text sources added to notebook, 12 questions pending
- Results will be saved to `research_pass4_core.md`

### Known Remaining Issues (from wiki research)
- Elephant pet: +150 FF at L100; Mooshroom Cow: +110 FF at L100 — Elephant has more raw FF but Mooshroom Cow has other bonuses. `pets/page.tsx` currently lists Mooshroom Cow first. Add a note clarifying this tradeoff.
- Foraging max level 54 (not 60) — affects skill display; gameplay naturally caps XP so no parsing error but should be documented in skills page
- Skill XP table: level 50 threshold may differ by 200,000 XP from wiki (55,172,425 vs 55,372,425) — low priority, needs verification

### Deferred from Phase 6 Meta Audit (lower priority)
- `gear/page.tsx`: armor progression descriptions still reference old path — update to Ender/Glacite → Strong Dragon → Shadow Assassin → Necron → Kuudra
- Museum milestone thresholds in `museum/page.tsx` are approximate — verify against live API once available
- YouTube-based money-making research still pending (user requested: find recent YouTube videos and synthesize via NotebookLM)

---

## 📋 Next Steps — Phase 5 Part 2 (in priority order)

### 1. ~~Better ItemIcon fallback~~ ✅ Color square fallback implemented

### 2. ~~Garden / Jacob planner improvements~~ ✅ Jacob medals + contest stats added

### 3. ~~Recommendation engine — 2 more rules~~ ✅ Done (now 17 modules)

### 4. Profile snapshot persistence improvement
- When loaded from snapshot cache, still fetch `allProfiles` for the profile switcher
- Currently when cache hit occurs, `allProfiles = []` so switcher doesn't show

### 5. ~~Better compare page~~ ✅ Champion badges done; export-as-image still open

### 6. ~~Real-time price data on money page~~ ✅ Live price banner added

### 7. Bestiary tracker
- Parse `member.bestiary` data
- Show mob kill counts, bestiary milestone progress
- File: `app/player/[username]/bestiary/page.tsx`

---

## ⚠️ Known Issues / Limitations

1. **Inventory NBT gating**: Armor, equipment, talisman bag only parse if player logged in recently.
2. **AH price accuracy**: Only first 3 of ~60+ pages scanned. Ballpark only.
3. **Prisma DB optional**: All DB features silently no-op if DATABASE_URL is not set.
4. **Accessory API items**: Items from the Hypixel Items API shown without prices.
5. **Pet level XP table**: Simplified XP table in pets/page.tsx.
6. ~~**allProfiles on cache hit**~~: Fixed — getSkyBlockProfiles now called before cache check.
7. **Networth estimate**: Very rough — no storage/enderchest/AH listings.
8. **Museum value**: Estimated from curated notable items list only. Actual in-game value from API is more accurate when available.
9. **Animated textures with 1 frame** (axe_of_the_shredded, etc.): ANIMATED_ITEMS map contains items with `frames: 1`. These animate with 1 frame = effectively static. Could filter them out.

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/hypixel/client.ts` | Hypixel + Mojang API client, in-memory TTL cache |
| `lib/hypixel/parser.ts` | Raw API → PlayerProfile + `enrichWithNBT()` |
| `lib/hypixel/nbt.ts` | NBT parser (base64 → ParsedItem[]) |
| `lib/recommendations/engine.ts` | 15-module recommendation engine |
| `lib/api/bazaar.ts` | Bazaar price fetcher (no key needed) |
| `lib/api/auction.ts` | AH lowest BIN price fetcher |
| `lib/data/accessories.ts` | ~55 curated accessories with upgrade chains |
| `lib/data/accessories-api.ts` | Hypixel Items API fetcher (400+ accessories) |
| `lib/data/animated-items.ts` | 245 animated item IDs with frame/frametime data (from .mcmeta) |
| `lib/data/xp-tables.ts` | Skill + dungeon XP tables + helper functions |
| `lib/db/client.ts` | Prisma 7 singleton (null if no DATABASE_URL) |
| `lib/db/snapshots.ts` | Player snapshot + search history DB helpers |
| `lib/types/player.ts` | All app-level TypeScript types |
| `lib/types/hypixel.ts` | Raw Hypixel API types (incl. Museum types) |
| `lib/utils/item-icons.ts` | Legacy `getItemIconUrl()` — prefer `ItemIcon` component now |
| `components/ItemIcon.tsx` | Smart item icon: helmet model / animated sprite / static |
| `app/page.tsx` | Landing page (21 routes stat, 16 feature cards) |
| `app/compare/page.tsx` | Profile comparison page |
| `app/research/page.tsx` | Data & Research transparency page |
| `app/admin/page.tsx` | Admin dashboard |
| `app/player/[username]/page.tsx` | Main profile page (13 planner nav links) |
| `app/player/[username]/recommendations-panel.tsx` | Client recommendations with filter tabs |
| `app/player/[username]/farming/page.tsx` | Farming Fortune Planner |
| `app/player/[username]/mining/page.tsx` | HOTM / Mining Planner |
| `app/player/[username]/dungeons/page.tsx` | Dungeon Planner |
| `app/player/[username]/slayer/page.tsx` | Slayer Planner (6 bosses) |
| `app/player/[username]/accessories/page.tsx` | Accessory Optimizer |
| `app/player/[username]/gear/page.tsx` | Gear Analyzer |
| `app/player/[username]/money/page.tsx` | Money Making Analyzer |
| `app/player/[username]/fishing/page.tsx` | Fishing Planner |
| `app/player/[username]/collections/page.tsx` | Collections & Minions |
| `app/player/[username]/pets/page.tsx` | Pets Planner |
| `app/player/[username]/skills/page.tsx` | Skills Planner |
| `app/player/[username]/networth/page.tsx` | Networth Breakdown |
| `app/player/[username]/museum/page.tsx` | Museum Tracker (NEW) |
| `public/items/` | 3349+ PNGs from FurfSky Reborn (item icons + 60 _model.png helmets) |
| `prisma/schema.prisma` | PlayerSnapshot + SearchHistory models |
| `SPEC.md` | Full 26-section original specification |

---

## 🔑 Environment

- Node: v25.8.2 · npm: v11.11.1 · Next.js: 16.2.1 · Prisma: 7.6.0
- Build: ✅ PASSING (21 routes, 0 TS errors)
- PATH: `/c/Program Files/nodejs:/c/Users/Leon/AppData/Roaming/npm`
- DATABASE_URL: optional — set in `.env` to activate PostgreSQL features

---

## Resume Command

```bash
export PATH="$PATH:/c/Program Files/nodejs:/c/Users/Leon/AppData/Roaming/npm"
cd "E:/pyton/SkyHub"
git status
cat CONTINUE.md
```

## Database Setup (when ready)

```bash
# Set DATABASE_URL in .env first, then:
npx prisma migrate dev --name init
# App will then persist player snapshots and show recent searches on landing page
```

## Texture Pack Notes

- Texture pack: `E:\pyton\SkyHub\temp\§aFurf§bSky §6Reborn §f§lFULL§r §71.21.8§8`
- 3349 item PNGs copied to `public/items/` from `assets/cittofirmgenerated/textures/item/`
- 245 animated items (`.mcmeta` files) — sprite sheets, vertical strips, 1 tick = 50ms
- 60 `*_model.png` files — pre-rendered 3D helmet previews (larger than 16×16)
- `ItemIcon` component handles all 3 cases automatically
- Armor layer textures (64×32 UV maps) are in `assets/cittofirmgenerated/textures/models/armor/` — NOT yet implemented (would need Three.js for full 3D rendering)
