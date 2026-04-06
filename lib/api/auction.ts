/**
 * Hypixel Auction House — lowest BIN price fetcher.
 * Fetches all pages. Cached for 10 minutes.
 * No API key required.
 */

const AH_URL = 'https://api.hypixel.net/v2/skyblock/auctions';
const CONCURRENCY = 15;

interface RawAuction {
  item_name: string;
  bin: boolean;
  starting_bid: number;
}

interface AHPage {
  success: boolean;
  page: number;
  totalPages: number;
  totalAuctions: number;
  auctions: RawAuction[];
}

export interface AHPrices {
  /** Map of item name (lowercase, alphanumeric) → lowest BIN price */
  byName: Record<string, number>;
  /** Timestamp of last update */
  updatedAt: number;
  /** How many pages were scanned */
  pagesScanned: number;
}

const _cache: { data: AHPrices | null; expiresAt: number } = { data: null, expiresAt: 0 };

async function fetchPage(page: number): Promise<AHPage | null> {
  return fetch(`${AH_URL}?page=${page}`, { cache: 'no-store' })
    .then(r => r.ok ? r.json() as Promise<AHPage> : null)
    .catch(() => null);
}

async function fetchAllPages(): Promise<AHPage[]> {
  // Fetch page 0 first to learn totalPages
  const page0 = await fetchPage(0);
  if (!page0?.success) return page0 ? [page0] : [];

  const { totalPages } = page0;
  if (totalPages <= 1) return [page0];

  // Build URLs for remaining pages
  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 1);
  const results: (AHPage | null)[] = new Array(remaining.length).fill(null);
  let idx = 0;

  async function worker() {
    while (idx < remaining.length) {
      const i = idx++;
      results[i] = await fetchPage(remaining[i]);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  return [page0, ...results.filter((p): p is AHPage => p !== null)];
}

export async function getAHPrices(): Promise<AHPrices> {
  if (_cache.data && Date.now() < _cache.expiresAt) return _cache.data;

  const byName: Record<string, number> = {};
  let pagesScanned = 0;

  try {
    const pages = await fetchAllPages();

    for (const page of pages) {
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
    // Return empty on total failure
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
