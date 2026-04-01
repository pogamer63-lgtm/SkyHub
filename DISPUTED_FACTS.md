# SkyHub — Disputed / Uncertain Facts

**Last updated:** 2026-04-01

Facts listed here are uncertain, disputed across sources, or subject to rapid meta changes.
Before coding a rule around any item below, re-verify from an authoritative source.

---

## High Uncertainty

### 1. Exact Museum Milestone XP thresholds
- **Claim**: 30 milestones, thresholds unknown without live API testing
- **Status**: Milestone count is confirmed (30). Exact value thresholds per milestone are NOT confirmed.
- **Impact**: Museum page shows milestone progress, but breakpoints are approximate

### 2. Mooshroom Cow vs Elephant for farming
- **Claim**: Mooshroom Cow is now BIS for farming fortune
- **Counter**: Some guides still recommend Elephant for newer players
- **Status**: Mooshroom Cow appears to be BIS at max level for coin/fortune combo, but Elephant is simpler to acquire
- **Recommendation**: Present both; mark Mooshroom Cow as "current meta pick"

### 3. Kuudra Infernal Armor vs Necron for dungeons
- **Claim**: Kuudra Infernal has higher stats than Necron
- **Counter**: Necron retains value for its set bonuses and Wither Impact ability
- **Status**: Context-dependent — Kuudra for stats, Necron for dungeon bonuses
- **Recommendation**: Do not say one is strictly better; both are viable endgame sets

### 4. Power Stone scaling breakpoints
- **Claim**: Community reference points are 250/500/750/1000
- **Status**: Confirmed as community reference points, NOT hard mechanical breakpoints
- **Note**: Actual scaling is logarithmic — every point of MP has diminishing returns

### 5. Exact HOTM node costs (Tier 10 nodes)
- **Status**: HOTM Tier 10 existence is confirmed, but specific node trees at T10 may have changed
- **Recommendation**: Do not hardcode HOTM node costs in code; use wiki as source of truth

### 6. Helianthus Armor exact requirements
- **Claim**: Requires Farming Level 50
- **Status**: Confirmed in December 2025 patch notes; recipe and exact drop source verified
- **Confidence**: High

---

## Medium Uncertainty

### 7. Shadow Assassin as mid-tier armor
- **Status**: Widely confirmed as strong pre-Necron armor after F5
- **Potential issue**: May have been power-crept by newer armor sets added post-December 2025
- **Recommendation**: Keep as recommendation but note it may not be the only mid-tier option

### 8. Scatha as mining BIS
- **Status**: Scatha is well-established for general mining
- **Note**: Glacite Golem is preferred for Glacite Tunnel mining specifically (this is confirmed)
- **Confidence**: Medium-high

### 9. Ammonite as fishing BIS
- **Status**: Consistent across fishing guides
- **Note**: Some content may favor other pets for specific fishing scenarios (e.g., sea creature hunting vs trophy fishing)
- **Confidence**: Medium

### 10. Black Cat as dungeon BIS
- **Status**: Black Cat is S-rank speed-focused; other pets may be preferred by certain classes
- **Note**: Ender Dragon pet provides high damage; Myst remains viable for early dungeon
- **Confidence**: Medium (context-dependent)

---

## Resolved (was uncertain, now confirmed)

| Fact | Resolution |
|------|-----------|
| Garden unlock level | **Confirmed Level 5** (was coded as 12 — fixed) |
| Museum reward system | **Confirmed post-0.20.7 overhaul** — no longer gives MP |
| HOTM max tier | **Confirmed Tier 10** |
| Revenant armor wear vs craft level | **Level 4 wear, Level 5 craft** |
| F5 importance in dungeon path | **Confirmed critical** — Shadow Assassin unlock |
