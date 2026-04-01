# SkyHub — Disputed / Uncertain Facts

**Last updated:** 2026-04-01 (Pass 4B)

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

---

## New Disputes Identified (Pass 2 — 2026-04-01)

### 11. Bazaar unlock level — Level 5 vs Level 7
- **Claim A**: SkyBlock Level 5 unlocks the Bazaar (some older sources)
- **Claim B**: SkyBlock Level 7 unlocks the Bazaar (2026 beginner guide explicitly states this)
- **Note**: The code currently has Garden at Level 5 (correct). Bazaar may be at Level 7 — verify before coding any Bazaar-gate logic.
- **Status**: Unresolved — verify in-game or against current API
- **Impact**: recommendation engine Bazaar-related advice

### 12. Ghost Farming profitability (30M/hour)
- **Claim**: Ghost farming yields ~30M/hour with Soul Whip + Emerald Blade swap
- **Counter**: Requires specific setup and Fishing 26; highly ping/RNG dependent
- **Status**: Listed as "theoretical" in source material — treat as ceiling not floor
- **Confidence**: Low-medium

### 13. Pumpkin Minion money-making viability
- **Claim**: Pumpkin Minions generate passive income
- **Counter**: Community flagged this as "based on a bug" — may be patched at any time
- **Status**: Do NOT build recommendation logic around this; mark as unreliable
- **Confidence**: Low

### 14. Foraging Update impact on meta
- **Claim**: Foraging Update (Part I, 2025) was "largest update ever released" and introduced Hunting skill
- **Status**: Confirmed shipped, but the full meta impact (new gear, new Hunting skill integration with other skills) is not fully documented in current research
- **Recommendation**: When implementing foraging/hunting features, re-research this topic
- **Confidence**: Low (topic not yet researched in depth)

### 15. Ghost Farming Fishing 26 requirement
- **Claim**: Ghost Farming requires Fishing 26
- **Status**: Appears in one source only; mechanism unclear (possibly for a specific area unlock)
- **Confidence**: Low — verify before implementing

### 16. Backwater Bayou fishing meta
- **Claim**: Backwater Bayou is a new fishing island with its own gear progression (Ichthyic → Finwave → Gilsplash)
- **Status**: Shipping confirmed (2025 major update) but the specific armor tier list is from a single 2026 equipment thread
- **Confidence**: Medium — armor names confirmed but order/relative power may have changed

---

---

## New Disputes and Corrections (Pass 3 — 2026-04-01)

### 17. Slayer order: Zombie → Wolf → Spider vs Zombie → Spider → Wolf
- **Pass 2 community guides said**: Zombie → Wolf → Spider → Enderman → Blaze
- **Wiki unlock requirements say**: Zombie T2 unlocks Spider; Spider T2 unlocks Wolf (NOT the other way)
- **Correct order per wiki**: Zombie → Spider → Wolf → Enderman → Blaze
- **Status**: CORRECTED — wiki is authoritative for unlock requirements; community guides may have been describing an efficiency order (not the unlock order), but the unlock chain is definitive
- **Impact**: UPGRADE_RULES.json `recommended_order` array needs correction

### 18. Erythrocyte coins — do they exist?
- **Claim (Pass 2)**: "New Erythrocyte currency from Vambus NPC"
- **NotebookLM wiki research**: No mention of "Erythrocyte coins" in Vampire Slayer wiki page; the currency for Vampire Slayer is Motes (to start quests)
- **Status**: Unresolved — may be community slang, a future update reference, or misinformation from the Pass 2 community forum
- **Impact**: Do not implement Erythrocyte coin logic until verified in-game or from patch notes

### 19. Vampire Slayer "ping requirement" for T5
- **Claim (Pass 2)**: T5 requires ping <40ms
- **Wiki research**: Ping mechanic not documented in wiki; likely refers to the "critical attack" mechanic (stand still = get hit)
- **Status**: Unresolved — ping sensitivity is a real community concern for Vampire Slayer but not officially documented
- **Impact**: Low — this is gameplay advice, not data we'd code into the engine

