/**
 * Parses raw SkyBlock API data into normalized PlayerProfile objects.
 */

import {
  SkyBlockProfile,
  SkyBlockMember,
  SlayerBoss,
  Pet,
} from '@/lib/types/hypixel';
import {
  PlayerProfile,
  SkillLevels,
  SlayerLevels,
  SlayerInfo,
  DungeonProgress,
  ParsedPet,
  AccessoryInfo,
  MiningProgress,
  FarmingProgress,
  GameStage,
} from '@/lib/types/player';
import { parseInventoryNBT, MP_PER_RARITY } from '@/lib/hypixel/nbt';
import { WEIGHT_SENITHER } from '@/lib/neu/data';

// XP tables
// Cumulative XP to reach each level (wiki-verified 2026-04-01, levels 0-60)
// L50+ corrected: L50 requires 4,200,000 (not 4,000,000 as previous table had)
const SKILL_XP_TABLE = [
  0, 50, 175, 375, 675, 1175, 1925, 2925, 4425, 6425, 9925, 14925, 22425,
  32425, 47425, 67425, 97425, 147425, 222425, 322425, 522425, 822425, 1222425,
  1722425, 2322425, 3022425, 3822425, 4722425, 5722425, 6822425, 8022425,
  9322425, 10722425, 12222425, 13822425, 15522425, 17322425, 19222425,
  21222425, 23322425, 25522425, 27822425, 30222425, 32722425, 35322425,
  38072425, 40972425, 44072425, 47472425, 51172425,
  55372425,  // L50: +4,200,000
  60072425,  // L51: +4,700,000
  65672425,  // L52: +5,600,000
  72072425,  // L53: +6,400,000
  79272425,  // L54: +7,200,000
  87272425,  // L55: +8,000,000
  96272425,  // L56: +9,000,000
  106272425, // L57: +10,000,000
  117272425, // L58: +11,000,000
  129272425, // L59: +12,000,000
  142272425, // L60: +13,000,000
];

const DUNGEON_XP_TABLE = [
  0, 50, 125, 235, 395, 625, 955, 1425, 2095, 3045, 4385, 6275, 8940, 12700,
  17960, 25340, 35640, 50040, 70040, 97640, 135640, 188140, 259640, 356640,
  488640, 668640, 911640, 1239640, 1684640, 2284640, 3084640, 4149640,
  5559640, 7459640, 9959640, 13259640, 17559640, 23159640, 30359640, 39559640,
  51559640, 66559640, 85559640, 109559640, 139559640, 174559640, 216559640,
  265559640, 323559640, 390559640,
];

function xpToLevel(xp: number, table: number[]): number {
  let level = 0;
  for (let i = 0; i < table.length; i++) {
    if (xp >= table[i]) level = i;
    else break;
  }
  return level;
}

function parseSkills(member: SkyBlockMember): SkillLevels {
  const exp = member.player_data?.experience ?? {};
  const get = (key: string) => exp[`SKILL_${key.toUpperCase()}`] ?? 0;

  const skills: SkillLevels = {
    farming: xpToLevel(get('farming'), SKILL_XP_TABLE),
    mining: xpToLevel(get('mining'), SKILL_XP_TABLE),
    combat: xpToLevel(get('combat'), SKILL_XP_TABLE),
    foraging: xpToLevel(get('foraging'), SKILL_XP_TABLE),
    fishing: xpToLevel(get('fishing'), SKILL_XP_TABLE),
    enchanting: xpToLevel(get('enchanting'), SKILL_XP_TABLE),
    alchemy: xpToLevel(get('alchemy'), SKILL_XP_TABLE),
    carpentry: xpToLevel(get('carpentry'), SKILL_XP_TABLE),
    runecrafting: xpToLevel(get('runecrafting'), SKILL_XP_TABLE),
    social: xpToLevel(get('social') / 2, SKILL_XP_TABLE), // social XP is shared
    taming: xpToLevel(get('taming'), SKILL_XP_TABLE),
    hunting: xpToLevel(get('hunting'), SKILL_XP_TABLE),
    farming_xp: get('farming'),
    mining_xp: get('mining'),
    combat_xp: get('combat'),
    foraging_xp: get('foraging'),
    fishing_xp: get('fishing'),
    enchanting_xp: get('enchanting'),
    alchemy_xp: get('alchemy'),
    hunting_xp: get('hunting'),
  };

  const mainSkills = ['farming', 'mining', 'combat', 'foraging', 'fishing', 'enchanting', 'alchemy', 'taming'] as const;
  skills.average = mainSkills.reduce((sum, s) => sum + skills[s], 0) / mainSkills.length;

  return skills;
}

