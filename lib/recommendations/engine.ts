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
import type { ElectionData } from '@/lib/api/election';

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
    profile.slayers.enderman.level,
    profile.slayers.blaze.level,
    profile.slayers.vampire.level,
  );
  // Enderman 3+ or Blaze 2+ means the player has completed mid-game slayer gates — force at least late
  if (profile.slayers.enderman.level >= 3 || profile.slayers.blaze.level >= 2) {
    if (avg >= 50 && cat >= 35) return 'endgame';
    return 'late';
  }
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
    { name: 'Hunting', level: skills.hunting ?? 0, key: 'hunting' },
  ];

  // Identify most lagging skill
  const lagging = skillChecks.sort((a, b) => (a.level as number) - (b.level as number))[0];

  // Per-skill benefit overrides based on research
  function getSkillBenefit(key: string, level: number): string {
    const remaining = 25 - level;
    if (key === 'hunting') return `+${remaining} Hunter Fortune, scaling coin rewards per level (max level 25 — Foraging Update)`;
    if (key === 'foraging') return `+${remaining * 4} Foraging Fortune from skill levels (max level 54 — raised from 50 in Foraging Update)`;
    return `+${5 * remaining} stat points, access to higher-tier content`;
  }

  if ((lagging.level as number) < 20) {
    recs.push({
      id: `skill_${lagging.key}_boost`,
      category: 'skills',
      title: `Level up ${lagging.name} Skill`,
      description: `Your ${lagging.name} skill is only level ${lagging.level}, which is significantly below average. Skill levels provide important stat bonuses and unlock content.`,
      whyItMatters: `Skills provide passive stat bonuses, unlock recipes, and increase your SkyBlock level. ${lagging.name} at level ${lagging.level} is leaving significant stats on the table.`,
      estimatedCost: 0,
      estimatedCostLabel: 'Time investment',
      estimatedBenefit: getSkillBenefit(lagging.key as string, lagging.level as number),
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

  // Correct unlock chain (wiki-confirmed, user-verified April 2026): Zombie T2 → Spider, Spider T2 → Wolf, Wolf T4 → Enderman, Enderman T3 → Blaze
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
      description: `Wolf Slayer unlocks after Spider T2. You're at Wolf ${wolf.level}. Level 4 unlocks Werewolf Armor and — critically — Wolf T4 is required to unlock Enderman Slayer.`,
      whyItMatters: 'Wolf is third in the unlock chain (after Spider). Wolf T4 is the gate to Enderman Slayer; Level 4 also gives Werewolf Armor which has strong combat bonuses.',
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

  if (enderman.level < 3 && wolf.level >= 4 && profile.skills.combat >= 20) {
    recs.push({
      id: 'slayer_enderman_3',
      category: 'slayer',
      title: 'Unlock Enderman Slayer Level 3',
      description: `Enderman Slayer unlocks after Wolf T4. You're at Enderman ${enderman.level}. Level 3 unlocks Ender armor bonuses and — critically — Enderman T3 is required to unlock Blaze Slayer.`,
      whyItMatters: 'Note: Enderman slayer itself has poor coin/hr in 2026 (Judgement Core prices fell). Do it for progression — Enderman T3 unlocks Blaze Slayer, which earns 50M+/hr and opens Crimson Isle.',
      estimatedCost: 3_000_000,
      estimatedCostLabel: '~3M coins',
      estimatedBenefit: 'Unlocks Blaze Slayer (50M+/hr), Etherwarp Conduit at Eman 7, Wither progression path',
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

  // F4 — Thorn boss (entrance requires Cat 8; recommend when Cat 5+)
  if (cat.level >= 5 && cat.level < 11 && cat.highestFloor < 4) {
    recs.push({
      id: 'dungeon_floor4',
      category: 'dungeons',
      title: 'Complete Floor 4 — Thorn',
      description: `You're Catacombs ${cat.level}. Floor 4 requires Cat 8 to enter (boss: Thorn). It drops Wither Essence, decent XP, and ~200k coins per run. A key step before Floor 5.`,
      whyItMatters: 'F4 is the bridge between F3 and F5. Clearing it consistently raises Catacombs level toward the Cat 14 requirement for F5 (Shadow Assassin unlock). Thorn is a straightforward boss with good loot for the stage.',
      estimatedCost: 500_000,
      estimatedCostLabel: '~500k (gear to clear F4 comfortably)',
      estimatedBenefit: 'Catacombs XP, Wither Essence, ~200k coins/run, path to F5',
      roiScore: 80,
      urgencyScore: 82,
      progressionScore: 83,
      requirementScore: 15,
      confidenceScore: 90,
      sourceTags: ['dungeons', 'f4', 'thorn', 'early-mid'],
      dependsOn: ['dungeon_floor3'],
      unlocks: ['f5_pathway', 'wither_essence'],
      gameStage: ['early', 'mid'],
      priority: 'high',
      type: 'progression',
    });
  }

  // F5 — Shadow Assassin unlock (entrance requires Cat 14; recommend when Cat 11+)
  if (cat.level >= 11 && cat.highestFloor < 5) {
    recs.push({
      id: 'dungeon_floor5',
      category: 'dungeons',
      title: 'Complete Floor 5 — Livid (Shadow Assassin Unlock)',
      description: `You're Catacombs ${cat.level}. Floor 5 requires Cat 14 to enter (boss: Livid). It drops Shadow Assassin Armor and Livid Dagger — both are key mid-game gear.`,
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

  // F6 — Sadan boss, entrance requires Cat 19; recommend when Cat 17+
  if (cat.level >= 17 && cat.highestFloor < 6) {
    recs.push({
      id: 'dungeon_floor6',
      category: 'dungeons',
      title: 'Progress to Floor 6 — Sadan (Necron Armor Pathway)',
      description: `You're Catacombs ${cat.level}. Floor 6 requires Cat 19 to enter (boss: Sadan). It drops Wither armor pieces including Necron parts and the Giant Sword.`,
      whyItMatters: 'Floor 6 (Sadan) is the gateway to Wither armor progression. Necron armor pieces and Giant Sword drop here — essential for F7 prep.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M (gear improvements)',
      estimatedBenefit: 'Wither armor pieces (Necron parts), Giant Sword, Catacombs XP',
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

  // Jacob's Contest — if farming-active player has never participated
  const totalMedals = (farming.jacobMedalsEarned?.bronze ?? 0)
    + (farming.jacobMedalsEarned?.silver ?? 0)
    + (farming.jacobMedalsEarned?.gold ?? 0)
    + (farming.jacobMedalsEarned?.platinum ?? 0)
    + (farming.jacobMedalsEarned?.diamond ?? 0);

  if (farmSkill >= 10 && totalMedals === 0) {
    recs.push({
      id: 'jacob_contests',
      category: 'farming',
      title: 'Enter Jacob\'s Farming Contests',
      description: `You have Farming ${farmSkill} but have never entered a Jacob's Contest. Contests run 3× per day and award medals used to buy Anita's Extra Farming Fortune perk (+4 FF per tier, up to +60 FF).`,
      whyItMatters: "Anita's Extra Farming Fortune perk (bought with Jacob medals) gives up to +60 Farming Fortune — one of the largest single FF sources in the game. Medals come exclusively from Jacob's Contests. Every farming player should participate regularly.",
      estimatedCost: 0,
      estimatedCostLabel: 'Free — speak to Jacob in the Hub',
      estimatedBenefit: 'Up to +60 Farming Fortune from Anita perk; bronze medals are easy to earn',
      roiScore: 88,
      urgencyScore: 75,
      progressionScore: 80,
      requirementScore: 5,
      confidenceScore: 95,
      sourceTags: ['farming', 'jacob', 'contests', 'farming-fortune'],
      dependsOn: [],
      unlocks: ['anita_ff_perk', 'farming_fortune'],
      gameStage: ['early', 'mid', 'late'],
      priority: 'high',
      type: 'best_roi',
    });
  }

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
      priority: mining.hotmLevel <= 1 ? 'high' : 'medium',
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
  const { blaze, vampire, enderman } = profile.slayers;

  // Push to MM when F7 is cleared
  if (profile.dungeons.catacombs.highestFloor >= 7 && cat >= 24 && profile.dungeons.masterMode.highestFloor === 0) {
    recs.push({
      id: 'enter_master_mode',
      category: 'dungeons',
      title: 'Start Master Mode Dungeons',
      description: 'You\'ve cleared F7! Master Mode 1 unlocks at Catacombs 24 (same as F7). MM3 requires Cat 28, MM5 requires Cat 32, MM7 requires Cat 36. MM drops are significantly more valuable.',
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

  // Blaze slayer for Crimson Isle access — requires Enderman T3 to unlock
  if (blaze.level < 4 && enderman.level >= 3 && profile.skills.combat >= 30 && cat >= 20) {
    recs.push({
      id: 'slayer_blaze_4',
      category: 'slayer',
      title: 'Push Blaze Slayer to Level 4',
      description: 'Blaze Slayer unlocks after Enderman T3. Level 4 unlocks Crimson Isle faction quests, Kuudra access, and Blaze is currently the most profitable slayer at 50M+/hr.',
      whyItMatters: 'Blaze Slayer is the top-earning slayer in 2026 (50M+/hr, ahead of Spider and Wolf). Drops Vertexes and Apexes for high-end gear. Also gates Kuudra (70M–90M/hr endgame). Worth prioritizing over Enderman for income.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M in consumables',
      estimatedBenefit: 'Blaze T4: 50M+/hr; Crimson Isle + Kuudra access (70M–90M/hr endgame)',
      roiScore: 90,
      urgencyScore: 82,
      progressionScore: 88,
      requirementScore: 50,
      confidenceScore: 82,
      sourceTags: ['slayer', 'blaze', 'crimson-isle', 'late-game'],
      dependsOn: ['slayer_enderman_3'],
      unlocks: ['crimson_isle', 'kuudra_access', 'mage_outfit'],
      gameStage: ['late', 'endgame'],
      priority: 'medium',
      type: 'progression',
    });
  }

  // Vampire slayer — requires Rift progression (NOT tied to Blaze T3 — separate unlock chain)
  // Unlock path: Enter Rift (Thaumaturgist in Hub / Wizard Portal in Wilderness) → progress questline
  // → reach Stillgore Château → talk to Maddox → kill Thralls/Fledglings/Splatters to summon boss
  // Requires Rift-specific gear (Coven Leggings + Steak Stake/Silver Karambit). Holy Ice needed T2+.
  if (vampire.level < 3 && profile.skyblockLevel >= 12) {
    recs.push({
      id: 'slayer_vampire_3',
      category: 'slayer',
      title: 'Unlock Vampire Slayer Level 3',
      description: 'Vampire Slayer (Riftstalker Bloodfiend) is Rift-exclusive — NOT unlocked via Blaze. Enter the Rift via the Thaumaturgist in the Hub (or Wizard Portal in the Wilderness). Progress the Rift questline through Dreadfarm and Village Plaza until you reach Stillgore Château. Find Maddox there to start Vampire Slayer. Requires Rift-specific gear: Coven Leggings + Steak Stake or Silver-Laced Karambit. Bring Holy Ice for Tier 2+.',
      whyItMatters: 'Vampire slayer is Rift-exclusive and uses Motes as currency. RNG Meter unlocks at T3, guaranteeing rare drops. Unique accessories and Bat Person pet are valuable.',
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

  // Endgame MP push: 750 → 1000 (absolute max outside dungeons: 1963; 1000 is community endgame tier)
  if (mp >= 750 && mp < 1000) {
    recs.push({
      id: 'magical_power_1000',
      category: 'accessories',
      title: 'Grow Your Magical Power (Endgame Goal: 1000)',
      description: `You're at ${mp} MP. 1000 MP is the endgame community benchmark (absolute max outside dungeons is 1963). Legendary/Mythic accessories and Rift-exclusive accessories are the primary source of MP gains at this tier.`,
      whyItMatters: 'MP scales logarithmically — every additional point still improves your stats, even at 1000+. Rift accessories (Motes currency) are the most efficient MP source at this tier, as overworld Legendary accessories become exponentially expensive.',
      estimatedCost: 100_000_000,
      estimatedCostLabel: '~100M+ (legendary accessories + Rift farming)',
      estimatedBenefit: 'Proportional stat scaling gains; Legendary/Rift accessories add their own stats on top',
      roiScore: 75,
      urgencyScore: 55,
      progressionScore: 78,
      requirementScore: 40,
      confidenceScore: 85,
      sourceTags: ['accessories', 'magical-power', 'endgame', 'rift'],
      dependsOn: ['magical_power_750'],
      unlocks: ['endgame_power_scaling'],
      gameStage: ['endgame'],
      priority: 'medium',
      type: 'best_roi',
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

  if (mining.hotmLevel < 3) return recs;

  // HOTM node priority (user-verified April 2026):
  // Phase 1 (HOTM 1-6 FOUNDATION): Mining Speed I/II + Mining Fortune I/II + Efficient Miner
  //   → Skip Cheapskate and Star Powder — these are TRAPS in 2026 (marginal benefit vs active mining)
  // Phase 2 (HOTM 7 POWDER): Great Explorer #1 (chest chance in Crystal Hollows), then Mole + Powder Buff
  //   → Star Powder still a trap: daily yield too low vs active Glacite/Hollows mining
  // Phase 3 (HOTM 8-10 ENDGAME): Surveyor (Glacite Mine Shafts), Strong Arm, Metal Head, then Pristine (T10)
  //   → Pristine is the #1 profit stat for gemstone mining once unlocked

  // Phase 1: Foundation nodes (HOTM 3-6)
  if (mining.hotmLevel >= 3 && mining.hotmLevel < 7) {
    const foundationNodes: Array<{ key: string; name: string; benefit: string }> = [
      { key: 'mining_speed_boost', name: 'Mining Speed Boost', benefit: '+Mining Speed for faster block breaking' },
      { key: 'mining_fortune_boost', name: 'Mining Fortune Boost', benefit: '+Mining Fortune for better drops' },
      { key: 'efficient_miner', name: 'Efficient Miner', benefit: 'AoE mining — essential for commission quests' },
    ];
    const missing = foundationNodes.filter(n => !nodes[n.key] || nodes[n.key] === 0);
    if (missing.length > 0) {
      recs.push({
        id: 'hotm_foundation_nodes',
        category: 'mining',
        title: `Unlock Foundation HOTM Nodes (${missing.length} missing)`,
        description: `You're HOTM ${mining.hotmLevel} and missing key early nodes: ${missing.map(n => n.name).join(', ')}. Prioritize Mining Speed/Fortune and Efficient Miner. Skip Star Powder and Cheapskate — they are weak in 2026 compared to actively mining in Glacite Tunnels or Crystal Hollows.`,
        whyItMatters: 'Efficient Miner enables multi-block AoE mining which massively speeds up commission quests (fastest path to HOTM 7). Mining Speed and Fortune provide consistent improvements to all content. Star Powder and Cheapskate are commonly over-invested in — save tokens for these three first.',
        estimatedCost: mining.powderMithril > 20_000 ? 0 : 500_000,
        estimatedCostLabel: mining.powderMithril > 20_000 ? 'Use existing Mithril powder' : '~500k to get started',
        estimatedBenefit: missing.map(n => n.benefit).join(', '),
        roiScore: 85,
        urgencyScore: 75,
        progressionScore: 80,
        requirementScore: 20,
        confidenceScore: 85,
        sourceTags: ['mining', 'hotm', 'nodes', 'efficient-miner'],
        dependsOn: [],
        unlocks: ['faster_commissions', 'mining_income'],
        gameStage: ['mid'],
        priority: 'high',
        type: 'best_roi',
      });
    }
  }

  // Phase 2: HOTM 7 — Great Explorer is #1 priority
  if (mining.hotmLevel >= 7) {
    const greatExplorerLevel = nodes['great_explorer'] ?? 0;
    if (greatExplorerLevel < 5) {
      recs.push({
        id: 'hotm_great_explorer',
        category: 'mining',
        title: 'Max Great Explorer — #1 Priority at HOTM 7',
        description: `Your Great Explorer is level ${greatExplorerLevel}/5. This is the most important node at HOTM 7 — it massively increases the chance of finding Treasure Chests in Crystal Hollows, which are the primary source of Gemstone powder and high-value loot. After Great Explorer, max Mole and Powder Buff.`,
        whyItMatters: 'Crystal Hollow Treasure Chests are the most powder-efficient source of Gemstone powder — required for Glacite node upgrades. Great Explorer is the single highest-return investment at HOTM 7. Star Powder (daily passive) and Cheapskate provide far less value in 2026.',
        estimatedCost: mining.powderGemstone > 100_000 ? 0 : 3_000_000,
        estimatedCostLabel: mining.powderGemstone > 100_000 ? 'Use your Gemstone powder' : '~3M to farm powder first',
        estimatedBenefit: `+${(5 - greatExplorerLevel) * 8}% chest chance in Crystal Hollows → dramatically more powder`,
        roiScore: 90,
        urgencyScore: 82,
        progressionScore: 85,
        requirementScore: 40,
        confidenceScore: 88,
        sourceTags: ['mining', 'hotm', 'great-explorer', 'crystal-hollows'],
        dependsOn: [],
        unlocks: ['powder_income', 'crystal_hollow_chests'],
        gameStage: ['mid', 'late'],
        priority: 'high',
        type: 'best_roi',
      });
    }

    // Phase 3 (HOTM 8+): Surveyor for Glacite Mine Shafts
    if (mining.hotmLevel >= 8) {
      const surveyorLevel = nodes['surveyor'] ?? 0;
      if (surveyorLevel < 5) {
        recs.push({
          id: 'hotm_surveyor',
          category: 'mining',
          title: 'Unlock Surveyor Node — Key for Glacite Profit',
          description: `Surveyor is level ${surveyorLevel}/5. This HOTM 8+ node increases Glacite Mine Shaft spawn chance — Mine Shafts are the highest-value content in Glacite Tunnels (best powder, rare drops, Peridot gems). After Surveyor, unlock Strong Arm and Metal Head for Tungsten/Umber ore efficiency.`,
          whyItMatters: 'Glacite Mine Shafts contain the most valuable content per time in Glacite Tunnels. Surveyor is the primary way to increase how often they appear. Combined with Great Explorer (Crystal Hollows), these two nodes drive most of endgame mining income.',
          estimatedCost: mining.powderGlacite > 200_000 ? 0 : 5_000_000,
          estimatedCostLabel: mining.powderGlacite > 200_000 ? 'Use your Glacite powder' : '~5M to farm Glacite powder first',
          estimatedBenefit: `+${(5 - surveyorLevel) * 6}% Mine Shaft spawn rate → more Peridot, more powder, more income`,
          roiScore: 88,
          urgencyScore: 75,
          progressionScore: 82,
          requirementScore: 50,
          confidenceScore: 85,
          sourceTags: ['mining', 'hotm', 'surveyor', 'glacite-tunnels'],
          dependsOn: [],
          unlocks: ['glacite_mine_shafts', 'peridot_income'],
          gameStage: ['late', 'endgame'],
          priority: 'high',
          type: 'best_roi',
        });
      }
    }

    // Pristine stat: #1 profit driver once HOTM 10 unlocks it
    if (mining.hotmLevel < 10) {
      recs.push({
        id: 'hotm_pristine_goal',
        category: 'mining',
        title: 'Rush HOTM 10 — Pristine Stat is #1 Gemstone Profit Driver',
        description: `Your HOTM is level ${mining.hotmLevel}/10. The Pristine stat unlocks at HOTM 10 and is the single most important factor for gemstone mining income. Every 1 Pristine = +1% chance to drop a Flawless gemstone instead of Rough (Flawless = 80× more valuable). Top miners aim for 16–18.4 Pristine. HOTM 10 requires 1,247,000 cumulative XP — prioritize daily commissions and Glacite powder runs.`,
        whyItMatters: 'Without Pristine, gemstone mining produces mostly Rough gems worth a few hundred coins each. With 16 Pristine, 16% of drops become Flawless gems worth 50k–200k each. This is a ~50× income multiplier on affected drops — the most impactful single stat in all of mining.',
        estimatedCost: 0,
        estimatedCostLabel: 'Mine Glacite powder + do daily Commissions (free, time investment)',
        estimatedBenefit: 'Pristine stat unlock at HOTM 10 → up to 60–110M+/hr gemstone income',
        roiScore: 92,
        urgencyScore: 80,
        progressionScore: 90,
        requirementScore: 45,
        confidenceScore: 92,
        sourceTags: ['mining', 'hotm', 'pristine', 'gemstone', 'income'],
        dependsOn: [],
        unlocks: ['pristine_stat', 'flawless_gem_drops'],
        gameStage: ['late', 'endgame'],
        priority: 'high',
        type: 'longterm',
      });
    }
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

  // Purse-vs-bank death risk: dying drops all purse coins
  const purse = profile.purseCoins ?? 0;
  const bank = profile.bankCoins ?? 0;
  if (purse > 1_000_000 && bank === 0) {
    recs.push({
      id: 'bank_your_coins',
      category: 'money',
      title: 'Bank Your Coins — Purse is Exposed to Death',
      description: `You have ${formatCoins(purse)} in your purse but nothing in the bank. Dying causes you to lose all purse coins. Type /bank to store them safely.`,
      whyItMatters: "Purse coins are lost on death. Bank coins are permanent. This is one of the most common early-game mistakes — regularly banking prevents catastrophic coin loss from accidental deaths.",
      estimatedCost: 0,
      estimatedCostLabel: 'Free — just open /bank',
      estimatedBenefit: `Protect ${formatCoins(purse)} from death loss`,
      roiScore: 99,
      urgencyScore: 92,
      progressionScore: 50,
      requirementScore: 0,
      confidenceScore: 99,
      sourceTags: ['coins', 'bank', 'beginner', 'blocker'],
      dependsOn: [],
      unlocks: ['coin_safety'],
      gameStage: ['early', 'mid', 'late', 'endgame'],
      priority: 'critical',
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
      description: 'Garden Level 7 unlocks all 25 crop plots and significant Farming Fortune bonuses from garden milestones.',
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
      description: `Your total crop upgrade levels are ${cropUpgradeTotal}. Each crop upgrade tier gives +5 Farming Fortune for that crop (Tier I–IX, max +45 FF per crop).`,
      whyItMatters: 'Crop upgrades are one of the most efficient Farming Fortune sources per copper spent. Each tier costs copper from garden visitors. Max 9 tiers = +45 FF per crop.',
      estimatedCost: 100_000,
      estimatedCostLabel: 'Copper from garden (grind)',
      estimatedBenefit: `+${Math.max(5, (9 - cropUpgradeTotal) * 5)} Farming Fortune per crop (wiki: +5 FF/tier, 9 tiers max)`,
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
  const stage = determineGameStage(profile);
  if (stage !== 'early') {
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

  // SkyBlock Level gate: Bazaar requires Level 7 — critical for all progression
  if (profile.skyblockLevel < 7 && profile.skyblockLevel >= 2) {
    const xpNeeded = Math.max(0, 700 - (profile.skyblockLevel * 100));
    recs.push({
      id: 'skyblock_level_bazaar',
      category: 'general',
      title: `Reach SkyBlock Level 7 to Unlock the Bazaar`,
      description: `You're SkyBlock Level ${profile.skyblockLevel}. The Bazaar (instant buy/sell for almost every item) unlocks at Level 7. Without it you're limited to NPC shops and AH, which are far slower for upgrades.`,
      whyItMatters: 'The Bazaar is essential for all progression — buying crafting materials, selling drops, and filling buy/sell orders. Every upgrade path assumes Bazaar access. Reach Level 7 ASAP by collecting Fairy Souls, completing quests, and leveling skills.',
      estimatedCost: 0,
      estimatedCostLabel: `~${xpNeeded} SkyBlock XP needed (free)`,
      estimatedBenefit: 'Bazaar access — instant buy/sell for all major items, buy orders, sell orders',
      roiScore: 99,
      urgencyScore: 99,
      progressionScore: 95,
      requirementScore: 0,
      confidenceScore: 99,
      sourceTags: ['skyblock-level', 'bazaar', 'blocker', 'early-game'],
      dependsOn: [],
      unlocks: ['bazaar_access', 'buy_orders', 'sell_orders'],
      gameStage: ['early'],
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
      unlocks: ['skyblock_xp', 'backpack_slots'],
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

  // Healer is obsolete at F6+ — wiki-confirmed and community consensus
  if (highestFloor >= 6 && selectedClass === 'healer') {
    recs.push({
      id: 'dungeon_class_healer_obsolete',
      category: 'dungeons',
      title: 'Switch Away From Healer — Obsolete at F6+',
      description: `You're playing Healer at Floor ${highestFloor}. Healer becomes obsolete at F6+: party HP pools and damage-avoidance outpace what healing can compensate. Community consensus and wiki both confirm Healer is not worth running at this tier.`,
      whyItMatters: 'At F6+, parties clear fast enough that Healer contributes near-zero value. Switching to Berserker (or Archer once you have Terminator, Mage with Hyperion) increases your personal DPS contribution and speeds up clears significantly.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free — just change class at the Dungeon Hub NPC',
      estimatedBenefit: 'Higher personal DPS, faster floor clears, more Catacombs XP/hr',
      roiScore: 82,
      urgencyScore: 78,
      progressionScore: 75,
      requirementScore: 0,
      confidenceScore: 92,
      sourceTags: ['dungeons', 'class', 'healer', 'meta'],
      dependsOn: [],
      unlocks: ['faster_dungeon_clears', 'better_class_dps'],
      gameStage: ['late', 'endgame'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  // Phase-based class meta (user-verified April 2026):
  // F1–F3: Berserker (Dragon Armor, AotD) or Mage (Dreadlord Sword for fast room clear)
  // F4–F6: Archer (Juju Shortbow, very strong at F5+) or Berserker (stable, cheap)
  // F7:    Mage (Hyperion) or Archer (Terminator) — without these weapons, getting into good groups is hard
  // MM:    Tank (near-essential for most MM groups) + Archer (highest DPS)

  // Early (F1-F3): push to Berserker or Mage
  if (cat >= 5 && highestFloor < 4 && selectedClass !== 'berserk' && selectedClass !== 'mage') {
    recs.push({
      id: 'dungeon_class_berserk_early',
      category: 'dungeons',
      title: 'Switch to Berserker or Mage (F1–F3 Meta)',
      description: `You're playing ${selectedClass} at Catacombs ${cat} (Floor 1–3). In this phase, Berserker is the best budget choice — great DPS with Dragon Armor and AotD. Mage is also strong if you have a Dreadlord Sword for fast room clearing.`,
      whyItMatters: 'Berserker provides the best melee DPS in early dungeons at low gear investment. Mage with Dreadlord Sword clears rooms faster. Both are significantly better than Healer or Tank at this stage.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free — just change class at Dungeon Hub NPC',
      estimatedBenefit: 'Higher DPS, faster floor clears, more Catacombs XP/hr',
      roiScore: 80,
      urgencyScore: 60,
      progressionScore: 72,
      requirementScore: 0,
      confidenceScore: 90,
      sourceTags: ['dungeons', 'class', 'berserker', 'mage'],
      dependsOn: [],
      unlocks: ['faster_dungeon_clears'],
      gameStage: ['early', 'mid'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  // Mid (F4-F6): recommend Archer transition once Juju is accessible
  if (highestFloor >= 4 && highestFloor < 7 && cat >= 14 && selectedClass !== 'archer' && selectedClass !== 'berserk') {
    recs.push({
      id: 'dungeon_class_archer_mid',
      category: 'dungeons',
      title: 'Switch to Archer or Keep Berserker (F4–F6 Meta)',
      description: `At Floor ${highestFloor}, Archer becomes very strong once you can get a Juju Shortbow (available from F5/F6 onwards). Berserker remains a solid, cost-effective choice. Both outperform Healer and Tank in terms of income per run.`,
      whyItMatters: 'Archer with Juju Shortbow is one of the strongest mid-game DPS classes — cheap, high damage, and great for boss fights. If you already have Juju, Archer is likely your best option.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free class change; Juju Shortbow ~500k on AH',
      estimatedBenefit: 'Faster floor clears, better DPS, more income per run',
      roiScore: 78,
      urgencyScore: 58,
      progressionScore: 75,
      requirementScore: 15,
      confidenceScore: 88,
      sourceTags: ['dungeons', 'class', 'archer', 'juju', 'mid-game'],
      dependsOn: [],
      unlocks: ['faster_dungeon_clears'],
      gameStage: ['mid'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  // Late (F7+): weapon-driven class transition
  if (highestFloor >= 7 && selectedClass === 'berserk') {
    recs.push({
      id: 'dungeon_class_transition',
      category: 'dungeons',
      title: 'Plan Your F7 Class Transition (Archer or Mage)',
      description: 'At F7, the meta is weapon-driven: Archer with Terminator or Mage with Hyperion. Without these weapons, getting into good groups becomes hard. Berserker is still viable but falls behind. Switch to Archer when you can afford Terminator (400–600 MP + bow), or to Mage when you have a Spirit Sceptre / Hyperion.',
      whyItMatters: 'F7 parties expect either Archer (Terminator) or Mage (Hyperion). Berserker becomes a liability at this tier. The class transition is weapon-gated, not Catacombs-level-gated.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free class change; cost is acquiring Terminator or Hyperion',
      estimatedBenefit: 'Accepted into high-speed F7 groups; faster clears; more coins/hr',
      roiScore: 82,
      urgencyScore: 65,
      progressionScore: 82,
      requirementScore: 40,
      confidenceScore: 90,
      sourceTags: ['dungeons', 'class', 'archer', 'mage', 'f7', 'late-game'],
      dependsOn: [],
      unlocks: ['optimized_dungeon_clears', 'f7_income'],
      gameStage: ['late', 'endgame'],
      priority: 'medium',
      type: 'progression',
    });
  }

  // Master Mode: recommend Tank if player is doing MM and not playing Tank
  if (profile.dungeons.masterMode.highestFloor >= 1 && selectedClass !== 'tank' && selectedClass !== 'archer') {
    recs.push({
      id: 'dungeon_class_tank_mm',
      category: 'dungeons',
      title: 'Consider Tank or Archer for Master Mode',
      description: `You're doing Master Mode as ${selectedClass}. In MM, Tank (with Goldor's Armor) is near-essential for most parties — the boss damage is too high for non-tank builds without a dedicated protector. Archer with Terminator is the top DPS pick. Both roles are in high demand for MM groups.`,
      whyItMatters: 'Master Mode damage output is orders of magnitude higher than F7. Tank becomes the most sought-after role for survival. Without a Tank or dedicated Archer, MM runs are slow and risky.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free class change; cost is in Goldor\'s Armor for Tank',
      estimatedBenefit: 'Invited into MM groups; higher survival rate; faster runs',
      roiScore: 80,
      urgencyScore: 70,
      progressionScore: 78,
      requirementScore: 35,
      confidenceScore: 88,
      sourceTags: ['dungeons', 'class', 'tank', 'master-mode'],
      dependsOn: [],
      unlocks: ['mm_group_access', 'faster_mm_clears'],
      gameStage: ['endgame'],
      priority: 'high',
      type: 'best_roi',
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

function checkBoosterCookie(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  // Skip if cookie is already active
  if (profile.tempStatBuffs.some(b => b.key === 'booster_cookie')) return recs;
  const total = (profile.purseCoins ?? 0) + (profile.bankCoins ?? 0);
  const stage = determineGameStage(profile);

  // Recommend cookie once player has 10M+ coins or is mid+ game — it's the #1 mid-game investment
  if ((stage === 'early' || stage === 'mid') && total >= 8_000_000) {
    recs.push({
      id: 'booster_cookie',
      category: 'money',
      title: 'Buy a Booster Cookie (~10M)',
      description: 'The Booster Cookie is the single best mid-game investment at ~10M coins. It lets you keep coins on death, access /bz and /ah remotely, and generates Bits for permanent upgrades.',
      whyItMatters: 'Dying without a Cookie means losing all your purse coins. Remote /bz access saves hours of travel. Bits from Cookie convert into Booster Cookies, Farming Fortune books, and more — the ROI compounds over time.',
      estimatedCost: 10_000_000,
      estimatedCostLabel: '~10M from Bazaar',
      estimatedBenefit: 'Coin-keep on death, remote AH/BZ, Bits income, faster progression',
      roiScore: 95,
      urgencyScore: 88,
      progressionScore: 85,
      requirementScore: 0,
      confidenceScore: 97,
      sourceTags: ['cookie', 'qol', 'bits', 'mid-game'],
      dependsOn: [],
      unlocks: ['coin_keep_death', 'remote_bazaar', 'bits_income'],
      gameStage: ['early', 'mid'],
      priority: total >= 10_000_000 ? 'high' : 'medium',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkGreenhousePlots(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const farming = profile.farming;
  const total = (profile.purseCoins ?? 0) + (profile.bankCoins ?? 0);

  // Greenhouse plots are unlocked with ~100M investment — best late-game passive income
  // Require Garden Level 12+ (Greenhouse unlocks at GL 12) and significant coins saved
  if (farming.gardenLevel >= 12 && total >= 50_000_000) {
    recs.push({
      id: 'greenhouse_plots',
      category: 'farming',
      title: 'Unlock Greenhouse Plots (100M investment)',
      description: 'Unlocking all three Greenhouse plots costs ~100M in Ethereal Vines and compost. Active clearing with Ashreath mutations nets 40–50M/hr; semi-passive harvesting twice daily yields 30M/day.',
      whyItMatters: 'The Greenhouse is the best consistent semi-passive income in the game. 100M invested can return 50M–100M per day through mutations — potentially paid off in under a week. Ashreath mutation is 20% better for raw NPC value.',
      estimatedCost: 100_000_000,
      estimatedCostLabel: '~100M (Ethereal Vines + compost)',
      estimatedBenefit: '40M–50M/hr active, ~30M/day semi-passive; ROI in under 1 week',
      roiScore: 92,
      urgencyScore: 72,
      progressionScore: 85,
      requirementScore: 35,
      confidenceScore: 88,
      sourceTags: ['farming', 'greenhouse', 'passive-income', 'late-game'],
      dependsOn: [],
      unlocks: ['greenhouse_income', 'mutation_farming'],
      gameStage: ['late', 'endgame'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkPestFarming(profile: PlayerProfile, election?: ElectionData | null): Recommendation[] {
  const recs: Recommendation[] = [];
  const farming = profile.farming;
  const farmSkill = profile.skills.farming;
  const isFinnegan = election?.currentMayor.name === 'Finnegan';

  // Pest farming income (user-verified April 2026):
  // Mid setup (Fermento + Squash armor, Pest Chance ~100): 30–40M/hr
  // Maxed setup (Helianthus, Green Thumb 5, Pest Chance 300+): up to 70M/hr
  // During Mayor Finnegan: spawn cooldown halved → rates roughly double
  // Best pests: Beetle (consistent NPC sells via Mutant Nether Wart), Slug (RNG Legendary Slug Pet drops),
  //             Fly (good for Wheat farmers). Target Bonus Pest Chance 300+ for 4 spawns/cycle.
  if (farming.gardenLevel >= 5 && farmSkill >= 30) {
    const farmingDesc = isFinnegan
      ? `Mayor Finnegan is active — spawn cooldown is halved, making this the best time for Pest Farming (up to 70M/hr+ right now). Prioritize Bonus Pest Chance 300+ and swap between Mosquito pet (spawn maximizer) and Hedgehog pet (kill maximizer). Best pest: Beetle for consistent NPC sells.`
      : `Pest Farming with Fermento/Squash armor earns 30–40M/hr. Fully maxed setup (Helianthus, Green Thumb 5, Pest Chance 300+) reaches up to 70M/hr — or double during Mayor Finnegan. Best pests: Beetle (consistent NPC income from Mutant Nether Wart), Slug (RNG jackpot via Legendary Slug Pet drops), Fly (Wheat farmers). Use Sprayonator to increase pest chance. Swap Mosquito pet ↔ Hedgehog pet to maximize spawns and kills.`;
    recs.push({
      id: 'pest_farming',
      category: 'farming',
      title: isFinnegan ? 'Pest Farming — Mayor Finnegan Active! (~70M/hr+)' : 'Focus on Pest Farming (30–70M/hr)',
      description: farmingDesc,
      whyItMatters: 'Pest Farming income scales with Bonus Pest Chance — aim for 300+ (allows 4 pests per cycle, max 8 on island simultaneously). The Sprayonator and Pest Hunter armor reduce spawn cooldown to ~2:20 min normally (~1:13 during Finnegan). This is the best income for farming-focused players with Garden 5+.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M (Hedgehog + Mosquito pets, Sprayonator)',
      estimatedBenefit: isFinnegan ? '~70M/hr+ (Finnegan active!)' : '30–40M/hr (mid setup) → up to 70M/hr (maxed, Green Thumb 5)',
      roiScore: isFinnegan ? 97 : 87,
      urgencyScore: isFinnegan ? 95 : 75,
      progressionScore: 80,
      requirementScore: 30,
      confidenceScore: 88,
      sourceTags: ['farming', 'pests', 'income', 'finnegan'],
      dependsOn: [],
      unlocks: ['pest_income', 'pest_shards'],
      gameStage: ['mid', 'late', 'endgame'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  return recs;
}

function checkChocolateFactory(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const skyblockLevel = profile.skyblockLevel ?? 0;
  const cps = profile.chocolatePerSecond ?? 0;
  const prestige = profile.chocolatePrestige ?? 0;

  // Case 1: Player hasn't started the factory yet (unlocks at SkyBlock Level 20)
  // cps is not computed server-side; use chocolateLevel and rabbit count as reliable proxies.
  const hasStartedFactory = (profile.chocolateLevel ?? 0) > 0
    || Object.keys(profile.chocolateRabbits ?? {}).length > 0;
  if (skyblockLevel >= 20 && !hasStartedFactory && prestige === 0) {
    recs.push({
      id: 'chocolate_factory',
      category: 'farming',
      title: 'Start the Chocolate Factory (/cf)',
      description: 'The Chocolate Factory (/cf) generates passive chocolate that scales with engagement. Check it daily to hire workers and collect progress. Scales into a major passive income stream.',
      whyItMatters: 'Chocolate Factory is free passive income that scales with daily engagement. Early start compounds significantly over time — the earlier you start, the higher your total output.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free — just open /cf daily',
      estimatedBenefit: 'Passive chocolate income, pet upgrades, scaling passive rewards',
      roiScore: 88,
      urgencyScore: 70,
      progressionScore: 65,
      requirementScore: 0,
      confidenceScore: 92,
      sourceTags: ['chocolate-factory', 'passive', 'free'],
      dependsOn: [],
      unlocks: ['chocolate_income'],
      gameStage: ['early', 'mid'],
      priority: 'medium',
      type: 'cheapest',
    });
  }

  // Case 2: Player has an active factory but very low CPS — workers likely un-upgraded
  // A well-maintained factory should produce >5 choc/s by mid-game
  if (cps > 0 && cps < 5 && prestige === 0) {
    recs.push({
      id: 'chocolate_factory_workers',
      category: 'farming',
      title: 'Upgrade Chocolate Factory Workers',
      description: `Your Chocolate Factory produces ${cps.toFixed(1)} choc/sec — well below potential. Upgrade your rabbit workers in /cf to boost output. Each worker upgrade multiplies long-term chocolate production.`,
      whyItMatters: 'Worker upgrades are the primary driver of chocolate production rate. Low CPS means you\'re leaving free passive income on the table every hour.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free — spend chocolate you already have on upgrades',
      estimatedBenefit: 'Higher choc/sec → more pet upgrades, Booster Cookies, and passive rewards',
      roiScore: 82,
      urgencyScore: 65,
      progressionScore: 60,
      requirementScore: 0,
      confidenceScore: 85,
      sourceTags: ['chocolate-factory', 'passive', 'free', 'workers'],
      dependsOn: [],
      unlocks: ['chocolate_income'],
      gameStage: ['early', 'mid'],
      priority: 'medium',
      type: 'cheapest',
    });
  }

  return recs;
}

function checkMinionOptimization(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const stage = determineGameStage(profile);

  // Recommend Compactors for mid+ players — passive income multiplier
  if (stage === 'mid' || stage === 'late' || stage === 'endgame') {
    recs.push({
      id: 'minion_compactors',
      category: 'money',
      title: 'Equip Compactors on All Minions',
      description: 'Minions without Compactors fill up and stop generating while you\'re offline. Equip at least a basic Compactor (BZ ~20k each) on every minion to maximize passive income. Super Compactors are better for high-value minions.',
      whyItMatters: 'A full minion generates nothing. Compactors are one of the highest ROI purchases per coin — cheap and permanent. Missing Compactors is one of the most common income leaks.',
      estimatedCost: 20_000,
      estimatedCostLabel: '~20k per Compactor (Bazaar)',
      estimatedBenefit: 'Minions never stop running; passive income maximized',
      roiScore: 88,
      urgencyScore: 75,
      progressionScore: 60,
      requirementScore: 0,
      confidenceScore: 95,
      sourceTags: ['minions', 'passive', 'cheap', 'compactor'],
      dependsOn: [],
      unlocks: ['passive_minion_income'],
      gameStage: ['mid', 'late', 'endgame'],
      priority: 'medium',
      type: 'cheapest',
    });
  }

  return recs;
}

// ─── Minion Slots ─────────────────────────────────────────────────────────────

// Unique minion types unlocks extra minion slots at Community Center milestones.
// Thresholds: 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 110, 120, 130
const MINION_SLOT_THRESHOLDS = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 70, 80, 90, 100, 110, 120, 130];

function checkMinionSlots(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const uniqueCount = profile.minions.length;
  const nextThreshold = MINION_SLOT_THRESHOLDS.find(t => t > uniqueCount);
  if (nextThreshold === undefined) return recs;

  const toGo = nextThreshold - uniqueCount;
  const slotsUnlocked = MINION_SLOT_THRESHOLDS.filter(t => t <= uniqueCount).length + 5; // base 5 slots
  const nextSlots = slotsUnlocked + 1;
  const stage = determineGameStage(profile);

  recs.push({
    id: 'minion_slots_unlock',
    category: 'money',
    title: `Craft ${toGo} More Unique Minion Type${toGo !== 1 ? 's' : ''} (Unlock Slot ${nextSlots})`,
    description: `You have ${uniqueCount} unique minion types. Crafting ${toGo} more reaches the next Community Center milestone (${nextThreshold}) and unlocks an additional minion slot. More slots = more passive income.`,
    whyItMatters: 'Each additional minion slot passively generates coins 24/7. Unlocking slots is one of the highest long-term ROI investments since the income compounds over time.',
    estimatedCost: toGo * 5_000,
    estimatedCostLabel: `~${toGo * 5}k–${toGo * 50}k (varies by minion type)`,
    estimatedBenefit: `+1 minion slot → permanent passive income increase`,
    roiScore: 82,
    urgencyScore: stage === 'early' ? 80 : 55,
    progressionScore: 75,
    requirementScore: 0,
    confidenceScore: 95,
    sourceTags: ['minions', 'community_center', 'passive_income', 'slots'],
    dependsOn: [],
    unlocks: ['extra_minion_slot'],
    gameStage: ['early', 'mid', 'late'],
    priority: stage === 'early' ? 'high' : 'medium',
    type: 'best_roi',
  });

  return recs;
}

// ─── Foraging Progression ─────────────────────────────────────────────────────

function checkForagingProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const foragingLevel = profile.skills.foraging;
  // foragingWhispers = total accumulated; foragingWhispersSpent = total spent; unspent = balance
  const whispers = Math.max(0, (profile.foragingWhispers ?? 0) - (profile.foragingWhispersSpent ?? 0));
  const tokensSpent = profile.foragingTreeTokensSpent;

  // Recommend getting foraging to 15+ for Ocelot pet unlock + Whispers
  if (foragingLevel < 15) {
    recs.push({
      id: 'foraging_skill_15',
      category: 'skills',
      title: 'Reach Foraging 15 for Whispers + Pet Unlock',
      description: `Your Foraging is level ${foragingLevel}. Reaching 15 unlocks the Foraging Skill Tree (Whispers system) and gives access to the Ocelot pet, which provides Foraging Fortune. The Park is the fastest XP spot.`,
      whyItMatters: 'Foraging 15 unlocks Whispers tokens — these can be spent on skill tree nodes that boost Foraging Fortune and daily tree caps. The Ocelot pet (available from Foraging 15) adds up to +30 FF at level 100.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free (time investment)',
      estimatedBenefit: `+${(15 - foragingLevel) * 4} Foraging Fortune from skill levels + Whispers unlock`,
      roiScore: 68,
      urgencyScore: 45,
      progressionScore: 65,
      requirementScore: 0,
      confidenceScore: 90,
      sourceTags: ['foraging', 'skill_tree', 'whispers', 'ocelot'],
      dependsOn: [],
      unlocks: ['foraging_skill_tree', 'ocelot_pet'],
      gameStage: ['early', 'mid'],
      priority: 'medium',
      type: 'fastest',
    });
  }

  // Recommend spending Whispers if they have unspent ones
  if (whispers > 0 && foragingLevel >= 15) {
    recs.push({
      id: 'spend_foraging_whispers',
      category: 'skills',
      title: `Spend ${whispers} Unspent Foraging Whisper${whispers !== 1 ? 's' : ''}`,
      description: `You have ${whispers} Foraging Whispers available. Open the Foraging Skill Tree (/wc menu) to spend them on nodes like Logging Expertise (+FF), Leaf Blower (speed), or daily tree cap increases.`,
      whyItMatters: 'Whispers are free Foraging Fortune and quality-of-life improvements. Unspent Whispers are wasted potential — you earn them daily by cutting trees, so spending them promptly maximizes your progression.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free',
      estimatedBenefit: `+${whispers * 2}–${whispers * 5} Foraging Fortune (node-dependent)`,
      roiScore: 95,
      urgencyScore: 70,
      progressionScore: 55,
      requirementScore: 0,
      confidenceScore: 85,
      sourceTags: ['foraging', 'whispers', 'skill_tree', 'free'],
      dependsOn: [],
      unlocks: ['foraging_fortune_nodes'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'cheapest',
    });
  }

  // Recommend getting Ocelot pet if none owned and foraging is meaningful
  if (foragingLevel >= 10) {
    const hasOcelot = profile.pets.some(p => p.type === 'OCELOT');
    if (!hasOcelot) {
      recs.push({
        id: 'ocelot_pet',
        category: 'farming',
        title: 'Get an Ocelot Pet for Foraging Fortune',
        description: 'An Ocelot pet provides +0.3 Foraging Fortune per level (up to +30 at level 100). It is the best pet for foraging and can be obtained from Foraging bosses or the Auction House.',
        whyItMatters: 'Foraging Fortune directly increases the wood and sap drops you get per tree cut, boosting both XP rates and passive income from foraging. The Ocelot is cheap on the AH.',
        estimatedCost: 100_000,
        estimatedCostLabel: '~50k–500k (AH, varies by rarity)',
        estimatedBenefit: 'Up to +30 Foraging Fortune at level 100',
        roiScore: 75,
        urgencyScore: 50,
        progressionScore: 60,
        requirementScore: 0,
        confidenceScore: 90,
        sourceTags: ['foraging', 'pet', 'ocelot', 'foraging_fortune'],
        dependsOn: [],
        unlocks: ['foraging_fortune_pet'],
        gameStage: ['mid', 'late'],
        priority: 'medium',
        type: 'best_roi',
      });
    }
  }

  // Token spending recommendation
  if (tokensSpent === 0 && foragingLevel >= 15) {
    recs.push({
      id: 'foraging_tree_tokens',
      category: 'skills',
      title: 'Spend Foraging Skill Tree Tokens',
      description: 'You have not spent any Foraging Skill Tree tokens. Open the Foraging menu to unlock nodes — start with Logging Expertise for Foraging Fortune, or daily tree cap nodes for consistent XP.',
      whyItMatters: 'Foraging Skill Tree tokens are earned just by leveling up and are completely free. Not spending them leaves permanent stat bonuses on the table.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free',
      estimatedBenefit: '+FF, +daily tree cap, +XP/cut',
      roiScore: 95,
      urgencyScore: 80,
      progressionScore: 60,
      requirementScore: 0,
      confidenceScore: 95,
      sourceTags: ['foraging', 'skill_tree', 'tokens', 'free'],
      dependsOn: [],
      unlocks: ['foraging_tree_nodes'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'cheapest',
    });
  }

  return recs;
}

// ─── Daily Habits ─────────────────────────────────────────────────────────────

function checkDailyHabits(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];

  // Experimentation Table: +Enchanting XP daily; ignore if enchanting is very low
  if (profile.skills.enchanting >= 5) {
    recs.push({
      id: 'daily_experimentation_table',
      category: 'skills',
      title: 'Do Your Daily Experimentation Table',
      description: 'The Experimentation Table (in your Private Island) rewards Enchanting XP and has a chance to yield rare items and books. Takes under a minute per day.',
      whyItMatters: 'Free Enchanting XP every day compounds over time. One of the simplest daily habits with no coin cost and meaningful long-term gains.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free',
      estimatedBenefit: '+Enchanting XP, chance at rare books/items daily',
      roiScore: 75,
      urgencyScore: 50,
      progressionScore: 60,
      requirementScore: 0,
      confidenceScore: 95,
      sourceTags: ['daily', 'enchanting', 'free', 'habit'],
      dependsOn: [],
      unlocks: ['enchanting_xp'],
      gameStage: ['early', 'mid', 'late'],
      priority: 'low',
      type: 'cheapest',
    });
  }

  // Dwarven Mines commissions: bonus HOTM XP if HOTM 3+
  if (profile.mining.hotmLevel >= 3) {
    recs.push({
      id: 'daily_dwarven_commissions',
      category: 'mining',
      title: 'Complete Daily Dwarven Mines Commissions',
      description: 'The Commission Board in Dwarven Mines offers 4 daily commissions with bonus HOTM XP rewards on top of regular powder. At HOTM 3+, this is the fastest way to level HOTM.',
      whyItMatters: 'Commission bonus HOTM XP is the most efficient path to HOTM 7 (Glacite Tunnels gate). Missing daily commissions is one of the most common mining progression mistakes.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free (time from your normal mining)',
      estimatedBenefit: '+Bonus HOTM XP daily, faster path to HOTM 7',
      roiScore: 80,
      urgencyScore: 60,
      progressionScore: 72,
      requirementScore: 0,
      confidenceScore: 95,
      sourceTags: ['daily', 'mining', 'hotm', 'commissions', 'free'],
      dependsOn: [],
      unlocks: ['hotm_xp', 'faster_hotm_levels'],
      gameStage: ['mid', 'late'],
      priority: 'medium',
      type: 'cheapest',
    });
  }

  return recs;
}

// ─── Money-Making Path ─────────────────────────────────────────────────────────

function checkMoneyMakingPath(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const stage = determineGameStage(profile);
  const total = (profile.purseCoins ?? 0) + (profile.bankCoins ?? 0);
  const cat = profile.dungeons.catacombs;

  if ((stage === 'early' || stage === 'mid') && total < 20_000_000) {
    recs.push({
      id: 'money_bazaar_flip',
      category: 'money',
      title: stage === 'early' ? 'Start Bazaar Flipping for Early Income' : 'Bazaar Flipping — Best Return on Liquid Coins',
      description: stage === 'early'
        ? 'Bazaar Flipping (placing buy orders for items below sell price) earns 10–50M/hr with 1M starting capital. Zero ban risk, scales with capital. Alternatively, Rift Berberis grinding is 10–20M/hr with near-zero investment (reach 3rd Rift area).'
        : `You have ${formatCoins(total)} liquid. Bazaar flipping scales to 50M+/hr — more capital means more concurrent orders and faster turnover. Place buy/sell orders on high-volume items (enchanting books, farming materials, potions) for passive coin growth.`,
      whyItMatters: 'Bazaar flipping compounds with capital. Unlike active grinding it works while offline, requires no skill gates, and has zero ban risk. It\'s the best ROI for any liquid coins you\'re not actively investing.',
      estimatedCost: 1_000_000,
      estimatedCostLabel: '~1M starting capital',
      estimatedBenefit: '10–50M/hr (scales linearly with capital deployed)',
      roiScore: 88,
      urgencyScore: stage === 'early' ? 70 : 55,
      progressionScore: 75,
      requirementScore: 5,
      confidenceScore: 92,
      sourceTags: ['money', 'bazaar', 'flipping', 'early-game'],
      dependsOn: ['skyblock_level_bazaar'],
      unlocks: ['coin_income', 'upgrade_funding'],
      gameStage: ['early', 'mid'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  if (stage === 'mid' && profile.skills.combat >= 20 && cat.highestFloor < 5) {
    recs.push({
      id: 'money_zealot_grinding',
      category: 'money',
      title: 'Grind Zealots for Mid-Game Income (~10M/hr)',
      description: 'Zealot grinding in The End (~10M/hr) is the best mid-game income before F5 dungeons. Requirements: Combat 12 (The End unlock), ~2M investment for Frozen Diamond armor + Legendary Enderman pet + Zealuck 5 enchant.',
      whyItMatters: 'Zealots drop Summoning Eyes (for Dragon fights) and Ender Armor materials. With Zealuck 5, each kill has a chance for an Eye worth 1–2M. Consistent and low risk.',
      estimatedCost: 2_000_000,
      estimatedCostLabel: '~2M (Frozen Diamond + Eman pet)',
      estimatedBenefit: '~10M/hr, Summoning Eyes, Ender items',
      roiScore: 82,
      urgencyScore: 68,
      progressionScore: 70,
      requirementScore: 20,
      confidenceScore: 90,
      sourceTags: ['money', 'zealots', 'mid-game', 'combat'],
      dependsOn: [],
      unlocks: ['zealot_income', 'dragon_access'],
      gameStage: ['mid'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  if (stage === 'mid' && cat.highestFloor >= 5) {
    recs.push({
      id: 'money_dungeons_f5',
      category: 'money',
      title: 'Farm Dungeons F5 for ~20M/hr',
      description: 'F5 (Livid) is the most reliable mid-game cash floor at ~20M/hr. 2.5-minute runs yield Livid Daggers, Shadow Assassin fragments, and high-value drops. Most reliable coins-per-hour in mid-game.',
      whyItMatters: 'Dungeons F5 combines income with progression — you earn coins while leveling Catacombs towards F6/F7. No extra investment beyond clearing F5 normally.',
      estimatedCost: 0,
      estimatedCostLabel: 'No extra cost — run F5 normally',
      estimatedBenefit: '~20M/hr, Livid Daggers, Shadow Assassin Frags',
      roiScore: 87,
      urgencyScore: 75,
      progressionScore: 82,
      requirementScore: 35,
      confidenceScore: 92,
      sourceTags: ['money', 'dungeons', 'f5', 'mid-late'],
      dependsOn: ['dungeon_floor5'],
      unlocks: ['dungeon_income', 'catacombs_xp'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  if (profile.mining.hotmLevel >= 7) {
    const hotm = profile.mining.hotmLevel;
    // Tiered estimates (user-verified April 2026):
    // HOTM 7+, Gauntlet/Sorrow, ~4M each powder: 10–20M/hr
    // Late (Divan Armor + x655 drill): 30–45M/hr for standard gems (Ruby, Jade)
    // Hypermaxed (Divan's Drill, 16-18 Pristine, optimized routes): 60–110M+/hr
    // Key profit drivers: Pristine stat > Mining Fortune; server ping matters hugely (200ms+ = -50% rate)
    // Best gems: Peridot in Glacite Tunnels (60–80M/hr top), Jade in Mines of Divan (20–40M/hr, consistent)
    const rateEstimate = hotm >= 9 ? '30–45M/hr (late) or 60–110M/hr (hypermaxed)' : '10–20M/hr (mid HOTM setup)';
    recs.push({
      id: 'money_gemstone_mining',
      category: 'money',
      title: `Gemstone Mining — ${hotm >= 9 ? '30–110M/hr' : '10–20M/hr'} (HOTM ${hotm})`,
      description: `Gemstone Mining income scales heavily with your setup. With HOTM ${hotm} and current powder: ${rateEstimate}. Key factors: **Pristine stat is #1** (each point = 1% Flawless gem chance, worth 80× more than Rough — aim for 16–18.4). Server ping matters: 200ms+ halves your rates. Best gems: **Peridot** in Glacite Tunnels (up to 60–80M/hr, best raw coins) or **Jade** in Mines of Divan (20–40M/hr, most consistent and "lazy"). Note: Jasper in Crystal Hollows is high-value but coordinates are often griefed.`,
      whyItMatters: 'Gemstone mining is the best consistent income for mining players. Pristine stat drives most of the profit by turning worthless Rough gems into valuable Flawless ones. 4M Mithril + 8M Gemstone powder minimum before you see real returns. Requires mod waypoints for top rates.',
      estimatedCost: hotm >= 9 ? 50_000_000 : 5_000_000,
      estimatedCostLabel: hotm >= 9 ? '50M+ (Divan Armor + DR-X655 drill for top rates)' : '~5M (Gauntlet/Sorrow armor, drill upgrade)',
      estimatedBenefit: rateEstimate,
      roiScore: hotm >= 9 ? 90 : 78,
      urgencyScore: 72,
      progressionScore: 80,
      requirementScore: hotm >= 9 ? 55 : 35,
      confidenceScore: 88,
      sourceTags: ['money', 'gemstone', 'mining', 'late-game', 'pristine'],
      dependsOn: ['hotm_7_glacite'],
      unlocks: ['gemstone_income'],
      gameStage: ['late', 'endgame'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  if (stage === 'late' && profile.skills.fishing >= 19 && profile.mining.hotmLevel < 7) {
    recs.push({
      id: 'money_worm_fishing',
      category: 'money',
      title: 'Try Worm Fishing (~14M/hr at Fishing 19+)',
      description: 'Worm Fishing earns ~14M/hr at Fishing 19+ with ~1M investment. Worm Membranes sell for up to 100k each on Bazaar. Low entry cost compared to other late-game methods.',
      whyItMatters: 'If you\'re waiting on HOTM levels or dungeon gear to improve, Worm Fishing is an accessible late-game income source with low investment and consistent returns.',
      estimatedCost: 1_000_000,
      estimatedCostLabel: '~1M (fishing rod + pet)',
      estimatedBenefit: '~14M/hr, Worm Membranes, sea creature loot',
      roiScore: 78,
      urgencyScore: 62,
      progressionScore: 65,
      requirementScore: 25,
      confidenceScore: 75,
      sourceTags: ['money', 'fishing', 'worm', 'late-game'],
      dependsOn: [],
      unlocks: ['worm_fishing_income'],
      gameStage: ['late'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  // Blaze Slayer income: once unlocked, mention as active income source (not just a progression goal)
  const { blaze } = profile.slayers;
  if ((stage === 'late' || stage === 'endgame') && blaze.level >= 4) {
    recs.push({
      id: 'money_blaze_slayer',
      category: 'money',
      title: 'Farm Blaze Slayer for 50M+/hr Income',
      description: 'You have Blaze Slayer L4 — use it actively for income. Blaze drops Vertexes and Apexes (Bazaar), plus Crimson Essence. At T4–T5, consistent 50M+/hr is achievable without special investment.',
      whyItMatters: 'Blaze Slayer is the highest-earning slayer in 2026. Unlike Zealots or Dungeons, it requires no party and minimal additional gear once Enderman is done. The Crimson Isle setting also makes it a natural path to Kuudra.',
      estimatedCost: 0,
      estimatedCostLabel: 'No extra cost — you already meet requirements',
      estimatedBenefit: '50M+/hr; Vertexes, Apexes, Crimson Essence',
      roiScore: 88,
      urgencyScore: 72,
      progressionScore: 70,
      requirementScore: 0,
      confidenceScore: 82,
      sourceTags: ['money', 'slayer', 'blaze', 'late-game'],
      dependsOn: [],
      unlocks: ['blaze_income', 'crimson_essence'],
      gameStage: ['late', 'endgame'],
      priority: 'high',
      type: 'best_roi',
    });
  }

  // Ghost Farming: ~30M/hr theoretical (low confidence — Fishing 26 + Corrupt Soil biome required)
  if ((stage === 'late' || stage === 'endgame') && profile.skills.fishing >= 26) {
    recs.push({
      id: 'money_ghost_farming',
      category: 'money',
      title: 'Ghost Farming (~30M/hr, Fishing 26+)',
      description: 'Ghost Farming earns roughly 30M/hr at Fishing 26+. Requires a Corrupt Soil biome in the Garden (unlocked through the Garden visitor system). Ghosts drop Sorrow armor fragments and other valuable materials.',
      whyItMatters: 'Ghost Farming is a niche but high-yield method for players who have leveled Fishing. If you\'ve invested in Fishing, this is one of the best returns on that investment.',
      estimatedCost: 2_000_000,
      estimatedCostLabel: '~2M (Corrupt Soil + fishing setup)',
      estimatedBenefit: '~30M/hr (theoretical — actual rates vary by RNG)',
      roiScore: 78,
      urgencyScore: 55,
      progressionScore: 60,
      requirementScore: 30,
      confidenceScore: 60,
      sourceTags: ['money', 'fishing', 'ghost', 'late-game'],
      dependsOn: [],
      unlocks: ['ghost_income', 'sorrow_armor'],
      gameStage: ['late', 'endgame'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  // Rift Berberis grinding — ~10–20M/hr with near-zero investment, accessible at SkyBlock Level 12
  if (profile.skyblockLevel >= 12 && (stage === 'mid' || stage === 'late') && total < 30_000_000) {
    recs.push({
      id: 'money_rift_berberis',
      category: 'money',
      title: 'Try Rift Berberis Grinding (~10–20M/hr, Near-Zero Cost)',
      description: 'Once you have Rift access (SkyBlock Level 12), Berberis grinding in the 3rd Rift area earns 10–20M/hr with almost no gear investment. Berberis are Rift-exclusive plants that drop valuable materials traded via Motes. Great low-risk income while building up for dungeons or mining.',
      whyItMatters: 'Rift Berberis grinding is one of the best early-Rift income methods — no gear required beyond entering the Rift, zero ban risk, and it is entirely independent from your overworld progression. Ideal bridge income for players who are early-mid game and can\'t yet do dungeons or gemstone mining efficiently.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free — just requires Rift access (SkyBlock Level 12)',
      estimatedBenefit: '10–20M/hr, Motes currency, low-risk passive grinding',
      roiScore: 80,
      urgencyScore: 60,
      progressionScore: 55,
      requirementScore: 10,
      confidenceScore: 78,
      sourceTags: ['money', 'rift', 'berberis', 'low-investment'],
      dependsOn: ['rift_access'],
      unlocks: ['rift_income', 'motes_currency'],
      gameStage: ['mid', 'late'],
      priority: 'medium',
      type: 'cheapest',
    });
  }

  return recs;
}

// ─── Master Mode Progression ───────────────────────────────────────────────────

const MM_CAT_REQUIREMENTS: Record<number, number> = {
  1: 24, 2: 26, 3: 28, 4: 30, 5: 32, 6: 34, 7: 36,
};

function checkMasterModeProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const mmHighest = profile.dungeons.masterMode.highestFloor;
  const catLevel = profile.dungeons.catacombs.level;

  // Only for players who have started MM
  if (mmHighest === 0) return recs;

  if (mmHighest < 3 && catLevel >= MM_CAT_REQUIREMENTS[1]) {
    recs.push({
      id: 'mm_push_3',
      category: 'dungeons',
      title: 'Push to Master Mode Floor 3 (requires Cat 28)',
      description: `You're at MM${mmHighest}. MM3 unlocks starred item drops — significantly more valuable than unstarred. Cat 28 is the entry requirement for MM3.`,
      whyItMatters: 'Starred items from MM3+ have higher stat scaling and sell for 2–3× the unstarred equivalent. This is the first real payoff floor in Master Mode.',
      estimatedCost: 3_000_000,
      estimatedCostLabel: '~3M (gear improvements for MM3)',
      estimatedBenefit: 'Starred MM drops (2–3× value of unstarred)',
      roiScore: 84,
      urgencyScore: 78,
      progressionScore: 85,
      requirementScore: 55,
      confidenceScore: 90,
      sourceTags: ['dungeons', 'master-mode', 'mm3'],
      dependsOn: ['enter_master_mode'],
      unlocks: ['starred_mm_drops'],
      gameStage: ['late', 'endgame'],
      priority: 'high',
      type: 'progression',
    });
  }

  if (mmHighest >= 3 && mmHighest < 5 && catLevel >= MM_CAT_REQUIREMENTS[3]) {
    recs.push({
      id: 'mm_push_5',
      category: 'dungeons',
      title: 'Push to Master Mode Floor 5 (requires Cat 32)',
      description: `You're at MM${mmHighest}. MM5 unlocks higher-tier MM drops. Cat 32 is the entry requirement for MM5.`,
      whyItMatters: 'MM5 significantly increases the quality of Wither armor and essence drops. Essential stepping stone before MM7.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M (gear/class improvements)',
      estimatedBenefit: 'Higher tier MM drops, more essence, better Wither fragments',
      roiScore: 82,
      urgencyScore: 72,
      progressionScore: 85,
      requirementScore: 60,
      confidenceScore: 87,
      sourceTags: ['dungeons', 'master-mode', 'mm5'],
      dependsOn: ['mm_push_3'],
      unlocks: ['mm5_drops'],
      gameStage: ['late', 'endgame'],
      priority: 'medium',
      type: 'progression',
    });
  }

  if (mmHighest >= 5 && mmHighest < 7 && catLevel >= MM_CAT_REQUIREMENTS[5]) {
    recs.push({
      id: 'mm_push_7',
      category: 'dungeons',
      title: 'Push to Master Mode Floor 7 (requires Cat 36)',
      description: `You're at MM${mmHighest}. MM7 is the pinnacle — BIS Necron/Storm/Maxor/Goldor Master Star gear drops here. Cat 36 is the entry requirement for MM7.`,
      whyItMatters: 'MM7 drops are the best dungeon gear in the game. Master Stars, Master Skulls, and maxed Wither armor all come from MM7. This is the endgame dungeon target.',
      estimatedCost: 10_000_000,
      estimatedCostLabel: '~10M (endgame gear prep)',
      estimatedBenefit: 'BIS MM7 drops — Master Stars, Master Skulls, Wither armor maxed',
      roiScore: 88,
      urgencyScore: 80,
      progressionScore: 92,
      requirementScore: 70,
      confidenceScore: 90,
      sourceTags: ['dungeons', 'master-mode', 'mm7', 'endgame'],
      dependsOn: ['mm_push_5'],
      unlocks: ['mm7_drops', 'master_stars'],
      gameStage: ['endgame'],
      priority: 'high',
      type: 'progression',
    });
  }

  return recs;
}

// ─── Armor Progression by Activity ────────────────────────────────────────────

function checkFarmingArmorProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const farmSkill = profile.skills.farming;
  const gardenLevel = profile.farming.gardenLevel;

  if (gardenLevel < 3 && farmSkill < 20) return recs;

  // Determine recommended tier based on skill level
  let recId: string;
  let title: string;
  let description: string;
  let benefit: string;
  let cost: number;
  let costLabel: string;
  let gameStages: GameStage[];

  // Correct farming armor progression (user-verified April 2026):
  // Melon → Cropie → Squash → Fermento → Helianthus
  if (farmSkill >= 50) {
    recId = 'farming_armor_helianthus';
    title = 'Upgrade to Helianthus Armor (BIS Farming)';
    description = 'Helianthus Armor is the BIS farming set, added December 2025. Requires Farming 50. Drops from Greenhouse mutation harvests (Moonflower, Sunflower, Wild Rose) or AH. Full set gives massive Farming Fortune — the top of the Melon → Cropie → Squash → Fermento → Helianthus progression.';
    benefit = 'Max Farming Fortune; BIS for pest farming and crop income';
    cost = 50_000_000;
    costLabel = '~50M+ (Greenhouse mutation drops or AH)';
    gameStages = ['late', 'endgame'];
  } else if (farmSkill >= 40) {
    recId = 'farming_armor_fermento';
    title = 'Upgrade to Fermento Armor (Farming 40)';
    description = 'Fermento Armor is the second-to-last farming set. Requires Farming 40. Use the SkyMart Brochure reforge for maximum Farming Fortune. A significant upgrade over Squash Armor and the last tier before Helianthus (Farming 50).';
    benefit = '+Farming Fortune, ready for mid-tier pest farming (~30–40M/hr)';
    cost = 5_000_000;
    costLabel = '~5M (Bazaar/AH)';
    gameStages = ['mid', 'late'];
  } else if (farmSkill >= 30) {
    recId = 'farming_armor_squash';
    title = 'Upgrade to Squash Armor (Farming 30)';
    description = 'Squash Armor is the third step in the farming armor path (Melon → Cropie → Squash). Requires Farming 30. Provides better Farming Fortune than Cropie and is required before Fermento is efficient.';
    benefit = '+Farming Fortune vs Cropie; unlocks practical pest farming entry';
    cost = 2_000_000;
    costLabel = '~2M (Bazaar/AH)';
    gameStages = ['mid'];
  } else if (farmSkill >= 20) {
    recId = 'farming_armor_cropie';
    title = 'Upgrade to Cropie Armor (Farming 20)';
    description = 'Cropie Armor is the second step in the farming armor path (Melon → Cropie → Squash → Fermento → Helianthus). Requires Farming 20. Better Farming Fortune than Melon Armor.';
    benefit = '+Farming Fortune vs Melon Armor; one step closer to Squash';
    cost = 500_000;
    costLabel = '~500k (AH)';
    gameStages = ['early', 'mid'];
  } else {
    recId = 'farming_armor_melon';
    title = 'Get Melon Armor (First Farming Set)';
    description = 'Melon Armor is the entry-level farming set — the start of the path: Melon → Cropie → Squash → Fermento → Helianthus. Crafted from Melons or bought on AH. Provides basic Farming Fortune for early Garden content.';
    benefit = '+Farming Fortune; entry point for farming armor progression';
    cost = 100_000;
    costLabel = '~100k (AH or craft from Melons)';
    gameStages = ['early'];
  }

  // Check if player already has the recommended armor (only if NBT was parsed)
  if (profile.armorItems && profile.armorItems.length > 0) {
    const armorIds = profile.armorItems.map(i => i.id.toLowerCase());
    const alreadyHas = (
      (recId === 'farming_armor_helianthus' && armorIds.some(id => id.includes('helianthus'))) ||
      (recId === 'farming_armor_fermento' && armorIds.some(id => id.includes('fermento'))) ||
      (recId === 'farming_armor_squash' && armorIds.some(id => id.includes('squash'))) ||
      (recId === 'farming_armor_cropie' && armorIds.some(id => id.includes('cropie'))) ||
      (recId === 'farming_armor_melon' && armorIds.some(id => id.includes('melon')))
    );
    if (alreadyHas) return recs;
  }

  recs.push({
    id: recId,
    category: 'farming',
    title,
    description,
    whyItMatters: 'Farming armor provides Farming Fortune that directly increases crop drops. Using combat armor while farming is a significant income loss.',
    estimatedCost: cost,
    estimatedCostLabel: costLabel,
    estimatedBenefit: benefit,
    roiScore: farmSkill >= 50 ? 88 : 82,
    urgencyScore: 65,
    progressionScore: 75,
    requirementScore: farmSkill >= 50 ? 40 : 15,
    confidenceScore: 92,
    sourceTags: ['farming', 'armor', 'farming-fortune'],
    dependsOn: [],
    unlocks: ['farming_fortune', 'farming_income'],
    gameStage: gameStages,
    priority: 'medium',
    type: 'best_roi',
  });

  return recs;
}

function checkMiningArmorProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const hotmLevel = profile.mining.hotmLevel;

  if (hotmLevel < 3) return recs;

  let recId: string;
  let title: string;
  let description: string;
  let benefit: string;
  let cost: number;
  let costLabel: string;
  let gameStages: GameStage[];

  if (hotmLevel >= 7) {
    recId = 'mining_armor_divan';
    title = 'Upgrade to Divan\'s Armor (Glacite Tunnels BIS)';
    description = 'Divan\'s Armor is the BIS mining set for Glacite Tunnels. Aim for full Recombed Jaded Divan with Perfect Topazes. Note: Glacite Armor is explicitly discouraged for Glacite Tunnels — only use it for surface mining.';
    benefit = 'Max Mining Fortune + Pristine stat for Flawless gem drops';
    cost = 50_000_000;
    costLabel = '~50M+ (Glacite Tunnels drops or AH)';
    gameStages = ['late', 'endgame'];
  } else if (hotmLevel >= 5) {
    recId = 'mining_armor_yog';
    title = 'Upgrade to Yog Armor (HOTM 5–6)';
    description = 'Yog Armor is the mid-tier mining set. Better than Sorrow for Glacite and Deep Caverns content. Craft or buy from AH.';
    benefit = '+Mining Fortune, better for mid-tier mining areas';
    cost = 3_000_000;
    costLabel = '~3M (AH)';
    gameStages = ['mid', 'late'];
  } else {
    recId = 'mining_armor_sorrow';
    title = 'Get Sorrow Armor (Early Mining)';
    description = 'Sorrow Armor is the early mining set. Provides Mining Fortune bonuses for Dwarven Mines content. Straightforward craft or AH purchase.';
    benefit = '+Mining Fortune for early mining areas';
    cost = 500_000;
    costLabel = '~500k (AH)';
    gameStages = ['mid'];
  }

  if (profile.armorItems && profile.armorItems.length > 0) {
    const armorIds = profile.armorItems.map(i => i.id.toLowerCase());
    const alreadyHas = (
      (recId === 'mining_armor_divan' && armorIds.some(id => id.includes('divan'))) ||
      (recId === 'mining_armor_yog' && armorIds.some(id => id.includes('yog'))) ||
      (recId === 'mining_armor_sorrow' && armorIds.some(id => id.includes('sorrow')))
    );
    if (alreadyHas) return recs;
  }

  recs.push({
    id: recId,
    category: 'mining',
    title,
    description,
    whyItMatters: 'Mining armor provides Mining Fortune that increases gem and ore drops. Using combat armor while mining is a significant income loss. Glacite Armor is wrong for Glacite Tunnels specifically.',
    estimatedCost: cost,
    estimatedCostLabel: costLabel,
    estimatedBenefit: benefit,
    roiScore: hotmLevel >= 7 ? 87 : 80,
    urgencyScore: 62,
    progressionScore: 72,
    requirementScore: hotmLevel >= 7 ? 45 : 15,
    confidenceScore: 90,
    sourceTags: ['mining', 'armor', 'mining-fortune'],
    dependsOn: [],
    unlocks: ['mining_fortune', 'mining_income'],
    gameStage: gameStages,
    priority: 'medium',
    type: 'progression',
  });

  return recs;
}

function checkFishingArmorProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const fishingLevel = profile.skills.fishing;

  if (fishingLevel < 10) return recs;

  let recId: string;
  let title: string;
  let description: string;
  let benefit: string;
  let cost: number;
  let costLabel: string;
  let gameStages: GameStage[];

  if (fishingLevel >= 36) {
    recId = 'fishing_armor_gilsplash';
    title = 'Upgrade to Gilsplash Armor (Late Fishing BIS)';
    description = 'Gilsplash Armor is the late-game fishing set from Backwater Bayou. Provides the highest Fishing Fortune for late-game sea creature and trophy fish hunting.';
    benefit = 'Max Fishing Fortune, best sea creature rates';
    cost = 20_000_000;
    costLabel = '~20M (Backwater Bayou drops or AH)';
    gameStages = ['late', 'endgame'];
  } else if (fishingLevel >= 20) {
    recId = 'fishing_armor_finwave';
    title = 'Upgrade to Finwave Armor (Mid Fishing)';
    description = 'Finwave Armor is the mid-tier fishing set. Obtained from Backwater Bayou content. Better than Ichthyic for mid-game fishing income.';
    benefit = '+Fishing Fortune, improved sea creature drops';
    cost = 5_000_000;
    costLabel = '~5M (AH or Backwater Bayou)';
    gameStages = ['mid', 'late'];
  } else {
    recId = 'fishing_armor_ichthyic';
    title = 'Get Ichthyic Armor (Early Fishing — Backwater Bayou)';
    description = 'Ichthyic Armor is the early fishing set from Backwater Bayou. Provides Fishing Fortune bonuses. Visit Backwater Bayou to start fishing progression there.';
    benefit = '+Fishing Fortune, Backwater Bayou access';
    cost = 1_000_000;
    costLabel = '~1M (Backwater Bayou drops or AH)';
    gameStages = ['mid'];
  }

  if (profile.armorItems && profile.armorItems.length > 0) {
    const armorIds = profile.armorItems.map(i => i.id.toLowerCase());
    const alreadyHas = (
      (recId === 'fishing_armor_gilsplash' && armorIds.some(id => id.includes('gilsplash'))) ||
      (recId === 'fishing_armor_finwave' && armorIds.some(id => id.includes('finwave'))) ||
      (recId === 'fishing_armor_ichthyic' && armorIds.some(id => id.includes('ichthyic')))
    );
    if (alreadyHas) return recs;
  }

  recs.push({
    id: recId,
    category: 'fishing',
    title,
    description,
    whyItMatters: 'Fishing armor provides Fishing Fortune that multiplies sea creature and trophy fish drops. Using combat armor while fishing leaves significant loot on the table.',
    estimatedCost: cost,
    estimatedCostLabel: costLabel,
    estimatedBenefit: benefit,
    roiScore: 78,
    urgencyScore: 58,
    progressionScore: 68,
    requirementScore: 20,
    confidenceScore: 72,
    sourceTags: ['fishing', 'armor', 'fishing-fortune', 'backwater-bayou'],
    dependsOn: [],
    unlocks: ['fishing_fortune', 'fishing_income'],
    gameStage: gameStages,
    priority: 'low',
    type: 'progression',
  });

  return recs;
}

// ─── BIS Pet Recommendations ───────────────────────────────────────────────────

function checkBISPetForActivity(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const activePet = profile.pets.find(p => p.active);
  const activePetType = activePet?.type ?? '';

  // Farming: Mooshroom Cow or Elephant while in Garden
  if (profile.farming.gardenLevel >= 5) {
    const isFarmingPet = ['MOOSHROOM_COW', 'ELEPHANT', 'BEE', 'RABBIT'].includes(activePetType);
    if (!isFarmingPet) {
      recs.push({
        id: 'bis_pet_farming',
        category: 'farming',
        title: 'Switch to Mooshroom Cow or Elephant Pet for Farming',
        description: `Your active pet (${activePetType.replace(/_/g, ' ') || 'none'}) doesn't boost Farming Fortune. Switch to a Mooshroom Cow (LEGENDARY, +110 FF + coin multiplier at L100) or Elephant (LEGENDARY, +150 FF at L100) before farming sessions.`,
        whyItMatters: 'Farming Fortune from pets directly multiplies crop drops. Mooshroom Cow is BIS for general farming with its coin multiplier; Elephant is BIS for max raw FF. Using the wrong pet while farming is one of the biggest FF losses.',
        estimatedCost: 10_000_000,
        estimatedCostLabel: '10M–50M for a Legendary farming pet',
        estimatedBenefit: '+110 FF (Mooshroom Cow) or +150 FF (Elephant) vs combat pet',
        roiScore: 85,
        urgencyScore: 70,
        progressionScore: 75,
        requirementScore: 15,
        confidenceScore: 75,
        sourceTags: ['pets', 'farming', 'mooshroom', 'elephant', 'farming-fortune'],
        dependsOn: [],
        unlocks: ['farming_fortune_pet'],
        gameStage: ['mid', 'late', 'endgame'],
        priority: 'medium',
        type: 'best_roi',
      });
    }
  }

  // Mining: Scatha or Glacite Golem at HOTM 7+
  if (profile.mining.hotmLevel >= 7) {
    const isMiningPet = ['SCATHA', 'GLACITE_GOLEM', 'MOLE'].includes(activePetType);
    if (!isMiningPet) {
      recs.push({
        id: 'bis_pet_mining',
        category: 'mining',
        title: 'Switch to Scatha or Glacite Golem Pet for Mining',
        description: `Your active pet (${activePetType.replace(/_/g, ' ') || 'none'}) doesn't boost mining. Switch to Scatha (LEGENDARY, BIS general mining) or Glacite Golem (LEGENDARY, BIS for Glacite Tunnels specifically) for mining sessions.`,
        whyItMatters: 'Mining pets boost Mining Fortune and drop rates. Scatha is the general-purpose BIS; Glacite Golem is preferred in Glacite Tunnels for Flawless gem rates.',
        estimatedCost: 15_000_000,
        estimatedCostLabel: '~15M–40M for a Legendary mining pet',
        estimatedBenefit: '+Mining Fortune, increased gem/ore drops per hour',
        roiScore: 82,
        urgencyScore: 65,
        progressionScore: 70,
        requirementScore: 20,
        confidenceScore: 70,
        sourceTags: ['pets', 'mining', 'scatha', 'glacite-golem'],
        dependsOn: [],
        unlocks: ['mining_fortune_pet'],
        gameStage: ['late', 'endgame'],
        priority: 'medium',
        type: 'best_roi',
      });
    }
  }

  // Dungeons: Black Cat at F5+ for S-rank speed
  if (profile.dungeons.catacombs.highestFloor >= 5) {
    const isDungeonPet = ['BLACK_CAT', 'LION', 'TIGER'].includes(activePetType);
    if (!isDungeonPet) {
      recs.push({
        id: 'bis_pet_dungeons',
        category: 'dungeons',
        title: 'Switch to Black Cat Pet for Dungeons',
        description: `Your active pet (${activePetType.replace(/_/g, ' ') || 'none'}) isn't optimized for dungeons. Black Cat (LEGENDARY) is BIS for dungeon speed — its ability boosts movement speed significantly, enabling S+ rank clears.`,
        whyItMatters: 'S-rank dungeon clears are worth far more per hour than B-rank. Black Cat enables faster floor navigation which is the primary bottleneck in dungeon time. Community vote: 64.6% run Berserker with Black Cat at mid-game.',
        estimatedCost: 20_000_000,
        estimatedCostLabel: '~20M+ for a Legendary Black Cat',
        estimatedBenefit: 'S-rank dungeon clears, faster runs, higher coins/hr',
        roiScore: 80,
        urgencyScore: 62,
        progressionScore: 72,
        requirementScore: 30,
        confidenceScore: 70,
        sourceTags: ['pets', 'dungeons', 'black-cat', 'speed'],
        dependsOn: [],
        unlocks: ['dungeon_speed', 's_rank'],
        gameStage: ['mid', 'late', 'endgame'],
        priority: 'medium',
        type: 'best_roi',
      });
    }
  }

  // Fishing: Ammonite at Fishing 15+
  if (profile.skills.fishing >= 15) {
    const isFishingPet = ['AMMONITE', 'FLYING_FISH', 'DOLPHIN', 'SQUID'].includes(activePetType);
    if (!isFishingPet) {
      recs.push({
        id: 'bis_pet_fishing',
        category: 'fishing',
        title: 'Switch to Ammonite (BIS) or Flying Fish for Fishing',
        description: `Your active pet (${activePetType.replace(/_/g, ' ') || 'none'}) doesn't boost fishing. Ammonite (LEGENDARY) is the BIS fishing pet. Flying Fish and Dolphin are strong alternatives at lower cost.`,
        whyItMatters: 'Fishing pets multiply Fishing Fortune and sea creature spawn rates. Ammonite is BIS for trophy fishing and high-value sea creature drops. Swapping before fishing sessions is always worth it.',
        estimatedCost: 8_000_000,
        estimatedCostLabel: '~8M (Flying Fish) to 50M+ (Ammonite)',
        estimatedBenefit: '+Fishing Fortune, better sea creature rates, trophy fish efficiency',
        roiScore: 78,
        urgencyScore: 58,
        progressionScore: 65,
        requirementScore: 20,
        confidenceScore: 80,
        sourceTags: ['pets', 'fishing', 'ammonite', 'flying-fish'],
        dependsOn: [],
        unlocks: ['fishing_fortune_pet'],
        gameStage: ['mid', 'late', 'endgame'],
        priority: 'medium',
        type: 'best_roi',
      });
    }
  }

  return recs;
}

// ─── Rift Progression ─────────────────────────────────────────────────────────

function checkRiftProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const cat = profile.dungeons.catacombs.level;

  // Gate check: SkyBlock Level 12 unlocks the Wizard Portal → Rift
  if (profile.skyblockLevel >= 10 && profile.skyblockLevel < 12 && cat >= 20) {
    recs.push({
      id: 'rift_unlock',
      category: 'general',
      title: 'Unlock The Rift at SkyBlock Level 12',
      description: 'The Rift is a separate dimension accessible at SkyBlock Level 12 via the Wizard Portal in the Wilderness. Bring a Rift Prism to enter. It has an isolated stat system (standard gear stats don\'t carry over) and its own Motes currency.',
      whyItMatters: 'The Rift unlocks Vampire Slayer (Rift-exclusive, unique accessories), Enigma Souls (free progression), Dead Cats quest line, and the Motes economy. Late-game accessories from the Rift are also the most efficient MP-per-coin at endgame.',
      estimatedCost: 0,
      estimatedCostLabel: `${12 - profile.skyblockLevel} more SkyBlock levels needed (free)`,
      estimatedBenefit: 'Vampire Slayer, Motes economy, Enigma Souls, late-game accessories',
      roiScore: 82,
      urgencyScore: 70,
      progressionScore: 80,
      requirementScore: 20,
      confidenceScore: 95,
      sourceTags: ['rift', 'skyblock-level', 'late-game'],
      dependsOn: [],
      unlocks: ['rift_access', 'vampire_slayer', 'motes_economy'],
      gameStage: ['mid', 'late'],
      priority: 'high',
      type: 'progression',
    });
  }

  // Enigma Souls: free passive progression inside the Rift
  if (profile.skyblockLevel >= 12 && (profile.rift?.enigmaSouls ?? 0) < 30) {
    const collected = profile.rift?.enigmaSouls ?? 0;
    recs.push({
      id: 'rift_enigma_souls',
      category: 'general',
      title: `Collect Enigma Souls in the Rift (${collected} collected)`,
      description: `You've collected ${collected} Enigma Souls in the Rift. These are Rift-exclusive collectibles that provide free Rift progression and unlock NPC interactions. There are many scattered across the Rift zones.`,
      whyItMatters: 'Enigma Souls are free and permanent Rift progression. Collecting them unlocks interactions and lore in the Rift, similar to how Fairy Souls work in the overworld.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free (exploration only)',
      estimatedBenefit: 'Free Rift progression, NPC unlocks, lore completeness',
      roiScore: 65,
      urgencyScore: 40,
      progressionScore: 55,
      requirementScore: 0,
      confidenceScore: 88,
      sourceTags: ['rift', 'enigma-souls', 'free', 'exploration'],
      dependsOn: ['rift_unlock'],
      unlocks: ['rift_npc_unlocks'],
      gameStage: ['late', 'endgame'],
      priority: 'low',
      type: 'cheapest',
    });
  }

  // Dead Cats: gallery quest line in the Rift
  if (profile.skyblockLevel >= 12 && (profile.rift?.deadCats ?? 0) < 3) {
    const found = profile.rift?.deadCats ?? 0;
    recs.push({
      id: 'rift_dead_cats',
      category: 'general',
      title: `Find Dead Cats in the Rift Gallery (${found} found)`,
      description: `The Rift Gallery contains ${3 - found} more Dead Cats to find. These are part of the Rift Gallery quest line and contribute to Rift-specific trophy and progression milestones.`,
      whyItMatters: 'The Dead Cats quest line is part of the Rift Gallery progression — a free way to earn Rift-specific rewards and advance the gallery storyline.',
      estimatedCost: 0,
      estimatedCostLabel: 'Free (exploration in Rift Gallery)',
      estimatedBenefit: 'Rift Gallery progression, trophy milestones',
      roiScore: 60,
      urgencyScore: 35,
      progressionScore: 50,
      requirementScore: 0,
      confidenceScore: 82,
      sourceTags: ['rift', 'dead-cats', 'gallery', 'free'],
      dependsOn: ['rift_unlock'],
      unlocks: ['rift_gallery_trophies'],
      gameStage: ['late', 'endgame'],
      priority: 'low',
      type: 'cheapest',
    });
  }

  return recs;
}

// ─── Kuudra Progression ────────────────────────────────────────────────────────

function checkKuudraProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const { blaze } = profile.slayers;
  const cat = profile.dungeons.catacombs.level;
  const kuudra = profile.crimson?.kuudraTiers ?? {};
  const kuudraRuns = Object.values(kuudra).reduce((s, v) => s + v, 0);

  // Kuudra income tiers (user-verified April 2026):
  // Basic/Hot (T1-T2): 5–15M/hr — mostly for Kuudra Teeth + initial reputation
  // Burning (T3): 20–30M/hr — Fatal Tempo Books, essence, attribute shards
  // Fiery (T4): 35–50M/hr — requires Aurora/Terror armor, specific roles
  // Infernal (T5): 60–120M+/hr — RNG-dependent (Kuudra Cores, Ananke Feathers); setup cost 5B–10B+
  // Key: must pay for Kuudra Keys upfront (grind Nether Stars from Vanquishers, or buy)
  //      Run time matters: sub-2 min parties hit top rates; 5+ min runs halve income

  // Entry: Blaze L4 unlocks Crimson Isle → Kuudra; recommend if player hasn't started
  if (blaze.level >= 4 && kuudraRuns === 0) {
    recs.push({
      id: 'kuudra_start',
      category: 'combat',
      title: 'Start Kuudra in the Crimson Isle (5–15M/hr entry)',
      description: 'You\'ve unlocked Crimson Isle via Blaze Slayer L4. Kuudra is the Crimson Isle raid boss with 5 tiers. Entry tiers Basic/Hot (T1-T2) earn 5–15M/hr — mostly Kuudra Teeth and Crimson Essence for initial reputation. You must pay for Kuudra Keys upfront (grind Nether Stars from Vanquishers). Scales to Burning T3 (20–30M/hr) → Fiery T4 (35–50M/hr) → Infernal T5 (60–120M+/hr).',
      whyItMatters: 'Kuudra is independent from dungeons — you can progress both simultaneously. Entry tier is accessible without major gear investment and provides a smooth scaling path. Infernal drops Kuudra Cores and Ananke Feathers worth hundreds of millions on good RNG.',
      estimatedCost: 5_000_000,
      estimatedCostLabel: '~5M (Crimson Isle gear + initial Kuudra Keys)',
      estimatedBenefit: '5–15M/hr now; path to 60–120M+/hr at Infernal',
      roiScore: 88,
      urgencyScore: 75,
      progressionScore: 85,
      requirementScore: 35,
      confidenceScore: 88,
      sourceTags: ['kuudra', 'crimson-isle', 'combat', 'income', 'late-game'],
      dependsOn: ['slayer_blaze_4'],
      unlocks: ['kuudra_income', 'crimson_armor', 'infernal_kuudra'],
      gameStage: ['late', 'endgame'],
      priority: 'high',
      type: 'progression',
    });
  }

  // Tier push: running Kuudra but not yet Infernal
  const infernalRuns = kuudra['infernal'] ?? 0;
  const fieryRuns = kuudra['fiery'] ?? 0;
  if (kuudraRuns > 0 && infernalRuns === 0 && cat >= 30) {
    const currentTier = fieryRuns > 0 ? 'Fiery (T4)' : 'Burning (T3) or below';
    recs.push({
      id: 'kuudra_infernal',
      category: 'combat',
      title: 'Push to Infernal Kuudra (60–120M+/hr)',
      description: `You're running Kuudra at ${currentTier} but haven't reached Infernal (T5). Infernal earns 60–120M+/hr — heavily RNG-dependent on Kuudra Cores and Ananke Feathers. Requires high-end gear (Aurora/Terror armor for T4, top setups for T5) and fast run times (sub-2 min for best income). Only "Paid Chest" if loot value exceeds key cost; salvage bad gear for Crimson Essence as fallback.`,
      whyItMatters: 'Infernal Kuudra is among the best endgame income methods. Setup cost is high (5B–10B+ for optimal), but consistent 80–110M/hr is realistic for organized parties. Unlike dungeons, Kuudra drops provide a reliable "floor" income via Crimson Essence salvage even on bad RNG.',
      estimatedCost: 100_000_000,
      estimatedCostLabel: '100M–500M+ (gear progression to Infernal; full BiS is 5B+)',
      estimatedBenefit: '60–120M+/hr (Infernal), Kuudra Cores, Ananke Feathers',
      roiScore: 90,
      urgencyScore: 68,
      progressionScore: 88,
      requirementScore: 65,
      confidenceScore: 85,
      sourceTags: ['kuudra', 'infernal', 'endgame', 'income'],
      dependsOn: ['kuudra_start'],
      unlocks: ['infernal_drops', 'crimson_armor_bis'],
      gameStage: ['endgame'],
      priority: 'medium',
      type: 'best_roi',
    });
  }

  return recs;
}

// ─── HOTM Tier 10 Progression ─────────────────────────────────────────────────

function checkHOTMTenProgression(profile: PlayerProfile): Recommendation[] {
  const recs: Recommendation[] = [];
  const hotm = profile.mining.hotmLevel;

  // Only relevant for HOTM 7+ miners who haven't reached tier 10 yet
  if (hotm < 7 || hotm >= 10) return recs;

  recs.push({
    id: 'hotm_push_10',
    category: 'mining',
    title: `Push HOTM to Level 10 (currently ${hotm}/10)`,
    description: `Your Heart of the Mountain is level ${hotm}. HOTM 10 requires 1,247,000 cumulative XP and unlocks 7 powerful endgame nodes: Gemstone Infusion (active, 120s CD), Sheer Force (active), Mining Master, Crystalline, Gifts from the Departed, Dead Man's Chest, and Vanguard Seeker.`,
    whyItMatters: 'HOTM 10 is the mining endgame. The Peak of the Mountain passive (tier 10) grants bonus tokens for node upgrades. Active nodes (Gemstone Infusion, Sheer Force) directly increase Flawless gem drop rates — the primary driver of gemstone mining income. Commissions + Glacite Powder are the fastest path.',
    estimatedCost: 0,
    estimatedCostLabel: 'Mine Glacite Powder + do daily Commissions',
    estimatedBenefit: 'Gemstone Infusion + Sheer Force active abilities, Mining Master passive, Peak of the Mountain tokens',
    roiScore: 85,
    urgencyScore: hotm >= 9 ? 65 : 75,
    progressionScore: 88,
    requirementScore: 30,
    confidenceScore: 92,
    sourceTags: ['mining', 'hotm', 'hotm-10', 'endgame'],
    dependsOn: ['hotm_7_glacite'],
    unlocks: ['gemstone_infusion', 'sheer_force', 'mining_master', 'hotm_endgame_nodes'],
    gameStage: ['late', 'endgame'],
    priority: hotm >= 9 ? 'medium' : 'high',
    type: 'progression',
  });

  return recs;
}

// ─── Main Engine ───────────────────────────────────────────────────────────────

export function generateRecommendations(profile: PlayerProfile, bazaar?: BazaarPrices, election?: ElectionData | null): RecommendationSet {
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
    ...checkBoosterCookie(profile),
    ...checkGreenhousePlots(profile),
    ...checkPestFarming(profile, election),
    ...checkChocolateFactory(profile),
    ...checkMinionOptimization(profile),
    ...checkMinionSlots(profile),
    ...checkForagingProgression(profile),
    ...checkDailyHabits(profile),
    ...checkMoneyMakingPath(profile),
    ...checkMasterModeProgression(profile),
    ...checkFarmingArmorProgression(profile),
    ...checkMiningArmorProgression(profile),
    ...checkFishingArmorProgression(profile),
    ...checkBISPetForActivity(profile),
    ...checkRiftProgression(profile),
    ...checkKuudraProgression(profile),
    ...checkHOTMTenProgression(profile),
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

  // Sort by composite score — weighted by confidence so low-confidence recs rank lower
  const scored = relevant.sort((a, b) => {
    const scoreA = (a.urgencyScore * 0.35 + a.progressionScore * 0.35 + a.roiScore * 0.3) * (a.confidenceScore / 100);
    const scoreB = (b.urgencyScore * 0.35 + b.progressionScore * 0.35 + b.roiScore * 0.3) * (b.confidenceScore / 100);
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
