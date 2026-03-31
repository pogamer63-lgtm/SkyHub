/**
 * Dynamic accessory data from the Hypixel SkyBlock Items API.
 * Fetches all ACCESSORY-category items and maps them to our internal format.
 * No API key required.
 *
 * Used to supplement the curated lib/data/accessories.ts with full game coverage.
 */

import { ItemRarity } from '@/lib/hypixel/nbt';
import { MP_PER_RARITY } from '@/lib/hypixel/nbt';

const API_URL = 'https://api.hypixel.net/v2/resources/skyblock/items';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RawSkyBlockItem {
  id: string;
  name: string;
  tier?: string;
  category?: string;
  museum?: boolean;
  npc_sell_price?: number;
}

interface APIAccessory {
  id: string;
  name: string;
  rarity: ItemRarity;
  mp: number;
}

// Module-level cache
let cachedItems: APIAccessory[] | null = null;
let cacheExpiry = 0;

function normalizeRarity(tier: string | undefined): ItemRarity {
  const t = (tier ?? 'COMMON').toUpperCase();
  const valid: ItemRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'DIVINE', 'SPECIAL', 'VERY_SPECIAL'];
  return valid.includes(t as ItemRarity) ? (t as ItemRarity) : 'COMMON';
}

/**
 * Fetch all accessories from the Hypixel Items API.
 * Cached for 1 hour in memory.
 */
export async function getAllAPIAccessories(): Promise<APIAccessory[]> {
  const now = Date.now();
  if (cachedItems && now < cacheExpiry) return cachedItems;

  try {
    const res = await fetch(API_URL, { next: { revalidate: 3600 } });
    if (!res.ok) return [];

    const data = await res.json() as { success: boolean; items?: RawSkyBlockItem[] };
    if (!data.success || !data.items) return [];

    const accessories = data.items
      .filter(item => item.category === 'ACCESSORY')
      .map(item => {
        const rarity = normalizeRarity(item.tier);
        return {
          id: item.id,
          name: item.name,
          rarity,
          mp: MP_PER_RARITY[rarity] ?? 3,
        };
      });

    cachedItems = accessories;
    cacheExpiry = now + CACHE_TTL_MS;
    return accessories;
  } catch {
    return [];
  }
}

/**
 * Get accessories from API that are not in the curated list.
 * Useful for showing the full picture on the accessories page.
 */
export async function getUncuratedAccessories(
  curatedIds: Set<string>,
): Promise<APIAccessory[]> {
  const all = await getAllAPIAccessories();
  return all.filter(a => !curatedIds.has(a.id));
}
