/**
 * NEU (NotEnoughUpdates) data loader
 *
 * Loads authoritative SkyBlock game data from our NEU-REPO fork.
 * Source: github.com/pogamer63-lgtm/NotEnoughUpdates-REPO
 *
 * Files are bundled locally under data/neu/ (downloaded from the repo).
 * To refresh: re-download from raw.githubusercontent.com/pogamer63-lgtm/NotEnoughUpdates-REPO/master/constants/
 */

import itemsIndexRaw from '@/data/neu/items_index.json';
import bazaarItemIdsRaw from '@/data/neu/items_bazaar_ids.json';
import gardenRaw from '@/data/neu/garden.json';
import levelingRaw from '@/data/neu/leveling.json';
import petsRaw from '@/data/neu/pets.json';
import museumRaw from '@/data/neu/museum.json';
import petnumsRaw from '@/data/neu/petnums.json';
import bestiaryRaw from '@/data/neu/bestiary.json';
import weightRaw from '@/data/neu/weight.json';
import trophyFishRaw from '@/data/neu/trophyfish.json';
import fairySoulsRaw from '@/data/neu/fairy_souls.json';
import reforgestonesRaw from '@/data/neu/reforgestones.json';
import enchantsRaw from '@/data/neu/enchants.json';
import essencecostsRaw from '@/data/neu/essencecosts.json';
import gemstonesRaw from '@/data/neu/gemstones.json';
import gemstonecostsRaw from '@/data/neu/gemstonecosts.json';
import attributeShardsRaw from '@/data/neu/attribute_shards.json';
import sacksRaw from '@/data/neu/sacks.json';
import hoppityRaw from '@/data/neu/hoppity.json';
import miscRaw from '@/data/neu/misc.json';
import bonusesRaw from '@/data/neu/bonuses.json';

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

// ─── Pet Nums ─────────────────────────────────────────────────────────────────

type PetNumData = { otherNums: number[]; statNums: Record<string, number> };

/**
 * Per-pet stat values at level 1 and level 100 per rarity.
 * Source: NEU-REPO petnums.json
 */
export const PET_NUMS = petnumsRaw as unknown as Record<string, Record<string, Record<string, PetNumData>>>;

/**
 * Interpolate pet stat bonuses at a given level (1–100) from NEU petnums data.
 * Linearly interpolates statNums between level 1 and level 100 data.
 * Returns key stat values (e.g. FARMING_FORTUNE, SEA_CREATURE_CHANCE).
 */
export function computePetStats(type: string, tier: string, level: number): Record<string, number> {
  const petData = PET_NUMS[type];
  if (!petData) return {};
  const rarityData = petData[tier.toUpperCase()] ?? petData[Object.keys(petData)[0]];
  if (!rarityData) return {};
  const l1 = rarityData['1'];
  const l100 = rarityData['100'];
  if (!l1 || !l100) return {};
  const t = Math.min(1, Math.max(0, (Math.min(level, 100) - 1) / 99));
  const result: Record<string, number> = {};
  for (const [stat, val100] of Object.entries(l100.statNums ?? {})) {
    const val1 = l1.statNums?.[stat] ?? 0;
    result[stat] = val1 + (val100 - val1) * t;
  }
  return result;
}

// ─── Bestiary ─────────────────────────────────────────────────────────────────

export interface BestiaryMobFamily {
  name: string;
  /** Exact API kill keys (e.g. "farming_chicken_1", "enderman_50") */
  apiKeys: string[];
  cap: number;
  bracket: number;
}

export interface BestiaryZone {
  key: string;
  name: string;
  families: BestiaryMobFamily[];
}

const _bestiaryRaw = bestiaryRaw as Record<string, unknown>;

/**
 * Kill count thresholds per bracket tier (1–7).
 * Milestone level = how many thresholds the player's kills exceed.
 * Source: NEU-REPO bestiary.json → brackets
 */
export const BESTIARY_BRACKETS: Record<string, number[]> =
  _bestiaryRaw['brackets'] as Record<string, number[]>;

/**
 * All bestiary zones with mob families and their exact API kill keys.
 * Source: NEU-REPO bestiary.json
 */
export const BESTIARY_ZONES: BestiaryZone[] = (() => {
  const zones: BestiaryZone[] = [];
  for (const [zoneKey, zoneData] of Object.entries(_bestiaryRaw)) {
    if (zoneKey === 'brackets' || zoneKey === 'dynamic') continue;
    const zone = zoneData as {
      name: string;
      mobs?: Array<{ name: string; mobs: string[]; cap: number; bracket: number }>;
    };
    if (!zone.mobs) continue;
    zones.push({
      key: zoneKey,
      name: zone.name,
      families: zone.mobs.map(mob => ({
        name: mob.name.replace(/§./g, ''), // strip Minecraft color codes
        apiKeys: mob.mobs,
        cap: mob.cap,
        bracket: mob.bracket,
      })),
    });
  }
  return zones;
})();

