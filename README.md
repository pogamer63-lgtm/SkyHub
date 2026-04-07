# SkyHub

**Hypixel SkyBlock progression advisor.** Enter a username, get a ranked action plan — what to upgrade next, what it costs, and why it matters at your game stage.

> Not affiliated with Hypixel Inc. or Mojang AB.

---

## Features

- **Upgrade Advisor** — ranked recommendations with cost, benefit, ROI, and urgency scores across all categories
- **Farming Planner** — Farming Fortune breakdown, Garden progression, crop-specific advice
- **Mining Planner** — HOTM tree optimizer, powder costs, commission unlocks
- **Dungeon Advisor** — floor gates, gear checks, class recommendations
- **Accessory Optimizer** — Magical Power analysis, missing talismans, reforge suggestions
- **Pet Analysis** — active pet checks, level targets, cost-to-upgrade estimates
- **Networth Estimator** — live Bazaar-priced gear, accessories, pets, and collections
- **Money-Making Analyzer** — ranked methods for your current stage (Pest farming, Crimson, Rift, etc.)
- **Item Tooltip Modal** — click any item to inspect lore, enchants, reforges, and stats
- **Game-Stage Filters** — Early / Mid / Late / Endgame recommendation modes

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Data | Hypixel API v2 + Mojang API |
| Item Data | NotEnoughUpdates (NEU) repository |
| Skin Rendering | Crafatar |

## Project Structure

```
SkyHub/
├── app/
│   ├── page.tsx                          # Landing page + player search
│   ├── layout.tsx                        # Global layout + nav
│   ├── player/[username]/
│   │   ├── page.tsx                      # Profile overview + recommendations
│   │   ├── skills/        farming/       # Skill planners
│   │   ├── mining/        fishing/
│   │   ├── foraging/      dungeons/
│   │   ├── slayer/        crimson/
│   │   ├── gear/          accessories/
│   │   ├── pets/          museum/
│   │   ├── networth/      money/
│   │   ├── collections/   bestiary/
│   │   ├── chocolate/     rift/
│   │   └── reforges/
│   └── api/player/[username]/            # Server-side API route
├── components/
│   ├── ItemIcon.tsx                      # Animated item sprite renderer
│   ├── ItemModal.tsx                     # Item tooltip modal
│   └── ClickableItemGrid.tsx
├── lib/
│   ├── hypixel/                          # API client, NBT parser, profile parser
│   ├── recommendations/                  # Recommendation engine (27+ checks)
│   ├── providers/skins/                  # Crafatar skin provider
│   ├── providers/textures/               # Item texture registry
│   ├── data/                             # XP tables, static game data
│   └── types/                            # TypeScript interfaces
└── data/neu/                             # NEU item data (items, enchants, pets, museum)
```

## Getting Started

**Requirements:** Node.js 18+, a [Hypixel API key](https://developer.hypixel.net)

```bash
git clone https://github.com/pogamer63-lgtm/SkyHub.git
cd SkyHub
npm install
cp .env.example .env   # then add your HYPIXEL_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

```env
HYPIXEL_API_KEY=your_hypixel_api_key_here
```

## What's Implemented

- [x] Farming Fortune calculator (Garden, pets, equipment, buffs, non-API sources)
- [x] HOTM node optimizer (powder costs, peak progression path)
- [x] Accessory upgrade tracker with live Bazaar pricing
- [x] Networth estimation
- [x] Mining, Dungeon, Slayer, Fishing, Foraging planners
- [x] Money-making opportunity analyzer
- [x] Recommendation engine with 27+ checks across all categories
- [x] Early / Mid / Late / Endgame game-stage filters
- [x] Item tooltip modal (lore, enchants, reforges, stats)
- [x] Item textures — local assets with sky.coflnet.com CDN fallback
- [x] Animated item sprite support (245+ items)

## Roadmap

- [ ] Profile snapshot history and progression tracking
- [ ] Redis caching layer for lower API latency
- [ ] Foraging Fortune equipment reforge detection (blocked on NBT API field)
- [ ] Garden Chip bonuses (no API field currently available)
