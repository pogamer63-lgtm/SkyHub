/**
 * Curated accessory list for the Accessory Optimizer.
 * Covers the most impactful accessories across all progression stages.
 * Source: Bazaar IDs for tradeable items, "AH" for auction-only.
 */

import { ItemRarity, MP_PER_RARITY } from '@/lib/hypixel/nbt';

export interface AccessoryEntry {
  id: string;               // SkyBlock item ID
  name: string;
  rarity: ItemRarity;
  mp: number;               // Magical Power contribution
  bazaarId?: string;        // If on Bazaar, item ID (may differ from SkyBlock ID)
  source: 'bazaar' | 'ah' | 'npc' | 'drop' | 'craft';
  gameStage: 'early' | 'mid' | 'late' | 'any';
  category: AccessoryCategory;
  family?: string;          // Upgrade family (e.g. "speed_talisman" → "speed_ring" → "speed_artifact")
  upgradesTo?: string;      // ID of next tier in same family
  notes?: string;
}

export type AccessoryCategory =
  | 'speed' | 'combat' | 'magic' | 'farming' | 'mining'
  | 'fishing' | 'utility' | 'dungeon' | 'misc';

/** Build MP from rarity for accessories without unique MP values */
function mp(rarity: ItemRarity) {
  return MP_PER_RARITY[rarity];
}

