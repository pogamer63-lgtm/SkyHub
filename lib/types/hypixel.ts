// Core Hypixel SkyBlock types

export interface HypixelPlayerResponse {
  success: boolean;
  player: HypixelPlayer | null;
}

export interface HypixelPlayer {
  _id: string;
  uuid: string;
  displayname: string;
  stats?: {
    SkyBlock?: {
      profiles?: Record<string, { profile_id: string; cute_name: string }>;
    };
  };
}

export interface HypixelProfilesResponse {
  success: boolean;
  profiles: SkyBlockProfile[] | null;
}

export interface SkyBlockProfile {
  profile_id: string;
  cute_name: string;
  selected: boolean;
  members: Record<string, SkyBlockMember>;
  banking?: { balance: number };
  game_mode?: string;
  museum?: SkyBlockMuseum;
}

export interface SkyBlockMuseum {
  members?: Record<string, MuseumMember>;
}

export interface MuseumItem {
  donated_time?: number;
  featuredSlot?: string;
  borrowing?: boolean;
  [key: string]: unknown;
}

export interface MuseumMember {
  items?: Record<string, MuseumItem>;
  special?: MuseumItem[];
  value?: number;
  appraisal?: boolean;
}

export interface SkyBlockMember {
  uuid?: string;
  profile?: {
    deletion_notice?: { timestamp: number };
    first_join?: number;
    first_join_hub?: number;
  };
  player_data?: {
    experience?: Record<string, number>;
    active_effects?: ActiveEffect[];
    disabled_potion_effects?: string[];
    visited_zones?: string[];
    last_death?: number;
    reaper_peppers_eaten?: number;
    unclean_sword?: boolean;
    temp_stat_buffs?: TempStatBuff[];
    death_count?: number;
    disabled_potion_effects_2?: string[];
  };
  currencies?: {
    coin_purse?: number;
    motes_purse?: number;
  };
  leveling?: {
    experience?: number;
    completions?: Record<string, number>;
    completed_tasks?: string[];
    highest_pet_score?: number;
    mining_fiesta_ores_mined?: number;
    fishing_festival_sharks_killed?: number;
    migrated?: boolean;
    bop_bonus?: number;
    migrated_completions_2?: boolean;
    last_viewed_tasks?: string[];
    current_badge?: number;
    free_emblems_claimed?: string[];
    selected_symbol?: string;
    emblem_unlocks?: Record<string, number>;
  };
  slayer?: SlayerData;
  dungeons?: DungeonData;
  /** Modern API: pets live under pets_data.pets */
  pets_data?: { pets?: Pet[] };
  /** Legacy fallback (old API format) */
  pets?: { pets?: Pet[] } | Pet[];
  inventory?: InventoryData;
  mining_core?: MiningCoreData;
  /** Powder fields are at member level, NOT inside mining_core */
  powder_mithril?: number;
  powder_spent_mithril?: number;
  powder_gemstone?: number;
  powder_spent_gemstone?: number;
  powder_glacite?: number;
  powder_spent_glacite?: number;
  garden_player_data?: GardenData;
  /** API uses jacobs_contest, NOT jacobs_farming */
  jacobs_contest?: JacobsFarmingData;
  /** Legacy fallback */
  jacobs_farming?: JacobsFarmingData;
  collection?: Record<string, number>;
  crafted_generators?: string[];
  accessory_bag_storage?: AccessoryBagData;
  bestiary?: { kills?: Record<string, number> };
  fairy_soul?: { total_collected?: number; fairy_exchanges?: number };
  trophy_fish?: Record<string, number | string[]>;
  hoppity?: {
    chocolate?: number;
    chocolate_since_prestige?: number;
    total_chocolate?: number;
    chocolate_level?: number;
    employees?: Record<string, number>;
    prestige?: { level?: number };
    rabbits?: Record<string, number>;
    [key: string]: unknown;
  };
  rift?: {
    wither_cage?: { killed_eyes?: number[] };
    gallery?: { secured_trophies?: unknown[] };
    enigma?: { found_souls?: unknown[] };
    dead_cats?: { montezuma?: unknown; found_cats?: unknown[] };
    castle?: { grubber_stacks?: number };
  };
  player_stats?: {
    kills?: Record<string, number>;
    deaths?: Record<string, number>;
    rift?: { lifetime_motes_earned?: number; motes_orb_pickup?: number };
    gifts?: { total_given?: number; total_received?: number };
  };
  nether_island_player_data?: NetherData;
}

export interface ActiveEffect {
  effect: string;
  level: number;
  modifiers?: Array<{ key: string; amp: number }>;
  ticks_remaining: number;
  infinite?: boolean;
}

export interface TempStatBuff {
  stat: number;
  key: string;
  amount: number;
  expire_at: number;
}

export interface SlayerData {
  slayer_bosses?: Record<string, SlayerBoss>;
  slayer_quest?: SlayerQuest;
}

export interface SlayerBoss {
  claimed_levels?: Record<string, boolean>;
  xp?: number;
  boss_kills_tier_0?: number;
  boss_kills_tier_1?: number;
  boss_kills_tier_2?: number;
  boss_kills_tier_3?: number;
  boss_kills_tier_4?: number;
}

