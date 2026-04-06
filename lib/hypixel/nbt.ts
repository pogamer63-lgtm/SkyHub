/**
 * NBT parser for Hypixel SkyBlock inventory data.
 * Server-side only — uses Node.js Buffer and zlib.
 * Never import this in client components.
 */

import { parse as nbtParse } from 'prismarine-nbt';

export interface ParsedItem {
  id: string;           // SkyBlock item ID e.g. "MANA_BAND"
  count: number;
  name: string;
  rarity: ItemRarity;
  lore: string[];       // raw lore lines with §-color codes preserved
  reforge?: string;     // e.g. "lucky"
  enchantments: Record<string, number>;
  petInfo?: { type: string; tier: string };
}

export type ItemRarity =
  | 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC'
  | 'LEGENDARY' | 'MYTHIC' | 'DIVINE' | 'SPECIAL'
  | 'VERY_SPECIAL' | 'UNKNOWN';

const COLOR_RARITY: Record<string, ItemRarity> = {
  '§f': 'COMMON',
  '§a': 'UNCOMMON',
  '§9': 'RARE',
  '§5': 'EPIC',
  '§6': 'LEGENDARY',
  '§d': 'MYTHIC',
  '§b': 'DIVINE',
  '§c': 'SPECIAL',
};

const RARITY_KEYWORDS: ItemRarity[] = [
  'VERY_SPECIAL', 'MYTHIC', 'LEGENDARY', 'DIVINE',
  'SPECIAL', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON',
];

function stripColor(text: string): string {
  return text.replace(/§[0-9a-fklmnorx]/gi, '');
}

function extractRarity(lore: string[]): ItemRarity {
  // Try to parse from the last lore line (e.g. "§6LEGENDARY ACCESSORY")
  for (let i = lore.length - 1; i >= 0; i--) {
    const raw = lore[i];
    // Color code at start tells us rarity
    const colorCode = raw.slice(0, 2);
    const text = stripColor(raw).toUpperCase();
    for (const rarity of RARITY_KEYWORDS) {
      if (text.startsWith(rarity)) {
        return rarity;
      }
    }
    if (COLOR_RARITY[colorCode] && text.length > 0) {
      for (const rarity of RARITY_KEYWORDS) {
        if (text.includes(rarity)) return rarity;
      }
    }
  }
  return 'UNKNOWN';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function readNBTValue(node: any): unknown {
  if (node == null) return null;
  if (typeof node.value !== 'undefined') {
    if (node.type === 'list') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (node.value.value as any[]).map(readNBTValue);
    }
    if (node.type === 'compound') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const obj: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(node.value as Record<string, unknown>)) {
        obj[k] = readNBTValue(v);
      }
      return obj;
    }
    return node.value;
  }
  return node;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractItem(rawItem: any): ParsedItem | null {
  if (!rawItem || typeof rawItem !== 'object') return null;

  const tag = rawItem.tag?.value;
  if (!tag) return null; // empty slot

  const ea = tag.ExtraAttributes?.value ?? {};
  const display = tag.display?.value ?? {};

  const id = String(ea.id?.value ?? '');
  if (!id) return null;

  const name = display.Name?.value ? stripColor(String(display.Name.value)) : id;
  const rawLore: string[] = display.Lore?.value?.value
    ? (display.Lore.value.value as string[])
    : [];

  const rarity = extractRarity(rawLore);

  const reforge = ea.modifier?.value ? String(ea.modifier.value) : undefined;

  // Enchantments
  const enchantments: Record<string, number> = {};
  if (ea.enchantments?.value) {
    for (const [k, v] of Object.entries(ea.enchantments.value as Record<string, { value: number }>)) {
      enchantments[k] = v?.value ?? 0;
    }
  }

  // Pet info
  let petInfo: ParsedItem['petInfo'];
  if (ea.petInfo?.value) {
    try {
      const info = JSON.parse(String(ea.petInfo.value));
      petInfo = { type: String(info.type ?? ''), tier: String(info.tier ?? '') };
    } catch {
      // ignore malformed pet info
    }
  }

  return {
    id,
    count: Number(rawItem.Count?.value ?? 1),
    name,
    rarity,
    lore: rawLore,
    reforge,
    enchantments,
    petInfo,
  };
}

/**
 * Parse a base64-encoded, gzip-compressed NBT inventory string.
 * Returns null items for empty slots (filtered out by default).
 */
export async function parseInventoryNBT(base64: string, includeEmpty = false): Promise<ParsedItem[]> {
  if (!base64) return [];

  const buffer = Buffer.from(base64, 'base64');

  let parsed: { parsed: { value: Record<string, unknown> } };
  try {
    parsed = await nbtParse(buffer) as typeof parsed;
  } catch {
    return [];
  }

  // The root compound has a single 'i' list key containing the items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const root = parsed.parsed?.value as any;
  const itemList = root?.i?.value?.value as unknown[];
  if (!Array.isArray(itemList)) return [];

  const results: ParsedItem[] = [];
  for (const raw of itemList) {
    const item = extractItem(raw);
    if (item || includeEmpty) {
      if (item) results.push(item);
    }
  }

  return results;
}

/** MP contribution per item rarity (Hypixel formula) */
export const MP_PER_RARITY: Record<ItemRarity, number> = {
  COMMON:       3,
  UNCOMMON:     5,
  RARE:         8,
  EPIC:        12,
  LEGENDARY:   16,
  MYTHIC:      22,
  DIVINE:      16,
  SPECIAL:      3,
  VERY_SPECIAL: 5,
  UNKNOWN:      3,
};
