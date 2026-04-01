# SkyHub — Meta Research Sources

**Last refreshed:** 2026-04-01 (Pass 2 — NotebookLM session expired; direct web research used)
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
| 14 | Hypixel SkyBlock 2025 Recap thread | hypixel.net/threads/skyblock-2025-recap.6029835 | 2026-04-01 | High |
| 15 | Equipment Progression 2026 thread | hypixel.net/threads/equipment-progression-2026.6070704 | 2026-04-01 | High |
| 16 | March 4 2026 Patch Notes | hypixel.net/threads/march-4-skyblock-patch-notes.6070209 | 2026-04-01 | Authoritative |
| 17 | February 17 2026 Patch Notes | hypixel.net/threads/february-17-skyblock-patch-notes.6062397 | 2026-04-01 | Authoritative |
| 18 | Beginner Guide 2026 (Level 0–15) | hypixel.net/threads/updated-hypixel-skyblock-beginner-guide-2026.6054057 | 2026-04-01 | High |
| 19 | Money Making Methods guide | beginnersguidetoskyblock.org/money-making-methods | 2026-04-01 | Medium |
| 20 | CoflNet Money Making Guide 2025 | sky.coflnet.com/guides/money-making-methods | 2026-04-01 | Medium |
| 21 | Dungeon class by game stage thread | hypixel.net/threads/what-dungeon-class-to-choose-for-each-game-stage.5858449 | 2026-04-01 | Medium |
| 22 | Glacite Tunnels guide for new players | hypixel.net/threads/glacite-tunnels-guide-for-new-players.5850074 | 2026-04-01 | Medium |
| 23 | Best crops for garden 2026 thread | hypixel.net/threads/best-crops-for-garden.6058835 | 2026-04-01 | Medium |
| 24 | Helianthus Armor — Fandom wiki | hypixel-skyblock.fandom.com/wiki/Helianthus_Armor | 2026-04-01 | High |
| 25 | Vampire Slayer comprehensive guide | hypixel.net/threads/comprehensive-vampire-slayer-guide.5799801 | 2026-04-01 | Medium |
| 26 | Helianthus Armor changes thread | hypixel.net/threads/fermento-helianthus-armour-changes.6032821 | 2026-04-01 | High |

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

## Pass 2 Findings (2026-04-01 — Direct Web Research)

### 2025 Major Game Updates (from 2025 Recap)
Three major updates shipped in 2025:
1. **The Backwater Bayou** — first dedicated Fishing Island; introduced Treasure Chance stat, Ship system
2. **The Foraging Update (Part I)** — "largest update ever released"; complete Foraging skill rework; introduced Hunting as a new skill; first latest-Minecraft-version content
3. **The Greenhouse** — Garden expansion; new Farming progression pathways; reduced milestone costs; added Greenhouse mutations and new crop types (Moonflower, Sunflower, Wild Rose, Soggybud, Bambloom)

**2026 roadmap**: 1 update/month target, 4 major updates planned; game moving to latest-only Minecraft in early 2026; patch 0.24.2 added Hub Revamp + Year of the Witch content; 0.24.1 added Swappable Pet Items.

### Equipment / Armor Progression (2026 confirmed)
| Slot | Early | Mid | Late | Endgame |
|------|-------|-----|------|---------|
| Armor | Glacite / Ender | Strong Dragon | Shadow Assassin | Necron / Wither sets |
| Endgame alt | — | — | Magma Lord (head combo) | Kuudra Infernal (non-dungeon) |
| Farming | Lotus → Pesthunter → Fermento | → Helianthus (Farm 50) | — | — |
| Mining | Sorrow → Yog → Divan | — | — | Divan's full set |
| Fishing | Ichthyic → Finwave → Gilsplash | — | — | — |
| Foraging | Mangrove Equipment + Ancestral Cloak | — | — | — |