function parseSlayers(member: SkyBlockMember): SlayerLevels {
  const bosses = member.slayer?.slayer_bosses ?? {};

  function parseOne(key: string, xpBreakpoints: number[]): SlayerInfo {
    const boss: SlayerBoss = bosses[key] ?? {};
    const xp = boss.xp ?? 0;
    let level = 0;
    for (let i = 0; i < xpBreakpoints.length; i++) {
      if (xp >= xpBreakpoints[i]) level = i + 1;
    }
    const kills: Record<string, number> = {};
    for (let t = 0; t <= 4; t++) {
      const k = (boss as Record<string, unknown>)[`boss_kills_tier_${t}`];
      if (typeof k === 'number' && k > 0) kills[`tier_${t + 1}`] = k;
    }
    return { level, xp, kills };
  }

  return {
    zombie: parseOne('zombie', [5, 15, 200, 1000, 5000, 20000, 100000, 400000, 1000000]),
    spider: parseOne('spider', [5, 25, 200, 1000, 5000, 20000, 100000, 400000, 1000000]),
    wolf: parseOne('wolf', [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000]),
    enderman: parseOne('enderman', [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000]),
    blaze: parseOne('blaze', [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000]),
    vampire: parseOne('vampire', [20, 75, 240, 840]), // max level 4 (wiki-confirmed)
  };
}

function parseDungeons(member: SkyBlockMember): DungeonProgress {
  const dungeons = member.dungeons ?? {};
  const catacombsData = dungeons.dungeon_types?.catacombs ?? {};
  const masterData = dungeons.dungeon_types?.master_catacombs ?? {};
  const classes = dungeons.player_classes ?? {};

  const catacombsXP = catacombsData.experience ?? 0;
  const catacombsLevel = xpToLevel(catacombsXP, DUNGEON_XP_TABLE);

  const parsedClasses: Record<string, { level: number; xp: number }> = {};
  for (const [cls, data] of Object.entries(classes)) {
    const clsXP = (data as { experience?: number }).experience ?? 0;
    parsedClasses[cls] = { level: xpToLevel(clsXP, DUNGEON_XP_TABLE), xp: clsXP };
  }

  return {
    selectedClass: dungeons.selected_dungeon_class ?? 'unknown',
    classes: parsedClasses,
    catacombs: {
      level: catacombsLevel,
      xp: catacombsXP,
      highestFloor: catacombsData.highest_tier_completed ?? 0,
      floorCompletions: catacombsData.tier_completions ?? {},
      fastestTimes: catacombsData.fastest_time ?? {},
    },
    masterMode: {
      highestFloor: masterData.highest_tier_completed ?? 0,
      floorCompletions: masterData.tier_completions ?? {},
    },
  };
}

