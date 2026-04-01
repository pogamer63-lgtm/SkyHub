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

## Next Scheduled Refresh

**Recommended**: Within 30 days, or after any major SkyBlock patch announcement
**Focus areas**: Kuudra meta (endgame armor), Garden/farming updates, new dungeon floors