**Equipment accessories (confirmed current meta):**
- Necklace: Bone Necklace (fragged) → Rift Necklace
- Belt: Adaptive Belt (fragged) / Implosion Belt (mages)
- Cloak: Shadow Assassin Cloak (fragged) → Ancestral Cloak (foraging)
- Gloves: Soul Weaver Gloves

**Note:** Master-starred equipment is NOT cost-effective — described as "the very last upgrade possible" with minimal stat gain.

### Dungeon Class Meta (2025–2026 confirmed)
| Stage | Recommended Class | Key Weapon Trigger |
|-------|------------------|-------------------|
| Early game | Berserker | AotD + Strong Dragon |
| Mid game | Archer (slight edge) or Mage | Spirit Shortbow / Juju Bow |
| Late game | Archer (dominant, 49.2% community vote) | Terminator |
| Endgame | Archer or Mage | Terminator / Hyperion |

- **Transition rule**: "Play Berserker until you get Terminator (→ Archer) or Hyperion (→ Mage)"
- Tank: Situationally valuable on F7 (boss positioning), less critical at higher Catacombs levels
- Healer: Effectively obsolete at F6+; not needed in modern party compositions
- Mage: Requires very expensive gear to be competitive (Hyperion + Storm Armor minimum)

### Farming Meta (2025–2026 confirmed)
- **Best crops for XP**: Mushroom (best), Melon (secondary) — recommended until Farming 40
- **Best crops for coins**: Wheat or Melon — "should still be wheat or melon for max coins"
- **Helianthus Armor confirmed stats**: 150 FF total from armor pieces alone; requires Farming 50; drops from Moonflower/Sunflower/Wild Rose while wearing 2+ pieces of Fermento or Helianthus; also drops from any Greenhouse crop/mutation with Harvestable status
- **Greenhouse update** (Dec 2025 / early 2026): New mutation crops added; void respawn farming removed (Feb 2026 patch nerf); offline mutation grace period extended
- **Farming Fortune formula**: Every 100 FF = +100% drops. Leftover FF = % chance for one more drop. (e.g., 250 FF = 100% for 3x drops, 50% chance for 4x)
- **Key FF enchantments**: Dedication IV (+0.5 × garden milestone per crop), Pesterminator V (+5 FF/piece = +20 total), Green Thumb V (+0.25 × unique visitors per equipment piece; 84 visitors = +21/piece = +84 total)
- **Blossom equipment swapping**: Nets only 2–3% more coins/hour — community consensus is not worth the hassle

### Mining Meta (2025–2026 confirmed)
- **Glacite Tunnels access**: Requires HOTM 7 + Secret Railroad Pass (crafted: 1 Flawless Ruby + 2 Refined Mithril + 8 Corleonite, 30s forge time)
- **Minimum setup for Glacite Tunnels**: Titanium Drill DR-X555 or higher; Breaking Power 9 required
- **Recommended setup**: Yog or Divan armor (NOT Sorrow or Glacite armor — community strongly warns against them)
- **HOTM powder amounts** (from community):
  - Normal mining: ~8M Mithril, ~14M Gemstone powder
  - Full SkyBlock XP: ~12M Mithril, ~20M Gemstone, ~20M Glacite
  - Starting Mineshaft mining: 8M/14M/24M (Mithril/Gemstone/Glacite)
  - Maxing Glacite perks: ~34M Glacite powder
- **Key HOTM priority nodes**: Powder Buff (T7), Mole (T6), Explorer (T6); mining below HOTM 7 is "incredibly time consuming and inefficient"
- **Mineshaft mechanics**: Base 0.05% (1/2000) spawn chance; Suspicious Scrap drops at 0.5% (1/200) base, halves each find — community says Suspicious Scrap excavation "typically loses money"
- **Nobody mithril mines anymore** (confirmed) — only for powder; gemstone mining is the primary income method