### 20. Bambloom and Soggybud crops
- **Claim (Pass 2)**: Listed as new Greenhouse crop types alongside Moonflower/Sunflower/Wild Rose
- **Wiki research**: Soggybud not in Greenhouse wiki; Bambloom only appears as "Bambloom Shard" in Bazaar
- **Status**: Partially confirmed — Sunflower, Moonflower, Wild Rose confirmed mutations; Soggybud/Bambloom may be from a different area or future update
- **Impact**: Don't code Soggybud/Bambloom as Greenhouse mutations without further verification

### 21. Hunting skill max level — Level 25 vs higher cap
- **Wiki**: Leveling rewards table goes up to Level XXV (25). No explicit statement of max level beyond this.
- **Status**: Level 25 appears to be the current cap, but could expand in future updates
- **Confidence**: Medium — table ends at 25, no "true max" statement found

---

## Resolved (was uncertain, now confirmed)

| Fact | Resolution |
|------|-----------|
| Garden unlock level | **Confirmed Level 5** (was coded as 12 — fixed) |
| Museum reward system | **Confirmed post-0.20.7 overhaul** — no longer gives MP |
| HOTM max tier | **Confirmed Tier 10** |
| Revenant armor wear vs craft level | **Level 4 wear, Level 5 craft** |
| F5 importance in dungeon path | **Confirmed critical** — Shadow Assassin unlock |
| Vampire Slayer existence | **Confirmed** — 6th slayer; Rift-only; max tier 5; Erythrocyte currency |
| Helianthus Armor stats | **Confirmed** — 150 FF total, requires Farming 50, drops from Moonflower/Sunflower/Wild Rose and Greenhouse Harvestable crops |
| Dungeon class transition rule | **Confirmed** — Berserker early, transition on weapon acquisition (Terminator → Archer, Hyperion → Mage) |
| Healer class viability | **Confirmed obsolete** at F6+ — modern party compositions don't use Healer |
| Farming Fortune formula | **Confirmed** — every 100 FF = +100% drops; leftover FF = fractional chance |
| Glacite armor in Glacite Tunnels | **Confirmed BAD** — community strongly warns against it; use Yog or Divan |
| Suspicious Scrap excavation profitability | **Confirmed loses money** on average |
| Nobody mithril mines for income | **Confirmed** — only for powder grind |
| Bazaar unlock level (Pass 3) | **Confirmed Level 7** — Bazaar wiki page explicitly states SkyBlock Level 7 |
| Slayer order correction (Pass 3) | **Confirmed Zombie → Spider → Wolf → Enderman → Blaze** per wiki unlock chain (not Wolf before Spider as some community guides state) |
| Swappable Pet Items fee structure (Pass 3) | **Confirmed** — tiered fee by rarity of new item applied; Super Scrubber removes without replacing |
| HOTM T10 node list (Pass 3) | **Confirmed** — 7 nodes at T10: Gemstone Infusion + Sheer Force (active, 120s CD), Mining Master, Crystalline, Gifts from the Departed, Dead Man's Chest, Vanguard Seeker (passive); requires 1,247,000 HotM XP |
| Greenhouse confirmed mutation crops (Pass 3) | **Confirmed** — Sunflower, Moonflower, Wild Rose are documented mutations with 256x yield, 15 growth cycles; Soggybud/Bambloom NOT found in Greenhouse wiki |
| Hunting skill max level (Pass 3) | **Confirmed Level 25** — leveling rewards table ends at Level XXV |
| Vampire Slayer RNG Meter (Pass 3) | **Confirmed** — unlocks at T3, fills via T3-T5 boss XP, guarantees selected rare item once full |
| Garden max level (Pass 4B) | **Confirmed Level 15** — wiki table ends at Level 15; code had 20 levels, now corrected in parser.ts |
| Fairy Souls stat bonuses (Pass 4B) | **Confirmed REMOVED September 2022** — now give SkyBlock XP (+10/exchange of 5) + Backpack slot unlocks only; engine.ts description corrected |
| Rift access method (Pass 4B) | **Confirmed SkyBlock Level 12 via Wizard Portal** — NOT via Timecharm as previously assumed; Timecharm is an in-Rift mechanic |
| Accessories reforging (Pass 4B) | **Confirmed REMOVED** since Crimson Isle update — accessories now use Accessory Powers system instead of reforges |
