/**
 * SkyHub Recommendation Engine
 *
 * Analyzes a player profile and generates prioritized, meaningful upgrade recommendations.
 * Each recommendation includes cost, benefit, ROI, urgency, and prerequisites.
 */

import {
  PlayerProfile,
  Recommendation,
  RecommendationSet,
  RecommendationCategory,
  GameStage,
} from '@/lib/types/player';
import { BazaarPrices, getBazaarBuyPrice } from '@/lib/api/bazaar';

// ─── Helper Scorers ────────────────────────────────────────────────────────────

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function formatCoins(coins: number): string {
  if (coins >= 1_000_000_000) return `${(coins / 1_000_000_000).toFixed(1)}B`;
  if (coins >= 1_000_000) return `${(coins / 1_000_000).toFixed(1)}M`;
  if (coins >= 1_000) return `${(coins / 1_000).toFixed(0)}k`;
  return coins.toString();
}

function determineGameStage(profile: PlayerProfile): GameStage {
  const avg = profile.skills.average ?? 0;
  const cat = profile.dungeons.catacombs.level;
  const maxSlayer = Math.max(
    profile.slayers.zombie.level,
    profile.slayers.spider.level,
    profile.slayers.wolf.level,
  );
  if (avg < 20 || (cat < 5 && maxSlayer < 2)) return 'early';
  if (avg < 35 || cat < 20) return 'mid';
  if (avg < 50 || cat < 35) return 'late';
  return 'endgame';
}

// ─── Individual Recommendation Rules ──────────────────────────────────────────

function checkSkillsProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const skills = profile.skills;
  const avg = skills.average ?? 0;

  // Check each skill for low levels
  const skillChecks: Array<{ name: string; level: number; key: keyof typeof skills }> = [
    { name: 'Combat', level: skills.combat, key: 'combat' },
    { name: 'Farming', level: skills.farming, key: 'farming' },
    { name: 'Mining', level: skills.mining, key: 'mining' },
    { name: 'Foraging', level: skills.foraging, key: 'foraging' },
    { name: 'Fishing', level: skills.fishing, key: 'fishing' },
    { name: 'Enchanting', level: skills.enchanting, key: 'enchanting' },
    { name: 'Alchemy', level: skills.alchemy, key: 'alchemy' },
  ];

  // Identify most lagging skill
  const lagging = skillChecks.sort((a, b) => (a.level as number) - (b.level as number))[0];

  if ((lagging.level as number) < 20) {
    recs.push({
      id: `skill_${lagging.key}_boost`,
      category: 'skills',
      title: `Level up ${lagging.name} Skill`,
      description: `Your ${lagging.name} skill is only level ${lagging.level}, which is significantly below average. Skill levels provide important stat bonuses and unlock content.`,
      whyItMatters: `Skills provide passive stat bonuses, unlock recipes, and increase your SkyBlock level. ${lagging.name} at level ${lagging.level} is leaving significant stats on the table.`,
      estimatedCost: 0,
      estimatedCostLabel: 'Time investment',
      estimatedBenefit: `+${5 * (25 - (lagging.level as number))} stat points, access to higher-tier content`,
      roiScore: clamp(80 - (lagging.level as number) * 2),
      urgencyScore: clamp(90 - (lagging.level as number) * 3),
      progressionScore: clamp(85 - (lagging.level as number) * 2),
      requirementScore: 0,
      confidenceScore: 95,
      sourceTags: ['skills', 'progression'],
      dependsOn: [],
      unlocks: [`${lagging.key}_bonuses`, 'higher_content'],
      gameStage: ['early', 'mid'],
      priority: (lagging.level as number) < 10 ? 'critical' : 'high',
      type: 'progression',
    });
  }

  // Average skill level recommendation
  if (avg < 30 && avg > 0) {
    recs.push({
      id: 'skill_average_25',
      category: 'skills',
      title: 'Reach Skill Average 25',
      description: `Your skill average is ${avg.toFixed(1)}. Reaching skill average 25 is a key early-mid game milestone that unlocks better gear and increases your base stats significantly.`,
      whyItMatters: 'Skill average 25 is a community benchmark. It unlocks important gear progression and provides meaningful stat bonuses across all activities.',
      estimatedCost: 0,
      estimatedCostLabel: 'Time investment',
      estimatedBenefit: 'Access to mid-game gear, better stat bonuses, community milestone',
      roiScore: 75,
      urgencyScore: 70,
      progressionScore: 80,
      requirementScore: 0,
      confidenceScore: 90,
      sourceTags: ['skills', 'milestone'],
      dependsOn: [],
      unlocks: ['mid_game_gear', 'fairy_soul_swap'],
      gameStage: ['early', 'mid'],
      priority: 'high',
      type: 'progression',
    });
  }

  return recs;
}