function parsePets(member: SkyBlockMember): ParsedPet[] {
  // Modern API: pets_data.pets. Fallback: member.pets.pets (old format).
  let pets: Pet[] = member.pets_data?.pets ?? [];
  if (pets.length === 0) {
    const fallback = member.pets;
    if (Array.isArray(fallback)) pets = fallback as Pet[];
    else if (fallback && !Array.isArray(fallback)) pets = (fallback as { pets?: Pet[] }).pets ?? [];
  }
  return pets.map(p => ({
    type: p.type,
    tier: p.tier,
    level: calculatePetLevel(p.exp, p.tier),
    xp: p.exp,
    active: p.active,
    heldItem: p.heldItem,
    skin: p.skin,
    candyUsed: p.candyUsed ?? 0,
  }));
}

// Cumulative XP thresholds to reach each pet level (1-indexed: index 0 = level 1).
// Levels 1-100: standard table (all rarities).
// Levels 101-200: extension for LEGENDARY / MYTHIC pets only.
const PET_XP_TABLE_BASE = [
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
  4302500, 4396500,
];

// Per-level XP costs for L101→L200 (Legendary/Mythic only). Source: SkyCrypt/NEU.
const PET_XP_PER_LEVEL_L101_200 = [
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

// Build cumulative tables
const PET_XP_LEGENDARY: number[] = [...PET_XP_TABLE_BASE];
{
  let cum = PET_XP_TABLE_BASE[PET_XP_TABLE_BASE.length - 1];
  for (const cost of PET_XP_PER_LEVEL_L101_200) {
    cum += cost;
    PET_XP_LEGENDARY.push(cum);
  }
}

function calculatePetLevel(xp: number, tier: string): number {
  const isLegendary = tier === 'LEGENDARY' || tier === 'MYTHIC';
  const table = isLegendary ? PET_XP_LEGENDARY : PET_XP_TABLE_BASE;
  const maxLevel = isLegendary ? 200 : 100;

  let level = 1;
  for (let i = 0; i < table.length; i++) {
    if (xp >= table[i]) level = i + 1;
    else break;
  }
  return Math.min(level, maxLevel);
}

function parseMining(member: SkyBlockMember): MiningProgress {
  const mc = member.mining_core ?? {};
  const exp = mc.experience ?? 0;
  const hotmTable = [0, 3000, 12000, 37000, 97000, 197000, 347000, 557000, 847000, 1247000];
  let hotmLevel = 0;
  for (let i = 0; i < hotmTable.length; i++) {
    if (exp >= hotmTable[i]) hotmLevel = i + 1;
    else break;
  }

  // Powder fields: in newer API they live at the member level (member.powder_mithril),
  // older API versions put them inside mining_core. Support both.
  const powderMithril = member.powder_mithril ?? mc.powder_mithril ?? 0;
  const powderMithrilTotal = ((member.powder_mithril ?? 0) + (member.powder_spent_mithril ?? 0)) || (mc.powder_mithril_total ?? 0);
  const powderGemstone = member.powder_gemstone ?? mc.powder_gemstone ?? 0;
  const powderGemstoneTotal = ((member.powder_gemstone ?? 0) + (member.powder_spent_gemstone ?? 0)) || (mc.powder_gemstone_total ?? 0);
  const powderGlacite = member.powder_glacite ?? mc.powder_glacite ?? 0;
  const powderGlaciteTotal = ((member.powder_glacite ?? 0) + (member.powder_spent_glacite ?? 0)) || (mc.powder_glacite_total ?? 0);

  return {
    hotmLevel,
    hotmNodes: mc.nodes ?? {},
    hotmTokensAvailable: mc.tokens ?? 0,
    hotmTokensSpent: mc.tokens_spent ?? 0,
    powderMithril,
    powderMithrilTotal,
    powderGemstone,
    powderGemstoneTotal,
    powderGlacite,
    powderGlaciteTotal,
    xp: exp,
  };
}

function parseFarming(member: SkyBlockMember): FarmingProgress {
  const garden = member.garden_player_data ?? {};
  // API uses jacobs_contest in v2; jacobs_farming is legacy fallback
  const jacob = member.jacobs_contest ?? member.jacobs_farming ?? {};

  // Garden level from XP — max level is 15 (wiki-confirmed, updated April 2026)
  const gardenXP = garden.garden_experience ?? 0;
  const gardenTable = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000];
  let gardenLevel = 0;
  for (let i = 0; i < gardenTable.length; i++) {
    if (gardenXP >= gardenTable[i]) gardenLevel = i;
    else break;
  }

  const contests = jacob.contests ?? {};
  const contestsParticipated = Object.keys(contests).length;

  // Count medals earned per type from contest data.
  // Use claimed_medal if present; otherwise compute from position/participants.
  // SkyCrypt thresholds: diamond=2%, platinum=5%, gold=10%, silver=30%, bronze=60%
  const jacobMedalsEarned = { bronze: 0, silver: 0, gold: 0, platinum: 0, diamond: 0 };
  for (const contest of Object.values(contests)) {
    const c = contest as { claimed_position?: number; claimed_participants?: number; claimed_rewards?: boolean; claimed_medal?: string };
    if (!c.claimed_rewards) continue;
    if (c.claimed_medal) {
      const m = c.claimed_medal.toLowerCase() as keyof typeof jacobMedalsEarned;
      if (m in jacobMedalsEarned) jacobMedalsEarned[m]++;
      continue;
    }
    if (c.claimed_position == null || c.claimed_participants == null) continue;
    const pos = c.claimed_position;
    const par = c.claimed_participants;
    if (pos <= Math.floor(par * 0.02))      jacobMedalsEarned.diamond++;
    else if (pos <= Math.floor(par * 0.05)) jacobMedalsEarned.platinum++;
    else if (pos <= Math.floor(par * 0.10)) jacobMedalsEarned.gold++;
    else if (pos <= Math.floor(par * 0.30)) jacobMedalsEarned.silver++;
    else if (pos <= Math.floor(par * 0.60)) jacobMedalsEarned.bronze++;
  }

  return {
    gardenLevel,
    plots: garden.plots_unlocked ?? 0,
    cropUpgrades: garden.crop_upgrade_levels ?? {},
    jacobMedals: jacob.medals_inv ?? {},
    jacobMedalsEarned,
    jacobPerks: jacob.perks ?? {},
    gardenResources: garden.resources_collected ?? {},
    copper: garden.copper ?? 0,
    farmingFortune: 0,
    // unique_brackets is the modern format; unique_golds2 is legacy
    uniqueGolds: jacob.unique_brackets?.gold ?? jacob.unique_golds2 ?? [],
    contestsParticipated,
  };
}

