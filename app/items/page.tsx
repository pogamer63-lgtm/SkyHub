import { Metadata } from 'next';
import { Suspense } from 'react';
import { ITEMS_INDEX } from '@/lib/neu/data';
import ItemSearchClient from './item-search-client';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export const metadata: Metadata = { title: 'SkyHub — Item Database' };

function serverSearch(q: string) {
  if (q.length < 2) return [];
  const results: Array<{ id: string; name: string; lore: string[]; category: string }> = [];
  for (const [id, entry] of Object.entries(ITEMS_INDEX)) {
    if (id.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q)) {
      results.push({ id, name: entry.name, lore: entry.lore, category: entry.category });
      if (results.length >= 20) break;
    }
  }
  return results;
}

export default async function ItemsPage({ searchParams }: Props) {
  const { q = '' } = await searchParams;
  const initial = serverSearch(q.toLowerCase().trim());
  const total = Object.keys(ITEMS_INDEX).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Item Database</h1>
        <p className="text-sm text-slate-500 mt-1">{total.toLocaleString()} SkyBlock items from NEU-REPO</p>
      </div>

      <Suspense>
        <ItemSearchClient initial={initial} />
      </Suspense>
    </div>
  );
}
