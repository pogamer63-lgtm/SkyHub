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
  SUNFLOWER:   'DOUBLE_PLANT',  // Hypixel garden API uses DOUBLE_PLANT for sunflower
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
  DOUBLE_PLANT:       'Sunflower',
  WILD_ROSE:          'Wild Rose',
};

/**
 * Crop milestone thresholds keyed by Hypixel API resource key.
 * Each array entry is the CUMULATIVE crop count needed to reach that milestone tier.
 * NEU-REPO stores incremental costs per tier; we convert to cumulative here.
 * Source: NEU-REPO garden.json → crop_milestones (46 tiers per crop).
 */
export const CROP_MILESTONE_THRESHOLDS: Record<string, number[]> = Object.fromEntries(
  Object.entries(gardenRaw.crop_milestones as Record<string, number[]>).map(
    ([neuKey, incremental]) => {
      let sum = 0;
      const cumulative = incremental.map(inc => (sum += inc));
      return [NEU_CROP_TO_API_KEY[neuKey] ?? neuKey, cumulative];
    }
  )
);

/** Total number of Garden plots (from NEU-REPO garden.json) */
export const GARDEN_PLOT_COUNT = Object.keys(gardenRaw.plots).length;

/**
 * Copper cost per crop upgrade tier (9 tiers, index 0 = tier 1).
 * Source: NEU-REPO garden.json → crop_upgrades
 */
export const CROP_UPGRADE_COSTS: number[] = gardenRaw.crop_upgrades as number[];

/**
 * Cumulative garden XP required to reach each garden level (index = level).
 * Derived from NEU-REPO garden.json → garden_exp (incremental per-level costs).
 * garden_exp[0] = 0 (level 0→1 is free), garden_exp[1] = 70 (level 1→2), etc.
 * Max garden level = 15.
 */
export const GARDEN_LEVEL_TABLE: number[] = (() => {
  const incremental = gardenRaw.garden_exp as number[];
  const cumulative: number[] = [0]; // level 0 = 0 XP
  let sum = 0;
  for (const xp of incremental) {
    sum += xp;
    cumulative.push(sum);
  }
  return cumulative;
})();

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
/**
 * Only these three pets can reach level 200. All other pets cap at level 100
 * regardless of rarity. Source: NEU-REPO pets.json custom_pet_leveling.
 */
export const PET_MAX_200_TYPES = new Set(['GOLDEN_DRAGON', 'JADE_DRAGON', 'ROSE_DRAGON']);

// Cumulative XP thresholds to reach each pet level (all rarities, levels 1–100).
// Index i = total XP needed to be at level (i+1).
// Source: Hypixel SkyBlock wiki / SkyCrypt (verified April 2026).
// NOTE: NEU pet_levels (petsRaw.pet_levels) is NOT the per-level XP cost — do not use it here.
const PET_XP_CUMULATIVE: number[] = [
  0, 100, 310, 700, 1300, 2200, 3500, 5200, 7400, 10100, 13500, 17600,
  22500, 28200, 35700, 44000, 53500, 64000, 75500, 88000, 102000, 116500,
  132000, 148500, 166000, 184500, 204000, 224500, 246000, 268500, 292000,
  317500, 344000, 371500, 400000, 429500, 460000, 492500, 526500, 561500,
  597500, 634500, 672500, 711500, 751500, 792500, 834500, 877500, 921500,
  966500, 1012500, 1059500, 1107500, 1156500, 1206500, 1257500, 1309500,
  1362500, 1416500, 1471500, 1527500, 1584500, 1642500, 1701500, 1761500,
  1822500, 1884500, 1947500, 2011500, 2076500, 2142500, 2209500, 2277500,
  2346500, 2416500, 2487500, 2559500, 2632500, 2706500, 2781500, 2857500,
  2934500, 3012500, 3091500, 3171500, 3252500, 3334500, 3417500, 3501500,
  3586500, 3672500, 3759500, 3847500, 3936500, 4026500, 4117500, 4209500,
  4302500, 4396500, 4491500,
]; // 100 entries

