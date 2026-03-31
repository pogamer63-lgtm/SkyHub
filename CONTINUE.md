# SkyHub — Continuation State

**Last updated:** 2026-03-31
**Session status:** Phase 4 COMPLETE ✅

---

## ✅ Completed (all phases)

### Phase 4 (2026-03-31) — current session
- [x] `app/player/[username]/fishing/page.tsx` — Fishing Planner (trophy fish, rod tiers, sea creatures, FF sources)
- [x] `app/admin/page.tsx` — Admin dashboard (system status, cache TTLs, DB stats, feature coverage)
- [x] `app/player/[username]/page.tsx` — added snapshot persistence (loadSnapshot before API, saveSnapshot after)
- [x] `app/player/[username]/recommendations-panel.tsx` — client component with filter tabs (All / Cheapest / Best ROI / Fastest / Blockers / By Category), ROI+urgency mini-bars, "Why it matters" expandable, "Open →" planner deep links
- [x] `app/player/[username]/collections/page.tsx` — Collections & Minions planner (minion slot tracking, tier grid, collection milestones, near-milestone highlights)
- [x] `app/player/[username]/pets/page.tsx` — Pets Planner (BIS per activity, XP progress, active pet highlight, tier breakdown)
- [x] `app/player/[username]/skills/page.tsx` — Skills Planner (XP tracking, leveling methods with cost color, milestone grid per skill)
- [x] `app/player/[username]/networth/page.tsx` — Networth Breakdown (coins, pets portfolio, gear, fairy souls, powder, bar chart)
- [x] `lib/recommendations/engine.ts` — 2 new rule modules (13 total): `checkFishingProgression`, `checkPetsProgression`
- [x] `app/page.tsx` — updated landing page (15 feature cards, stats bar, CTA section)
- [x] `app/layout.tsx` — added Admin nav link
- [x] Nav links: Fishing, Collections, Pets, Skills, Networth (10 total planner links per profile)
- [x] `lib/types/hypixel.ts` — added `crafted_generators?: string[]` to SkyBlockMember
- [x] Build: **PASSES** (19 routes, 0 TS errors) — pushed to GitHub

### Phase 3 — Part 2 (2026-03-31)
- [x] Research page, Prisma 7 + PostgreSQL, DB snapshots, Compare page
- [x] Landing page server component, SearchForm client component
- [x] Nav: Compare + Data links
- [x] 11 recommendation rule modules

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

## 📋 Next Steps — Phase 5 (in priority order)

### 1. Museum / Bestiary tracker
- Hypixel API: `profile.museum` contains `items` and `special` arrays of donated items
- File: `app/player/[username]/museum/page.tsx`
- Show: items donated, total value estimate, what's missing, museum rewards tiers
- Add to `SkyBlockProfile` type: `museum?: { items: Record<string, unknown>; special: unknown[] }`

### 2. Garden / Jacob planner improvements
- Enhance `app/player/[username]/farming/page.tsx` with:
  - Jacob contest calendar awareness
  - Garden visitor tracking (show which visitors to prioritize)
  - Crop-specific upgrade recommendations (turbo-crop vs bountiful reforge per crop)

### 3. Recommendation engine improvements
- Add `checkAccessoryReforges`: detect when player has accessories with bad reforges
- Add `checkPetItems`: detect pets without held items (e.g., LEGENDARY pet with no item)
- Add `checkGardenLevel`: recommend garden upgrades for farming players
- Now at 13 modules — target 15-16

### 4. Profile snapshot persistence improvement
- When loaded from snapshot cache, still fetch `allProfiles` for the profile switcher
- Currently when cache hit occurs, `allProfiles = []` so switcher doesn't show

### 5. Better compare page
- Add champion badges per category (who wins Farming, who wins Mining, etc.)
- Add "Progression gap" analysis (what A would need to do to catch B in each area)
- Export comparison as image (screenshot-friendly layout)

### 6. Real-time price data on money page
- Integrate live Bazaar + AH prices into income method calculations
- Show coins/hour estimates with current market prices
- Compare with last-fetched timestamp

### 7. Prisma migration documentation
- Run `npx prisma migrate dev --name init` when DATABASE_URL is set
- Add to README instructions for database setup

