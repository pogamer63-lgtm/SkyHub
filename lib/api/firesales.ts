/**
 * Hypixel SkyBlock Fire Sales API.
 * No API key required. Cached for 5 minutes.
 */

const FIRESALES_URL = 'https://api.hypixel.net/v2/skyblock/firesales';

export interface FireSale {
  itemId: string;
  start: number;   // unix ms
  end: number;     // unix ms
  amount: number;  // total units available
  price: number;   // cost in gems
}

const _cache: { data: FireSale[]; expiresAt: number } = { data: [], expiresAt: 0 };

interface RawFireSale { item_id: string; start: number; end: number; amount: number; price: number }
interface RawResponse { success: boolean; sales?: RawFireSale[] }

export async function getFireSales(): Promise<FireSale[]> {
  if (_cache.data.length > 0 && Date.now() < _cache.expiresAt) return _cache.data;

  try {
    const res = await fetch(FIRESALES_URL, { cache: 'no-store' });
    if (!res.ok) return _cache.data;

    const json = await res.json() as RawResponse;
    if (!json.success) return _cache.data;

    const now = Date.now();
    const data: FireSale[] = (json.sales ?? [])
      .filter(s => s.end > now) // only active / upcoming
      .map(s => ({
        itemId: s.item_id,
        start: s.start,
        end: s.end,
        amount: s.amount,
        price: s.price,
      }));

    _cache.data = data;
    _cache.expiresAt = now + 5 * 60 * 1000;
    return data;
  } catch {
    return _cache.data;
  }
}

/** Returns true if a fire sale is currently active (started and not yet ended) */
export function isActive(sale: FireSale): boolean {
  const now = Date.now();
  return sale.start <= now && sale.end > now;
}

/** Format remaining time as "2h 15m" or "45m" */
export function formatTimeLeft(endMs: number): string {
  const left = Math.max(0, endMs - Date.now());
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