function parseChocolateFactory(member: SkyBlockMember): {
  rabbits: Record<string, number>;
  chocolate: number;
  totalChocolate: number;
  chocolatePerSecond: number;
  prestige: number;
} {
  const h = member.hoppity ?? {};
  const rabbits: Record<string, number> = {};
  const raw = (h.rabbits ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(raw)) {
    if (typeof v === 'number') rabbits[k] = v;
  }
  return {
    rabbits,
    chocolate: typeof h.chocolate === 'number' ? h.chocolate : 0,
    totalChocolate: typeof h.total_chocolate === 'number' ? h.total_chocolate : 0,
    chocolatePerSecond: 0, // computed later from rabbit count
    prestige: typeof h.prestige === 'object' && h.prestige ? (h.prestige.level ?? 0) : 0,
  };
}

function parseTrophyFish(member: SkyBlockMember): Record<string, number> {
  const raw = member.trophy_fish ?? {};
  const result: Record<string, number> = {};
  for (const [key, val] of Object.entries(raw)) {
    if (key === 'rewards' || Array.isArray(val)) continue;
    if (typeof val === 'number') result[key] = val;
  }
  return result;
}

function computeSeniherWeight(
  skills: SkillLevels,
  slayers: SlayerLevels,
  dungeons: DungeonProgress,
): number {
  const sw = WEIGHT_SENITHER;
  let total = 0;

  // Skill weight: [exponent, divider]
  const skillXpMap: Record<string, number> = {
    farming: skills.farming_xp,
    mining: skills.mining_xp,
    combat: skills.combat_xp,
    foraging: skills.foraging_xp,
    fishing: skills.fishing_xp,
    enchanting: skills.enchanting_xp,
    alchemy: skills.alchemy_xp,
    taming: 0,
  };
  for (const [skill, [exp, div]] of Object.entries(sw.skills ?? {})) {
    const xp = skillXpMap[skill] ?? 0;
    if (xp > 0 && div > 0) total += Math.pow(xp / div, exp);
  }

  // Slayer weight: [divider, exponent]
  const slayerXpMap: Record<string, number> = {
    zombie: slayers.zombie.xp,
    spider: slayers.spider.xp,
    wolf: slayers.wolf.xp,
    enderman: slayers.enderman.xp,
  };
  for (const [boss, [div, exp]] of Object.entries(sw.slayer ?? {})) {
    const xp = slayerXpMap[boss] ?? 0;
    if (xp > 0 && div > 0) total += Math.pow(xp / div, exp);
  }

  // Dungeon weight: catacombs_xp * multiplier + class_xp * class_multiplier
  const catXP = dungeons.catacombs.xp;
  if (catXP > 0 && sw.dungeons?.catacombs) {
    total += catXP * sw.dungeons.catacombs;
  }
  for (const [cls, mult] of Object.entries(sw.dungeons?.classes ?? {})) {
    const clsXP = dungeons.classes[cls]?.xp ?? 0;
    if (clsXP > 0) total += clsXP * mult;
  }

  return Math.round(total);
}