export interface SlayerQuest {
  type?: string;
  tier?: number;
  start_timestamp?: number;
  completion_state?: number;
  used_items?: string[];
  combat_xp?: number;
  recent_mob_kills?: Array<{ xp: number; timestamp: number }>;
  last_killed_mob_island?: string;
  kill_timestamp?: number;
  killed_mobs?: number;
}

export interface DungeonData {
  dungeon_types?: Record<string, DungeonType>;
  player_classes?: Record<string, DungeonClass>;
  dungeon_journal?: Record<string, unknown>;
  dungeons_blah_blah?: string[];
  selected_dungeon_class?: string;
  daily_runs?: Record<string, unknown>;
  treasures?: Record<string, unknown>;
}

export interface DungeonType {
  experience?: number;
  tier_completions?: Record<string, number>;
  highest_tier_completed?: number;
  times_played?: Record<string, number>;
  milestone_completions_0?: number;
  best_runs?: Record<string, DungeonRun[]>;
  best_score?: Record<string, number>;
  most_mobs_killed?: Record<string, number>;
  most_healing?: Record<string, number>;
  mobs_killed?: Record<string, number>;
  fastest_time?: Record<string, number>;
  fastest_time_s?: Record<string, number>;
  fastest_time_s_plus?: Record<string, number>;
  watcher_kills?: Record<string, number>;
  times_played_1?: number;
}

export interface DungeonRun {
  score_exploration?: number;
  score_speed?: number;
  score_skill?: number;
  score_bonus?: number;
  dungeon_class?: string;
  teammates?: string[];
  elapsed_time?: number;
  damage_dealt?: number;
  deaths?: number;
  mobs_killed?: number;
  secrets_found?: number;
  damage_mitigated?: number;
  ally_healing?: number;
  timestamp?: number;
}

export interface DungeonClass {
  experience?: number;
}

export interface Pet {
  uuid?: string;
  uniqueId?: string;
  type: string;
  exp: number;
  active: boolean;
  tier: PetTier;
  heldItem?: string;
  candyUsed: number;
  skin?: string;
}

export type PetTier = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export interface InventoryData {
  inv_contents?: NBTData;
  armor?: NBTData;
  equipment_contents?: NBTData;
  wardrobe_contents?: NBTData;
  ender_chest_contents?: NBTData;
  backpack_contents?: Record<string, NBTData>;
  bag_contents?: {
    talisman_bag?: NBTData;
    potion_bag?: NBTData;
    fishing_bag?: NBTData;
    quiver?: NBTData;
    sacks_bag?: NBTData;
    candy_inventory_contents?: NBTData;
  };
}

export interface NBTData {
  type?: number;
  data: string; // base64 encoded NBT
}

export interface MiningCoreData {
  nodes?: Record<string, number>;
  received_free_tier?: boolean;
  tokens?: number;
  tokens_spent?: number;
  /** Legacy powder fields (may be inside mining_core in some API versions) */
  powder_mithril?: number;
  powder_mithril_total?: number;
  powder_gemstone?: number;
  powder_gemstone_total?: number;
  powder_glacite?: number;
  powder_glacite_total?: number;
  experience?: number;
  crystals?: Record<string, CrystalData>;
  biomes?: Record<string, unknown>;
  selected_pickaxe_ability?: string;
  retroactive_tier2_token?: boolean;
  last_reset?: number;
  daily_ores_mined?: number;
  daily_ores_mined_day_mithril_ore?: number;
  daily_ores_mined_day?: number;
  daily_ores_mined_mithril_ore?: number;
  greater_mines_last_access?: number;
  toggle_main_pickaxe?: boolean;
}

export interface CrystalData {
  state?: string;
  total_found?: number;
  total_placed?: number;
}

export interface GardenData {
  copper?: number;
  larva_consumed?: number;
  garden_experience?: number;
  plots_unlocked?: number;
  commission_data?: Record<string, unknown>;
  resources_collected?: Record<string, number>;
  crop_upgrade_levels?: Record<string, number>;
  visitors_served?: number;
  composter_data?: Record<string, unknown>;
}

export interface JacobsFarmingData {
  medals_inv?: Record<string, number>;
  perks?: Record<string, number>;
  talked?: boolean;
  contests?: Record<string, JacobsContest>;
  /** unique_brackets replaces unique_golds2 in newer API */
  unique_brackets?: { gold?: string[]; platinum?: string[]; diamond?: string[] };
  unique_golds2?: string[];
  participation_milestones?: number;
  collected_rewards?: string[];
}

export interface JacobsContest {
  collected?: number;
  claimed_rewards?: boolean;
  claimed_position?: number;
  claimed_participants?: number;
  /** Direct medal field present in newer API responses */
  claimed_medal?: string;
}

export interface AccessoryBagData {
  tuning?: Record<string, unknown>;
  selected_power?: string;
  powers?: string[];
  bag_upgrades_purchased?: number;
  highest_magical_power?: number;
  unlocked_powers?: string[];
}

export interface NetherData {
  kuudra_completed_tiers?: Record<string, number>;
  dojo?: Record<string, unknown>;
  abiphone?: Record<string, unknown>;
  matriarch?: Record<string, unknown>;
  mages_reputation?: number;
  barbarians_reputation?: number;
  selected_faction?: string;
  fairy_soul_collected?: number;
  bestiary?: Record<string, unknown>;
}

// Mojang API types
export interface MojangProfile {
  id: string;
  name: string;
}
