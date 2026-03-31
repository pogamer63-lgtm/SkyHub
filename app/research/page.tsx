import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data & Research — SkyHub',
  description: 'Understand how SkyHub recommendations are generated and where data comes from.',
};

// ─── Static data about sources, rules, limitations ────────────────────────────

const DATA_SOURCES = [
  {
    name: 'Hypixel SkyBlock API',
    url: 'api.hypixel.net/v2/skyblock/profiles',
    type: 'Official API',
    keyRequired: true,
    cacheTTL: '3 minutes',
    color: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
    badge: 'Live',
    provides: [
      'Skill XP for all 11 skills',
      'Slayer boss XP and kill counts',
      'Dungeon class levels + floor completions',
      'Pet collection (type, tier, level, XP)',
      'HOTM node levels and powder balances',
      'Garden level, Jacob perks, crop upgrades',
      'Inventory NBT (armor, equipment, talisman bag)',
      'Coin purse + co-op bank balance',
      'Fairy Souls collected',
      'Collection counts per item',
    ],
    limitations: [
      'Inventory NBT only available if player logged in recently',
      'API key required — rate limited to ~120 req/min',
      'Data can be 3–5 minutes stale',
    ],
  },
  {
    name: 'Hypixel Bazaar API',
    url: 'api.hypixel.net/v2/skyblock/bazaar',
    type: 'Official API',
    keyRequired: false,
    cacheTTL: '5 minutes',
    color: 'text-green-300 border-green-500/30 bg-green-500/5',
    badge: 'Live',
    provides: [
      'Real-time buy order prices for all Bazaar items',
      'Real-time sell offer prices for all Bazaar items',
      'Used in upgrade cost estimates throughout the app',
    ],
    limitations: [
      'Prices fluctuate — estimates are snapshots, not guarantees',
      'Does not include Auction House items',
    ],
  },
  {
    name: 'Hypixel Auction House API',
    url: 'api.hypixel.net/v2/skyblock/auctions',
    type: 'Official API',
    keyRequired: false,
    cacheTTL: '10 minutes',
    color: 'text-blue-300 border-blue-500/30 bg-blue-500/5',
    badge: 'Live',
    provides: [
      'Lowest BIN (Buy It Now) prices for auctioned items',
      'Used for accessories and gear not available on Bazaar',
    ],
    limitations: [
      'Only first 3 pages scanned (of ~60+) — ballpark only',
      'Auction prices are highly volatile',
      'Does not include bid auctions, only BIN listings',
    ],
  },
  {
    name: 'Mojang / Minecraft API',
    url: 'api.mojang.com / api.minecraftservices.com',
    type: 'Official API',
    keyRequired: false,
    cacheTTL: '60 minutes',
    color: 'text-orange-300 border-orange-500/30 bg-orange-500/5',
    badge: 'Live',
    provides: [
      'UUID lookup from username',
      'Username lookup from UUID',
    ],
    limitations: [
      'Username history not tracked',
      'Rate limited — UUID cached for 1hr',
    ],
  },
  {
    name: 'Crafatar (Skin/Avatar CDN)',
    url: 'crafatar.com',
    type: 'Community CDN',
    keyRequired: false,
    cacheTTL: 'CDN cached',
    color: 'text-purple-300 border-purple-500/30 bg-purple-500/5',
    badge: 'CDN',
    provides: [
      'Player head/avatar images',
      'Full body renders',
    ],
    limitations: [
      'Skin may lag behind player\'s current skin',
      'Third-party service — subject to availability',
    ],
  },
  {
    name: 'Hardcoded Game Data',
    url: 'Internal (lib/data/, lib/hypixel/parser.ts)',
    type: 'Static',
    keyRequired: false,
    cacheTTL: 'Build-time',
    color: 'text-slate-300 border-slate-500/30 bg-slate-500/5',
    badge: 'Static',
    provides: [
      'Skill XP tables (level 0–60)',
      'Dungeon catacombs XP table (level 0–50)',
      'HOTM node definitions (22 nodes, costs, benefits)',
      'Slayer XP breakpoints per boss',
      'Crop milestone thresholds (10 crops)',
      'Accessory database (~55 curated entries with upgrade chains)',
      'Armor set tier database (Starter → BiS)',
      'Weapon tier database',
      'Pet level XP table',
    ],
    limitations: [
      'Must be manually updated when Hypixel patches the game',
      'Accessory database is a curated subset — full game has 400+',
      'Armor/weapon costs are estimates based on community data',
    ],
  },
];

