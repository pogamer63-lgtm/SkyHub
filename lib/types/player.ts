// Normalized player types used throughout the app
import type { ParsedItem } from '@/lib/hypixel/nbt';

export interface PlayerProfile {
  uuid: string;
  username: string;
  profileId: string;
  profileName: string;
  gameMode?: string;
  lastSaved?: number;

  // Parsed stats
  skyblockLevel: number;
  purseCoins: number;
  bankCoins: number;

  skills: SkillLevels;
  slayers: SlayerLevels;
  dungeons: DungeonProgress;
  pets: ParsedPet[];
  accessories: AccessoryInfo;
  mining: MiningProgress;
  farming: FarmingProgress;
  collections: Record<string, number>;

  // Computed
  magicalPower: number;
  networth?: number;
  fairySouls: number;
  seniherWeight?: number;
  /** Trophy fish caught: FISH_NAME_bronze/silver/gold/diamond → count */
  trophyFish?: Record<string, number>;

  // Populated by enrichWithNBT — undefined until enriched
  armorItems?: ParsedItem[];
  equipmentItems?: ParsedItem[];
  inventoryItems?: ParsedItem[];
  enderChestItems?: ParsedItem[];
  wardrobeItems?: ParsedItem[];
  backpackItems?: ParsedItem[];
}

export type { ParsedItem };

export interface SkillLevels {
  farming: number;
  mining: number;
  combat: number;
  foraging: number;
  fishing: number;
  enchanting: number;
  alchemy: number;
  carpentry: number;
  runecrafting: number;
  social: number;
  taming: number;
  hunting: number;
  farming_xp: number;
  mining_xp: number;
  combat_xp: number;
  foraging_xp: number;
  fishing_xp: number;
  enchanting_xp: number;
  alchemy_xp: number;
  hunting_xp: number;
  average?: number;
}

export interface SlayerLevels {
  zombie: SlayerInfo;
  spider: SlayerInfo;
  wolf: SlayerInfo;
  enderman: SlayerInfo;
  blaze: SlayerInfo;
  vampire: SlayerInfo;
}

export interface SlayerInfo {
  level: number;
  xp: number;
  kills: Record<string, number>;
}

export interface DungeonProgress {
  selectedClass: string;
  classes: Record<string, { level: number; xp: number }>;
  catacombs: {
    level: number;
    xp: number;
    highestFloor: number;
    floorCompletions: Record<string, number>;
    fastestTimes: Record<string, number>;
  };
  masterMode: {
    highestFloor: number;
    floorCompletions: Record<string, number>;
  };
}

export interface ParsedPet {
  type: string;
  tier: string;
  level: number;
  xp: number;
  active: boolean;
  heldItem?: string;
  skin?: string;
  candyUsed: number;
}

export interface AccessoryInfo {
  count: number;
  magicalPower: number;
  missingCommon: string[];
  missingUncommon: string[];
  missingRare: string[];
  missingEpic: string[];
  selectedPower?: string;
  powers: string[];
  /** Populated after NBT enrichment */
  ownedIds?: Set<string>;
}

export interface MiningProgress {
  hotmLevel: number;
  hotmNodes: Record<string, number>;
  hotmTokensAvailable: number;
  hotmTokensSpent: number;
  powderMithril: number;
  powderMithrilTotal: number;
  powderGemstone: number;
  powderGemstoneTotal: number;
  powderGlacite: number;
  powderGlaciteTotal: number;
  xp: number;
}

export interface FarmingProgress {
  gardenLevel: number;
  plots: number;
  cropUpgrades: Record<string, number>;
  /** medals_inv: current held medals (bronze/silver/gold) */
  jacobMedals: Record<string, number>;
  /** Total medals earned across all contests (bronze/silver/gold/platinum/diamond) */
  jacobMedalsEarned: { bronze: number; silver: number; gold: number; platinum: number; diamond: number };
  jacobPerks: Record<string, number>;
  /** Crop resources collected (used for milestone calculation) */
  gardenResources: Record<string, number>;
  copper: number;
  farmingFortune: number;
  uniqueGolds: string[];
  contestsParticipated: number;
}

// Recommendation types
export type GameStage = 'early' | 'mid' | 'late' | 'endgame';
export type RecommendationCategory =
  | 'general'
  | 'farming'
  | 'mining'
  | 'dungeons'
  | 'slayer'
  | 'fishing'
  | 'accessories'
  | 'skills'
  | 'combat'
  | 'money';

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  whyItMatters: string;
  estimatedCost: number | null; // coins, null = unknown
  estimatedCostLabel: string;
  estimatedBenefit: string;
  roiScore: number; // 0-100
  urgencyScore: number; // 0-100
  progressionScore: number; // 0-100
  requirementScore: number; // 0=no requirements, 100=hard to unlock
  confidenceScore: number; // 0-100
  sourceTags: string[];
  dependsOn: string[]; // IDs of prerequisite recommendations
  unlocks: string[]; // what this upgrade enables
  gameStage: GameStage[];
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: 'cheapest' | 'best_roi' | 'fastest' | 'progression' | 'longterm' | 'blocker';
  actionUrl?: string;
}

export interface RecommendationSet {
  playerId: string;
  profileId: string;
  generatedAt: number;
  gameStage: GameStage;
  topPick: Recommendation;
  cheapest: Recommendation[];
  bestROI: Recommendation[];
  fastest: Recommendation[];
  blockers: Recommendation[];
  byCategory: Record<RecommendationCategory, Recommendation[]>;
  all: Recommendation[];
}

export interface PlayerSearchResult {
  uuid: string;
  username: string;
  profiles: Array<{
    id: string;
    name: string;
    selected: boolean;
  }>;
}
