# SkyHub — Continuation State

**Last updated:** 2026-03-31
**Session status:** Phase 5 Part 2 COMPLETE ✅

---

## ✅ Completed (all phases)

### Phase 5 — Part 2 (2026-03-31) — current session
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

Nothing. Clean state. Ready to continue.

---

## 📋 Next Steps — Phase 5 Part 2 (in priority order)

### 1. Better ItemIcon — detect missing images more elegantly
- Currently static icons silently render nothing on missing image (onError hides)
- Could add a fallback sprite (colored square with item ID initial letter)
- Low priority since most items have textures

### 2. Garden / Jacob planner improvements
- Enhance `app/player/[username]/farming/page.tsx` with:
  - Jacob contest calendar awareness (parse contest schedule)
  - Garden visitor tracking
  - Crop-specific reforge recommendations

### 3. Recommendation engine — 2 more rules (target 17)
- Add `checkAccessoryReforges`: detect accessories with suboptimal reforges (needs NBT reforge data)
- Add `checkGardenLevel`: recommend garden upgrades for farming players with Garden > 0

### 4. Profile snapshot persistence improvement
- When loaded from snapshot cache, still fetch `allProfiles` for the profile switcher
- Currently when cache hit occurs, `allProfiles = []` so switcher doesn't show

### 5. Better compare page
- Add champion badges per category (who wins Farming, who wins Mining, etc.)
- Add "Progression gap" analysis
- Export comparison as image

### 6. Real-time price data on money page
- Integrate live Bazaar + AH prices into income method calculations

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