function checkSlayerProgression(profile: PlayerProfile, bazaar?: BazaarPrices): Recommendation[] {
  const recs: Recommendation[] = [];
  const { zombie, spider, wolf, enderman, blaze } = profile.slayers;

  // Estimate Revenant Flesh cost from Bazaar if available
  const fleshPrice = bazaar ? getBazaarBuyPrice(bazaar, 'REVENANT_FLESH') : 0;
  const zombieCost = fleshPrice > 0 ? Math.round(fleshPrice * 200) : 1_500_000;
  const zombieCostLabel = fleshPrice > 0
    ? `~${formatCoins(zombieCost)} (Revenant Flesh × Bazaar)`
    : '~1.5M coins (estimate)';

  if (zombie.level < 5 && profile.skills.combat >= 12) {
    recs.push({
      id: 'slayer_zombie_5',
      category: 'slayer',
      title: 'Complete Zombie Slayer Level 5',
      description: `You're at Zombie Slayer ${zombie.level}. Reaching level 4 lets you wear Revenant Armor; level 5 lets you craft the chestplate. A huge early-mid game power spike.`,
      whyItMatters: 'Zombie Slayer Level 4 unlocks equipping Revenant Armor — one of the best early-game sets. Level 5 unlocks crafting the chestplate for the full set bonus.',
      estimatedCost: zombieCost,
      estimatedCostLabel: zombieCostLabel,
      estimatedBenefit: 'Revenant Armor access, strong defense boost, better combat XP',
      roiScore: 88,
      urgencyScore: 85,
      progressionScore: 90,
      requirementScore: 30,
      confidenceScore: 92,
      sourceTags: ['slayer', 'zombie', 'progression'],
      dependsOn: [],
      unlocks: ['revenant_armor', 'zombie_slayer_rewards'],
      gameStage: ['early', 'mid'],
      priority: zombie.level < 3 ? 'critical' : 'high',
      type: 'progression',
    });
  }

  // Correct unlock chain (wiki-confirmed): Zombie T2 → Spider, Spider T2 → Wolf, Wolf T2 → Enderman, Enderman T2 → Blaze
  // Spider must come before Wolf — some community guides had this backwards

  if (spider.level < 4 && zombie.level >= 2 && profile.skills.combat >= 15) {
    recs.push({
      id: 'slayer_spider_4',
      category: 'slayer',
      title: 'Progress Spider Slayer to Level 4',
      description: `Spider Slayer unlocks after Zombie T2. You're at Spider ${spider.level}. Level 4 unlocks Tarantula Armor — and Spider T2 is required before you can unlock Wolf Slayer.`,
      whyItMatters: 'Spider Slayer is the second slayer in the unlock chain (Zombie → Spider → Wolf). Skipping it means Wolf Slayer stays locked. Tarantula Armor at L4 is also a solid mid-game set.',
      estimatedCost: 2_000_000,
      estimatedCostLabel: '~2M coins',
      estimatedBenefit: 'Tarantula Armor, Spider Slayer rewards, unlocks Wolf Slayer',
      roiScore: 80,
      urgencyScore: 75,
      progressionScore: 82,
      requirementScore: 25,
      confidenceScore: 92,
      sourceTags: ['slayer', 'spider', 'progression'],
      dependsOn: ['slayer_zombie_5'],
      unlocks: ['tarantula_armor', 'wolf_slayer_unlock'],
      gameStage: ['early', 'mid'],
      priority: zombie.level >= 5 && spider.level < 2 ? 'high' : 'medium',
      type: 'progression',
    });
  }

  if (wolf.level < 4 && spider.level >= 2 && profile.skills.combat >= 18) {
    recs.push({
      id: 'slayer_wolf_4',
      category: 'slayer',
      title: 'Progress Wolf Slayer to Level 4',
      description: `Wolf Slayer unlocks after Spider T2. You're at Wolf ${wolf.level}. Level 4 unlocks Werewolf Armor. Wolf T2 also unlocks Enderman Slayer.`,
      whyItMatters: 'Wolf is third in the unlock chain (after Spider). Level 2 unlocks Enderman Slayer; Level 4 gives Werewolf Armor which has strong combat bonuses.',
      estimatedCost: 2_500_000,
      estimatedCostLabel: '~2.5M coins',
      estimatedBenefit: 'Werewolf Armor, Radiant Power Orb recipe, unlocks Enderman Slayer',
      roiScore: 76,
      urgencyScore: 68,
      progressionScore: 78,
      requirementScore: 30,
      confidenceScore: 90,
      sourceTags: ['slayer', 'wolf', 'progression'],
      dependsOn: ['slayer_spider_4'],
      unlocks: ['werewolf_armor', 'enderman_slayer_unlock'],
      gameStage: ['mid'],
      priority: 'medium',
      type: 'progression',
    });
  }

  if (enderman.level < 3 && wolf.level >= 2 && profile.skills.combat >= 20) {
    recs.push({
      id: 'slayer_enderman_3',
      category: 'slayer',
      title: 'Unlock Enderman Slayer Level 3',
      description: `Enderman Slayer unlocks after Wolf T2. You're at Enderman ${enderman.level}. Level 3 unlocks Ender armor bonuses and Wither progression paths.`,
      whyItMatters: 'Enderman slayer is the gateway to Wither armor progression. Requires Wolf T2 to unlock — not just Zombie T5 as previously stated.',
      estimatedCost: 3_000_000,
      estimatedCostLabel: '~3M coins',
      estimatedBenefit: 'Wither armor pathway, better combat damage, Enderman rewards',
      roiScore: 78,
      urgencyScore: 72,
      progressionScore: 82,
      requirementScore: 40,
      confidenceScore: 92,
      sourceTags: ['slayer', 'enderman', 'mid-game'],
      dependsOn: ['slayer_wolf_4'],
      unlocks: ['enderman_rewards', 'wither_progression'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'progression',
    });
  }

  return recs;
}

function checkDungeonProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const cat = profile.dungeons.catacombs;

  if (cat.level < 5) {
    recs.push({
      id: 'dungeon_floor3',
      category: 'dungeons',
      title: 'Complete Catacombs Floor 3',
      description: `You're at Catacombs ${cat.level}. Completing Floor 3 and reaching Catacombs 12 is a critical early progression step. Dungeons provide the best gear in the game.`,
      whyItMatters: 'Dungeons are the primary gear progression system in SkyBlock. Floor 3+ unlocks meaningful gear upgrades and dungeon coins for powerful items.',
      estimatedCost: 500_000,
      estimatedCostLabel: '~500k (gear to enter safely)',
      estimatedBenefit: 'Catacombs XP, dungeon loot, gear progression pathway',
      roiScore: 82,
      urgencyScore: 88,
      progressionScore: 85,
      requirementScore: 20,
      confidenceScore: 90,
      sourceTags: ['dungeons', 'early-game', 'progression'],
      dependsOn: [],
      unlocks: ['dungeon_loot', 'stronger_gear'],
      gameStage: ['early', 'mid'],
      priority: 'critical',
      type: 'blocker',
    });
  }

  // F5 — Shadow Assassin armor unlock (critical mid-game milestone)
  if (cat.level >= 8 && cat.highestFloor < 5) {
    recs.push({
      id: 'dungeon_floor5',
      category: 'dungeons',
      title: 'Complete Floor 5 (Shadow Assassin Unlock)',
      description: `You're Catacombs ${cat.level} but haven't completed Floor 5. Floor 5 is a critical milestone — it unlocks Shadow Assassin armor, one of the best pre-Necron sets.`,
      whyItMatters: 'Shadow Assassin Armor (from F5+) is a major power spike for mid-game. It is significantly better than Dragon armor and is the current meta recommendation before Necron.',
      estimatedCost: 2_000_000,
      estimatedCostLabel: '~2M (gear to safely clear F5)',
      estimatedBenefit: 'Shadow Assassin Armor access, major defense/crit boost, F6/F7 viability',
      roiScore: 87,
      urgencyScore: 85,
      progressionScore: 90,
      requirementScore: 35,
      confidenceScore: 92,
      sourceTags: ['dungeons', 'mid-game', 'f5', 'shadow-assassin'],
      dependsOn: ['dungeon_floor3'],
      unlocks: ['shadow_assassin_armor', 'f6_access'],
      gameStage: ['mid'],
      priority: 'high',
      type: 'progression',
    });
  }

  if (cat.level >= 15 && cat.highestFloor < 6) {
    recs.push({
      id: 'dungeon_floor6',
      category: 'dungeons',
      title: 'Progress to Floor 6 (Livid)',
      description: `You're Catacombs ${cat.level} but haven't completed Floor 6. Floor 6 is the gateway to Necron armor parts and significantly better gear.`,
      whyItMatters: 'Floor 6 (Livid) drops are essential for mid-game progression. Livid Dagger and Floor 6 gear are strong stepping stones toward F7.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M (gear improvements)',
      estimatedBenefit: 'Livid Dagger, Wither armor pieces, Catacombs XP',
      roiScore: 80,
      urgencyScore: 78,
      progressionScore: 85,
      requirementScore: 50,
      confidenceScore: 87,
      sourceTags: ['dungeons', 'mid-game', 'f6'],
      dependsOn: ['dungeon_floor5'],
      unlocks: ['necron_armor', 'livid_dagger', 'f7_prep'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'progression',
    });
  }

  return recs;
}

function checkMagicalPower(profile: PlayerProfile, bazaar?: BazaarPrices): Recommendation[] {
  const recs: Recommendation[] = [];
  const mp = profile.magicalPower;

  // Estimate cost of cheap accessories from Bazaar
  const candyRingPrice = bazaar ? getBazaarBuyPrice(bazaar, 'CANDY_RING') : 0;
  const speedRingPrice = bazaar ? getBazaarBuyPrice(bazaar, 'SPEED_RING') : 0;
  const cheapAccessoryCost = candyRingPrice > 0 && speedRingPrice > 0
    ? Math.round((candyRingPrice + speedRingPrice) * 3)
    : 2_000_000;
  const cheapAccessoryLabel = bazaar && cheapAccessoryCost < 2_000_000
    ? `~${formatCoins(cheapAccessoryCost)} (Bazaar accessories)`
    : '~2M coins (cheap accessories)';

  // MP scales logarithmically — no hard breakpoints, but community uses 250/500/750/1000 as reference tiers
  if (mp < 250) {
    recs.push({
      id: 'magical_power_250',
      category: 'accessories',
      title: 'Grow Your Magical Power (Early Goal: 250)',
      description: `You have ${mp} Magical Power. MP scales logarithmically — every point helps, with 250 being a common early-game milestone. Fill missing common/uncommon accessories first.`,
      whyItMatters: 'Magical Power multiplies your stats from accessories. Each additional MP point gives diminishing returns, but early MP is cheap and impactful.',
      estimatedCost: cheapAccessoryCost,
      estimatedCostLabel: cheapAccessoryLabel,
      estimatedBenefit: 'Proportional stat scaling gains from each accessory added',
      roiScore: 90,
      urgencyScore: 85,
      progressionScore: 88,
      requirementScore: 5,
      confidenceScore: 93,
      sourceTags: ['accessories', 'magical-power', 'cheap'],
      dependsOn: [],
      unlocks: ['stat_multiplier', 'better_power_scaling'],
      gameStage: ['early', 'mid'],
      priority: mp < 100 ? 'critical' : 'high',
      type: 'cheapest',
    });
  }

  if (mp >= 250 && mp < 500) {
    recs.push({
      id: 'magical_power_500',
      category: 'accessories',
      title: 'Grow Your Magical Power (Mid Goal: 500)',
      description: `You're at ${mp} MP. 500 MP is the mid-game reference tier. MP scaling is logarithmic, so each additional accessory still helps even without hitting a specific threshold.`,
      whyItMatters: 'More MP always helps. Filling rare/epic accessories towards 500 also provides individual stat bonuses beyond the MP multiplier.',
      estimatedCost: 10_000_000,
      estimatedCostLabel: '~10M coins',
      estimatedBenefit: 'Proportional stat scaling; rare accessories also add individual stats',
      roiScore: 82,
      urgencyScore: 75,
      progressionScore: 80,
      requirementScore: 15,
      confidenceScore: 88,
      sourceTags: ['accessories', 'magical-power', 'mid-game'],
      dependsOn: ['magical_power_250'],
      unlocks: ['better_power_scaling', 'reforge_efficiency'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkFarmingProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const farming = profile.farming;
  const farmSkill = profile.skills.farming;

  if (farmSkill < 25 && farming.gardenLevel < 3) {
    recs.push({
      id: 'unlock_garden',
      category: 'farming',
      title: 'Unlock and Develop Your Garden',
      description: 'The Garden is Hypixel SkyBlock\'s dedicated farming area. It provides massive Farming Fortune bonuses, crop-specific upgrades, and is essential for farming progression.',
      whyItMatters: 'Garden provides access to Farming Fortune sources unavailable elsewhere. Even at low levels, the Garden gives you better farming efficiency and crop upgrades.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free to unlock (need SkyBlock Level 5)',
      estimatedBenefit: '+Farming Fortune, crop upgrades, NPC commissions',
      roiScore: 85,
      urgencyScore: 70,
      progressionScore: 75,
      requirementScore: 20,
      confidenceScore: 90,
      sourceTags: ['farming', 'garden', 'early-game'],
      dependsOn: [],
      unlocks: ['farming_fortune', 'crop_upgrades', 'garden_commissions'],
      gameStage: ['early', 'mid'],
      priority: 'medium',
      type: 'progression',
    });
  }

  return recs;
}

function checkMiningProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const mining = profile.mining;

  if (mining.hotmLevel < 3) {
    recs.push({
      id: 'hotm_3',
      category: 'mining',
      title: 'Reach HOTM Level 3',
      description: `Your Heart of the Mountain is level ${mining.hotmLevel}. HOTM 3 unlocks Mining Speed and Fortune buffs, special abilities, and the Mithril Powder system.`,
      whyItMatters: 'HOTM provides passive mining bonuses and unlocks key perk nodes. HOTM 3 is the first important milestone with meaningful stat nodes.',
      estimatedCost: 200_000,
      estimatedCostLabel: '~200k or time mining',
      estimatedBenefit: '+Mining Speed/Fortune, powder system, node unlocks',
      roiScore: 80,
      urgencyScore: 65,
      progressionScore: 72,
      requirementScore: 10,
      confidenceScore: 88,
      sourceTags: ['mining', 'hotm', 'early-game'],
      dependsOn: [],
      unlocks: ['mining_nodes', 'powder_system', 'hotm_abilities'],
      gameStage: ['early', 'mid'],
      priority: mining.hotmLevel === 0 ? 'high' : 'medium',
      type: 'progression',
    });
  }

  return recs;
}

function checkGearProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const cat = profile.dungeons.catacombs.level;
  const combat = profile.skills.combat;
  const avg = profile.skills.average ?? 0;

  // Early game: push to hardened diamond / basic set
  if (combat < 15 && avg < 20) {
    recs.push({
      id: 'gear_early_armor',
      category: 'combat',
      title: 'Upgrade to Hardened Diamond Armor',
      description: 'Hardened Diamond is the best early-game armor set before dragons. It costs only 20k–50k and dramatically improves survivability.',
      whyItMatters: 'Dying repeatedly wastes time and coins. Hardened Diamond lets you grind combat/slayer efficiently.',
      estimatedCost: 40_000,
      estimatedCostLabel: '~40k from Bazaar/AH',
      estimatedBenefit: '+600 Defense, great survivability, cheap upgrade',
      roiScore: 92,
      urgencyScore: 80,
      progressionScore: 75,
      requirementScore: 0,
      confidenceScore: 88,
      sourceTags: ['gear', 'armor', 'cheap'],
      dependsOn: [],
      unlocks: ['better_slayer', 'faster_grinding'],
      gameStage: ['early'],
      priority: 'high',
      type: 'cheapest',
    });
  }

  // Mid game: push to dragon / perfect set
  if (cat >= 10 && cat < 25 && combat >= 20 && avg >= 20) {
    recs.push({
      id: 'gear_dragon_set',
      category: 'combat',
      title: 'Upgrade to a Dragon Armor Set',
      description: 'Dragon Armor (Strong, Unstable, or Superior) is a massive mid-game upgrade. Strong Dragon is the best budget option for general combat.',
      whyItMatters: 'Dragon Armor provides set bonuses that significantly multiply combat effectiveness. Moving from early to dragon armor is one of the biggest power spikes.',
      estimatedCost: 2_000_000,
      estimatedCostLabel: '~2M (Strong Dragon set)',
      estimatedBenefit: '+800 Strength/Crit Damage from set bonuses, major DPS increase',
      roiScore: 85,
      urgencyScore: 78,
      progressionScore: 88,
      requirementScore: 20,
      confidenceScore: 85,
      sourceTags: ['gear', 'armor', 'mid-game', 'dragon'],
      dependsOn: [],
      unlocks: ['better_dungeons', 'faster_slayer', 'f6_viability'],
      gameStage: ['mid'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  // Late game: push to Necron armor
  if (cat >= 24 && profile.dungeons.catacombs.highestFloor < 7) {
    recs.push({
      id: 'gear_push_f7',
      category: 'dungeons',
      title: 'Push to Floor 7 for Necron Armor',
      description: `You're Catacombs ${cat} — close to F7 (requires Cat 28). Necron Armor is the best pre-Kuudra armor and a major progression milestone.`,
      whyItMatters: 'Necron Armor from F7 is the best armor before Crimson Isle content. Getting it accelerates every other progression area.',
      estimatedCost: 10_000_000,
      estimatedCostLabel: '~10M (gear prep for F7)',
      estimatedBenefit: 'Necron Armor access, F7 clears unlock MM progression',
      roiScore: 88,
      urgencyScore: 82,
      progressionScore: 92,
      requirementScore: 60,
      confidenceScore: 85,
      sourceTags: ['gear', 'dungeons', 'f7', 'necron'],
      dependsOn: ['dungeon_floor6'],
      unlocks: ['necron_armor', 'master_mode', 'mm_income'],
      gameStage: ['late'],
      priority: 'high',
      type: 'progression',
    });
  }

  return recs;
}

function checkLateGameProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const cat = profile.dungeons.catacombs.level;
  const mp = profile.magicalPower;
  const { blaze, vampire } = profile.slayers;

  // Push to MM when F7 is cleared
  if (profile.dungeons.catacombs.highestFloor >= 7 && cat >= 28 && profile.dungeons.masterMode.highestFloor === 0) {
    recs.push({
      id: 'enter_master_mode',
      category: 'dungeons',
      title: 'Start Master Mode Dungeons',
      description: 'You\'ve cleared F7! Master Mode is available and provides significantly better loot including Goldor, Storm, Maxor, and Necron armor upgrades.',
      whyItMatters: 'Master Mode is the next progression tier after F7. MM drops are worth far more than normal F7 drops.',
      estimatedCost: 0,
      estimatedCostLabel: 'No extra cost — just run MM',
      estimatedBenefit: 'Crimson Essence, MM armor upgrades, significantly higher loot value',
      roiScore: 90,
      urgencyScore: 88,
      progressionScore: 92,
      requirementScore: 70,
      confidenceScore: 90,
      sourceTags: ['dungeons', 'master-mode', 'late-game'],
      dependsOn: [],
      unlocks: ['master_mode_loot', 'mm_armor', 'crimson_essence'],
      gameStage: ['late', 'endgame'],
      priority: 'high',
      type: 'progression',
    });
  }

  // Blaze slayer for Crimson Isle access
  if (blaze.level < 4 && profile.skills.combat >= 30 && cat >= 20) {
    recs.push({
      id: 'slayer_blaze_4',
      category: 'slayer',
      title: 'Push Blaze Slayer to Level 4',
      description: 'Blaze Slayer Level 4 unlocks Crimson Isle faction quests and Mage Outfit drops. The Mage Outfit alone sells for 15M+.',
      whyItMatters: 'Blaze Slayer is the gateway to Crimson Isle content and Kuudra progression. Mage Outfit drops are excellent income.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M in consumables',
      estimatedBenefit: 'Crimson Isle access, Mage Outfit drops (5M+ each), faction reputation',
      roiScore: 84,
      urgencyScore: 76,
      progressionScore: 86,
      requirementScore: 50,
      confidenceScore: 82,
      sourceTags: ['slayer', 'blaze', 'crimson-isle', 'late-game'],
      dependsOn: [],
      unlocks: ['crimson_isle', 'kuudra_access', 'mage_outfit'],
      gameStage: ['late', 'endgame'],
      priority: 'medium',
      type: 'progression',
    });
  }

  // Vampire slayer for late-game
  if (vampire.level < 3 && cat >= 30) {
    recs.push({
      id: 'slayer_vampire_3',
      category: 'slayer',
      title: 'Unlock Vampire Slayer Level 3',
      description: 'Vampire Slayer Level 3 unlocks the Bat Person Armor and important accessories. It\'s one of the easier slayer progressions and unlocks valuable late-game items.',
      whyItMatters: 'Vampire slayer provides unique accessories not available elsewhere. The Bat Person pet from vampire slayer is also highly valuable.',
      estimatedCost: 3_000_000,
      estimatedCostLabel: '~3M in slayer XP',
      estimatedBenefit: 'Unique accessories, Bat Person pet access, late-game unlocks',
      roiScore: 72,
      urgencyScore: 65,
      progressionScore: 75,
      requirementScore: 55,
      confidenceScore: 78,
      sourceTags: ['slayer', 'vampire', 'late-game'],
      dependsOn: [],
      unlocks: ['bat_person_pet', 'vampire_accessories'],
      gameStage: ['late', 'endgame'],
      priority: 'medium',
      type: 'progression',
    });
  }

  // High MP push (late-game reference tier: 750)
  if (mp >= 500 && mp < 750) {
    recs.push({
      id: 'magical_power_750',
      category: 'accessories',
      title: 'Grow Your Magical Power (Late Goal: 750)',
      description: `You're at ${mp} MP. 750 MP is the late-game reference tier. Epic and Legendary accessories each add significant MP. Scaling is logarithmic — every point still matters.`,
      whyItMatters: 'Epic/Legendary accessories provide the most MP per coin. Pushing towards 750 via the accessory upgrade chains maximizes your stat multiplier.',
      estimatedCost: 40_000_000,
      estimatedCostLabel: '~40M (epic/legendary accessories)',
      estimatedBenefit: 'Proportional stat scaling gains; legendary accessories also have strong individual stats',
      roiScore: 80,
      urgencyScore: 68,
      progressionScore: 82,
      requirementScore: 30,
      confidenceScore: 85,
      sourceTags: ['accessories', 'magical-power', 'late-game'],
      dependsOn: ['magical_power_500'],
      unlocks: ['full_power_scaling', 'late_reforges'],
      gameStage: ['late', 'endgame'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkHOTMNodes(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const mining = profile.mining;
  const nodes = mining.hotmNodes;

  if (mining.hotmLevel < 7) return recs;

  // Check for key unpurchased nodes at HOTM 7+
  const keyNodes: Array<{ key: string; name: string; benefit: string }> = [
    { key: 'mining_speed_2', name: 'Mining Speed II', benefit: '+200 Mining Speed' },
    { key: 'mining_fortune_2', name: 'Mining Fortune II', benefit: '+50 Mining Fortune' },
    { key: 'gemstone_infusion', name: 'Gemstone Infusion', benefit: '+Gemstone drop rates' },
    { key: 'efficient_miner', name: 'Efficient Miner', benefit: 'AoE mining on veins' },
  ];

  const missing = keyNodes.filter(n => !nodes[n.key] || nodes[n.key] === 0);
  if (missing.length > 0) {
    recs.push({
      id: 'hotm_key_nodes',
      category: 'mining',
      title: `Unlock Key HOTM Nodes (${missing.length} missing)`,
      description: `You're HOTM ${mining.hotmLevel} but missing key nodes: ${missing.map(n => n.name).join(', ')}. These significantly improve mining income.`,
      whyItMatters: 'HOTM nodes compound — unlocking all key nodes at your level maximizes gemstone income and powder accumulation.',
      estimatedCost: mining.powderMithril + mining.powderGemstone > 50_000 ? 0 : 2_000_000,
      estimatedCostLabel: mining.powderMithril + mining.powderGemstone > 50_000 ? 'Use existing powder' : '~2M to buy powder',
      estimatedBenefit: missing.map(n => n.benefit).join(', '),
      roiScore: 82,
      urgencyScore: 70,
      progressionScore: 78,
      requirementScore: 40,
      confidenceScore: 80,
      sourceTags: ['mining', 'hotm', 'nodes'],
      dependsOn: [],
      unlocks: ['better_gemstone_income', 'powder_efficiency'],
      gameStage: ['mid', 'late', 'endgame'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkCoinsReserve(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const total = (profile.purseCoins ?? 0) + (profile.bankCoins ?? 0);
  const stage = determineGameStage(profile);

  // Low coin warning per game stage
  const minCoins: Record<typeof stage, number> = {
    early: 50_000,
    mid: 500_000,
    late: 5_000_000,
    endgame: 20_000_000,
  };

  if (total < minCoins[stage]) {
    recs.push({
      id: 'low_coins',
      category: 'money',
      title: 'Low Coin Reserve',
      description: `You only have ${formatCoins(total)} coins. For ${stage} game, you should have at least ${formatCoins(minCoins[stage])}. Consider farming or minion income first.`,
      whyItMatters: 'Coins are required for every upgrade. Running out of coins blocks all progression. Having a reserve prevents expensive emergency sales.',
      estimatedCost: 0,
      estimatedCostLabel: 'Earn coins through active play',
      estimatedBenefit: `${formatCoins(minCoins[stage] - total)} more coins to unlock upgrades`,
      roiScore: 70,
      urgencyScore: 85,
      progressionScore: 60,
      requirementScore: 0,
      confidenceScore: 90,
      sourceTags: ['coins', 'income', 'blocker'],
      dependsOn: [],
      unlocks: ['upgrade_ability'],
      gameStage: ['early', 'mid', 'late', 'endgame'],
      priority: total < minCoins[stage] / 5 ? 'critical' : 'high',
      type: 'blocker',
    });
  }

  return recs;
}

function checkFishingProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const fishingLevel = profile.skills.fishing;
  const activePet = profile.pets.find(p => p.active);

  // Low fishing level + no fishing pet
  if (fishingLevel < 10 && (profile.skills.average ?? 0) > 15) {
    recs.push({
      id: 'fishing_early',
      category: 'fishing',
      title: 'Level Fishing to 10',
      description: `Your Fishing skill is only ${fishingLevel}. Fishing 10 unlocks sea creature spawns and better items. It's one of the most passive skills to level.`,
      whyItMatters: 'Fishing skill provides Fishing Fortune (+4/level) and unlocks deeper water areas. AFK ocean fishing is very low effort.',
      estimatedCost: 0,
      estimatedCostLabel: 'AFK time only',
      estimatedBenefit: '+40 Fishing Fortune, sea creature unlocks',
      roiScore: 65,
      urgencyScore: 45,
      progressionScore: 60,
      requirementScore: 0,
      confidenceScore: 85,
      sourceTags: ['fishing', 'easy'],
      dependsOn: [],
      unlocks: ['sea_creatures', 'fishing_fortune', 'better_rods'],
      gameStage: ['early', 'mid'],
      priority: 'medium',
      type: 'progression',
    });
  }

  // No fishing pet active during fishing
  if (fishingLevel >= 15 && activePet && activePet.type !== 'FLYING_FISH' && activePet.type !== 'DOLPHIN' && activePet.type !== 'SQUID') {
    recs.push({
      id: 'fishing_pet',
      category: 'fishing',
      title: 'Use a Fishing Pet While Fishing',
      description: 'For fishing sessions, switch to a Flying Fish, Dolphin, or Squid pet for massively improved Fishing Fortune and sea creature rates.',
      whyItMatters: 'Fishing pets multiply drops. A Flying Fish legendary pet can add 100+ Fishing Fortune. Switching pets before fishing is always worth it.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M for a good fishing pet',
      estimatedBenefit: '+100+ Fishing Fortune, better sea creature loot, faster trophy fishing',
      roiScore: 80,
      urgencyScore: 60,
      progressionScore: 72,
      requirementScore: 20,
      confidenceScore: 85,
      sourceTags: ['fishing', 'pets'],
      dependsOn: [],
      unlocks: ['better_fishing_drops', 'trophy_fish_efficiency'],
      gameStage: ['mid', 'late'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkPetsProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const pets = profile.pets;
  const legendary = pets.filter(p => p.tier === 'LEGENDARY' || p.tier === 'MYTHIC');
  const avg = profile.skills.average ?? 0;

  // No legendary pets
  if (legendary.length === 0 && avg >= 20) {
    recs.push({
      id: 'first_legendary_pet',
      category: 'general',
      title: 'Get Your First Legendary Pet',
      description: 'You have no Legendary pets. A Legendary pet provides dramatically better bonuses than Epic or lower. Spider (Slayer) or Enchanting pets are affordable first choices.',
      whyItMatters: 'Legendary pets unlock their most powerful abilities and have significantly higher stat scaling. Even an affordable Legendary pet is a major upgrade.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5–20M for affordable legendary',
      estimatedBenefit: 'Double the stats of an Epic pet, unique legendary abilities',
      roiScore: 85,
      urgencyScore: 70,
      progressionScore: 78,
      requirementScore: 10,
      confidenceScore: 88,
      sourceTags: ['pets', 'legendary'],
      dependsOn: [],
      unlocks: ['legendary_pet_abilities', 'better_stat_bonuses'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'progression',
    });
  }

  return recs;
}

function checkGardenUpgrades(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const farming = profile.farming;
  const farmSkill = profile.skills.farming;

  // Garden level milestone recommendations
  if (farming.gardenLevel >= 3 && farming.gardenLevel < 7 && farmSkill >= 20) {
    recs.push({
      id: 'garden_level_7',
      category: 'farming',
      title: `Reach Garden Level 7 (currently ${farming.gardenLevel})`,
      description: 'Garden Level 7 unlocks all 24 crop plots and significant Farming Fortune bonuses from garden milestones.',
      whyItMatters: 'Each garden level unlocks more plots and provides passive Farming Fortune. Level 7 is the inflection point for serious farming setups.',
      estimatedCost: 0,
      estimatedCostLabel: 'Farm crops to gain Garden XP',
      estimatedBenefit: '+Farming Fortune, +plots, crop upgrade slots',
      roiScore: 80,
      urgencyScore: farming.gardenLevel < 5 ? 65 : 50,
      progressionScore: 78,
      requirementScore: 15,
      confidenceScore: 88,
      sourceTags: ['farming', 'garden', 'fortune'],
      dependsOn: [],
      unlocks: ['all_plots', 'garden_milestones', 'visitor_npcs'],
      gameStage: ['mid', 'late'],
      priority: 'medium',
      type: 'progression',
    });
  }

  // Crop upgrades: if farming is active but upgrades are low
  const cropUpgradeTotal = Object.values(farming.cropUpgrades ?? {}).reduce((s, v) => s + v, 0);
  if (farmSkill >= 25 && cropUpgradeTotal < 15 && farming.gardenLevel >= 3) {
    recs.push({
      id: 'crop_upgrades',
      category: 'farming',
      title: 'Level Up Crop Upgrades',
      description: `Your total crop upgrade levels are ${cropUpgradeTotal}. Each crop upgrade tier gives +1 Farming Fortune for that crop and unlocks faster collection.`,
      whyItMatters: 'Crop upgrades are one of the most efficient Farming Fortune sources per copper spent. Each level costs a fixed copper amount from garden visitors.',
      estimatedCost: 100_000,
      estimatedCostLabel: 'Copper from garden (grind)',
      estimatedBenefit: `+${Math.max(1, 10 - cropUpgradeTotal)} Farming Fortune per crop`,
      roiScore: 75,
      urgencyScore: 55,
      progressionScore: 70,
      requirementScore: 10,
      confidenceScore: 82,
      sourceTags: ['farming', 'garden', 'fortune', 'crop-upgrades'],
      dependsOn: [],
      unlocks: ['farming_fortune'],
      gameStage: ['mid', 'late'],
      priority: 'low',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkAccessoryPower(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const mp = profile.accessories.magicalPower;
  const selectedPower = profile.accessories.selectedPower;
  const powers = profile.accessories.powers ?? [];

  // No power selected
  if (mp >= 50 && !selectedPower) {
    recs.push({
      id: 'select_power',
      category: 'accessories',
      title: 'Select an Accessory Power',
      description: 'You have Magical Power but no Accessory Power selected. Go to your Accessory Bag and select a power from the Hex on the right.',
      whyItMatters: 'Accessory Powers provide major stat bonuses based on your Magical Power. Not selecting one means leaving significant stats on the table.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free — just select it',
      estimatedBenefit: '+Stats scaled by your Magical Power',
      roiScore: 99,
      urgencyScore: 95,
      progressionScore: 85,
      requirementScore: 0,
      confidenceScore: 99,
      sourceTags: ['accessories', 'magical-power', 'free'],
      dependsOn: [],
      unlocks: ['power_bonuses'],
      gameStage: ['early', 'mid', 'late', 'endgame'],
      priority: 'critical',
      type: 'blocker',
    });
  }

  // Has MP but very few unlocked powers
  if (mp >= 200 && powers.length < 3) {
    recs.push({
      id: 'unlock_more_powers',
      category: 'accessories',
      title: 'Unlock More Accessory Powers',
      description: `You have only ${powers.length} Accessory Power(s) unlocked. Powers like Sorrow, Ender, Bloodthirsty, and Warrior are strong picks for different builds.`,
      whyItMatters: 'Unlocking more powers gives you flexibility to swap between builds (e.g. Tank vs Damage). Powers are unlocked by crafting their corresponding accessories.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '5M–50M per power (varies)',
      estimatedBenefit: 'Build flexibility, optimal stats per activity',
      roiScore: 65,
      urgencyScore: 45,
      progressionScore: 60,
      requirementScore: 20,
      confidenceScore: 75,
      sourceTags: ['accessories', 'magical-power', 'powers'],
      dependsOn: [],
      unlocks: ['power_flexibility'],
      gameStage: ['mid', 'late', 'endgame'],
      priority: 'low',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkPetItems(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];

  const legendaryOrMythicPets = profile.pets.filter(
    p => (p.tier === 'LEGENDARY' || p.tier === 'MYTHIC') && !p.active
  );
  const activePet = profile.pets.find(p => p.active);

  // Active LEGENDARY/MYTHIC pet with no held item
  if (activePet && (activePet.tier === 'LEGENDARY' || activePet.tier === 'MYTHIC') && !activePet.heldItem) {
    recs.push({
      id: 'pet_item_active',
      category: 'general',
      title: `Equip a Pet Item on ${activePet.type.replace(/_/g, ' ')}`,
      description: `Your active ${activePet.tier.toLowerCase()} ${activePet.type.replace(/_/g, ' ')} has no held item. Pet items significantly boost your pet's effectiveness.`,
      whyItMatters: 'Pet items multiply the bonuses of LEGENDARY pets. A Minos Relic, Hunting Knife, or Dwarf Turtle Shieldberry can dramatically increase your output.',
      estimatedCost: 200_000,
      estimatedCostLabel: '200k–5M depending on item',
      estimatedBenefit: '+20–50% improved pet effectiveness',
      roiScore: 85,
      urgencyScore: 70,
      progressionScore: 75,
      requirementScore: 0,
      confidenceScore: 90,
      sourceTags: ['pets', 'items'],
      dependsOn: [],
      unlocks: ['pet_item_bonuses'],
      gameStage: ['mid', 'late', 'endgame'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  // Legendary pets sitting idle without held items (not active but still worth noting)
  const idleLegendaryNoItem = legendaryOrMythicPets.filter(p => !p.heldItem).slice(0, 2);
  for (const pet of idleLegendaryNoItem) {
    recs.push({
      id: `pet_item_idle_${pet.type}`,
      category: 'general',
      title: `Pet Item Missing: ${pet.type.replace(/_/g, ' ')}`,
      description: `Your ${pet.tier.toLowerCase()} ${pet.type.replace(/_/g, ' ')} has no held item. When you switch to this pet, you'll be leaving stats on the table.`,
      whyItMatters: 'Even when not active, equipping pet items now means you\'re ready to swap. Items are often cheap relative to the pets they boost.',
      estimatedCost: 200_000,
      estimatedCostLabel: '200k+',
      estimatedBenefit: 'Ready to maximize pet when switching',
      roiScore: 55,
      urgencyScore: 40,
      progressionScore: 50,
      requirementScore: 0,
      confidenceScore: 80,
      sourceTags: ['pets', 'items'],
      dependsOn: [],
      unlocks: [],
      gameStage: ['mid', 'late', 'endgame'],
      priority: 'low',
      type: 'cheapest',
    });
  }

  return recs;
}

function checkMuseumValue(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  // Post-patch 0.20.7: Museum gives Bits Multiplier + Bank Interest (NOT Magical Power).
  // 30 milestones, each = +1% Bits Multiplier, +2% Bank Interest Rate.
  // Recommend donating for mid+ players since Bits and Bank interest compound over time.
  if ((profile.skyblockLevel ?? 0) >= 60) {
    recs.push({
      id: 'museum_donate',
      category: 'general',
      title: 'Donate Items to the Museum',
      description: 'The Museum grants up to 30 milestones from donated item value. Each milestone gives +1% Bits Multiplier and +2% Bank Interest Rate — up to +30% Bits and +60% Bank.',
      whyItMatters: 'Bits buy valuable items from Elizabeth (Cookie, Booster Cookie, etc.). Bank Interest compounds passively. Donating old weapons/armor you\'ve replaced is essentially free progress.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free (donate items you no longer use)',
      estimatedBenefit: '+Bits Multiplier, +Bank Interest Rate per milestone',
      roiScore: 85,
      urgencyScore: 50,
      progressionScore: 65,
      requirementScore: 0,
      confidenceScore: 88,
      sourceTags: ['museum', 'bits', 'bank', 'free'],
      dependsOn: [],
      unlocks: ['museum_milestones', 'bits_income'],
      gameStage: ['mid', 'late', 'endgame'],
      priority: 'medium',
      type: 'cheapest',
    });
  }

  return recs;
}

function checkCriticalBlockers(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];

  // No pets active
  const activePet = profile.pets.find(p => p.active);
  if (!activePet) {
    recs.push({
      id: 'activate_pet',
      category: 'general',
      title: 'Equip an Active Pet',
      description: 'You have no active pet! Pets provide significant passive bonuses. Even a common pet is better than nothing.',
      whyItMatters: 'An active pet is one of the highest-value free improvements. Pets provide passive stat bonuses and some have extremely powerful abilities.',
      estimatedCost: 5_000,
      estimatedCostLabel: '~5k (cheap common pet from AH)',
      estimatedBenefit: 'Passive stat bonuses, pet XP, pet abilities',
      roiScore: 99,
      urgencyScore: 99,
      progressionScore: 90,
      requirementScore: 0,
      confidenceScore: 99,
      sourceTags: ['pets', 'blocker', 'free'],
      dependsOn: [],
      unlocks: ['pet_bonuses', 'pet_progression'],
      gameStage: ['early', 'mid', 'late', 'endgame'],
      priority: 'critical',
      type: 'blocker',
    });
  }

  // Very low fairy souls
  if (profile.fairySouls < 20 && profile.skyblockLevel > 5) {
    recs.push({
      id: 'fairy_souls_20',
      category: 'general',
      title: 'Collect More Fairy Souls',
      description: `You only have ${profile.fairySouls} Fairy Souls. Every 5 souls traded to Tia the Fairy gives +10 SkyBlock XP and unlocks Backpack slots at milestones. Note: stat bonuses were removed in September 2022.`,
      whyItMatters: 'Fairy Souls give free SkyBlock XP (important for level gates like Garden at L5, Bazaar at L7, Rift at L12) and additional Backpack slots. They are scattered across all islands.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free (exploration only)',
      estimatedBenefit: `+${Math.floor((267 - profile.fairySouls) / 5) * 10} SkyBlock XP remaining + Backpack slot unlocks`,
      roiScore: 95,
      urgencyScore: 80,
      progressionScore: 70,
      requirementScore: 0,
      confidenceScore: 95,
      sourceTags: ['fairy-souls', 'free', 'exploration'],
      dependsOn: [],
      unlocks: ['permanent_stats'],
      gameStage: ['early', 'mid'],
      priority: profile.fairySouls < 5 ? 'high' : 'medium',
      type: 'cheapest',
    });
  }

  return recs;
}

function checkDungeonClassMeta(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const cat = profile.dungeons.catacombs.level;
  const selectedClass = profile.dungeons.selectedClass;
  const highestFloor = profile.dungeons.catacombs.highestFloor;

  // Early: push to Berserker if not already
  if (cat >= 5 && cat < 20 && selectedClass !== 'berserk') {
    recs.push({
      id: 'dungeon_class_berserk_early',
      category: 'dungeons',
      title: 'Switch to Berserker Class (Early Game)',
      description: `You're playing ${selectedClass} at Catacombs ${cat}. Early game, Berserker is the strongest class — best DPS with AotD and Strong Dragon Armor (64.6% community vote).`,
      whyItMatters: 'Berserker dominates early dungeons. Switch to Archer once you have Terminator, or Mage with Hyperion. Until then, Berserker is the clearest choice.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free — just change class at NPC',
      estimatedBenefit: 'Higher DPS, faster floor clears, more Catacombs XP/hr',
      roiScore: 80,
      urgencyScore: 60,
      progressionScore: 72,
      requirementScore: 0,
      confidenceScore: 90,
      sourceTags: ['dungeons', 'class', 'berserker'],
      dependsOn: [],
      unlocks: ['faster_dungeon_clears'],
      gameStage: ['early', 'mid'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  // Late: push to Archer if no class transition yet and has F6+
  if (highestFloor >= 6 && cat >= 20 && selectedClass === 'berserk') {
    recs.push({
      id: 'dungeon_class_transition',
      category: 'dungeons',
      title: 'Plan Your Class Transition (Archer or Mage)',
      description: 'At late game, Archer with Terminator (49.2% community vote) or Mage with Hyperion are dominant. Berserker is still viable but loses ground at higher floors.',
      whyItMatters: 'The meta transition point is weapon-driven: get Terminator → switch to Archer; get Hyperion → switch to Mage. Healer is obsolete at F6+.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free class change; cost is in the weapon',
      estimatedBenefit: 'Faster F7/MM clears, higher loot value per hour',
      roiScore: 75,
      urgencyScore: 55,
      progressionScore: 78,
      requirementScore: 40,
      confidenceScore: 88,
      sourceTags: ['dungeons', 'class', 'archer', 'mage', 'late-game'],
      dependsOn: [],
      unlocks: ['optimized_dungeon_clears'],
      gameStage: ['late', 'endgame'],
      priority: 'medium',
      type: 'progression',
    });
  }

  return recs;
}

function checkEquipmentSlots(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const avg = profile.skills.average ?? 0;
  const cat = profile.dungeons.catacombs.level;

  // Equipment slots (necklace/belt/cloak/gloves) — recommend if mid+ and presumably not equipped
  // We can't read equipment from API directly without NBT, so suggest it for mid+ players
  if (avg >= 20 || cat >= 10) {
    recs.push({
      id: 'equipment_slots',
      category: 'combat',
      title: 'Fill Your Equipment Slots',
      description: 'Equipment slots (Necklace, Belt, Cloak, Gloves) provide stats separate from armor. Current meta: Bone Necklace, Adaptive Belt, Shadow Assassin Cloak, Soul Weaver Gloves — all fragged from dungeons.',
      whyItMatters: 'Equipment slots are pure stat additions on top of your armor. Fragged equipment pieces from dungeons are the best early option and cost little.',
      estimatedCost: 500_000,
      estimatedCostLabel: '~500k (fragged equipment from AH)',
      estimatedBenefit: '+Stats from 4 extra equipment slots',
      roiScore: 85,
      urgencyScore: 72,
      progressionScore: 78,
      requirementScore: 15,
      confidenceScore: 90,
      sourceTags: ['equipment', 'gear', 'mid-game'],
      dependsOn: [],
      unlocks: ['equipment_bonuses'],
      gameStage: ['mid', 'late', 'endgame'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkGlaciteTunnels(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const mining = profile.mining;

  // HOTM 7 gate for Glacite Tunnels
  if (mining.hotmLevel >= 5 && mining.hotmLevel < 7) {
    recs.push({
      id: 'hotm_7_glacite',
      category: 'mining',
      title: `Reach HOTM 7 for Glacite Tunnels (currently ${mining.hotmLevel})`,
      description: 'HOTM 7 + Secret Railroad Pass unlocks Glacite Tunnels — the best mining income source. Mining below HOTM 7 is inefficient by community consensus.',
      whyItMatters: 'Glacite Tunnels are significantly more profitable than surface mining. HOTM 7 is the access gate alongside the Secret Railroad Pass (crafted from Corleonite).',
      estimatedCost: 0,
      estimatedCostLabel: 'Mine to earn Powder, then spend it',
      estimatedBenefit: 'Access to Glacite Tunnels (top mining income)',
      roiScore: 88,
      urgencyScore: 70,
      progressionScore: 85,
      requirementScore: 25,
      confidenceScore: 92,
      sourceTags: ['mining', 'hotm', 'glacite-tunnels'],
      dependsOn: [],
      unlocks: ['glacite_tunnels', 'divan_armor', 'gemstone_income'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'progression',
    });
  }

  return recs;
}

// ─── Main Engine ───────────────────────────────────────────────────────────────

export function generateRecommendations(profile: PlayerProfile, bazaar?: BazaarPrices): RecommendationSet {
  const gameStage = determineGameStage(profile);

  // Collect all recommendations from all rule modules
  const all: Recommendation[] = [
    ...checkCriticalBlockers(profile),
    ...checkCoinsReserve(profile),
    ...checkSkillsProgression(profile),
    ...checkSlayerProgression(profile, bazaar),
    ...checkDungeonProgression(profile),
    ...checkMagicalPower(profile, bazaar),
    ...checkFarmingProgression(profile),
    ...checkMiningProgression(profile),
    ...checkGearProgression(profile),
    ...checkLateGameProgression(profile),
    ...checkHOTMNodes(profile),
    ...checkFishingProgression(profile),
    ...checkPetsProgression(profile),
    ...checkPetItems(profile),
    ...checkMuseumValue(profile),
    ...checkGardenUpgrades(profile),
    ...checkAccessoryPower(profile),
    ...checkDungeonClassMeta(profile),
    ...checkEquipmentSlots(profile),
    ...checkGlaciteTunnels(profile),
  ];

  // Filter by game stage relevance — include current stage + adjacent stages
  const stageOrder: GameStage[] = ['early', 'mid', 'late', 'endgame'];
  const stageIdx = stageOrder.indexOf(gameStage);
  const relevantStages = new Set<GameStage>([
    gameStage,
    stageOrder[stageIdx - 1],
    stageOrder[stageIdx + 1],
  ].filter(Boolean) as GameStage[]);
  const relevant = all.filter(r => r.gameStage.some(s => relevantStages.has(s)) || r.type === 'blocker');

  // Sort by composite score
  const scored = relevant.sort((a, b) => {
    const scoreA = a.urgencyScore * 0.35 + a.progressionScore * 0.35 + a.roiScore * 0.3;
    const scoreB = b.urgencyScore * 0.35 + b.progressionScore * 0.35 + b.roiScore * 0.3;
    return scoreB - scoreA;
  });

  // Categorize
  const byCategory: Record<RecommendationCategory, Recommendation[]> = {
    general: [], farming: [], mining: [], dungeons: [], slayer: [],
    fishing: [], accessories: [], skills: [], combat: [], money: [],
  };
  for (const r of scored) {
    byCategory[r.category]?.push(r);
  }

  const blockers = scored.filter(r => r.type === 'blocker' || r.priority === 'critical');
  const cheapest = [...scored].sort((a, b) => (a.estimatedCost ?? 999_999_999) - (b.estimatedCost ?? 999_999_999)).slice(0, 5);
  const bestROI = [...scored].sort((a, b) => b.roiScore - a.roiScore).slice(0, 5);
  const fastest = [...scored].sort((a, b) => (b.roiScore + b.urgencyScore) - (a.roiScore + a.urgencyScore)).slice(0, 5);

  return {
    playerId: profile.uuid,
    profileId: profile.profileId,
    generatedAt: Date.now(),
    gameStage,
    topPick: scored[0] ?? blockers[0],
    cheapest,
    bestROI,
    fastest,
    blockers,
    byCategory,
    all: scored,
  };
}
