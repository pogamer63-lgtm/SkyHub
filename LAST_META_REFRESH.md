# SkyHub — Meta Refresh Log

Each entry documents a research pass over current SkyBlock meta.
Before modifying game-logic rules, check if a refresh is needed (> 30 days since last).

---

## 2026-04-01 — Initial Meta Audit

**Researcher**: Claude Sonnet 4.6 (automated)
**Trigger**: User identified potential logic errors in recommendation engine
**Sources**: 13 sources (see META_SOURCES.md)
**SkyBlock version at time of research**: ~0.21.x (post Helianthus Dec 2025 update)

### Changes Required (found during audit)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `lib/recommendations/engine.ts` | Garden unlock at SB Level 12 | Change to Level 5 |
| 2 | `lib/recommendations/engine.ts` | "Level 5 unlocks Revenant armor" | Level 4 wear / Level 5 craft |
| 3 | `lib/recommendations/engine.ts` | MP thresholds 200/400 | No hard breakpoints; reference 250/500/750/1000 |
| 4 | `lib/recommendations/engine.ts` | Dungeon path missing F5 | Add F5 as critical milestone |
| 5 | `app/player/[username]/museum/page.tsx` | Shows museum as MP source | Complete rewrite — 30 milestones, Bits/Interest rewards |
| 6 | `app/player/[username]/gear/page.tsx` | Outdated armor path | Update to current meta path |
| 7 | `app/player/[username]/pets/page.tsx` | BIS pets outdated | Update to current meta |

### Status
- [x] Documentation files created (META_SOURCES.md, UPGRADE_RULES.json, DISPUTED_FACTS.md, LAST_META_REFRESH.md)
- [x] engine.ts fixes: Garden Level 5, Revenant armor wording, MP thresholds (250/500/750), F5 dungeon milestone, checkMuseumValue corrected
- [x] museum/page.tsx rewrite: removed MP-from-museum, added 30-milestone Bits/Bank system
- [ ] gear/page.tsx armor path update (deferred — descriptions reference general stages, not specific sets)
- [ ] pets/page.tsx BIS pets update (deferred)
- [x] CONTINUE.md updated
- [ ] Committed

---

## 2026-04-01 — Pass 2: Deep Web Research

**Researcher**: Claude Sonnet 4.6 (automated)
**Trigger**: Scheduled second pass; NotebookLM session expired so direct web research used instead
**Sources**: 26 sources total (13 new added this pass — see META_SOURCES.md)
**SkyBlock version at time of research**: ~0.24.2 (post-Hub Revamp, post-Greenhouse, post-Foraging Update Part I)

### New Topics Researched This Pass

| Topic | Findings | Confidence |
|-------|----------|-----------|
| 2025 Major Updates | Backwater Bayou, Foraging Update (Part I), Greenhouse — all confirmed | High |
| 2026 Patch Notes (Feb + Mar) | Garden void-respawn nerf, crop growth bug fix, Swappable Pet Items | High |
| Dungeon Class Meta | Berserker early → Archer/Mage late; transition tied to weapon acquisition | High |
| Equipment Accessories (slots) | Bone Necklace → Rift Necklace; Adaptive Belt; SA Cloak; Soul Weaver Gloves | High |
| Armor Progression (all skills) | Combat/Farming/Mining/Fishing paths all documented | High |
| Vampire Slayer | Confirmed 6th slayer; Rift-only; T5 most profitable; Erythrocyte currency | High |
| Mining Glacite Tunnels | HOTM 7 req; Yog/Divan armor; Titanium drill; powder amounts documented | High |
| Money-Making Methods | Full ranked table with coins/hr, investment, stage documented | High |
| Farming Fortune Formula | Confirmed formula; key enchantments Dedication/Pesterminator/Green Thumb | High |
| Beginner Mistakes | 8 common mistakes with fixes documented | High |
| Level Gates | Mining 5/12, SkyBlock 5/7, Combat 12 all confirmed | High |
| Helianthus Armor Stats | 150 FF from set; exact drop conditions confirmed | High |
| Best Crops | Mushroom for XP; Wheat/Melon for coins | Medium |

### Changes Required (found during Pass 2 audit)

