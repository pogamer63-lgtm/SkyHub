'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm({ recentSearches }: { recentSearches: string[] }) {
  const router = useRouter();
  const [query, setQuery]     = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    setLoading(true);
    setError('');
    try {
      const res  = await fetch(`/api/player/search?q=${encodeURIComponent(trimmed)}`);
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
          {/* Search icon */}
          <div className="absolute left-4 pointer-events-none" style={{ color: 'var(--text-faint)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
          </div>

          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Minecraft username…"
            autoComplete="off"
            style={{
              background: 'var(--bg-raised)',
              border: '1px solid var(--border-light)',
              color: 'var(--foreground)',
            }}
            className="w-full rounded-lg py-3 pl-11 pr-32 text-sm outline-none transition-all
              focus:[border-color:var(--gold)] focus:[box-shadow:0_0_0_3px_rgba(240,180,41,0.12)]"
          />

          <button
            type="submit"
            disabled={loading || !query.trim()}
            style={{
              background: 'var(--gold)',
              color: '#0a0d16',
            }}
            className="absolute right-2 rounded-md px-4 py-1.5 text-sm font-semibold
              hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Loading
              </span>
            ) : 'Analyze'}
          </button>
        </div>

        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </form>

      {/* Recent / example searches */}
      <div className="mt-3 flex flex-wrap gap-2 items-center">
        {recentSearches.length > 0 ? (
          <>
            <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Recent:</span>
            {recentSearches.map(name => (
              <button
                key={name}
                onClick={() => { setQuery(name); router.push(`/player/${name}`); }}
                className="text-xs rounded px-2.5 py-1 transition-colors"
                style={{
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              >
                {name}
              </button>
            ))}
          </>
        ) : (
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            e.g.{' '}
            <button
              onClick={() => setQuery('Hypixel')}
              className="underline underline-offset-2 transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--foreground)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Hypixel
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
