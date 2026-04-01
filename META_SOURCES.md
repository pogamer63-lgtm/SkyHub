# SkyHub — Meta Research Sources

**Last refreshed:** 2026-04-01
**Researcher:** Claude Sonnet 4.6 (automated web research)

---

## Sources Consulted

| # | Source | URL / Description | Date Accessed | Reliability |
|---|--------|-------------------|---------------|-------------|
| 1 | Hypixel SkyBlock Wiki (Fandom) | wiki.hypixel.net — Garden, Museum, Dungeons, Slayers | 2026-04-01 | High |
| 2 | Hypixel SkyBlock Patch Notes | hypixel.net/threads/skyblock-patch-notes | 2026-04-01 | Authoritative |
| 3 | SkyCrypt (player stats site) | sky.shiiyu.moe | 2026-04-01 | High (live data) |
| 4 | Hypixel Forums — Meta threads | hypixel.net/forums/skyblock | 2026-04-01 | Medium |
| 5 | SkyBlock community Discord | Various search results | 2026-04-01 | Medium |
| 6 | YouTube — SkyBlock guides (last 5 months) | Multiple creators | 2026-04-01 | Medium |
| 7 | Hypixel SkyBlock Wiki — Museum page | wiki.hypixel.net/Museum | 2026-04-01 | High |
| 8 | Hypixel SkyBlock Wiki — Magical Power | wiki.hypixel.net/Magical_Power | 2026-04-01 | High |
| 9 | Hypixel SkyBlock Wiki — Garden | wiki.hypixel.net/Garden | 2026-04-01 | High |
| 10 | Hypixel SkyBlock Wiki — Helianthus Armor | wiki.hypixel.net/Helianthus_Armor | 2026-04-01 | High |
| 11 | Hypixel SkyBlock Wiki — Catacombs | wiki.hypixel.net/Catacombs | 2026-04-01 | High |
| 12 | Hypixel SkyBlock Wiki — Pets | wiki.hypixel.net/Pets | 2026-04-01 | High |
| 13 | Patch 0.20.7 changelog | Museum overhaul announcement | 2026-04-01 | Authoritative |

---

## Key Findings by Category

### Garden / Farming
- Garden unlocks at **SkyBlock Level 5** (NOT Level 12 as previously coded)
- Helianthus Armor added December 2025 — new farming BIS above Fermento, requires Farming 50
- Mooshroom Cow Pet is BIS for farming coin/FF multiplier (replaces Elephant as top pick)
- Hedgehog Pet is best for pest control / pest-related fortune
- Elephant Pet remains strong but no longer the clear BIS

### Museum (CRITICAL — system overhauled in patch 0.20.7)
- OLD system: Donated items → Magical Power tiers (completely removed)
- NEW system: 30 milestones based on total donated item value
  - Each milestone grants: +1% Bits Multiplier + +2% Bank Interest Rate
  - Max bonuses: +30% Bits Multiplier, +60% Bank Interest Rate
- Museum no longer contributes to Magical Power AT ALL
- Museum value is shown in the API as `special` and `items` categories
- Armor sets count as complete sets for milestone progression

### Dungeons
- Critical path: F1 → F3 → **F5** → F6 → F7 → M1 → M3 → M5 → M6 → M7
- F5 is critical: unlocks Shadow Assassin armor (major power spike)
- HOTM max tier: **10** (confirmed)
- Shadow Assassin Armor: currently best pre-Necron armor for most classes
- Class XP is separate from Catacombs XP — each class levels independently

### Slayers
- Revenant Horror (Zombie): Level **4** to equip Revenant armor, Level **5** to craft chestplate
- Tarantula Broodfather (Spider): Level 4 unlocks Tarantula armor
- Sven Packmaster (Wolf): Level 4 unlocks Werewolf set
- Voidgloom Seraph (Enderman): Level 3+ unlocks various Ender armor bonuses
- Inferno Demonlord (Blaze): Level 4 unlocks Magma Lord armor pieces

### Magical Power / Accessories
- MP scaling is **logarithmic**, no hard breakpoints
- Common Power Stone reference thresholds used by community: 250 / 500 / 750 / 1000
- Hegemony Artifact: doubles the bonus of selected Power (requires Power selected)
- NOT having a Power selected is a critical blocker if MP ≥ 50
- Powers unlock at specific MP thresholds (not simple tier gates)

### Armor Progression (current meta, 2026)
Early → Mid:
1. Glacite Armor or Ender Armor (early-mid)
2. Strong Dragon Armor (mid)
3. Shadow Assassin Armor (post-F5)
4. Necron's Armor / Wither Armor sets (late)
5. Kuudra Infernal Armor (endgame, replaces Necron for non-dungeon content)

OLD path in code (Zombie Soldier → Hardened Diamond → Perfect → Superior Dragon → Necron) is outdated.

### BIS Pets (current meta)
| Category | BIS Pet | Notes |
|----------|---------|-------|
| Farming (general) | Mooshroom Cow (LEGENDARY) | Best FF + coin multiplier |
| Farming (pests) | Hedgehog (LEGENDARY) | Pest-focused fortune |
| Mining (general) | Scatha (LEGENDARY) | Best overall mining |
| Mining (Glacite) | Glacite Golem (LEGENDARY) | Glacite Tunnels specific |
| Combat (general) | Golden Dragon (LEGENDARY, Lv200) | Best DPS pet |
| Dungeons | Black Cat (LEGENDARY) | S+ rank speed boost |
| Fishing | Ammonite (LEGENDARY) | Best fishing pet |
| Alchemy | Rabbit (LEGENDARY) | Brew time reduction |

---

## Confidence Levels

- **High**: Information from official wiki or patch notes, consistent across sources
- **Medium**: From community sources, consistent but not officially documented
- **Low/Uncertain**: From single source, community claims, or rapidly changing meta

See DISPUTED_FACTS.md for areas of uncertainty.
