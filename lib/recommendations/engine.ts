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

  // High MP milestone
  if (mp >= 400 && mp < 600) {
    recs.push({
      id: 'magical_power_600',
      category: 'accessories',
      title: 'Reach 600 Magical Power',
      description: `You're at ${mp} MP. 600 MP is the late-game talisman target. Epic and Legendary accessories dramatically increase your power scaling.`,
      whyItMatters: '600 MP unlocks the full potential of your accessory reforges and power stones. It\'s a significant damage/defense multiplier.',
      estimatedCost: 40_000_000,
      estimatedCostLabel: '~40M (epic/legendary accessories)',
      estimatedBenefit: '+25-40% additional stat scaling, access to higher-tier power stones',
      roiScore: 80,
      urgencyScore: 68,
      progressionScore: 82,
      requirementScore: 30,
      confidenceScore: 85,
      sourceTags: ['accessories', 'magical-power', 'late-game'],
      dependsOn: ['magical_power_400'],
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
