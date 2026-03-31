'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm({ recentSearches }: { recentSearches: string[] }) {
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
    <div className="w-full max-w-md">
      <form onSubmit={handleSearch}>
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

      {/* Quick-fill examples / recent searches */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {recentSearches.length > 0 ? (
          <>
            <span className="text-xs text-slate-600 self-center">Recent:</span>
            {recentSearches.map(name => (
              <button
                key={name}
                onClick={() => { setQuery(name); router.push(`/player/${name}`); }}
                className="text-xs text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-full px-3 py-1 transition-colors"
              >
                {name}
              </button>
            ))}
          </>
        ) : (
          <p className="text-xs text-slate-600">
            Example:{' '}
            <button onClick={() => setQuery('Hypixel')} className="text-slate-400 hover:text-white underline underline-offset-2">
              Hypixel
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
