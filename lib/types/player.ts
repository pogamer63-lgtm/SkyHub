// Normalized player types used throughout the app
import type { ParsedItem } from '@/lib/hypixel/nbt';
import type { DungeonRun, ActiveEffect, SlayerQuest, TempStatBuff } from '@/lib/types/hypixel';
export type { DungeonRun, ActiveEffect, SlayerQuest, TempStatBuff } from '@/lib/types/hypixel';

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
  /** Chocolate factory: rabbit names found → count (1 = found) */
  chocolateRabbits?: Record<string, number>;
  /** Chocolate per second (base rate before prestige) */
  chocolatePerSecond?: number;
  /** Total chocolate ever produced */
  totalChocolate?: number;
  /** Current chocolate available */
  chocolate?: number;
  /** Chocolate factory prestige level */
  chocolatePrestige?: number;

  // Crimson Isle / Nether
  crimson: CrimsonProgress;
  // The Rift
  rift: RiftProgress;

  // Player combat/social stats
  playerStats: PlayerStats;
  fairyExchanges: number;
  highestPetScore: number;

  // Chocolate factory detail
  chocolateLevel: number;
  chocolateEmployees: Record<string, number>;

  // Accessory bag detail
  accessoryBagUpgrades: number;
  unlockedPowers: string[];

  // Mining biomes
  miningBiomes: Record<string, unknown>;

  // Misc scalars
  deathCount: number;
  firstJoin?: number;
  visitorsServed: number;
  larvaeConsumed: number;
  /** Crafted (unique) minion IDs */
  minions: string[];

  // Populated by enrichWithNBT — undefined until enriched
  armorItems?: ParsedItem[];
  equipmentItems?: ParsedItem[];
  inventoryItems?: ParsedItem[];
  enderChestItems?: ParsedItem[];
  wardrobeItems?: ParsedItem[];
  backpackItems?: ParsedItem[];
  potionItems?: ParsedItem[];
  fishingBagItems?: ParsedItem[];
  quiverItems?: ParsedItem[];
  sacksItems?: ParsedItem[];
  vaultItems?: ParsedItem[];
  candyItems?: ParsedItem[];
  /** Active potion/effect buffs from player_data.active_effects */
  activeEffects: ActiveEffect[];
  /** Active temporary stat buffs (cookie, booster, etc.) */
  tempStatBuffs: TempStatBuff[];
  /** Emblem unlock levels (name → level) */
  emblemUnlocks: Record<string, number>;
  /** Emblem names claimed for free */
  freeEmblemsClaimed: string[];
  /** Chocolate earned since last prestige */
  chocolateSincePrestige?: number;

  // Bestiary milestone totals
  bestiaryMilestones: number;
  bestiaryMaxMilestones: number;

  // Active slayer quest (undefined when no quest is running)
  slayerQuest?: SlayerQuest;

  // Leveling extras
  completedTasksCount: number;
  currentBadge?: number;
  selectedSymbol?: string;
  miningFiestaOresMined: number;
  fishingFestivalSharksKilled: number;

  // Player misc
  lastDeath?: number;
  visitedZonesCount: number;
  soulflow?: number;
  peltCount: number;
  attributeStacks: Record<string, number>;
  glacite?: GlaciteProgress;
  foragingTreeTokensSpent: number;
  foragingTreeNodes: Record<string, number | boolean>;
  foragingDailyTreesCut: number;
  foragingWhispers: number;
  foragingWhispersSpent: number;
  foragingDailyEffect?: string;
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
  taming_xp: number;
  carpentry_xp: number;
  runecrafting_xp: number;
  social_xp: number;
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
  claimedLevels: Record<string, boolean>;
}

export interface DungeonFloorStats {
  floorCompletions: Record<string, number>;
  timesPlayed: Record<string, number>;
  fastestTimes: Record<string, number>;
  fastestTimesS: Record<string, number>;
  fastestTimesSPlus: Record<string, number>;
  bestScores: Record<string, number>;
  mobsKilled: Record<string, number>;
  bestRuns: Record<string, DungeonRun[]>;
  mostHealing: Record<string, number>;
  watcherKills: Record<string, number>;
}

export interface DungeonProgress {
  selectedClass: string;
  classes: Record<string, { level: number; xp: number }>;
  catacombs: DungeonFloorStats & {
    level: number;
    xp: number;
    highestFloor: number;
  };
  masterMode: DungeonFloorStats & {
    highestFloor: number;
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
  maxed: boolean;
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

export interface GlaciteProgress {
  fossilsDonated: string[];
  fossilDust: number;
  corpsesLooted: Record<string, number>;
  mineshaftsEntered: number;
}

export interface CrystalState {
  state: string;
  found: number;
  placed: number;
}

export interface DojoChallenge {
  score: number;
  wave?: number;
}

export interface CrimsonProgress {
  selectedFaction: string;
  magesReputation: number;
  barbiansReputation: number;
  kuudraTiers: Record<string, number>;
  dojo: Record<string, DojoChallenge>;
  fairySoulCollected: number;
  abiphoneContacts: number;
}

export interface RiftProgress {
  enigmaSouls: number;
  deadCats: number;
  galleryTrophies: number;
  witherEyes: number;
  grubberStacks: number;
  motesPurse: number;
  motesOrbPickup: number;
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
  crystals: Record<string, CrystalState>;
  selectedPickaxeAbility?: string;
  dailyOresMined: number;
  hotmLastReset?: number;
  greaterMinesLastAccess?: number;
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
  uniquePlatinums: string[];
  uniqueDiamonds: string[];
  contestsParticipated: number;
  participationMilestones: number;
}

export interface PlayerStats {
  totalKills: number;
  totalDeaths: number;
  riftMotesEarned: number;
  giftsGiven: number;
  giftsReceived: number;
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