/**
 * Compute the milestone level for a mob family.
 * Uses the bracket's kill thresholds, limited by the mob's cap.
 */
export function getBestiaryMilestoneLevel(kills: number, cap: number, bracket: number): number {
  const thresholds = BESTIARY_BRACKETS[String(bracket)] ?? [];
  let level = 0;
  for (const threshold of thresholds) {
    if (threshold > cap) break;
    if (kills >= threshold) level++;
    else break;
  }
  return level;
}

/**
 * Compute the max milestone level for a mob family (total tiers up to cap).
 */
export function getBestiaryMaxLevel(cap: number, bracket: number): number {
  const thresholds = BESTIARY_BRACKETS[String(bracket)] ?? [];
  return thresholds.filter(t => t <= cap).length;
}

// ─── Weight (Senither) ────────────────────────────────────────────────────────

/**
 * Senither Weight coefficients from NEU-REPO weight.json.
 * Skills: { skill: [exponent, divider] }
 * Slayer: { boss: [divider, exponent] }
 * Dungeons: { catacombs: multiplier, classes: { class: multiplier } }
 */
export const WEIGHT_SENITHER = (weightRaw as unknown as {
  senither: {
    skills: Record<string, [number, number]>;
    slayer: Record<string, [number, number]>;
    dungeons: { catacombs: number; classes: Record<string, number> };
  };
}).senither;

// ─── Trophy Fish ──────────────────────────────────────────────────────────────

/**
 * Per-fish kill count thresholds to earn [bronze, silver, gold, diamond] trophy.
 * Source: NEU-REPO trophyfish.json
 */
export const TROPHY_FISH_THRESHOLDS = trophyFishRaw as unknown as Record<string, [number, number, number, number]>;

/** Display name for each trophy fish (derived from ID) */
export function trophyFishName(id: string): string {
  return id.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
}

// ─── Fairy Souls ──────────────────────────────────────────────────────────────

/** Maximum fairy souls in the current version. Source: NEU-REPO fairy_souls.json */
export const FAIRY_SOUL_MAX: number =
  ((fairySoulsRaw as Record<string, unknown>)['Max Souls'] as number) ?? 267;

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

// ─── Reforge Stones ───────────────────────────────────────────────────────────

export interface ReforgeStone {
  internalName: string;
  reforgeName: string;
  reforgeType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  itemTypes: string | string[] | Record<string, any>;
  requiredRarities: string[];
  reforgeCosts: Record<string, number>;
  reforgeStats: Record<string, Record<string, number>>;
  reforgeAbility?: Record<string, string>;
}

/** All reforge stones with per-rarity stats and costs. Source: NEU-REPO reforgestones.json */
export const REFORGE_STONES: ReforgeStone[] =
  Object.values(reforgestonesRaw) as unknown as ReforgeStone[];

// ─── Enchants ─────────────────────────────────────────────────────────────────

interface EnchantsData {
  enchants: Record<string, string[]>;
  enchant_pools: string[][];
  enchants_xp_cost: Record<string, number[]>;
  max_xp_table_levels: Record<string, number>;
}

const _enchantsData = enchantsRaw as unknown as EnchantsData;

/** Enchantment IDs available per item type (SWORD, BOW, FISHING_ROD, etc.) */
export const ENCHANTS_BY_ITEM_TYPE: Record<string, string[]> = _enchantsData.enchants ?? {};

/** XP cost per enchant level (array indexed from 0 = level 1). */
export const ENCHANT_XP_COSTS: Record<string, number[]> = _enchantsData.enchants_xp_cost ?? {};

/** Mutually exclusive enchant pools (only one per pool can be applied). */
export const ENCHANT_POOLS: string[][] = _enchantsData.enchant_pools ?? [];

// ─── Essence Costs ────────────────────────────────────────────────────────────

export interface EssenceCostEntry {
  type: string;  // e.g. "Wither", "Gold", "Diamond"
  [tier: string]: number | string | Record<string, string[]>;
}

/** Item ID → essence upgrade costs per tier. Source: NEU-REPO essencecosts.json */
export const ESSENCE_COSTS: Record<string, EssenceCostEntry> =
  essencecostsRaw as unknown as Record<string, EssenceCostEntry>;

// ─── Gemstones ────────────────────────────────────────────────────────────────

export interface GemstoneTypeInfo {
  statName: string;
  /** stats[quality][rarity] = stat value (e.g. stats['FLAWLESS']['LEGENDARY'] = 14) */
  stats: Record<string, Record<string, number>>;
}

/** Gemstone type → stat info. Source: NEU-REPO gemstones.json */
export const GEMSTONE_TYPES: Record<string, GemstoneTypeInfo> =
  (gemstonesRaw as unknown as { gemstoneTypes: Record<string, GemstoneTypeInfo> }).gemstoneTypes;

