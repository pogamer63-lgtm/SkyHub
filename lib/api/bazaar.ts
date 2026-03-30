/**
 * Hypixel Bazaar price fetcher.
 * No API key required. Cached for 5 minutes.
 */

const BAZAAR_URL = 'https://api.hypixel.net/v2/skyblock/bazaar';

// Module-level cache — persists across requests, TTL-based
const _cache: { data: BazaarPrices | null; expiresAt: number } = { data: null, expiresAt: 0 };

export interface BazaarProduct {
  /** Insta-buy price (what sellers want) */
  sellPrice: number;
  /** Insta-sell price (what buyers offer) */
  buyPrice: number;
  sellVolume: number;
  buyVolume: number;
}

export type BazaarPrices = Record<string, BazaarProduct>;

interface RawProduct {
  quick_status: {
    sellPrice: number;
    sellVolume: number;
    buyPrice: number;
    buyVolume: number;
  };
}

export async function getBazaarPrices(): Promise<BazaarPrices> {
  if (_cache.data && Date.now() < _cache.expiresAt) return _cache.data;

  const res = await fetch(BAZAAR_URL, { next: { revalidate: 300 } });
  if (!res.ok) throw new Error(`Bazaar API error: ${res.status} ${res.statusText}`);

  const json = (await res.json()) as { success: boolean; products: Record<string, RawProduct> };
  if (!json.success) throw new Error('Bazaar API returned success: false');

  const prices: BazaarPrices = {};
  for (const [id, product] of Object.entries(json.products)) {
    const qs = product.quick_status;
    prices[id] = {
      sellPrice: qs.sellPrice,
      buyPrice: qs.buyPrice,
      sellVolume: qs.sellVolume,
      buyVolume: qs.buyVolume,
    };
  }

  _cache.data = prices;
  _cache.expiresAt = Date.now() + 5 * 60 * 1000;
  return prices;
}

/** Get the insta-buy price for an item (what it costs to buy immediately) */
export function getBazaarBuyPrice(prices: BazaarPrices, itemId: string): number {
  return prices[itemId]?.sellPrice ?? 0;
}

/** Get the insta-sell price for an item (what you receive selling immediately) */
export function getBazaarSellPrice(prices: BazaarPrices, itemId: string): number {
  return prices[itemId]?.buyPrice ?? 0;
}