const RECOMMENDATION_RULES = [
  {
    id: 'skills_progression',
    name: 'Skills Progression',
    category: 'Skills',
    description: 'Checks skill average vs game stage. If average skill is below 30, recommends hitting Combat 15+ for access to dungeons and slayer. If any skill is below 20, flags it as an easy level to push.',
    signals: ['skill average', 'individual skill levels', 'game stage'],
    confidence: 85,
  },
  {
    id: 'magical_power',
    name: 'Magical Power / Accessories',
    category: 'Accessories',
    description: 'Evaluates current MP against key milestones (200, 300, 400, 500, 600, 700). Identifies missing accessories with the best MP-per-coin ratio from the curated accessory database.',
    signals: ['accessories.magicalPower', 'ownedIds (from NBT)', 'Bazaar prices'],
    confidence: 80,
  },
  {
    id: 'dungeon_progression',
    name: 'Dungeon Progression',
    category: 'Dungeons',
    description: 'Checks highest floor completed. Recommends the next floor if the player meets the minimum catacombs level. Flags if the player has not entered dungeons yet.',
    signals: ['dungeons.catacombs.level', 'dungeons.catacombs.highestFloor', 'game stage'],
    confidence: 90,
  },
  {
    id: 'slayer_progression',
    name: 'Slayer Progression',
    category: 'Slayer',
    description: 'Checks each slayer boss level. Recommends pushing to the next tier when it becomes cost-effective. Uses real Revenant Flesh Bazaar price for zombie slayer cost estimates.',
    signals: ['slayers.zombie/spider/wolf/enderman/blaze/vampire XP', 'Bazaar flesh price'],
    confidence: 75,
  },
  {
    id: 'fairy_souls',
    name: 'Fairy Souls',
    category: 'General',
    description: 'Flags if the player has fewer than 100 fairy souls collected. Each 5 fairy souls = +1 to all stats permanently. Cheap and often overlooked.',
    signals: ['fairySouls'],
    confidence: 95,
  },
  {
    id: 'hotm_progression',
    name: 'HOTM Progression',
    category: 'Mining',
    description: 'Checks if Mining Skill is high enough to warrant pushing HOTM levels. If HOTM is under level 4 and mining skill is 20+, recommends investing mithril powder.',
    signals: ['mining.hotmLevel', 'skills.mining'],
    confidence: 80,
  },
  {
    id: 'pet_check',
    name: 'Active Pet Check',
    category: 'General',
    description: 'Checks whether the player has an active pet. If no pet is active, this is a free stat boost being wasted.',
    signals: ['pets array, pets[].active'],
    confidence: 95,
  },
  {
    id: 'coins_check',
    name: 'Coin Reserve Check',
    category: 'General',
    description: 'If total coins (purse + bank) are below 50k, flags a low coin reserve and recommends basic income methods appropriate for the player\'s game stage.',
    signals: ['purseCoins', 'bankCoins', 'game stage'],
    confidence: 70,
  },
];

