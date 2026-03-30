/**
 * Texture Registry — maps SkyBlock item IDs to texture URLs.
 *
 * Primary style reference: FurfSky Reborn texture pack (https://furfsky.net)
 * Legal note: FurfSky textures are NOT redistributed here.
 * We use item IDs mapped to Minecraft vanilla textures via Crafatar/mc-heads,
 * or public SkyBlock resource APIs as fallbacks.
 *
 * For full FurfSky visuals, users can install the texture pack client-side.
 * The API layer here provides fallback textures that are safely reusable.
 */

export interface TextureEntry {
  itemId: string;
  slug: string;
  textureUrl: string;
  source: 'mc-api' | 'skytils' | 'hypixel-assets' | 'fallback';
  furfskyCoverage: boolean; // true if FurfSky has a custom texture for this
}

// Head texture base — uses Minecraft skin API head data (public)
const MC_HEAD_BASE = 'https://mc-heads.net/head';
// SkyBlock item textures via public community resource
const SKYTILS_TEXTURE_BASE = 'https://cdn.discordapp.com/attachments'; // placeholder

export function getItemTextureUrl(itemId: string): string {
  const entry = TEXTURE_MAP[itemId.toUpperCase()];
  if (entry) return entry.textureUrl;
  // Fallback: use a generic item icon
  return `/textures/unknown.png`;
}

export function getItemTexture(itemId: string): TextureEntry | null {
  return TEXTURE_MAP[itemId.toUpperCase()] ?? null;
}

// Core item texture map — expand over time
// Using publicly available Minecraft texture references
export const TEXTURE_MAP: Record<string, TextureEntry> = {
  // Armor
  SUPERIOR_DRAGON_HELMET: {
    itemId: 'SUPERIOR_DRAGON_HELMET',
    slug: 'superior_dragon_helmet',
    textureUrl: `${MC_HEAD_BASE}/Superior_Dragon_Helmet`,
    source: 'mc-api',
    furfskyCoverage: true,
  },
  NECRON_BLADE: {
    itemId: 'NECRON_BLADE',
    slug: 'necron_blade',
    textureUrl: `/textures/items/necron_blade.png`,
    source: 'fallback',
    furfskyCoverage: true,
  },
  HYPERION: {
    itemId: 'HYPERION',
    slug: 'hyperion',
    textureUrl: `/textures/items/hyperion.png`,
    source: 'fallback',
    furfskyCoverage: true,
  },
};

// Pet texture helper
export function getPetTextureUrl(petType: string): string {
  const normalized = petType.toUpperCase().replace(/ /g, '_');
  return `/textures/pets/${normalized.toLowerCase()}.png`;
}

// Fallback: use Minecraft vanilla item sprite sheet
export function getVanillaItemUrl(materialId: string): string {
  return `https://mc-heads.net/item/${materialId}`;
}
