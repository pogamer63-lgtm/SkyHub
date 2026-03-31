/**
 * Item icon resolution for SkyBlock items.
 * Textures are from the FurfSky Reborn texture pack, stored in /public/items/.
 * File names are the lowercase SkyBlock item ID with underscores.
 *
 * Usage: getItemIconUrl('NECRON_HELMET') → '/items/necron_helmet.png'
 */

/** Map of overrides for IDs that don't match the filename pattern */
const ID_OVERRIDES: Record<string, string> = {
  // Farming equipment
  LOTUS_HAT: 'lotus_helmet',
  // Misc aliases
  INK_SACK: 'ink_sack_0',
  'INK_SACK:4': 'lapis',
  LOG: 'oak_log',
  'LOG:2': 'birch_log',
  CARROT_ITEM: 'carrot',
  POTATO_ITEM: 'potato',
  // Slayer items
  REVENANT_FLESH: 'revenant_flesh',
};

/**
 * Returns the URL for the item icon PNG, or null if likely unavailable.
 * Always falls back gracefully — never throws.
 */
export function getItemIconUrl(itemId: string): string | null {
  if (!itemId) return null;
  const override = ID_OVERRIDES[itemId];
  const filename = (override ?? itemId.toLowerCase()).replace(/[^a-z0-9_]/g, '_');
  return `/items/${filename}.png`;
}

/**
 * Returns the URL for a known item — for use in <img> tags.
 * Pass onError handler to hide broken images.
 */
export function itemIconProps(itemId: string) {
  return {
    src: getItemIconUrl(itemId),
    width: 32,
    height: 32,
    alt: itemId.replace(/_/g, ' '),
    className: 'pixelated w-8 h-8 shrink-0',
  };
}
