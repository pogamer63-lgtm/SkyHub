# SkyHub — Hypixel SkyBlock Progression Advisor

SkyHub is a production-ready web application that acts as your personal Hypixel SkyBlock coach. It analyzes your profile, evaluates your progression, and tells you exactly what to upgrade next — ranked by cost efficiency, progression value, and ROI.

> **Not affiliated with Hypixel Inc. or Mojang AB.**

## Features

- 🎯 **Upgrade Advisor** — ranked recommendations with cost, benefit, ROI, urgency scores
- 💰 **Cost Optimizer** — cheapest meaningful upgrades for your account stage
- ⚡ **Progression Planner** — early/mid/late/endgame tailored next steps
- 🌾 **Farming Planner** — Garden, Farming Fortune, crop upgrades
- ⛏️ **Mining Planner** — HOTM tree, powder, mining gear progression
- ⚔️ **Dungeon Advisor** — floor gates, gear checks, class advice
- 🧿 **Accessory Optimizer** — Magical Power, missing talismans, reforges
- 🐾 **Pet Analysis** — active pet checks, level recommendations

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| API | Hypixel API v2 + Mojang API |
| Skin Rendering | Crafatar (open-source, Mojang-compliant) |

## Project Structure

```
SkyHub/
├── app/
│   ├── page.tsx                    # Landing page + search
│   ├── layout.tsx                  # Global layout + nav
│   ├── player/[username]/page.tsx  # Player profile page
│   └── api/player/                 # API routes
├── lib/
│   ├── hypixel/                    # API client + data parser
│   ├── recommendations/            # Recommendation engine
│   ├── providers/skins/            # Crafatar skin provider
│   ├── providers/textures/         # Item texture registry
│   ├── types/                      # TypeScript types
│   └── utils/                      # Helpers
└── data/rules/                     # Recommendation rules
```

## Prerequisites

- Node.js 18+ (no Python venv needed)
- Hypixel API key: https://developer.hypixel.net

## Local Setup (Windows)

```bash
git clone https://github.com/pogamer63-lgtm/SkyHub.git
cd SkyHub
npm install
copy .env.example .env
# Edit .env and add HYPIXEL_API_KEY=your_key_here
npm run dev
```

Open http://localhost:3000

## Environment Variables

```env
HYPIXEL_API_KEY=your_hypixel_api_key_here
NEXT_PUBLIC_APP_NAME=SkyHub
```

**Never commit `.env` — it is in `.gitignore`.**

## Production Build

```bash
npm run build
npm start
```

## Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t skyhub .
docker run -p 3000:3000 -e HYPIXEL_API_KEY=yourkey skyhub
```

## Self-Hosting (Nginx + PM2)

```bash
# On server
git clone https://github.com/pogamer63-lgtm/SkyHub.git /opt/skyhub
cd /opt/skyhub && npm ci
echo "HYPIXEL_API_KEY=your_key" > .env
npm run build
npm install -g pm2
pm2 start npm --name skyhub -- start
pm2 save && pm2 startup
```

Nginx config:
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
    }
}
```

## GitHub Workflow

```bash
git add .
git commit -m "feat: description"
git push origin main
```

## Asset Notes

- **Skins**: Crafatar (open-source Mojang proxy). NameMC used for profile links only.
- **Item Textures**: Style reference is FurfSky Reborn (furfsky.net). Assets are NOT redistributed. Fallback to mc-heads.net public renders.
- **No Python venv**: Project is Node.js-first. No virtual environment needed.

## API Rate Limits

Hypixel: 300 req/min — SkyHub caches all responses (5min TTL). Mojang: UUID lookups cached 1hr.

## What's Implemented

- [x] Farming Fortune calculator (Garden, pets, equipment, buffs, no-API sources)
- [x] HOTM node optimizer (powder costs, commission unlocks, peak progression)
- [x] Accessory upgrade tracker with live Bazaar prices
- [x] Networth estimation
- [x] Mining, Dungeon, Slayer, Fishing, Foraging planners
- [x] Money-making opportunity analyzer (Pest farming, Crimson, Rift, etc.)
- [x] Recommendation engine with 27+ checks across all categories
- [x] Early/Mid/Late/Endgame game-stage filters on recommendations
- [x] Item tooltip modal with lore, enchants, reforges
- [x] Item textures (FurfSky-compatible local assets + sky.coflnet.com CDN fallback)
- [x] Animated item sprite support (245 items with mcmeta animation data)

## Roadmap

- [ ] PostgreSQL persistence (profile snapshots, history tracking)
- [ ] Redis caching layer (reduce API calls, improve cold-start perf)
- [ ] Foraging Fortune: Equipment reforge detection (requires NBT from API)
- [ ] Garden Chip bonuses (Crop Shot, Vermin Vaporizer) — no API field currently
- [ ] Accessory count fix (NBT fallback working; parser.ts:521 TODO remains)