const SCORING_DIMENSIONS = [
  { name: 'ROI Score', range: '0–100', description: 'Benefit gained per coin spent. A cheap item that gives a lot is rated high. An expensive item with marginal gains is rated low.' },
  { name: 'Urgency Score', range: '0–100', description: 'How time-sensitive the upgrade is. Blockers (missing prerequisites) score very high. Passive improvements score lower.' },
  { name: 'Progression Score', range: '0–100', description: 'How much this upgrade advances overall game stage. An upgrade that unlocks a new progression path scores very high.' },
  { name: 'Confidence Score', range: '0–100', description: 'How certain the app is that this recommendation applies correctly to this player. Higher = more reliable recommendation.' },
  { name: 'Requirement Score', range: '0–100', description: 'How hard the prerequisites are to meet. 0 = no requirements, 100 = significant unlock needed first.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Data &amp; Research</h1>
        <p className="text-slate-400 max-w-2xl">
          SkyHub analyzes your SkyBlock profile using live API data combined with curated game knowledge.
          This page explains where data comes from, how recommendations are generated, and what the known limitations are.
        </p>
      </div>

      {/* Architecture overview */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-3">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          {[
            {
              step: '1',
              title: 'Fetch',
              desc: 'Your profile is fetched from the Hypixel API using your username → UUID lookup from Mojang.',
              icon: '📡',
            },
            {
              step: '2',
              title: 'Parse',
              desc: 'Raw API data is normalized into a typed PlayerProfile. Inventory NBT (base64-gzipped binary) is decoded to extract real item IDs, rarities, reforges, and enchantments.',
              icon: '🔧',
            },
            {
              step: '3',
              title: 'Analyze',
              desc: 'The recommendation engine runs 8+ rule modules against your profile, cross-referencing live Bazaar and AH prices, scoring each upgrade for ROI, urgency, and progression value.',
              icon: '🧠',
            },
          ].map(s => (
            <div key={s.step} className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-white font-medium mb-1">Step {s.step}: {s.title}</div>
              <div className="text-slate-400 text-xs leading-relaxed">{s.desc}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-slate-800/30 rounded-lg p-4 text-xs text-slate-400">
          <span className="text-slate-300 font-medium">Caching: </span>
          All external API responses are cached in memory server-side to avoid hammering rate limits.
          Profile data: 3 min · Bazaar: 5 min · Auction House: 10 min · UUID lookups: 60 min.
          Cache is per-process (in-memory) and resets on server restart.
        </div>
      </div>

      {/* Data Sources */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Data Sources</h2>
        <div className="space-y-4">
          {DATA_SOURCES.map(src => (
            <div key={src.name} className={`card p-5 border ${src.color}`}>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-white">{src.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${src.color}`}>{src.badge}</span>
                    {src.keyRequired && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">API Key</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">{src.url}</div>
                </div>
                <div className="text-right shrink-0 text-xs text-slate-400">
                  Cache: <span className="text-slate-300">{src.cacheTTL}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 font-medium mb-1">Provides</div>
                  <ul className="space-y-0.5">
                    {src.provides.map((p, i) => (
                      <li key={i} className="text-slate-300 flex gap-1.5">
                        <span className="text-green-500 shrink-0">✓</span>{p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-slate-400 font-medium mb-1">Limitations</div>
                  <ul className="space-y-0.5">
                    {src.limitations.map((l, i) => (
                      <li key={i} className="text-slate-400 flex gap-1.5">
                        <span className="text-yellow-500/70 shrink-0">⚠</span>{l}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation Rules */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-1">Recommendation Rules</h2>
        <p className="text-slate-400 text-sm mb-4">
          The recommendation engine runs these rule modules for every profile load. Each rule can emit zero or more recommendations.
        </p>
        <div className="space-y-3">
          {RECOMMENDATION_RULES.map(rule => (
            <div key={rule.id} className="card p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium text-sm">{rule.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">{rule.category}</span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed mb-2">{rule.description}</p>
                  <div className="text-xs text-slate-500">
                    Signals: <span className="text-slate-400">{rule.signals.join(', ')}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-xs text-slate-500 mb-0.5">Confidence</div>
                  <div className={`text-sm font-bold ${rule.confidence >= 85 ? 'text-green-400' : rule.confidence >= 70 ? 'text-yellow-400' : 'text-orange-400'}`}>
                    {rule.confidence}%
                  </div>
                  <div className="w-16 h-1.5 bg-slate-700 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${rule.confidence >= 85 ? 'bg-green-500' : rule.confidence >= 70 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                      style={{ width: `${rule.confidence}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scoring */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Scoring Dimensions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCORING_DIMENSIONS.map(d => (
            <div key={d.name} className="card p-4">
              <div className="flex justify-between items-start mb-1">
                <span className="text-white font-medium text-sm">{d.name}</span>
                <span className="text-xs text-slate-500 font-mono">{d.range}</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{d.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Known Limitations */}
      <div className="card p-6 border border-yellow-500/20 bg-yellow-500/5">
        <h2 className="text-lg font-semibold text-white mb-3">Known Limitations</h2>
        <ul className="space-y-2 text-sm">
          {[
            { issue: 'Inventory NBT gating', detail: 'Armor, equipment, and talisman bag contents only parse if the player has logged into Hypixel recently. The API returns no NBT data for inactive accounts.' },
            { issue: 'AH price accuracy', detail: 'Only the first 3 of ~60+ auction pages are scanned. Prices are ballpark estimates. Very rare items may show inaccurate costs.' },
            { issue: 'Farming Fortune equipment', detail: 'Equipment reforge bonuses (Lotus, Fermento, etc.) require equipment NBT to calculate. These are currently shown as [NBT] placeholders.' },
            { issue: 'Accessory coverage', detail: 'The curated accessory database contains ~55 entries. The full game has 400+. Missing accessories from the database won\'t appear as upgrade suggestions.' },
            { issue: 'Income estimates', detail: 'Coins/hr estimates on the Money Making page assume active, optimized gameplay. Real results vary based on gear, pet, skill, and market conditions.' },
            { issue: 'Static game data', detail: 'HOTM nodes, crop milestones, and XP tables are hardcoded from the current game patch. They must be manually updated when Hypixel patches the game.' },
          ].map((l, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-yellow-400 shrink-0 mt-0.5">⚠</span>
              <div>
                <span className="text-yellow-200 font-medium">{l.issue}: </span>
                <span className="text-slate-400">{l.detail}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Footer note */}
      <div className="text-center text-xs text-slate-600 pb-4">
        SkyHub is not affiliated with Hypixel Inc. or Mojang AB.
        All game data belongs to their respective owners.
        Recommendation quality improves over time as more game data is integrated.
      </div>
    </div>
  );
}