/** Item ID → gemstone slot costs. Source: NEU-REPO gemstonecosts.json */
export const GEMSTONE_COSTS: Record<string, Record<string, string[]>> =
  gemstonecostsRaw as unknown as Record<string, Record<string, string[]>>;

// ─── Attribute Shards ─────────────────────────────────────────────────────────

/** Shard XP costs per rarity to level up attributes. Source: NEU-REPO attribute_shards.json */
export const ATTRIBUTE_LEVELING: Record<string, number[]> =
  (attributeShardsRaw as unknown as { attribute_levelling: Record<string, number[]> }).attribute_levelling;

/** Attribute IDs that cannot be consumed/transferred. */
export const UNCONSUMABLE_ATTRIBUTES: string[] =
  (attributeShardsRaw as unknown as { unconsumable_attributes: string[] }).unconsumable_attributes ?? [];

/** All attribute shard IDs. */
export const ATTRIBUTE_LIST: string[] =
  (attributeShardsRaw as unknown as { attributes: string[] }).attributes ?? [];

// ─── Sacks ────────────────────────────────────────────────────────────────────

export interface SackInfo {
  item: string;
  contents: string[];
}

/** Sack name → sack info. Source: NEU-REPO sacks.json */
export const SACKS_DATA: Record<string, SackInfo> =
  (sacksRaw as unknown as { sacks: Record<string, SackInfo> }).sacks;

// ─── Hoppity (Chocolate Factory) ──────────────────────────────────────────────

export interface HoppityRarityData {
  rabbits: string[];
  chocolate: number;
  multiplier: number;
}

export interface HoppityData {
  rarities: Record<string, HoppityRarityData>;
  special: Record<string, { chocolate: number; multiplier: number }>;
  prestigeMultipliers: Record<string, number>;
  talisman: Record<string, number>;
}

/** Full Hoppity Chocolate Factory rabbit data. Source: NEU-REPO hoppity.json */
export const HOPPITY_DATA: HoppityData =
  (hoppityRaw as unknown as { hoppity: HoppityData }).hoppity;

// ─── Misc ─────────────────────────────────────────────────────────────────────

interface MiscData {
  talisman_upgrades: [string, string[]][];
  slayer_cost: number[];
  minionXp: Record<string, number>;
  item_types: Record<string, string[]>;
  base_stats: Record<string, number>;
  area_names: Record<string, string>;
}

const _miscData = miscRaw as unknown as MiscData;

/** Talisman upgrade paths: fromId → toIds[]. Source: NEU-REPO misc.json */
export const TALISMAN_UPGRADES: Map<string, string[]> = new Map(
  Object.entries((_miscData.talisman_upgrades ?? {}) as unknown as Record<string, string[]>)
);

/** Coins required per slayer tier (index 0 = T1). Source: NEU-REPO misc.json */
export const SLAYER_COST: number[] = _miscData.slayer_cost ?? [];

/** Minion XP per tier. Source: NEU-REPO misc.json */
export const MINION_XP: Record<string, number> = _miscData.minionXp ?? {};

/** Area/zone display names. Source: NEU-REPO misc.json */
export const AREA_NAMES: Record<string, string> = _miscData.area_names ?? {};

// ─── Bonuses ──────────────────────────────────────────────────────────────────

interface BonusesData {
  pet_rewards: Record<string, Record<string, number>>;
  pet_value: Record<string, Record<string, number>>;
  bonus_stats: Record<string, Record<string, number>>;
}

const _bonusesData = bonusesRaw as unknown as BonusesData;

/** Pet score milestones → bonus stats (Magic Find, etc.). Source: NEU-REPO bonuses.json */
export const PET_SCORE_REWARDS: Record<string, Record<string, number>> = _bonusesData.pet_rewards ?? {};

/** Pet score value milestones. */
export const PET_SCORE_VALUE: Record<string, Record<string, number>> = _bonusesData.pet_value ?? {};

/** Bonus stats per level milestone (e.g. fairy_souls, pet_score). */
export const BONUS_STATS: Record<string, Record<string, number>> = _bonusesData.bonus_stats ?? {};

// ─── Items Index ───────────────────────────────────────────────────────────────

export interface ItemIndexEntry {
  name: string;
  lore: string[];    // full lore lines with §-codes preserved
  category: string;
}

/** All 8000+ SkyBlock items from NEU-REPO, keyed by internal item ID. */
export const ITEMS_INDEX = itemsIndexRaw as unknown as Record<string, ItemIndexEntry>;

/** Set of item IDs that are tradable on the Bazaar. */
export const BAZAAR_ITEM_IDS: ReadonlySet<string> = new Set(bazaarItemIdsRaw as string[]);

/** Convert a raw item ID to a human-readable name, falling back to underscores → spaces. */
export function getItemName(id: string): string {
  return ITEMS_INDEX[id]?.name ?? id.replace(/_/g, ' ');
}
