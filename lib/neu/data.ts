/**
 * NEU (NotEnoughUpdates) data loader
 *
 * Loads authoritative SkyBlock game data from our NEU-REPO fork.
 * Source: github.com/pogamer63-lgtm/NotEnoughUpdates-REPO
 *
 * Files are bundled locally under data/neu/ (downloaded from the repo).
 * To refresh: re-download from raw.githubusercontent.com/pogamer63-lgtm/NotEnoughUpdates-REPO/master/constants/
 */

import gardenRaw from '@/data/neu/garden.json';
import levelingRaw from '@/data/neu/leveling.json';
import petsRaw from '@/data/neu/pets.json';
import museumRaw from '@/data/neu/museum.json';

// ─── Garden ───────────────────────────────────────────────────────────────────

/** NEU crop key → Hypixel API resource key (garden.resources_collected) */
const NEU_CROP_TO_API_KEY: Record<string, string> = {
  WHEAT:       'WHEAT',
  CARROT:      'CARROT_ITEM',
  POTATO:      'POTATO_ITEM',
  MELON:       'MELON',
  PUMPKIN:     'PUMPKIN',
  SUGAR_CANE:  'SUGAR_CANE',
  COCOA_BEANS: 'INK_SACK:3',
  CACTUS:      'CACTUS',
  MUSHROOM:    'MUSHROOM_COLLECTION',
  NETHER_WART: 'NETHER_STALK',
  MOONFLOWER:  'MOONFLOWER',
  SUNFLOWER:   'SUNFLOWER',
  WILD_ROSE:   'WILD_ROSE',
};

/** API key → display name */
export const CROP_DISPLAY_NAMES: Record<string, string> = {
  WHEAT:              'Wheat',
  CARROT_ITEM:        'Carrot',
  POTATO_ITEM:        'Potato',
  MELON:              'Melon',
  PUMPKIN:            'Pumpkin',
  SUGAR_CANE:         'Sugar Cane',
  'INK_SACK:3':       'Cocoa Beans',
  CACTUS:             'Cactus',
  MUSHROOM_COLLECTION:'Mushroom',
  NETHER_STALK:       'Nether Wart',
  MOONFLOWER:         'Moonflower',
  SUNFLOWER:          'Sunflower',
  WILD_ROSE:          'Wild Rose',
};

/**
 * Crop milestone thresholds keyed by Hypixel API resource key.
 * Each array entry is the cumulative crop count needed to reach that milestone tier.
 * Source: NEU-REPO garden.json → crop_milestones (46 tiers per crop).
 */
export const CROP_MILESTONE_THRESHOLDS: Record<string, number[]> = Object.fromEntries(
  Object.entries(gardenRaw.crop_milestones as Record<string, number[]>).map(
    ([neuKey, thresholds]) => [NEU_CROP_TO_API_KEY[neuKey] ?? neuKey, thresholds]
  )
);

/** Total number of Garden plots (from NEU-REPO garden.json) */
export const GARDEN_PLOT_COUNT = Object.keys(gardenRaw.plots).length;

/**
 * Copper cost per crop upgrade tier (9 tiers, index 0 = tier 1).
 * Source: NEU-REPO garden.json → crop_upgrades
 */
export const CROP_UPGRADE_COSTS: number[] = gardenRaw.crop_upgrades as number[];

// ─── Leveling ─────────────────────────────────────────────────────────────────

/**
 * XP required to level up from level N to N+1 (index 0 = level 1→2).
 * Used by: Farming, Mining, Combat, Fishing, Foraging, Enchanting, Alchemy, Carpentry, Taming.
 * Source: NEU-REPO leveling.json → leveling_xp (60 entries, covers levels 1–60)
 */
export const SKILL_LEVELING_XP: number[] = levelingRaw.leveling_xp;

/** Maximum level per skill. Source: NEU-REPO leveling.json → leveling_caps */
export const SKILL_CAPS: Record<string, number> = levelingRaw.leveling_caps as Record<string, number>;

/**
 * Catacombs XP thresholds (100 entries).
 * Source: NEU-REPO leveling.json → catacombs
 */
export const CATACOMBS_XP: number[] = levelingRaw.catacombs;

/**
 * HOTM XP thresholds (10 levels).
 * Source: NEU-REPO leveling.json → HOTM
 */
export const HOTM_XP: Record<string, number> = levelingRaw.HOTM as unknown as Record<string, number>;

/**
 * Slayer XP required per tier.
 * Source: NEU-REPO leveling.json → slayer_xp
 */
export const SLAYER_XP: Record<string, number[]> = levelingRaw.slayer_xp as Record<string, number[]>;

// ─── Pets ─────────────────────────────────────────────────────────────────────

/**
 * XP required to reach each pet level (119 entries total, covering up to level 100+).
 * Actual level = rarity_offset + progression through this array.
 * Source: NEU-REPO pets.json → pet_levels
 */
export const PET_LEVEL_XP: number[] = petsRaw.pet_levels;

/**
 * XP offset per rarity — skip this many entries in PET_LEVEL_XP for the starting level.
 * Source: NEU-REPO pets.json → pet_rarity_offset
 */
export const PET_RARITY_OFFSET: Record<string, number> = petsRaw.pet_rarity_offset as Record<string, number>;

/** Pet type → associated skill. Source: NEU-REPO pets.json → pet_types */
export const PET_TYPES: Record<string, string> = petsRaw.pet_types as Record<string, string>;

/**
 * Compute pet level and XP progress from raw XP value.
 * Returns { level, xpForCurrentLevel, xpForNextLevel, xpProgress }
 */
export function computePetLevel(
  xp: number,
  rarity: string,
): { level: number; xpIntoLevel: number; xpForNextLevel: number | null; progressPct: number } {
  const offset = PET_RARITY_OFFSET[rarity.toUpperCase()] ?? 0;
  const maxLevel = rarity.toUpperCase() === 'LEGENDARY' || rarity.toUpperCase() === 'MYTHIC' ? 100 : 100;

  let remaining = xp;
  let level = 1;

  for (let i = offset; i < PET_LEVEL_XP.length; i++) {
    const needed = PET_LEVEL_XP[i];
    if (remaining < needed) {
      return {
        level,
        xpIntoLevel: remaining,
        xpForNextLevel: needed,
        progressPct: Math.min(100, (remaining / needed) * 100),
      };
    }
    remaining -= needed;
    level++;
    if (level >= maxLevel) {
      return { level: maxLevel, xpIntoLevel: 0, xpForNextLevel: null, progressPct: 100 };
    }
  }

  return { level: maxLevel, xpIntoLevel: 0, xpForNextLevel: null, progressPct: 100 };
}

// ─── Museum ───────────────────────────────────────────────────────────────────

/**
 * Item internal name → museum XP value (1–30).
 * Source: NEU-REPO museum.json → itemToXp
 */
export const MUSEUM_ITEM_XP: Record<string, number> = museumRaw.itemToXp as Record<string, number>;

/** Total museum XP available per category. Source: NEU-REPO museum.json → max_values */
export const MUSEUM_MAX_VALUES: Record<string, number> = museumRaw.max_values as Record<string, number>;

/**
 * Item name → difficulty stage (STARTER, INTERMEDIATE, EXPERT, MASTER).
 * Source: NEU-REPO museum.json → itemToStage
 */
export const MUSEUM_ITEM_STAGE: Record<string, string> = museumRaw.itemToStage as Record<string, string>;