### Slayer Order (2025–2026 confirmed, including Vampire)
6 slayers total: Zombie, Spider, Wolf, Enderman, Blaze, **Vampire** (added later)
Recommended order:
1. **Zombie (Revenant Horror)** — easiest, Wand of Healing (Zombie L1 + 16 Revenant Flesh) is critical early tool
2. **Wolf (Sven Packmaster)** — L2 gives Radiant Power Orb recipe
3. **Spider (Tarantula Broodfather)** — L4 unlocks Tarantula Armor
4. **Enderman (Voidgloom Seraph)** — harder, do after established
5. **Blaze (Inferno Demonlord)** — challenging, L4 for Magma Lord pieces
6. **Vampire (Riftstalker Bloodfiend)** — Rift only; T5 bosses most profitable; requires ping <40ms for T5; new Erythrocyte currency from Vambus NPC; "go big or go home" — T4 viable if T5 is too difficult

### Money-Making Methods (ranked, 2025–2026)
| Method | Coins/Hour | Investment | Stage | Notes |
|--------|-----------|------------|-------|-------|
| Gemstone Mining | 27–30M | 50M+ | Late/Endgame | Divan armor + drill required; "Pristine over Mining Fortune" |
| Ghost Farming | ~30M (theoretical) | 30M | Late | Soul Whip + Emerald Blade swap; needs Fishing 26 |
| Dungeons F5 | ~20M | — | Mid-Late | 2.5 min runs; most reliable cash floor |
| Frag Running | ~15M | 120M | Endgame | Needs Cata progression |
| Worm Fishing | ~14M | 1M | Mid-Late | Fishing 19+; Worm Membrane worth up to 100k each |
| Zealot Grinding | ~10M | 2M | Mid | Frozen Diamond armor + Eman pet + Zealuck 5 |
| Pest Farming | varies | low | Mid | Farming 40 required |
| Automaton Grinding | ~9M | 2M | Mid | Less competitive than Zealots; HOTM 3 needed |
| Bazaar Flipping | 10–50M* | 1M+ | All stages | Most capital-efficient for new players; scales infinitely |
| Farming (Netherwart) | ~4M | 5M | Early-Mid | Legendary Elephant pet + max T3 hoe |
| Rift (Berberis) | 10–20M | near zero | Early | "Get to 3rd area"; very accessible |
| Minions (passive) | 10–50M/day | 50M–500M | Mid-Late | Pumpkin minions flagged as bug-based |
| Spooky Fishing (event) | ~15M | 7M | Mid-Late | Seasonal event only |

**Progression pathway**: Farming/Fishing/Ice Walkers → Bazaar Flip with 1M capital → Zealots + Craft Flipping → Dungeons F5 + Gemstone Mining → Endgame Minions

### Common Beginner/Midgame Mistakes (2026 guide)
1. Not depositing coins — deaths drop purse coins (not bank coins)
2. Ignoring Magical Power progression — most beginners underestimate how important accessories are
3. Reforging addiction early — waste of coins before you have good accessories
4. Enchanting basic diamond armor — you'll replace it immediately
5. Not banking/organizing items early — storage system critical by mid-game
6. Island layout mistakes — don't bridge to extensions; use stone slabs on main island
7. Dragon summoning early — building economy around dragon RNG is a trap
8. Accepting random invites / scams
9. Not pushing Redstone Collection — unlocks accessory bag (core QoL)
10. Ignoring daily habits: Experimentation Table, Dwarven Mines commissions (bonus HOTM XP), Chocolate Factory, Community Center

**Key level gates (2026 confirmed):**
- Mining 5 → Deep Caverns
- Mining 12 → Dwarven Mines
- SkyBlock Level 7 → Bazaar (NOT level 5 as sometimes stated)
- Combat 12 → The End

---

## Confidence Levels

- **High**: Information from official wiki or patch notes, consistent across sources
- **Medium**: From community sources, consistent but not officially documented
- **Low/Uncertain**: From single source, community claims, or rapidly changing meta

See DISPUTED_FACTS.md for areas of uncertainty.
