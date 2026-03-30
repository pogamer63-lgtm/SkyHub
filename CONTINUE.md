# SkyHub — Continuation State

**Last updated:** 2026-03-30
**Session status:** Phase 3 — Part 1 COMPLETE ✅

---

## ✅ Completed (all phases)

### Phase 3 — Part 1 (2026-03-30)
- [x] `app/player/[username]/gear/page.tsx` — Gear Analyzer
  - Parses armor + equipment + weapon NBT server-side
  - Gear Score 0-100, 7-tier item database (Starter → BiS)
  - Slot-by-slot ratings, reforge guide, upgrade paths with coin estimates
  - Full armor progression roadmap (6 stages)
- [x] `app/player/[username]/money/page.tsx` — Money Making Analyzer
  - 14 income methods: farming/mining/dungeons/slayer/fishing/Bazaar/minions
  - Unlock check per method, Bazaar-weighted coins/hr estimates
  - Locked vs unlocked ranking, finance advice by coin bracket
  - Passive AFK income estimate from minion farms
- [x] Profile page: Gear 🛡️ + Money 💰 nav links added (7 nav links total)
- [x] Build: **PASSES** (12 routes, 0 TS errors)
- [x] Pushed to GitHub (`a19efae`)

### Phase 2 — Part 2 (2026-03-30)
- [x] `lib/hypixel/nbt.ts` — Full NBT parser (base64 → gzip → NBT → item list)
- [x] `lib/hypixel/parser.ts` → `enrichWithNBT()` — async post-parse NBT enrichment
- [x] `lib/data/accessories.ts` — Curated accessory database (~55 entries, upgrade chains)
- [x] `lib/api/auction.ts` — AH lowest BIN fetcher (3 pages, 10min cache)
- [x] `app/player/[username]/accessories/page.tsx` — Accessory Optimizer
- [x] `app/player/[username]/dungeons/page.tsx` — Dungeon Planner (F1-F7 + MM)
- [x] `app/player/[username]/slayer/page.tsx` — Slayer Planner (all 6 bosses)
- [x] `lib/data/xp-tables.ts` — XP tables + helpers (exported)
- [x] Profile page: NBT enrichment, PetsPanel, networth estimator, 5 nav links

### Phase 2 — Part 1 (2026-03-30)
- [x] `lib/api/bazaar.ts` — Bazaar price fetcher (no API key needed, 5min cache)
- [x] `app/player/[username]/error.tsx` — Error boundary (Next.js 16 `unstable_retry`)
- [x] `app/player/[username]/loading.tsx` — Suspense skeleton
- [x] `app/player/[username]/farming/page.tsx` — Farming Fortune Planner
- [x] `app/player/[username]/mining/page.tsx` — HOTM / Mining Planner (22 nodes)

### Infrastructure + Core (Phase 1)
- [x] Next.js 16 + TypeScript + Tailwind CSS
- [x] `lib/hypixel/client.ts` — API client with in-memory TTL cache
- [x] `lib/hypixel/parser.ts` — Full profile parser (skills/slayer/dungeons/pets/mining/farming)
- [x] `lib/recommendations/engine.ts` — Recommendation engine (8 rules, Bazaar-aware)
- [x] `lib/types/hypixel.ts` + `lib/types/player.ts` — All TypeScript types
- [x] `app/page.tsx` — Landing page with search
- [x] `app/player/[username]/page.tsx` — Full profile overview
- [x] `app/api/player/search/route.ts` + `app/api/player/[username]/route.ts`
- [x] `README.md`, `.env.example`, `SPEC.md`
- [x] Git connected to `https://github.com/pogamer63-lgtm/SkyHub.git`

---

## 🔄 Currently In Progress

Nothing. Clean state. Ready to continue.

---

## 📋 Next Steps — Phase 3 (in priority order)

### 1. Research / Data Transparency page (SPEC §8.11)
- File: `app/research/page.tsx` or `app/player/[username]/research/page.tsx`
- Show where recommendations come from (data sources, confidence, last updated)
- List all known data sources (Hypixel API, Bazaar, AH, hardcoded game data)
- Show data freshness (cache TTL, last fetch timestamp)
- Optionally show the recommendation rules in human-readable form
- No external fetch needed — purely explains the app's logic

### 2. PostgreSQL + Prisma (SPEC §7 / §9)
- Install: `npm install prisma @prisma/client`
- Create `prisma/schema.prisma`:
  - `PlayerSnapshot` — stores parsed PlayerProfile JSON + timestamp (cache layer)
  - `SearchHistory` — username + timestamp (for popular searches / landing page)
- `lib/db/client.ts` — Prisma client singleton
- `lib/db/snapshots.ts` — save/load snapshot helpers
- Update `app/api/player/[username]/route.ts` to read/write snapshots
- Update `app/page.tsx` to show recent/popular searches from DB
- Add `DATABASE_URL` to `.env.example` (already there)
- Schema should be ready for Redis replacement of in-memory cache later