export const ACCESSORY_LIST: AccessoryEntry[] = [
  // ─── Speed Family ─────────────────────────────────────────────────────────
  { id: 'SPEED_TALISMAN',  name: 'Speed Talisman',  rarity: 'COMMON',    mp: mp('COMMON'),    source: 'bazaar', bazaarId: 'SPEED_TALISMAN',  gameStage: 'early', category: 'speed', family: 'speed', upgradesTo: 'SPEED_RING' },
  { id: 'SPEED_RING',      name: 'Speed Ring',      rarity: 'UNCOMMON',  mp: mp('UNCOMMON'),  source: 'bazaar', bazaarId: 'SPEED_RING',      gameStage: 'early', category: 'speed', family: 'speed', upgradesTo: 'SPEED_ARTIFACT' },
  { id: 'SPEED_ARTIFACT',  name: 'Speed Artifact',  rarity: 'RARE',      mp: mp('RARE'),      source: 'craft',  gameStage: 'mid',   category: 'speed', family: 'speed' },

  // ─── Feather Falling Family ────────────────────────────────────────────────
  { id: 'FEATHER_TALISMAN', name: 'Feather Talisman', rarity: 'COMMON',   mp: mp('COMMON'),   source: 'bazaar', bazaarId: 'FEATHER_TALISMAN', gameStage: 'early', category: 'utility', family: 'feather', upgradesTo: 'FEATHER_RING' },
  { id: 'FEATHER_RING',     name: 'Feather Ring',     rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'bazaar', bazaarId: 'FEATHER_RING',     gameStage: 'early', category: 'utility', family: 'feather', upgradesTo: 'FEATHER_ARTIFACT' },
  { id: 'FEATHER_ARTIFACT', name: 'Feather Artifact', rarity: 'RARE',     mp: mp('RARE'),     source: 'ah',     gameStage: 'mid',   category: 'utility', family: 'feather' },

  // ─── Potion Family ────────────────────────────────────────────────────────
  { id: 'POTION_AFFINITY_TALISMAN', name: 'Potion Affinity Talisman', rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'bazaar', bazaarId: 'POTION_AFFINITY_TALISMAN', gameStage: 'early', category: 'utility', family: 'potion', upgradesTo: 'RING_OF_LOVE' },
  { id: 'RING_OF_LOVE',             name: 'Ring of Love',              rarity: 'RARE',     mp: mp('RARE'),     source: 'ah',     gameStage: 'mid',   category: 'utility', family: 'potion' },

  // ─── Night Vision ─────────────────────────────────────────────────────────
  { id: 'NIGHT_VISION_CHARM', name: 'Night Vision Charm', rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'bazaar', bazaarId: 'NIGHT_VISION_CHARM', gameStage: 'early', category: 'utility' },

  // ─── Combat / Crit ────────────────────────────────────────────────────────
  { id: 'INTIMIDATION_TALISMAN', name: 'Intimidation Talisman', rarity: 'SPECIAL', mp: mp('SPECIAL'), source: 'ah', gameStage: 'early', category: 'combat' },
  { id: 'HUNTER_TALISMAN',       name: 'Hunter Talisman',       rarity: 'COMMON',  mp: mp('COMMON'),  source: 'ah', gameStage: 'early', category: 'combat' },
  { id: 'CRIT_TALISMAN',         name: 'Crit Talisman',         rarity: 'COMMON',  mp: mp('COMMON'),  source: 'bazaar', bazaarId: 'CRIT_TALISMAN', gameStage: 'early', category: 'combat', family: 'crit', upgradesTo: 'CRIT_RING' },
  { id: 'CRIT_RING',             name: 'Crit Ring',             rarity: 'UNCOMMON',mp: mp('UNCOMMON'), source: 'bazaar', bazaarId: 'CRIT_RING', gameStage: 'early', category: 'combat', family: 'crit', upgradesTo: 'CRIT_ARTIFACT' },
  { id: 'CRIT_ARTIFACT',         name: 'Crit Artifact',         rarity: 'RARE',    mp: mp('RARE'),    source: 'ah', gameStage: 'mid', category: 'combat', family: 'crit' },

  // ─── Resistance Family ────────────────────────────────────────────────────
  { id: 'RESISTANCE_TALISMAN', name: 'Resistance Talisman', rarity: 'COMMON',   mp: mp('COMMON'),   source: 'ah', gameStage: 'early', category: 'combat', family: 'resistance', upgradesTo: 'RESISTANCE_RING' },
  { id: 'RESISTANCE_RING',     name: 'Resistance Ring',     rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'ah', gameStage: 'early', category: 'combat', family: 'resistance', upgradesTo: 'RESISTANCE_ARTIFACT' },
  { id: 'RESISTANCE_ARTIFACT', name: 'Resistance Artifact', rarity: 'RARE',     mp: mp('RARE'),     source: 'ah', gameStage: 'mid',   category: 'combat', family: 'resistance' },

  // ─── Mana / Magic ─────────────────────────────────────────────────────────
  { id: 'MANA_BAND',         name: 'Mana Band',         rarity: 'EPIC',      mp: mp('EPIC'),      source: 'bazaar', bazaarId: 'MANA_BAND',         gameStage: 'mid',  category: 'magic', family: 'mana', upgradesTo: 'MANA_NECKLACE' },
  { id: 'MANA_NECKLACE',     name: 'Mana Necklace',     rarity: 'LEGENDARY', mp: mp('LEGENDARY'), source: 'ah',     gameStage: 'late', category: 'magic', family: 'mana' },
  { id: 'MANA_TALISMAN',     name: 'Mana Talisman',     rarity: 'UNCOMMON',  mp: mp('UNCOMMON'),  source: 'bazaar', bazaarId: 'MANA_TALISMAN',     gameStage: 'early', category: 'magic' },

  // ─── Piggy Bank ───────────────────────────────────────────────────────────
  { id: 'PIGGY_BANK',    name: 'Piggy Bank',    rarity: 'COMMON',   mp: mp('COMMON'),   source: 'npc', gameStage: 'early', category: 'utility' },
  { id: 'CRACKED_PIGGY_BANK', name: 'Cracked Piggy Bank', rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'craft', gameStage: 'early', category: 'utility', family: 'piggy', upgradesTo: 'REINFORCED_PIGGY_BANK' },
  { id: 'REINFORCED_PIGGY_BANK', name: 'Reinforced Piggy Bank', rarity: 'RARE', mp: mp('RARE'), source: 'craft', gameStage: 'mid', category: 'utility', family: 'piggy' },

  // ─── Campfire Badge ───────────────────────────────────────────────────────
  { id: 'CAMPFIRE_TALISMAN_1',  name: 'Campfire Badge I',  rarity: 'COMMON',   mp: mp('COMMON'),   source: 'npc', gameStage: 'early', category: 'misc' },
  { id: 'CAMPFIRE_TALISMAN_2',  name: 'Campfire Badge II', rarity: 'COMMON',   mp: mp('COMMON'),   source: 'npc', gameStage: 'early', category: 'misc' },
  { id: 'CAMPFIRE_TALISMAN_3',  name: 'Campfire Badge III',rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'npc', gameStage: 'early', category: 'misc' },
  { id: 'CAMPFIRE_TALISMAN_4',  name: 'Campfire Badge IV', rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'npc', gameStage: 'mid',   category: 'misc' },
  { id: 'CAMPFIRE_TALISMAN_5',  name: 'Campfire Badge V',  rarity: 'RARE',     mp: mp('RARE'),     source: 'npc', gameStage: 'mid',   category: 'misc' },
  { id: 'CAMPFIRE_TALISMAN_6',  name: 'Campfire Badge VI', rarity: 'EPIC',     mp: mp('EPIC'),     source: 'npc', gameStage: 'late',  category: 'misc' },

  // ─── Fishing ──────────────────────────────────────────────────────────────
  { id: 'ANGLER_TALISMAN', name: 'Angler Talisman', rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'ah', gameStage: 'early', category: 'fishing', family: 'angler', upgradesTo: 'ANGLER_RING' },
  { id: 'ANGLER_RING',     name: 'Angler Ring',     rarity: 'RARE',     mp: mp('RARE'),     source: 'ah', gameStage: 'mid',   category: 'fishing', family: 'angler', upgradesTo: 'ANGLER_ARTIFACT' },
  { id: 'ANGLER_ARTIFACT', name: 'Angler Artifact', rarity: 'EPIC',     mp: mp('EPIC'),     source: 'ah', gameStage: 'late',  category: 'fishing', family: 'angler' },

  // ─── Farming ──────────────────────────────────────────────────────────────
  { id: 'FARMER_ORB',        name: 'Farmer Orb',         rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'bazaar', bazaarId: 'FARMER_ORB',        gameStage: 'early', category: 'farming' },
  { id: 'UNCOMMON_AGRI_ORB', name: 'Agri Orb (Uncommon)',rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'bazaar', bazaarId: 'UNCOMMON_AGRI_ORB', gameStage: 'early', category: 'farming', family: 'agri_orb', upgradesTo: 'RARE_AGRI_ORB' },
  { id: 'RARE_AGRI_ORB',     name: 'Agri Orb (Rare)',    rarity: 'RARE',     mp: mp('RARE'),     source: 'bazaar', bazaarId: 'RARE_AGRI_ORB',     gameStage: 'mid',   category: 'farming', family: 'agri_orb', upgradesTo: 'EPIC_AGRI_ORB' },
  { id: 'EPIC_AGRI_ORB',     name: 'Agri Orb (Epic)',    rarity: 'EPIC',     mp: mp('EPIC'),     source: 'bazaar', bazaarId: 'EPIC_AGRI_ORB',     gameStage: 'late',  category: 'farming', family: 'agri_orb' },

  // ─── Mining ───────────────────────────────────────────────────────────────
  { id: 'ROCK_TALISMAN',   name: 'Rock Talisman',   rarity: 'COMMON',   mp: mp('COMMON'),   source: 'ah', gameStage: 'early', category: 'mining', family: 'rock', upgradesTo: 'ROCK_RING' },
  { id: 'ROCK_RING',       name: 'Rock Ring',       rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'ah', gameStage: 'mid',   category: 'mining', family: 'rock', upgradesTo: 'ROCK_ARTIFACT' },
  { id: 'ROCK_ARTIFACT',   name: 'Rock Artifact',   rarity: 'RARE',     mp: mp('RARE'),     source: 'ah', gameStage: 'late',  category: 'mining', family: 'rock' },
  { id: 'VILLAGE_AFFINITY_TALISMAN', name: 'Village Affinity Talisman', rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'ah', gameStage: 'early', category: 'mining' },
  { id: 'MINE_TALISMAN',   name: 'Mine Talisman',   rarity: 'COMMON',   mp: mp('COMMON'),   source: 'ah', gameStage: 'early', category: 'mining', family: 'mine', upgradesTo: 'MINE_RING' },
  { id: 'MINE_RING',       name: 'Mine Ring',       rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'ah', gameStage: 'mid',   category: 'mining', family: 'mine' },

  // ─── Slayer ───────────────────────────────────────────────────────────────
  { id: 'SCARF_STUDIES',       name: "Scarf's Studies",       rarity: 'EPIC',      mp: mp('EPIC'),      source: 'ah', gameStage: 'mid',  category: 'dungeon', notes: 'Scarf boss drop' },
  { id: 'SCARF_THESIS',        name: "Scarf's Thesis",        rarity: 'LEGENDARY', mp: mp('LEGENDARY'), source: 'ah', gameStage: 'late', category: 'dungeon' },
  { id: 'POWER_RELIC',         name: 'Power Relic',           rarity: 'RARE',      mp: mp('RARE'),      source: 'ah', gameStage: 'mid',  category: 'dungeon' },

  // ─── Dungeon ──────────────────────────────────────────────────────────────
  { id: 'BAT_TALISMAN',    name: 'Bat Talisman',    rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'ah', gameStage: 'early', category: 'dungeon', family: 'bat', upgradesTo: 'BAT_RING' },
  { id: 'BAT_RING',        name: 'Bat Ring',        rarity: 'RARE',     mp: mp('RARE'),     source: 'ah', gameStage: 'mid',   category: 'dungeon', family: 'bat', upgradesTo: 'BAT_ARTIFACT' },
  { id: 'BAT_ARTIFACT',    name: 'Bat Artifact',    rarity: 'EPIC',     mp: mp('EPIC'),     source: 'ah', gameStage: 'late',  category: 'dungeon', family: 'bat' },

  // ─── Hegemony / Special ───────────────────────────────────────────────────
  { id: 'HEGEMONY_ARTIFACT', name: 'Hegemony Artifact', rarity: 'VERY_SPECIAL', mp: mp('VERY_SPECIAL'), source: 'ah', gameStage: 'late', category: 'utility', notes: '+0.5% crit damage for each missing crit chance over 100' },
  { id: 'WITHER_SHIELD',     name: 'Wither Shield',     rarity: 'RARE',          mp: mp('RARE'),          source: 'ah', gameStage: 'mid',  category: 'utility', notes: 'Absorbed damage stored as shield' },

  // ─── Coins ────────────────────────────────────────────────────────────────
  { id: 'COINS_TALISMAN',  name: 'Coins Talisman',  rarity: 'COMMON',   mp: mp('COMMON'),   source: 'bazaar', bazaarId: 'COINS_TALISMAN', gameStage: 'early', category: 'utility', family: 'coins', upgradesTo: 'COINS_RING' },
  { id: 'COINS_RING',      name: 'Coins Ring',      rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'bazaar', bazaarId: 'COINS_RING',     gameStage: 'mid',   category: 'utility', family: 'coins', upgradesTo: 'COINS_ARTIFACT' },
  { id: 'COINS_ARTIFACT',  name: 'Coins Artifact',  rarity: 'RARE',     mp: mp('RARE'),     source: 'bazaar', bazaarId: 'COINS_ARTIFACT', gameStage: 'late',  category: 'utility', family: 'coins' },

  // ─── Candy ────────────────────────────────────────────────────────────────
  { id: 'CANDY_TALISMAN', name: 'Candy Talisman', rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'bazaar', bazaarId: 'CANDY_TALISMAN', gameStage: 'any', category: 'misc', family: 'candy', upgradesTo: 'CANDY_RING' },
  { id: 'CANDY_RING',     name: 'Candy Ring',     rarity: 'RARE',     mp: mp('RARE'),     source: 'bazaar', bazaarId: 'CANDY_RING',     gameStage: 'any', category: 'misc', family: 'candy', upgradesTo: 'CANDY_ARTIFACT' },
  { id: 'CANDY_ARTIFACT', name: 'Candy Artifact', rarity: 'EPIC',     mp: mp('EPIC'),     source: 'bazaar', bazaarId: 'CANDY_ARTIFACT', gameStage: 'any', category: 'misc', family: 'candy' },

  // ─── Nether ───────────────────────────────────────────────────────────────
  { id: 'TALISMAN_OF_POWER',   name: 'Talisman of Power',   rarity: 'UNCOMMON', mp: mp('UNCOMMON'), source: 'ah', gameStage: 'mid',  category: 'combat' },
  { id: 'RING_OF_POWER',       name: 'Ring of Power',       rarity: 'RARE',     mp: mp('RARE'),     source: 'ah', gameStage: 'mid',  category: 'combat' },
  { id: 'ARTIFACT_OF_POWER',   name: 'Artifact of Power',   rarity: 'EPIC',     mp: mp('EPIC'),     source: 'ah', gameStage: 'late', category: 'combat' },

  { id: 'NETHER_ARTIFACT',     name: 'Nether Artifact',     rarity: 'LEGENDARY', mp: mp('LEGENDARY'), source: 'ah', gameStage: 'late', category: 'combat' },
];

/** Quick lookup by ID */
export const ACCESSORY_BY_ID = new Map(ACCESSORY_LIST.map(a => [a.id, a]));

/** All Bazaar-tradeable accessories */
export const BAZAAR_ACCESSORIES = ACCESSORY_LIST.filter(a => a.source === 'bazaar');
