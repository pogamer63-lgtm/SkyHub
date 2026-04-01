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

## Next Scheduled Refresh

**Recommended**: Within 30 days, or after any major SkyBlock patch announcement
**Focus areas for Pass 3**:
- Foraging Update Part II (Galatea island) — planned 2026 release
- New Slayers announced for 2026
- Backwater Bayou fishing armor meta (Ichthyic/Finwave/Gilsplash stats)
- Hunting skill (new skill added in Foraging Update Part I) — no data yet
- Bazaar unlock level (Level 5 vs 7) — verify in-game
- Ghost Farming Fishing 26 requirement — verify mechanism
