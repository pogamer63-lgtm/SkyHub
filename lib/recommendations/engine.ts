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
      description: `You're at Zombie Slayer ${zombie.level}. Reaching level 5 unlocks Revenant armor, which is a huge early-mid game upgrade. Costs roughly 1-2M coins in slayer XP to complete.`,
      whyItMatters: 'Zombie Slayer Level 5 unlocks Revenant Armor — one of the best early progression sets. It also unlocks the Revenant Horror boss for consistent combat XP.',
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

  if (enderman.level < 3 && profile.skills.combat >= 20 && zombie.level >= 5) {
    recs.push({
      id: 'slayer_enderman_3',
      category: 'slayer',
      title: 'Unlock Enderman Slayer Level 3',
      description: `Enderman Slayer level 3 unlocks Midas Staff and Wither armor progression paths. You need Combat ${profile.skills.combat}/20 — you're there!`,
      whyItMatters: 'Enderman slayer is the gateway to Wither armor progression. Level 3 gives you access to key late-game items.',
      estimatedCost: 3_000_000,
      estimatedCostLabel: '~3M coins',
      estimatedBenefit: 'Wither armor pathway, better combat damage',
      roiScore: 78,
      urgencyScore: 72,
      progressionScore: 82,
      requirementScore: 40,
      confidenceScore: 88,
      sourceTags: ['slayer', 'enderman', 'mid-game'],
      dependsOn: ['slayer_zombie_5'],
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

  if (cat.level >= 15 && cat.highestFloor < 6) {
    recs.push({
      id: 'dungeon_floor6',
      category: 'dungeons',
      title: 'Progress to Floor 6 (Livid)',
      description: `You're Catacombs ${cat.level} but haven't completed Floor 6. Floor 6 is the gateway to Necron armor parts and significantly better gear.`,
      whyItMatters: 'Floor 6 (Livid) drops are essential for mid-game progression. Livid Dagger and Floor 6 gear are strong stepping stones.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M (gear improvements)',
      estimatedBenefit: 'Livid Dagger, Wither armor pieces, Catacombs XP',
      roiScore: 80,
      urgencyScore: 78,
      progressionScore: 85,
      requirementScore: 50,
      confidenceScore: 87,
      sourceTags: ['dungeons', 'mid-game', 'f6'],
      dependsOn: [],
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

  if (mp < 200) {
    recs.push({
      id: 'magical_power_200',
      category: 'accessories',
      title: 'Reach 200 Magical Power',
      description: `You have ${mp} Magical Power. Reaching 200 MP is a key early milestone that significantly boosts your stats from talisman synergies.`,
      whyItMatters: 'Magical Power multiplies your stats from accessories. Low MP means you are wasting a huge stat multiplier that costs relatively little to fill.',
      estimatedCost: cheapAccessoryCost,
      estimatedCostLabel: cheapAccessoryLabel,
      estimatedBenefit: '+15-25% to all stats from MP scaling',
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

  if (mp >= 200 && mp < 400) {
    recs.push({
      id: 'magical_power_400',
      category: 'accessories',
      title: 'Reach 400 Magical Power',
      description: `You're at ${mp} MP. Reaching 400 MP opens up significantly stronger power stat scaling and lets you use better Reforge Stones effectively.`,
      whyItMatters: '400 MP is the mid-game talisman target. Getting there requires filling in uncommon/rare accessories, which also individually provide useful stats.',
      estimatedCost: 10_000_000,
      estimatedCostLabel: '~10M coins',
      estimatedBenefit: '+20-30% additional stat scaling over current',
      roiScore: 82,
      urgencyScore: 75,
      progressionScore: 80,
      requirementScore: 15,
      confidenceScore: 88,
      sourceTags: ['accessories', 'magical-power', 'mid-game'],
      dependsOn: ['magical_power_200'],
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
      estimatedCostLabel: 'Free to unlock (need SB Level 12)',
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
      description: `You only have ${profile.fairySouls} Fairy Souls. Each group of 5 souls traded to Tia gives +3 HP/Defense/Strength/Speed permanently.`,
      whyItMatters: 'Fairy Souls are completely free permanent stat bonuses. There is no reason to skip them — they are located throughout the SkyBlock world.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free (exploration only)',
      estimatedBenefit: `+${Math.floor((20 - profile.fairySouls) / 5) * 3} HP/Defense/Strength for free`,
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

// ─── Main Engine ───────────────────────────────────────────────────────────────

export function generateRecommendations(profile: PlayerProfile, bazaar?: BazaarPrices): RecommendationSet {
  const gameStage = determineGameStage(profile);

  // Collect all recommendations from all rule modules
  const all: Recommendation[] = [
    ...checkCriticalBlockers(profile),
    ...checkSkillsProgression(profile),
    ...checkSlayerProgression(profile, bazaar),
    ...checkDungeonProgression(profile),
    ...checkMagicalPower(profile, bazaar),
    ...checkFarmingProgression(profile),
    ...checkMiningProgression(profile),
  ];

  // Filter by game stage relevance
  const relevant = all.filter(r => r.gameStage.includes(gameStage) || r.type === 'blocker');

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
