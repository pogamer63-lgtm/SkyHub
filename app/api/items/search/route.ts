import { NextRequest } from 'next/server';
import { ITEMS_INDEX } from '@/lib/neu/data';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.toLowerCase().trim() ?? '';
  if (q.length < 2) return Response.json([]);

  const results: Array<{ id: string; name: string; lore: string; category: string }> = [];

  for (const [id, entry] of Object.entries(ITEMS_INDEX)) {
    if (id.toLowerCase().includes(q) || entry.name.toLowerCase().includes(q)) {
      results.push({ id, name: entry.name, lore: entry.lore, category: entry.category });
      if (results.length >= 30) break;
    }
  }

  // Boost exact-name matches to top
  results.sort((a, b) => {
    const aExact = a.name.toLowerCase() === q ? -1 : a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bExact = b.name.toLowerCase() === q ? -1 : b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return aExact - bExact;
  });

  return Response.json(results.slice(0, 20));
}
