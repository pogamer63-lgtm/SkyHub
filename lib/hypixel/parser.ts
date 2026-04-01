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

// XP tables
const SKILL_XP_TABLE = [
  0, 50, 175, 375, 675, 1175, 1925, 2925, 4425, 6425, 9925, 14925, 22425,
  32425, 47425, 67425, 97425, 147425, 222425, 322425, 522425, 822425, 1222425,
  1722425, 2322425, 3022425, 3822425, 4722425, 5722425, 6822425, 8022425,
  9322425, 10722425, 12222425, 13822425, 15522425, 17322425, 19222425,
  21222425, 23322425, 25522425, 27822425, 30222425, 32722425, 35322425,
  38072425, 40972425, 44072425, 47472425, 51172425, 55172425, 59472425,
  64072425, 68972425, 74172425, 79672425, 85472425, 91572425, 97972425,
  104672425,
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
    farming_xp: get('farming'),
    mining_xp: get('mining'),
    combat_xp: get('combat'),
    foraging_xp: get('foraging'),
    fishing_xp: get('fishing'),
    enchanting_xp: get('enchanting'),
    alchemy_xp: get('alchemy'),
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
  const pets: Pet[] = member.pets?.pets ?? [];
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

function calculatePetLevel(xp: number, tier: string): number {
  // Simplified pet level calculation
  const maxLevel = tier === 'LEGENDARY' || tier === 'MYTHIC' ? 200 : 100;
  const xpTable = [
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

  let level = 1;
  for (let i = 0; i < Math.min(xpTable.length, maxLevel); i++) {
    if (xp >= xpTable[i]) level = i + 1;
    else break;
  }
  return Math.min(level, maxLevel);
}

function parseMining(member: SkyBlockMember): MiningProgress {
  const mc = member.mining_core ?? {};
  const exp = mc.experience ?? 0;
  // HOTM level from XP
  const hotmTable = [0, 3000, 12000, 37000, 97000, 197000, 347000, 557000, 847000, 1247000];
  let hotmLevel = 0;
  for (let i = 0; i < hotmTable.length; i++) {
    if (exp >= hotmTable[i]) hotmLevel = i;
    else break;
  }

  return {
    hotmLevel,
    hotmNodes: mc.nodes ?? {},
    powderMithril: mc.powder_mithril ?? 0,
    powderMithrilTotal: mc.powder_mithril_total ?? 0,
    powderGemstone: mc.powder_gemstone ?? 0,
    powderGemstoneTotal: mc.powder_gemstone_total ?? 0,
    powderGlacite: mc.powder_glacite ?? 0,
    xp: exp,
  };
}

function parseFarming(member: SkyBlockMember): FarmingProgress {
  const garden = member.garden_player_data ?? {};
  const jacob = member.jacobs_farming ?? {};

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

  return {
    gardenLevel,
    plots: garden.plots_unlocked ?? 0,
    cropUpgrades: garden.crop_upgrade_levels ?? {},
    jacobMedals: jacob.medals_inv ?? {},
    jacobPerks: jacob.perks ?? {},
    gardenResources: garden.resources_collected ?? {},
    copper: garden.copper ?? 0,
    farmingFortune: 0,
    uniqueGolds: jacob.unique_golds2 ?? [],
    contestsParticipated,
  };
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
    fairySouls: member.nether_island_player_data?.fairy_soul_collected ?? 0,
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

/**
 * Asynchronously enriches a PlayerProfile with NBT-parsed inventory data.
 * Call this after selectBestProfile / parseProfile in server contexts.
 * Falls back gracefully if NBT parsing fails.
 */
export async function enrichWithNBT(
  profile: PlayerProfile,
  rawProfile: SkyBlockProfile,
  uuid: string,
): Promise<PlayerProfile> {
  const member = rawProfile.members[uuid] ?? {};
  const talismans = member.inventory?.bag_contents?.talisman_bag?.data;

  if (!talismans) return profile;

  try {
    const items = await parseInventoryNBT(talismans);
    const accessories = items.filter(i => i.id && !i.id.startsWith('NONE'));

    // Calculate real MP from rarity
    const realMP = accessories.reduce((sum, item) => sum + (MP_PER_RARITY[item.rarity] ?? 3), 0);

    // Group by rarity for missing calculations
    const ids = new Set(accessories.map(i => i.id));

    return {
      ...profile,
      accessories: {
        ...profile.accessories,
        count: accessories.length,
        magicalPower: Math.max(profile.accessories.magicalPower, realMP),
        ownedIds: ids,
      },
      magicalPower: Math.max(profile.magicalPower, realMP),
    };
  } catch {
    return profile;
  }
}
