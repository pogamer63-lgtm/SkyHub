import { getRecentSearches } from '@/lib/db/snapshots';
import SearchForm from './search-form';

const FEATURES = [
  { icon: '🎯', title: 'Upgrade Advisor', desc: 'Ranked upgrade recommendations with cost, benefit, and ROI for your specific account state.' },
  { icon: '💰', title: 'Cost Optimizer', desc: 'Find the cheapest meaningful upgrades. Never waste coins on inefficient purchases.' },
  { icon: '⚡', title: 'Progression Planner', desc: 'Know exactly what to do next — from early game to endgame, step by step.' },
  { icon: '🌾', title: 'Farming Planner', desc: 'Optimize Farming Fortune sources, Garden upgrades, and crop-specific paths.' },
  { icon: '⛏️', title: 'Mining Planner', desc: 'HOTM tree optimization, powder allocation, and mining speed/fortune maximization.' },
  { icon: '⚔️', title: 'Dungeon Advisor', desc: 'Gear checks, floor progression gates, class advice, and catacombs milestone paths.' },
  { icon: '🛡️', title: 'Gear Analyzer', desc: 'Slot-by-slot armor and weapon analysis with tier ratings and upgrade cost estimates.' },
  { icon: '💎', title: 'Accessory Optimizer', desc: 'Missing accessories ranked by Magical Power per coin spent.' },
  { icon: '💵', title: 'Money Making', desc: 'Account-specific income methods ranked by unlocked potential and coins per hour.' },
  { icon: '🎣', title: 'Fishing Planner', desc: 'Trophy fish progress, rod tier recommendations, Fishing Fortune sources.' },
  { icon: '🐾', title: 'Pets Planner', desc: 'Best-in-slot pets per activity, XP leveling guide, tier breakdown.' },
  { icon: '📊', title: 'Skills Planner', desc: 'XP tracking per skill, leveling methods ranked by cost and XP/hour.' },
  { icon: '🤖', title: 'Collections & Minions', desc: 'Minion slot tracking, collection milestones, near-milestone alerts.' },
  { icon: '💎', title: 'Networth Estimate', desc: 'Detailed breakdown: coins, pets, gear, powder, and fairy souls.' },
  { icon: '⚔️', title: 'Slayer Planner', desc: 'All 6 bosses tracked with XP, level progress, and recommended next tier.' },
  { icon: '🏛', title: 'Museum Tracker', desc: 'Track donated items, museum value milestones, and Magical Power earned from the museum.' },
  { icon: '📖', title: 'Bestiary', desc: 'Mob kill tracking, milestone level progress per family, completion percentage.' },
];

const STATS = [
  { value: '22', label: 'Routes & Pages' },
  { value: '14+', label: 'Planner Categories' },
  { value: '15', label: 'Recommendation Rules' },
  { value: 'Live', label: 'Bazaar & AH Prices' },
];

export default async function HomePage() {
  // Fetch recent searches (falls back to [] if DB unavailable)
  const recentRows = await getRecentSearches(6);
  const recentNames = recentRows.map(r => r.username);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm text-indigo-300">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
          Hypixel SkyBlock Progression Advisor
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="gradient-text">SkyHub</span>
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 max-w-2xl mb-4">
          Stop guessing what to upgrade next.
        </p>
        <p className="text-base text-slate-500 max-w-xl mb-12">
          SkyHub analyzes your Hypixel SkyBlock profile and tells you exactly
          what upgrades give the best return — sorted by cost, speed, and impact.
        </p>

        <SearchForm recentSearches={recentNames} />
      </section>

      {/* Stats bar */}
      <section className="border-t border-white/5 px-4 py-8 bg-slate-900/30">
        <div className="mx-auto max-w-3xl">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {STATS.map(s => (
              <div key={s.label}>
                <div className="text-2xl font-bold text-indigo-300">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-white/5 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-300 mb-2">More than a stat viewer</h2>
          <p className="text-center text-sm text-slate-500 mb-12">Every page is built around one question: <em>what should I do next?</em></p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title + f.desc} className="card p-5 hover:border-white/20 transition-colors">
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 px-4 py-12 text-center">
        <p className="text-slate-400 text-sm mb-4">Ready to optimize your SkyBlock progression?</p>
        <a href="#search" className="inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-medium text-white transition-colors">
          Analyze Your Profile →
        </a>
      </section>
    </div>
  );
}