function parseAccessories(member: SkyBlockMember): AccessoryInfo {
  const bag = member.accessory_bag_storage ?? {};
  return {
    count: 0, // TODO: parse from NBT
    magicalPower: bag.highest_magical_power ?? 0,
    missingCommon: [],
    missingUncommon: [],
    missingRare: [],
    missingEpic: [],
    selectedPower: bag.selected_power,
    powers: bag.powers ?? [],
  };
}

function determineSkyblockLevel(member: SkyBlockMember): number {
  const xp = member.leveling?.experience ?? 0;
  return Math.floor(xp / 100);
}

function determineGameStage(profile: PlayerProfile): GameStage {
  const avgSkill = profile.skills.average ?? 0;
  const catLevel = profile.dungeons.catacombs.level;
  const highestSlayer = Math.max(
    profile.slayers.zombie.level,
    profile.slayers.spider.level,
    profile.slayers.wolf.level,
    profile.slayers.enderman.level,
  );

  if (avgSkill < 20 && catLevel < 10 && highestSlayer < 3) return 'early';
  if (avgSkill < 35 && catLevel < 25 && highestSlayer < 7) return 'mid';
  if (avgSkill < 50 && catLevel < 40) return 'late';
  return 'endgame';
}

export function parseProfile(
  profile: SkyBlockProfile,
  uuid: string,
  username: string,
): PlayerProfile {
  const member = profile.members[uuid] ?? {};

  const skills = parseSkills(member);
  const slayers = parseSlayers(member);
  const dungeons = parseDungeons(member);
  const pets = parsePets(member);
  const accessories = parseAccessories(member);
  const mining = parseMining(member);
  const farming = parseFarming(member);

  const trophyFish = parseTrophyFish(member);
  const seniherWeight = computeSeniherWeight(skills, slayers, dungeons);
  const cf = parseChocolateFactory(member);

  const partial: PlayerProfile = {
    uuid,
    username,
    profileId: profile.profile_id,
    profileName: profile.cute_name,
    gameMode: profile.game_mode,
    lastSaved: undefined,
    skyblockLevel: determineSkyblockLevel(member),
    purseCoins: member.currencies?.coin_purse ?? 0,
    bankCoins: profile.banking?.balance ?? 0,
    skills,
    slayers,
    dungeons,
    pets,
    accessories,
    mining,
    farming,
    collections: member.collection ?? {},
    magicalPower: accessories.magicalPower,
    fairySouls: member.fairy_soul?.total_collected ?? 0,
    seniherWeight,
    trophyFish,
    chocolateRabbits: cf.rabbits,
    chocolate: cf.chocolate,
    totalChocolate: cf.totalChocolate,
    chocolatePrestige: cf.prestige,
  };

  return partial;
}

