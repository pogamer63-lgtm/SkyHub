'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/player/search?q=${encodeURIComponent(trimmed)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Player not found.');
        setLoading(false);
        return;
      }
      router.push(`/player/${data.username}`);
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

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
        <form onSubmit={handleSearch} className="w-full max-w-md">
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-500">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Enter Minecraft username..."
              className="w-full rounded-xl border border-white/10 bg-white/5 py-4 pl-12 pr-36 text-white placeholder-slate-500 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              autoComplete="off"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-5 py-2.5 text-sm font-medium text-white transition-colors"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Loading
                </span>
              ) : 'Analyze'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-red-400 text-left">{error}</p>}
        </form>
        <p className="mt-4 text-xs text-slate-600">
          Example:{' '}
          <button onClick={() => setQuery('Hypixel')} className="text-slate-400 hover:text-white underline underline-offset-2">Hypixel</button>
        </p>
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

const FEATURES = [
  { icon: '🎯', title: 'Upgrade Advisor', desc: 'Ranked upgrade recommendations with cost, benefit, and ROI for your specific account state.' },
  { icon: '💰', title: 'Cost Optimizer', desc: 'Find the cheapest meaningful upgrades. Never waste coins on inefficient purchases.' },
  { icon: '⚡', title: 'Progression Planner', desc: 'Know exactly what to do next — from early game to endgame, step by step.' },
  { icon: '🌾', title: 'Farming Planner', desc: 'Optimize Farming Fortune sources, Garden upgrades, and crop-specific paths.' },
  { icon: '⛏️', title: 'Mining Planner', desc: 'HOTM tree optimization, powder allocation, and mining speed/fortune maximization.' },
  { icon: '⚔️', title: 'Dungeon Advisor', desc: 'Gear checks, floor progression gates, class advice, and catacombs milestone paths.' },
];
