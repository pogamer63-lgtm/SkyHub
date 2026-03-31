'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function CompareSearchForm({ defaultA, defaultB }: { defaultA: string; defaultB: string }) {
  const router = useRouter();
  const [a, setA] = useState(defaultA);
  const [b, setB] = useState(defaultB);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!a.trim() || !b.trim()) return;
    setLoading(true);
    router.push(`/compare?a=${encodeURIComponent(a.trim())}&b=${encodeURIComponent(b.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="card p-4">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
        <input
          type="text"
          value={a}
          onChange={e => setA(e.target.value)}
          placeholder="Player A username..."
          className="flex-1 rounded-lg border border-indigo-500/30 bg-indigo-500/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all text-sm"
        />
        <span className="text-slate-600 text-sm font-medium text-center hidden sm:block">vs</span>
        <input
          type="text"
          value={b}
          onChange={e => setB(e.target.value)}
          placeholder="Player B username..."
          className="flex-1 rounded-lg border border-purple-500/30 bg-purple-500/5 py-2.5 px-4 text-white placeholder-slate-500 outline-none focus:border-purple-500/60 focus:ring-1 focus:ring-purple-500/30 transition-all text-sm"
        />
        <button
          type="submit"
          disabled={loading || !a.trim() || !b.trim()}
          className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed px-6 py-2.5 text-sm font-medium text-white transition-colors shrink-0"
        >
          {loading ? 'Loading…' : 'Compare'}
        </button>
      </div>
    </form>
  );
}