export function selectBestProfile(
  profiles: SkyBlockProfile[],
  uuid: string,
  username: string,
): PlayerProfile {
  // Prefer selected profile, else highest skill average
  const selected = profiles.find(p => p.selected);
  if (selected) return parseProfile(selected, uuid, username);

  // Fallback: pick profile with highest SkyBlock level
  let best = profiles[0];
  let bestLevel = 0;
  for (const p of profiles) {
    const member = p.members[uuid] ?? {};
    const level = (member.leveling?.experience ?? 0) / 100;
    if (level > bestLevel) {
      bestLevel = level;
      best = p;
    }
  }
  return parseProfile(best, uuid, username);
}

/** Parse a single optional NBT slot, returning [] on missing/error. */
async function safeParseNBT(data: string | undefined): Promise<ReturnType<typeof parseInventoryNBT>> {
  if (!data) return [];
  try { return await parseInventoryNBT(data); } catch { return []; }
}

/**
 * Asynchronously enriches a PlayerProfile with NBT-parsed inventory data.
 * Parses: talisman bag, armor, equipment, main inventory, wardrobe, ender chest, backpacks.
 * Falls back gracefully on any parsing failure.
 */
export async function enrichWithNBT(
  profile: PlayerProfile,
  rawProfile: SkyBlockProfile,
  uuid: string,
): Promise<PlayerProfile> {
  const member = rawProfile.members[uuid] ?? {};
  const inv = member.inventory;
  if (!inv) return profile;

  // Parse all slots in parallel
  const [
    accessories,
    armorItems,
    equipmentItems,
    inventoryItems,
    wardrobeItems,
    enderChestItems,
    ...backpackArrays
  ] = await Promise.all([
    safeParseNBT(inv.bag_contents?.talisman_bag?.data),
    safeParseNBT(inv.armor?.data),
    safeParseNBT(inv.equipment_contents?.data),
    safeParseNBT(inv.inv_contents?.data),
    safeParseNBT(inv.wardrobe_contents?.data),
    safeParseNBT(inv.ender_chest_contents?.data),
    // Each backpack slot is a separate NBT blob
    ...Object.values(inv.backpack_contents ?? {}).map(bp => safeParseNBT(bp?.data)),
  ]);

  const filteredAccessories = accessories.filter(i => i.id && !i.id.startsWith('NONE'));
  const backpackItems = (backpackArrays as Awaited<ReturnType<typeof parseInventoryNBT>>[]).flat();

  // Magical Power from talisman bag rarity
  const realMP = filteredAccessories.reduce((sum, item) => sum + (MP_PER_RARITY[item.rarity] ?? 3), 0);
  const ownedIds = new Set(filteredAccessories.map(i => i.id));

  return {
    ...profile,
    accessories: {
      ...profile.accessories,
      count: filteredAccessories.length,
      magicalPower: Math.max(profile.accessories.magicalPower, realMP),
      ownedIds,
    },
    magicalPower: Math.max(profile.magicalPower, realMP),
    armorItems:    armorItems.filter(i => !!i.id),
    equipmentItems:equipmentItems.filter(i => !!i.id),
    inventoryItems:inventoryItems.filter(i => !!i.id),
    wardrobeItems: wardrobeItems.filter(i => !!i.id),
    enderChestItems:enderChestItems.filter(i => !!i.id),
    backpackItems: backpackItems.filter(i => !!i.id),
  };
}