| # | File | Issue | Fix |
|---|------|-------|-----|
| 1 | `UPGRADE_RULES.json` | Missing dungeon class meta | Added `dungeon_class_meta` section |
| 2 | `UPGRADE_RULES.json` | Missing equipment accessory slots | Added `equipment_accessories` section |
| 3 | `UPGRADE_RULES.json` | Armor progression incomplete (non-combat) | Added farming/mining/fishing paths |
| 4 | `UPGRADE_RULES.json` | Missing Vampire slayer | Added to slayers section |
| 5 | `UPGRADE_RULES.json` | Mining Glacite Tunnels undocumented | Added full `mining` section |
| 6 | `UPGRADE_RULES.json` | Farming Fortune formula missing | Added `farming_fortune` section |
| 7 | `UPGRADE_RULES.json` | Level gates incomplete | Added `level_gates` section |
| 8 | `UPGRADE_RULES.json` | Money-making methods missing | Added `money_making` section |
| 9 | `UPGRADE_RULES.json` | Beginner mistakes not documented | Added `beginner_mistakes` section |
| 10 | `DISPUTED_FACTS.md` | New disputed facts not recorded | Added items 11–16 |
| 11 | `META_SOURCES.md` | 13 new sources not recorded | Added sources 14–26 |

### Status (Pass 2)
- [x] META_SOURCES.md: Pass 2 sources (14–26) + full findings section appended
- [x] UPGRADE_RULES.json: All new sections added (v1.1)
- [x] DISPUTED_FACTS.md: New disputes (11–16) + new resolved items added
- [x] LAST_META_REFRESH.md: Pass 2 entry added
- [ ] Code files: gear/page.tsx, pets/page.tsx updates still deferred from Pass 1
- [ ] Committed

---

---

## 2026-04-01 — Pass 3: NotebookLM Deep Research (10 Fandom Wiki Sources)

**Researcher**: Claude Sonnet 4.6 (automated, via NotebookLM skill)
**Trigger**: Scheduled Pass 3; NotebookLM auth working this session
**NotebookLM Notebook ID**: b810fa1e-4ec3-45e4-88b4-732bae2472c8
**Sources**: 10 Fandom wiki sources (Hunting, Foraging, Bazaar, Vampire Slayer, Greenhouse, Heart of the Mountain, Backwater Bayou, Slayer, Pet Items; Hypixel Forums patch notes failed — login wall)
**SkyBlock version at time of research**: ~0.24.2 (post-Swappable Pet Items 0.24.1, post-Greenhouse, post-Foraging Update Part I)

### New Topics Researched This Pass

