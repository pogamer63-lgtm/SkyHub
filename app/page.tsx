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

      {/* Features */}
      <section className="border-t border-white/5 px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-semibold text-slate-300 mb-12">More than a stat viewer</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map(f => (
              <div key={f.title} className="card p-5 hover:border-white/20 transition-colors">
                <div className="mb-3 text-2xl">{f.icon}</div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
