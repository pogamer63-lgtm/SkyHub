/**
 * Hypixel Auction House — lowest BIN price fetcher.
 * Fetches page 0 only. Cached for 10 minutes.
 * For a full BIN scan you'd need all pages (~60+), which is too heavy.
 * This gives a reasonable approximation for common items.
 */

const AH_URL = 'https://api.hypixel.net/v2/skyblock/auctions';

interface RawAuction {
  item_name: string;
  bin: boolean;
  starting_bid: number;
  item_bytes?: string;
  category?: string;
  tier?: string;
}

interface AHPage {
  success: boolean;
  page: number;
  totalPages: number;
  totalAuctions: number;
  auctions: RawAuction[];
}

export interface AHPrices {
  /** Map of item name (lowercase) → lowest BIN price */
  byName: Record<string, number>;
  /** Timestamp of last update */
  updatedAt: number;
  /** How many pages were scanned */
  pagesScanned: number;
}

const _cache: { data: AHPrices | null; expiresAt: number } = { data: null, expiresAt: 0 };

export async function getAHPrices(pages = 3): Promise<AHPrices> {
  if (_cache.data && Date.now() < _cache.expiresAt) return _cache.data;

  const byName: Record<string, number> = {};
  let pagesScanned = 0;

  try {
    // Fetch first N pages to get a sample of BIN listings
    const fetches = Array.from({ length: pages }, (_, i) =>
      fetch(`${AH_URL}?page=${i}`, { next: { revalidate: 600 } })
        .then(r => r.ok ? r.json() as Promise<AHPage> : null)
        .catch(() => null)
    );

    const results = await Promise.all(fetches);

    for (const page of results) {
      if (!page?.success) continue;
      pagesScanned++;

      for (const auction of page.auctions) {
        if (!auction.bin) continue;
        const key = auction.item_name.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
        const existing = byName[key];
        if (!existing || auction.starting_bid < existing) {
          byName[key] = auction.starting_bid;
        }
      }
    }
  } catch {
    // Return empty on network failure
  }

  const data: AHPrices = { byName, updatedAt: Date.now(), pagesScanned };
  _cache.data = data;
  _cache.expiresAt = Date.now() + 10 * 60 * 1000;
  return data;
}

/** Lookup AH price by item name (case-insensitive, approximate) */
export function getAHPrice(prices: AHPrices, itemName: string): number | null {
  const key = itemName.toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  return prices.byName[key] ?? null;
}