### 3. Profile Comparison Mode (SPEC §8.3)
- File: `app/compare/page.tsx`
- Compare two players side-by-side: skills, slayer, dungeons, MP, networth
- URL: `/compare?a=player1&b=player2`
- Highlight who is ahead in each category
- Show what Player A needs to catch up to Player B in each area

### 4. Recommendation Engine — Expanded Rules (SPEC §9)
- Current engine has 8 rules. Expand to cover all planner pages:
  - Gear: detect weak armor set → recommend upgrade path
  - Farming: detect low FF → recommend top FF sources
  - Mining: detect missing high-priority HOTM nodes → recommend next node
  - Dungeons: detect class imbalance → recommend which class to level
  - Slayer: detect profitable next boss tier → recommend
- Add filter UI on the profile page recommendations section (cheapest / best ROI / fastest / by category)

### 5. Equipment Farming Fortune Fix (Known Issue #3)
- `app/player/[username]/farming/page.tsx` currently shows [NBT] placeholder for equipment
- Fix: call `parseInventoryNBT(member.inventory.equipment_contents.data)` in the farming page
- Map known farming equipment IDs to their Farming Fortune values:
  - `RABBIT_HAT` → +5 FF
  - `BOUNTIFUL_SCEPTER` → FF by perk level
  - Lotus armor set → +60 FF / piece
  - Fermento → +60 FF / piece
  - Melon Dicer → crop-specific FF

### 6. Accessory Database Expansion (Known Issue #4)
- Current: ~55 entries. Full game has 400+.
- Option A: Add more manually to `lib/data/accessories.ts`
- Option B: Fetch from `https://api.hypixel.net/v2/resources/skyblock/items` (no key needed)
  - Filter by `category: "ACCESSORY"` and extract item IDs + rarities
  - Map to MP using existing `MP_PER_RARITY` lookup
  - Store in `lib/data/accessories-generated.ts` as auto-generated supplement

### 7. Admin / Data Sync page (SPEC §8.12)
- File: `app/admin/page.tsx`
- Show: cache status (entries count, oldest entry), last API fetch timestamps
- Show: build info (version, last deployed)
- No auth needed initially — internal tool

---

## ⚠️ Known Issues / Limitations

1. **Accessory MP from talisman bag**: Requires player to have logged in recently (Hypixel API returns NBT only then). Fallback uses `highest_magical_power` from API.
2. **AH prices approximate**: Only 3 pages of ~60+ scanned. Ballpark only.
3. **Farming Fortune equipment**: Shows [NBT] placeholder — fix in Phase 3 step 5 above.
4. **Accessory list incomplete**: ~55 curated entries; full game has 400+. See Phase 3 step 6.
5. **Pet level edge cases**: Simplified XP table, may drift at very high levels (100+).
6. **Gear analyzer weapons**: Only detects weapons from main inventory (not hotbar) — depends on API returning `inv_contents`.
7. **Dungeons/accessories links on profile page**: Lines 133/135 of `page.tsx` use backslash in template literals — verify they work in production (they show correctly in build but may be a lint/copy artifact).

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `lib/hypixel/client.ts` | Hypixel + Mojang API requests, in-memory TTL cache |
| `lib/hypixel/parser.ts` | Raw API → PlayerProfile + `enrichWithNBT()` |
| `lib/hypixel/nbt.ts` | NBT parser (base64 → ParsedItem[]) |
| `lib/recommendations/engine.ts` | Recommendation rules — add new rules here |
| `lib/api/bazaar.ts` | Bazaar price fetcher (no key needed) |
| `lib/api/auction.ts` | AH lowest BIN price fetcher |
| `lib/data/accessories.ts` | ~55 curated accessories with upgrade chains |
| `lib/data/xp-tables.ts` | Skill + dungeon XP tables + helper functions |
| `lib/types/player.ts` | All app-level TypeScript types |
| `lib/types/hypixel.ts` | Raw Hypixel API types |
| `app/player/[username]/page.tsx` | Main profile page (7 nav links to planners) |
| `app/player/[username]/farming/page.tsx` | Farming Fortune Planner |
| `app/player/[username]/mining/page.tsx` | HOTM / Mining Planner |
| `app/player/[username]/dungeons/page.tsx` | Dungeon Planner |
| `app/player/[username]/slayer/page.tsx` | Slayer Planner (6 bosses) |
| `app/player/[username]/accessories/page.tsx` | Accessory Optimizer |
| `app/player/[username]/gear/page.tsx` | Gear Analyzer |
| `app/player/[username]/money/page.tsx` | Money Making Analyzer |
| `SPEC.md` | Full 26-section original specification |

---

## 🔑 Environment

- Node: v25.8.2
- npm: v11.11.1
- Next.js: 16.2.1
- Build status: ✅ PASSING (12 routes, 0 TS errors)
- PATH needed: `/c/Program Files/nodejs:/c/Users/Leon/AppData/Roaming/npm`

---

## Resume Command

```bash
export PATH="$PATH:/c/Program Files/nodejs:/c/Users/Leon/AppData/Roaming/npm"
cd "E:/pyton/SkyHub"
git status
cat CONTINUE.md
```