| Topic | Findings | Confidence |
|-------|----------|-----------|
| Hunting skill | New Main Skill; Level 25 cap; 5 hunting methods; XP from shard rarity | High |
| Foraging Update Part I | Level cap 50→54; Galatea + Moonglade Marsh; Fig/Mangrove logs; Moonglade reforge | High |
| Bazaar unlock level | **Definitively Level 7** (resolves Pass 2 dispute #11) | High |
| Vampire Slayer T5 | T5 confirmed; RNG Meter system documented; Erythrocyte coins = disputed/unverified | Medium |
| Greenhouse mutations | Sunflower/Moonflower/Wild Rose confirmed; Soggybud/Bambloom = NOT in wiki | High |
| HOTM T10 nodes | 7 nodes documented; requires 1,247,000 XP; Gemstone Infusion, Sheer Force + 5 passives | High |
| Slayer order CORRECTION | **Zombie → Spider → Wolf → Enderman → Blaze** (Spider before Wolf per wiki unlock chain) | High |
| Swappable Pet Items 0.24.1 | Full fee table; Super Scrubber; 5 rarity changes documented | High |
| Money-making 2026 | Qualitative ranking via wiki synthesis; no specific coins/hr from wiki sources | Medium |
| Backwater Bayou | Junk Fishing + Junker Joel confirmed; armor progression confirmed | Medium |

### Changes Made This Pass

| # | File | Change |
|---|------|--------|
| 1 | `UPGRADE_RULES.json` | Version bumped to 1.2 |
| 2 | `UPGRADE_RULES.json` | `slayers.recommended_order` corrected: Zombie→Spider→Wolf→Enderman→Blaze (was Wolf before Spider) |
| 3 | `UPGRADE_RULES.json` | Added `hunting_skill` section |
| 4 | `UPGRADE_RULES.json` | Added `foraging_update` section |
| 5 | `UPGRADE_RULES.json` | Added `greenhouse_mutations` section |
| 6 | `UPGRADE_RULES.json` | Added `hotm_t10_nodes` section |
| 7 | `UPGRADE_RULES.json` | Added `vampire_slayer_mechanics` section |
| 8 | `UPGRADE_RULES.json` | Added `swappable_pet_items` section |
| 9 | `UPGRADE_RULES.json` | Added `backwater_bayou` section |
| 10 | `UPGRADE_RULES.json` | Added `money_making_2026` section |
| 11 | `META_SOURCES.md` | 9 new sources added (27–35); Pass 3 findings section added |
| 12 | `DISPUTED_FACTS.md` | 5 new disputes added (17–21); 8 new resolved facts added |
| 13 | `notebooklm_pass3_raw.md` | Full raw Q&A output written |

### Status (Pass 3)
- [x] notebooklm_pass3_raw.md: All 9 Q&A answers written
- [x] META_SOURCES.md: Sources 27–35 added; Pass 3 findings section added
- [x] UPGRADE_RULES.json: All new sections added (v1.2); slayer order corrected
- [x] DISPUTED_FACTS.md: New disputes (17–21) + new resolved items added
- [x] LAST_META_REFRESH.md: Pass 3 entry added
- [ ] Code files: gear/page.tsx, pets/page.tsx — updates still deferred
- [ ] Committed

---

## 2026-04-01 — Pass 4B: NotebookLM — Economy & Content (Garden, Farming, Fishing, Foraging, Kuudra, Rift, Money-making, Reforges, Enchants, Minions, Fairy Souls)

**Researcher**: Claude Sonnet 4.6 (automated, via NotebookLM pass4 script)
**Trigger**: Continuation of Pass 4 research; Core Systems notebook sources still pending
**Sources used**: Notebook B (Economy & Content) — 10 Fandom wiki pages added as text sources
**Output file**: `research_pass4_economy.md`

### New Topics Researched This Pass

| Topic | Findings | Confidence |
|-------|----------|-----------|
| Garden system full | 15 levels (NOT 20), Copper/Visitor system, pests, plots, crop upgrades | High |
| Farming Fortune formula | Every 100 FF = +100% drops; sources: enchants, pets, tools, Jacob perks, Bestiary | High |
| Jacob's Contests | Medal tiers Bronze→Diamond; Unique Golds track; perks: Turbowheat/Extra Plots etc. | High |
| Fishing system | Sea creature types, trophy fishing, Backwater Bayou, fishing fortune sources | High |
| Foraging + Hunting skill | Level 50→54, Galatea, Hunting Level 25 cap, 5 hunting methods | High |
| Kuudra full | 5 tiers (Basic→Infernal), Aurora→Molten armor, Mage/Barbarian factions, Crimson Essence | High |
| Rift access | **SkyBlock Level 12 via Wizard Portal** (not Timecharm); Motes currency; Vampire Slayer | High |
| Money-making 2026 | Full ranked table: Ghost Farming, Kuudra T5, Dungeons, Bazaar flipping, farming crops | High |
| Reforges best | Combat: Renowned/Forceful; Farming: Blessed; Mining: Refined; Accessories: Silky/Lucky/Itchy | High |
| Enchantments | Sword: Sharpness 7, Smite 7, Critical 6, Telekinesis; Armor: Protection 7, Growth 7, etc. | High |
| Minions best | Clay, Lapis, Mushroom, Sugar Cane for passive income; Diamond + Super Compactor meta | High |
| Fairy Souls | **267 total; stat bonuses REMOVED September 2022** — now SkyBlock XP + Backpack slots only | High |

### Critical Corrections Found This Pass

| # | Correction | File Fixed |
|---|-----------|-----------|
| 1 | Garden max level is 15, NOT 20 | `lib/hypixel/parser.ts` — gardenTable truncated |
| 2 | Fairy Souls DO NOT give stat bonuses (removed Sept 2022) | `lib/recommendations/engine.ts` — description fixed |
| 3 | Rift accessed via SkyBlock Level 12 Wizard Portal, NOT Timecharm | `UPGRADE_RULES.json` — rift_access section added |
| 4 | Accessories cannot be reforged (Crimson Isle era change) | `UPGRADE_RULES.json` — noted in equipment_accessories section |

### Status (Pass 4B)
- [x] research_pass4_economy.md: Full Q&A output saved (610+ lines)
- [x] lib/hypixel/parser.ts: gardenTable corrected to 16 entries (max level 15)
- [x] lib/recommendations/engine.ts: Fairy Souls description corrected
- [x] UPGRADE_RULES.json: fairy_souls + rift_access sections added; garden.levels.max = 15; version → 1.3
- [x] DISPUTED_FACTS.md: 4 new resolved facts added (garden 15 levels, fairy souls, rift access, no reforges)
- [ ] Part A (Core Systems) notebook still needs sources — pending (Fandom URL failures require add_text approach)
- [ ] Committed

---

## 2026-04-01 — Pass 4C: Wiki Direct Verification (wiki_content.md cross-check)

**Researcher**: Claude Sonnet 4.6 (automated)
**Trigger**: Pass 4A NotebookLM rate-limited (all 12 Q&A failed); used wiki_content.md + research_pass4_economy.md directly
**Sources**: wiki_content.md (15 wiki pages fetched 2026-04-01), research_pass4_economy.md (NotebookLM Part B answers)
**SkyBlock version**: ~0.24.2 (post-Foraging Update Part I June 2025)

### New Topics Verified This Pass

| Topic | Finding | Confidence |
|-------|---------|-----------|
| Skill bonus descriptions | Fishing gives HP (not FF); Mining gives Mining Fortune + Defense (not Speed/Fishing Fortune) | High |
| Foraging bonuses | Foraging gives Foraging Fortune + Strength (not "Farming upgrade paths") | High |
| Hunting skill max level | **Level 25** confirmed (wiki); Hunting is a Main Skill added in Foraging Update | High |
| Crop upgrades | **9 tiers** (Tier I–IX), not 10; each tier = **+5 FF** per crop (not +1) | High |
| Jacob FF perk | **15 tiers** max (not 4), +4 FF each = **+60 FF** total (wiki: "up to +60 with 15 tiers") | High |
| Garden plots FF | **+3 FF per plot** (wiki), 24 plots max = +72 FF — distinct from garden levels | High |
| Elephant pet FF | **+1.5 per level** = **+150 at level 100** (code had ×0.3 = only 30 at level 100) | High |
| Mooshroom Cow FF | **+1 per level + 10** = **+110 at level 100** (now added to pet detection code) | High |
| HOTM XP table | Verified: `[0, 3000, 12000, 37000, 97000, 197000, 347000, 557000, 847000, 1247000]` — matches wiki ✓ | High |
| MP rarity values | Common 3, Uncommon 5, Rare 8, Epic 12, Legendary 16, Mythic 22 — matches code ✓ | High |
| Kuudra tiers/rep | Basic 0 → Hot 1000 → Burning 3000 → Fiery 7000 → Infernal 12000 — matches code ✓ | High |

### Critical Corrections Found This Pass

| # | Correction | File Fixed |
|---|-----------|-----------|
| 1 | Fishing skill bonus wrong: "+4 Fishing Fortune per level" | `skills/page.tsx` — changed to "+4 HP per level" |
| 2 | Mining skill bonus wrong: "+0.5 Fishing Fortune per level" | `skills/page.tsx` — changed to "+4 Mining Fortune per level, +1 Defense per level" |
| 3 | Foraging skill bonus wrong: "Farming upgrade paths unlock" | `skills/page.tsx` — changed to "+4 Foraging Fortune per level, +Strength per level" |
| 4 | Hunting skill missing from type + parser + skills page | `lib/types/player.ts`, `lib/hypixel/parser.ts`, `skills/page.tsx` — Hunting added |
| 5 | Crop upgrades: max 10 levels, +1 FF/level | `farming/page.tsx` — corrected to max 9 tiers, +5 FF per tier (up to +45) |
| 6 | Jacob FF perk max = 4 levels | `farming/page.tsx` — corrected to 15 levels (+60 FF max) |
| 7 | Garden Level FF: used gardenLevel×4 (wrong concept) | `farming/page.tsx` — replaced with plot FF: plots×3 per wiki |
| 8 | Elephant pet: ×0.3 multiplier (gives +30 at level 100) | `farming/page.tsx` — fixed to ×1.5 (+150 at level 100, wiki-confirmed) |
| 9 | Mooshroom Cow missing from pet FF detection | `farming/page.tsx` — added: +1/level+10 = +110 max |

### Status (Pass 4C)
- [x] lib/types/player.ts: `hunting`, `hunting_xp` fields added to SkillLevels
- [x] lib/hypixel/parser.ts: Hunting skill parsed from `SKILL_HUNTING` API key
- [x] app/player/[username]/skills/page.tsx: 3 skill bonus descriptions corrected + Hunting added
- [x] app/player/[username]/farming/page.tsx: Crop upgrades, Jacob perk, garden plots, pet FF all corrected
- [x] LAST_META_REFRESH.md: Pass 4C entry added
- [x] UPGRADE_RULES.json: farming_fortune section updated with correct FF sources, pet values, perk max levels
- [x] Committed (c4c7556)

---

## Next Scheduled Refresh

**Recommended**: Within 30 days, or after any major SkyBlock patch announcement
**Focus areas for Pass 4**:
- Foraging Update Part II (Galatea island) — announced but not yet released as of Pass 3
- New Slayers announced for 2026 (if any)
- Erythrocyte coins verification (disputed in Pass 3 — needs in-game check)
- Soggybud / Bambloom as Greenhouse mutations — needs verification
- Hunting skill deeper meta (best methods, profitability of attribute shards)
- Bazaar Flipper perk mechanics (when to upgrade)
- Ghost Farming Fishing 26 requirement — still unverified mechanism