---

## ⚠️ Known Issues / Limitations

1. **Inventory NBT gating**: Armor, equipment, talisman bag only parse if player logged in recently.
2. **AH price accuracy**: Only first 3 of ~60+ pages scanned. Ballpark only.
3. **Prisma DB optional**: All DB features silently no-op if DATABASE_URL is not set.
   Run `npx prisma migrate dev --name init` after setting DATABASE_URL to activate.
4. **Accessory API items**: Items from the Hypixel Items API shown without prices (Bazaar IDs not mapped).
5. **Pet level XP table**: Simplified XP table in pets/page.tsx, may drift at very high levels.
6. **Gear weapon detection**: Only detects weapons from `inv_contents` (requires NBT).
7. **allProfiles on cache hit**: When loadSnapshot() returns data, the profile switcher won't show (allProfiles=[]).
8. **Networth estimate**: Very rough — no storage/enderchest/AH listings. Pet values approximate.
9. **Collection item storage estimate**: Assumes 1% of collected items are still in storage (very rough).

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/hypixel/client.ts` | Hypixel + Mojang API client, in-memory TTL cache |
| `lib/hypixel/parser.ts` | Raw API → PlayerProfile + `enrichWithNBT()` |
| `lib/hypixel/nbt.ts` | NBT parser (base64 → ParsedItem[]) |
| `lib/recommendations/engine.ts` | 13-module recommendation engine |
| `lib/api/bazaar.ts` | Bazaar price fetcher (no key needed) |
| `lib/api/auction.ts` | AH lowest BIN price fetcher |
| `lib/data/accessories.ts` | ~55 curated accessories with upgrade chains |
| `lib/data/accessories-api.ts` | Hypixel Items API fetcher (400+ accessories) |
| `lib/data/xp-tables.ts` | Skill + dungeon XP tables + helper functions |
| `lib/db/client.ts` | Prisma 7 singleton (null if no DATABASE_URL) |
| `lib/db/snapshots.ts` | Player snapshot + search history DB helpers |
| `lib/types/player.ts` | All app-level TypeScript types |
| `lib/types/hypixel.ts` | Raw Hypixel API types |
| `app/page.tsx` | Landing page (server component, recent searches, 15 feature cards) |
| `app/compare/page.tsx` | Profile comparison page |
| `app/research/page.tsx` | Data & Research transparency page |
| `app/admin/page.tsx` | Admin dashboard (system status, DB stats, feature coverage) |
| `app/player/[username]/page.tsx` | Main profile page (10 planner nav links, snapshot persistence) |
| `app/player/[username]/recommendations-panel.tsx` | Client recommendations with filter tabs + deep links |
| `app/player/[username]/farming/page.tsx` | Farming Fortune Planner (real equipment NBT) |
| `app/player/[username]/mining/page.tsx` | HOTM / Mining Planner |
| `app/player/[username]/dungeons/page.tsx` | Dungeon Planner |
| `app/player/[username]/slayer/page.tsx` | Slayer Planner (6 bosses) |
| `app/player/[username]/accessories/page.tsx` | Accessory Optimizer (curated + API extras) |
| `app/player/[username]/gear/page.tsx` | Gear Analyzer |
| `app/player/[username]/money/page.tsx` | Money Making Analyzer |
| `app/player/[username]/fishing/page.tsx` | Fishing Planner (trophy fish, rods, sea creatures) |
| `app/player/[username]/collections/page.tsx` | Collections & Minions (minion slots, milestones) |
| `app/player/[username]/pets/page.tsx` | Pets Planner (BIS guide, XP levels, active pet) |
| `app/player/[username]/skills/page.tsx` | Skills Planner (XP tracking, leveling methods) |
| `app/player/[username]/networth/page.tsx` | Networth Breakdown (detailed estimate) |
| `prisma/schema.prisma` | PlayerSnapshot + SearchHistory models |
| `SPEC.md` | Full 26-section original specification |

---

## 🔑 Environment

- Node: v25.8.2 · npm: v11.11.1 · Next.js: 16.2.1 · Prisma: 7.6.0
- Build: ✅ PASSING (19 routes, 0 TS errors)
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
