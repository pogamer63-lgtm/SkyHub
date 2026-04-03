'use client';

import { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface ItemResult {
  id: string;
  name: string;
  lore: string;
  category: string;
}

const CATEGORY_COLOR: Record<string, string> = {
  SWORD: 'text-red-300 bg-red-500/10',
  BOW: 'text-orange-300 bg-orange-500/10',
  HELMET: 'text-blue-300 bg-blue-500/10',
  CHESTPLATE: 'text-blue-300 bg-blue-500/10',
  LEGGINGS: 'text-blue-300 bg-blue-500/10',
  BOOTS: 'text-blue-300 bg-blue-500/10',
  ACCESSORY: 'text-purple-300 bg-purple-500/10',
  FISHING_ROD: 'text-cyan-300 bg-cyan-500/10',
  DRILL: 'text-yellow-300 bg-yellow-500/10',
  PICKAXE: 'text-slate-300 bg-slate-500/10',
  COSMETIC: 'text-pink-300 bg-pink-500/10',
  PET: 'text-emerald-300 bg-emerald-500/10',
};

export default function ItemSearchClient({ initial }: { initial: ItemResult[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [results, setResults] = useState<ItemResult[]>(initial);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/items/search?q=${encodeURIComponent(q)}`);
      setResults(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    router.replace(`/items?q=${encodeURIComponent(val)}`, { scroll: false });
    search(val);
  }

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder="Search items by name or ID…"
          autoFocus
          className="w-full rounded-lg bg-slate-800 border border-white/10 text-white py-3 pl-11 pr-4 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
        />
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <svg className="animate-spin h-4 w-4 text-slate-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map(item => (
            <div key={item.id} className="card p-3 hover:border-white/20 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{item.name}</div>
                  <div className="text-xs text-slate-500 font-mono truncate mt-0.5">{item.id}</div>
                  {item.lore && (
                    <div className="text-xs text-slate-400 mt-1 line-clamp-2">{item.lore}</div>
                  )}
                </div>
                {item.category && (
                  <span className={`shrink-0 text-xs rounded px-1.5 py-0.5 font-medium ${CATEGORY_COLOR[item.category] ?? 'text-slate-400 bg-slate-500/10'}`}>
                    {item.category.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {query.length >= 2 && !loading && results.length === 0 && (
        <div className="text-center py-12 text-slate-500 text-sm">
          No items found for &quot;{query}&quot;
        </div>
      )}

      {query.length < 2 && (
        <div className="text-center py-12 text-slate-600 text-sm">
          Type at least 2 characters to search 8,059 SkyBlock items
        </div>
      )}
    </div>
  );
}