// Per-level XP costs for L101→L200 (legendary/mythic only).
// Source: SkyCrypt / NEU community — same values used in parser.ts PET_XP_PER_LEVEL_L101_200.
const PET_XP_PER_LEVEL_L101_200: number[] = [
  490000, 510000, 530000, 550000, 570000, 590000, 610000, 630000, 650000, 670000,
  700000, 730000, 760000, 790000, 820000, 850000, 890000, 930000, 970000, 1020000,
  1060000, 1110000, 1160000, 1210000, 1260000, 1310000, 1370000, 1430000, 1490000, 1560000,
  1630000, 1700000, 1770000, 1840000, 1920000, 2010000, 2100000, 2200000, 2300000, 2400000,
  2510000, 2630000, 2760000, 2900000, 3050000, 3200000, 3360000, 3530000, 3710000, 3900000,
  4100000, 4310000, 4530000, 4770000, 5020000, 5290000, 5570000, 5870000, 6190000, 6530000,
  6890000, 7270000, 7670000, 8100000, 8550000, 9030000, 9540000, 10080000, 10650000, 11260000,
  11910000, 12590000, 13310000, 14070000, 14870000, 15720000, 16620000, 17570000, 18570000, 19630000,
  20750000, 21940000, 23200000, 24530000, 25940000, 27440000, 29030000, 30720000, 32510000, 34420000,
  36450000, 38600000, 40890000, 43310000, 45880000, 48600000, 51490000, 54560000, 57820000, 61280000,
];

// Cumulative table for the 3 dragon pets that reach level 200 (L1–200).
const PET_XP_LEGENDARY_CUM: number[] = [...PET_XP_CUMULATIVE];
{
  let cum = PET_XP_CUMULATIVE[PET_XP_CUMULATIVE.length - 1];
  for (const cost of PET_XP_PER_LEVEL_L101_200) {
    cum += cost;
    PET_XP_LEGENDARY_CUM.push(cum);
  }
}

export function computePetLevel(
  xp: number,
  petType: string,
): { level: number; xpIntoLevel: number; xpForNextLevel: number | null; progressPct: number } {
  const isDragon = PET_MAX_200_TYPES.has(petType.toUpperCase());
  const table = isDragon ? PET_XP_LEGENDARY_CUM : PET_XP_CUMULATIVE;
  const maxLevel = isDragon ? 200 : 100;

  // Find level: largest index i where xp >= table[i], then level = i+1
  let level = 1;
  for (let i = 0; i < table.length; i++) {
    if (xp >= table[i]) level = i + 1;
    else break;
  }
  level = Math.min(level, maxLevel);

  if (level >= maxLevel) {
    return { level: maxLevel, xpIntoLevel: 0, xpForNextLevel: null, progressPct: 100 };
  }

  const xpAtCurrentLevel = table[level - 1];
  const xpAtNextLevel = table[level];
  const xpIntoLevel = xp - xpAtCurrentLevel;
  const xpForNextLevel = xpAtNextLevel - xpAtCurrentLevel; // per-level cost
  return {
    level,
    xpIntoLevel,
    xpForNextLevel,
    progressPct: Math.min(100, (xpIntoLevel / xpForNextLevel) * 100),
  };
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

// ─── Pet Lore ─────────────────────────────────────────────────────────────────

const RARITY_SUFFIX: Record<string, string> = {
  COMMON: '0', UNCOMMON: '1', RARE: '2', EPIC: '3', LEGENDARY: '4', MYTHIC: '5',
};

/** Extract the actual effect lines from a held pet item's lore, skipping boilerplate. */
function extractHeldItemEffectLines(lore: string[]): string[] {
  // Generic boilerplate appears before "The pet must be visible..." sentinel.
  // Effect lines come after it.
  const sentinelIdx = lore.findIndex(l => l.includes('must be visible'));
  const startAt = sentinelIdx !== -1 ? sentinelIdx + 1 : 0;
  const result: string[] = [];
  for (let i = startAt; i < lore.length; i++) {
    // Stop at rarity line (§x§lUPPERCASE)
    if (/§[0-9a-f]§l[A-Z]/.test(lore[i])) break;
    result.push(lore[i]);
  }
  // Trim leading/trailing empty lines
  while (result.length > 0 && result[0] === '') result.shift();
  while (result.length > 0 && result[result.length - 1] === '') result.pop();
  return result;
}

/**
 * Build the Minecraft-style lore for a pet at a given level, ready for MinecraftText rendering.
 * Returns { name, lore } where lore lines contain §-color codes.
 */
export function computePetLore(
  type: string,
  tier: string,
  level: number,
  xp: number,
  maxed: boolean,
  heldItemId?: string,
): { name: string; lore: string[] } {
  const rarityIdx = RARITY_SUFFIX[tier.toUpperCase()] ?? '4';
  const itemData = ITEMS_INDEX[`${type};${rarityIdx}`];

  // Interpolation factor (0 at level 1, 1 at level 100)
  const petData = PET_NUMS[type];
  const rarityData = petData?.[tier.toUpperCase()] ?? petData?.[Object.keys(petData ?? {})[0]];
  const l1 = rarityData?.['1'];
  const l100 = rarityData?.['100'];
  const t = Math.min(1, Math.max(0, (Math.min(level, 100) - 1) / 99));

  function fmt(val: number): string {
    const rounded = Math.round(val * 10) / 10;
    return rounded % 1 === 0 ? String(rounded) : rounded.toFixed(1);
  }

  function replacePlaceholders(line: string): string {
    line = line.replace(/\{LVL\}/g, String(level));
    if (l1 && l100) {
      line = line.replace(/\{(\d+)\}/g, (_, i) => {
        const idx = Number(i);
        const v1 = (l1.otherNums ?? [])[idx] ?? 0;
        const v100 = (l100.otherNums ?? [])[idx] ?? 0;
        return fmt(v1 + (v100 - v1) * t);
      });
      line = line.replace(/\{([A-Z_]+)\}/g, (_, stat) => {
        const v1 = (l1.statNums ?? {})[stat] ?? 0;
        const v100 = (l100.statNums ?? {})[stat] ?? 0;
        return fmt(v1 + (v100 - v1) * t);
      });
    }
    return line;
  }

  // Strip trailing boilerplate (Right-click lines + rarity line) from base lore
  const rawLore: string[] = itemData?.lore ?? [];
  let cutAt = rawLore.length;
  for (let i = rawLore.length - 1; i >= 0; i--) {
    const l = rawLore[i];
    if (/§[0-9a-f]§l[A-Z]/.test(l) || l.includes('Right-click') || l.includes('pet menu')) {
      cutAt = i;
    } else {
      break;
    }
  }
  while (cutAt > 0 && rawLore[cutAt - 1] === '') cutAt--;

  const lore = rawLore.slice(0, cutAt).map(replacePlaceholders);

  // Held item section
  if (heldItemId) {
    const heldData = ITEMS_INDEX[heldItemId];
    if (heldData) {
      const effectLines = extractHeldItemEffectLines(heldData.lore ?? []);
      if (effectLines.length > 0) {
        lore.push('');
        lore.push(`§6Held Item: §a${heldData.name}`);
        lore.push(...effectLines);
      }
    }
  }

  // Level / XP footer
  lore.push('');
  if (maxed) {
    lore.push('§bMAX LEVEL');
    lore.push(`§7· ${xp.toLocaleString()} XP`);
  } else {
    const maxLevel = PET_MAX_200_TYPES.has(type) ? 200 : 100;
    lore.push(`§7Level §f${level}§7/§f${maxLevel}`);
    lore.push(`§7· ${xp.toLocaleString()} XP total`);
  }

  const rawName = itemData?.name ?? `[Lvl {LVL}] ${type.replace(/_/g, ' ')}`;
  const name = rawName.replace(/\{LVL\}/g, String(level));

  return { name, lore };
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
