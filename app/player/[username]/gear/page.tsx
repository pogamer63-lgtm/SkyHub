import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { parseInventoryNBT, ParsedItem, ItemRarity } from '@/lib/hypixel/nbt';
import { SkyBlockProfile } from '@/lib/types/hypixel';
import { GEMSTONE_TYPES, ESSENCE_COSTS } from '@/lib/neu/data';
import { ClickableItemGrid, SerializableItem } from '@/components/ClickableItemGrid';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Gear Analyzer` };
}

// ─── Armor / Gear Knowledge Base ─────────────────────────────────────────────

interface GearTierEntry {
  tier: number;          // 1 = early, 5 = endgame
  stage: 'Early' | 'Mid' | 'Late' | 'Endgame';
  set: string;
  upgradeSet?: string;
  upgradeNote?: string;
  upgradeCost?: string;
}

// Maps item ID fragments → tier info (fragments match if item ID *contains* the key)
const ARMOR_TIER_DB: Record<string, GearTierEntry> = {
  // ── Early ──
  ZOMBIE_SOLDIER:      { tier: 1, stage: 'Early', set: 'Zombie Soldier',    upgradeSet: 'Glacite / Ender Armor', upgradeNote: 'Farm Zombie Slayer T1/T2 to start', upgradeCost: '20k–50k' },
  FAIRY:               { tier: 1, stage: 'Early', set: 'Fairy Armor',       upgradeSet: 'Glacite / Ender Armor', upgradeNote: 'Basic protection only — upgrade soon', upgradeCost: '20k–50k' },
  HARDENED_DIAMOND:    { tier: 2, stage: 'Early', set: 'Hardened Diamond',  upgradeSet: 'Glacite / Ender Armor', upgradeNote: 'Solid early survivability', upgradeCost: '20k–50k' },
  GLACITE:             { tier: 2, stage: 'Early', set: 'Glacite Armor',     upgradeSet: 'Strong Dragon', upgradeNote: 'Good early-mid armor; upgrade to Strong Dragon next', upgradeCost: '50k–100k' },
  ENDER:               { tier: 2, stage: 'Early', set: 'Ender Armor',       upgradeSet: 'Strong Dragon', upgradeNote: 'Good early-mid combat armor; upgrade to Strong Dragon next', upgradeCost: '50k–100k' },
  MINERAL:             { tier: 2, stage: 'Early', set: 'Mineral',           upgradeSet: 'Glacite / Ender Armor', upgradeNote: 'Mining set', upgradeCost: '100k' },
  SKELET:              { tier: 2, stage: 'Early', set: 'Skeleton Master',   upgradeSet: 'Glacite / Ender Armor', upgradeNote: 'Farming-viable early armor', upgradeCost: '80k' },
  // ── Mid ──
  PERFECT:             { tier: 3, stage: 'Mid', set: 'Perfect Armor',       upgradeSet: 'Strong Dragon', upgradeNote: 'Craft from Flawless Gemstones. Solid mid-game.', upgradeCost: '500k–2M' },
  STRONG_DRAGON:       { tier: 3, stage: 'Mid', set: 'Strong Dragon',       upgradeSet: 'Shadow Assassin', upgradeNote: 'Current meta: Strong Dragon → Shadow Assassin after F5. Fierce reforge recommended.', upgradeCost: '1M–3M' },
  WISE_DRAGON:         { tier: 3, stage: 'Mid', set: 'Wise Dragon',         upgradeSet: 'Shadow Assassin', upgradeNote: 'Magic find / Mage builds. Upgrade to SA after F5.', upgradeCost: '500k–1M' },
  UNSTABLE_DRAGON:     { tier: 3, stage: 'Mid', set: 'Unstable Dragon',    upgradeSet: 'Shadow Assassin', upgradeNote: 'Crit damage. Upgrade to SA after F5.', upgradeCost: '1M–2M' },
  YOUNG_DRAGON:        { tier: 3, stage: 'Mid', set: 'Young Dragon',        upgradeSet: 'Shadow Assassin', upgradeNote: 'Speed focus. Upgrade to SA after F5.', upgradeCost: '300k' },
  SUPERIOR_DRAGON:     { tier: 3, stage: 'Mid', set: 'Superior Dragon',     upgradeSet: 'Shadow Assassin', upgradeNote: 'Strong all-around. Still upgrade to Shadow Assassin after F5.', upgradeCost: '8M–15M' },
  SHADOW:              { tier: 4, stage: 'Mid', set: 'Shadow Assassin',     upgradeSet: "Necron's Armor", upgradeNote: "Current meta post-F5: Shadow Assassin is the best mid-game set. Upgrade to Necron's for F7+.", upgradeCost: '5M–15M' },
  CHEAP_TUXEDO:        { tier: 2, stage: 'Early', set: 'Cheap Tuxedo',      upgradeSet: 'Tuxedo', upgradeNote: 'Fishing set', upgradeCost: '50k' },
  TUXEDO:              { tier: 3, stage: 'Mid', set: 'Tuxedo',              upgradeSet: 'Diver', upgradeNote: 'Fishing armor', upgradeCost: '200k' },
  // ── Late ──
  NECRON:              { tier: 5, stage: 'Late', set: "Necron's Armor",     upgradeSet: 'Kuudra Infernal', upgradeNote: 'F7 drop. Best dungeon armor (set bonus scales). For non-dungeon endgame, Kuudra Infernal has better raw stats.', upgradeCost: '50M+' },
  MAXOR:               { tier: 5, stage: 'Late', set: 'Maxor\'s Armor',     upgradeSet: 'Storm\'s Armor', upgradeNote: 'HP focus. F7 drop.', upgradeCost: '30M+' },
  STORM:               { tier: 5, stage: 'Late', set: 'Storm\'s Armor',     upgradeSet: 'Goldor / Necron', upgradeNote: 'Intelligence focus. F7.', upgradeCost: '30M+' },
  GOLDOR:              { tier: 5, stage: 'Late', set: 'Goldor\'s Armor',    upgradeSet: 'Necron\'s Armor', upgradeNote: 'Defense focus. F7.', upgradeCost: '30M+' },
  CRIMSON:             { tier: 6, stage: 'Endgame', set: 'Crimson Armor',   upgradeSet: 'Molten (Kuudra)', upgradeNote: 'Kuudra T1-T4. Strong Nether set.', upgradeCost: '20M–80M' },
  AURORA:              { tier: 5, stage: 'Late', set: 'Aurora Armor',       upgradeSet: 'Crimson / Terror', upgradeNote: 'Kuudra T1. Entry Kuudra armor.', upgradeCost: '5M–15M' },
  TERROR:              { tier: 6, stage: 'Endgame', set: 'Terror Armor',    upgradeSet: 'Molten / Fervor', upgradeNote: 'Kuudra T4. Excellent mage/berserk.', upgradeCost: '50M–200M' },
  FERVOR:              { tier: 6, stage: 'Endgame', set: 'Fervor Armor',    upgradeSet: 'Molten', upgradeNote: 'Kuudra T4. Great for archers.', upgradeCost: '50M+' },
  MOLTEN:              { tier: 7, stage: 'Endgame', set: 'Molten Armor',    upgradeNote: 'Kuudra T5. Best-in-slot for most builds.', upgradeCost: '200M+' },
  INFERNAL_AURORA:     { tier: 7, stage: 'Endgame', set: 'Kuudra Infernal', upgradeNote: 'Endgame: better raw stats than Necron outside dungeons. Necron retains value for dungeon set bonuses.', upgradeCost: '500M+' },
  WARDEN:              { tier: 7, stage: 'Endgame', set: 'Warden Helmet',   upgradeNote: 'MM7 exclusive helmet.', upgradeCost: '100M+' },
};

// Equipment slot names
const EQUIP_SLOT_NAMES = ['Gauntlet', 'Cloak', 'Belt', 'Necklace', 'Bracelet', 'Gloves'];

// Known equipment tier mappings
const EQUIP_TIER_DB: Record<string, { tier: number; stage: string; set?: string }> = {
  ZOMBIE_COMMANDER_WHIP:  { tier: 2, stage: 'Early', set: 'Zombie Slayer' },
  SPIDER_LEG_PENDANT:     { tier: 2, stage: 'Early', set: 'Spider Slayer' },
  WOLF_PAW:               { tier: 2, stage: 'Early', set: 'Wolf Slayer' },
  ENDERMAN_CORTEX_REEKE: { tier: 2, stage: 'Early', set: 'Enderman Slayer' },
  YOUNG_DRAGON_FRAGMENT:  { tier: 3, stage: 'Mid'   },
  BLAZE_BELT:             { tier: 3, stage: 'Mid',   set: 'Blaze Slayer' },
  VAMPIRE_FANG_NECKLACE:  { tier: 3, stage: 'Mid',   set: 'Vampire Slayer' },
  MOLTEN_NECKLACE:        { tier: 7, stage: 'Endgame', set: 'Molten' },
  MOLTEN_CLOAK:           { tier: 7, stage: 'Endgame', set: 'Molten' },
  MOLTEN_BELT:            { tier: 7, stage: 'Endgame', set: 'Molten' },
  MOLTEN_BRACELET:        { tier: 7, stage: 'Endgame', set: 'Molten' },
  TERROR_NECKLACE:        { tier: 6, stage: 'Endgame', set: 'Terror' },
  TERROR_CLOAK:           { tier: 6, stage: 'Endgame', set: 'Terror' },
  TERROR_BELT:            { tier: 6, stage: 'Endgame', set: 'Terror' },
  TERROR_BRACELET:        { tier: 6, stage: 'Endgame', set: 'Terror' },
  CRIMSON_NECKLACE:       { tier: 5, stage: 'Late',    set: 'Crimson' },
  CRIMSON_CLOAK:          { tier: 5, stage: 'Late',    set: 'Crimson' },
  CRIMSON_BELT:           { tier: 5, stage: 'Late',    set: 'Crimson' },
  CRIMSON_BRACELET:       { tier: 5, stage: 'Late',    set: 'Crimson' },
};

// Key weapon tier database
const WEAPON_TIER_DB: Record<string, { tier: number; stage: string; type: string; upgradeTo?: string; upgradeCost?: string }> = {
  ASPECT_OF_THE_JERRY:   { tier: 1, stage: 'Early',   type: 'Sword',  upgradeTo: 'Aspect of the End / Livid Dagger', upgradeCost: '10k' },
  ASPECT_OF_THE_END:     { tier: 2, stage: 'Early',   type: 'Sword',  upgradeTo: 'Livid Dagger / Aspect of the Dragon', upgradeCost: '500k' },
  LIVID_DAGGER:          { tier: 3, stage: 'Mid',     type: 'Dagger', upgradeTo: 'Shadow Fury / Hyperion', upgradeCost: '1M–3M' },
  ASPECT_OF_THE_DRAGON:  { tier: 3, stage: 'Mid',     type: 'Sword',  upgradeTo: 'Giant Sword / Hyperion', upgradeCost: '5M' },
  GIANT_SWORD:           { tier: 4, stage: 'Mid',     type: 'Sword',  upgradeTo: 'Hyperion / Shadow Fury', upgradeCost: '20M+' },
  HYPERION:              { tier: 5, stage: 'Late',    type: 'Sword',  upgradeTo: 'Nothing (best wither)' },
  SHADOW_FURY:           { tier: 4, stage: 'Mid',     type: 'Sword',  upgradeTo: 'Hyperion / Valkyrie', upgradeCost: '20M' },
  VALKYRIE:              { tier: 5, stage: 'Late',    type: 'Sword',  upgradeTo: 'Nothing (best sword)' },
  TERMINATOR:            { tier: 5, stage: 'Late',    type: 'Bow',    upgradeTo: 'Nothing (best bow)' },
  JUJU_SHORTBOW:         { tier: 3, stage: 'Mid',     type: 'Bow',    upgradeTo: 'Terminator', upgradeCost: '5M' },
  SPIRIT_SCEPTRE:        { tier: 3, stage: 'Mid',     type: 'Wand',   upgradeTo: 'Midas Staff / Hyperion', upgradeCost: '10M' },
  MIDAS_STAFF:           { tier: 4, stage: 'Mid',     type: 'Wand',   upgradeTo: 'Hyperion', upgradeCost: '30M' },
  RUNAANS_BOW:           { tier: 2, stage: 'Early',   type: 'Bow',    upgradeTo: 'Juju Shortbow', upgradeCost: '500k' },
  BONZO_STAFF:           { tier: 2, stage: 'Early',   type: 'Wand',   upgradeTo: 'Spirit Sceptre', upgradeCost: '200k' },
  FLOWER_OF_TRUTH:       { tier: 4, stage: 'Mid',     type: 'Sword',  upgradeTo: 'Hyperion' },
  WARDEN_SWORD:          { tier: 5, stage: 'Late',    type: 'Sword',  upgradeTo: 'Nothing (endgame melee)' },
  FIRE_VEIL_WAND:        { tier: 3, stage: 'Mid',     type: 'Wand',   upgradeTo: 'Hyperion', upgradeCost: '5M' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const RARITY_COLORS: Record<ItemRarity, string> = {
  COMMON:       'text-slate-300 border-slate-500/40 bg-slate-500/10',
  UNCOMMON:     'text-green-300 border-green-500/40 bg-green-500/10',
  RARE:         'text-blue-300 border-blue-500/40 bg-blue-500/10',
  EPIC:         'text-purple-300 border-purple-500/40 bg-purple-500/10',
  LEGENDARY:    'text-yellow-300 border-yellow-500/40 bg-yellow-500/10',
  MYTHIC:       'text-pink-300 border-pink-500/40 bg-pink-500/10',
  DIVINE:       'text-sky-300 border-sky-500/40 bg-sky-500/10',
  SPECIAL:      'text-red-300 border-red-500/40 bg-red-500/10',
  VERY_SPECIAL: 'text-red-400 border-red-400/40 bg-red-400/10',
  UNKNOWN:      'text-slate-500 border-slate-600/30 bg-slate-600/5',
};

function tierColor(tier: number): string {
  if (tier <= 1) return 'text-slate-400';
  if (tier <= 2) return 'text-green-400';
  if (tier <= 3) return 'text-blue-400';
  if (tier <= 4) return 'text-purple-400';
  if (tier <= 5) return 'text-yellow-400';
  if (tier <= 6) return 'text-orange-400';
  return 'text-pink-400';
}

function tierLabel(tier: number): string {
  const labels = ['', 'Starter', 'Basic', 'Solid', 'Good', 'Strong', 'Excellent', 'BiS'];
  return labels[Math.min(tier, 7)] ?? '???';
}

function lookupArmorTier(id: string): GearTierEntry | null {
  for (const [key, entry] of Object.entries(ARMOR_TIER_DB)) {
    if (id.includes(key)) return entry;
  }
  return null;
}

function lookupWeaponTier(id: string) {
  for (const [key, entry] of Object.entries(WEAPON_TIER_DB)) {
    if (id.includes(key)) return entry;
  }
  return null;
}

function lookupEquipTier(id: string) {
  for (const [key, entry] of Object.entries(EQUIP_TIER_DB)) {
    if (id.includes(key)) return entry;
  }
  return null;
}

function slotLabel(index: number, isArmor: boolean): string {
  if (isArmor) {
    const names = ['Helmet', 'Chestplate', 'Leggings', 'Boots'];
    return names[index] ?? `Slot ${index}`;
  }
  return EQUIP_SLOT_NAMES[index] ?? `Equip ${index}`;
}

function armorSlotIcon(index: number): string {
  return ['🪖', '🛡️', '🩲', '👢'][index] ?? '📦';
}

function equipSlotIcon(index: number): string {
  return ['🧤', '🧥', '🔗', '📿', '📿', '🧤'][index] ?? '💎';
}

function gearScore(armorItems: ParsedItem[], equipItems: ParsedItem[], weaponItems: ParsedItem[]): number {
  let total = 0;
  let count = 0;
  for (const item of [...armorItems, ...equipItems, ...weaponItems]) {
    if (!item.id || item.id === 'AIR') continue;
    const armorT = lookupArmorTier(item.id);
    const weaponT = lookupWeaponTier(item.id);
    const equipT = lookupEquipTier(item.id);
    const tier = armorT?.tier ?? weaponT?.tier ?? equipT?.tier ?? 2;
    total += tier;
    count++;
  }
  if (count === 0) return 0;
  return Math.round((total / count / 7) * 100);
}

// Slot-specific upgrade recommendations based on what is (or isn't) equipped
function getArmorUpgrades(slots: ParsedItem[]): string[] {
  const upgrades: string[] = [];
  let totalTier = 0;
  let slotCount = 0;

  for (let i = 0; i < 4; i++) {
    const item = slots[i];
    if (!item || !item.id || item.id === 'AIR' || item.name === '') {
      upgrades.push(`${slotLabel(i, true)}: Empty! Equip any armor piece immediately.`);
      continue;
    }
    const info = lookupArmorTier(item.id);
    totalTier += info?.tier ?? 2;
    slotCount++;
    if (info && info.upgradeSet) {
      if (info.tier <= 2) {
        upgrades.push(`${slotLabel(i, true)}: Upgrade from ${info.set} → ${info.upgradeSet} (${info.upgradeCost ?? '?'})`);
      } else if (info.tier <= 3) {
        upgrades.push(`${slotLabel(i, true)}: ${info.set} is solid. Consider ${info.upgradeSet} for late game.`);
      }
    }
  }

  const avgTier = slotCount > 0 ? totalTier / slotCount : 0;

  // Mix detection — if pieces are from different sets, warn
  const sets = slots
    .filter(i => i.id && i.id !== 'AIR')
    .map(i => lookupArmorTier(i.id)?.set ?? 'Unknown')
    .filter((v, idx, arr) => arr.indexOf(v) === idx);

  if (sets.length > 2) {
    upgrades.push('⚠️ Mixed armor set detected — aim for a full matching set for the set bonus.');
  }

  if (avgTier < 3 && slotCount >= 3) {
    upgrades.push('💡 Priority: Upgrade to Perfect Armor or a Dragon Set for a major power spike.');
  }

  return upgrades;
}

function getWeaponUpgrades(items: ParsedItem[]): string[] {
  const upgrades: string[] = [];
  const weapons = items.filter(i => i.id && i.id !== 'AIR' && i.name !== '');
  if (weapons.length === 0) {
    upgrades.push('No weapon detected in inventory scan. Make sure you have a weapon equipped!');
    return upgrades;
  }
  const best = weapons.reduce((a, b) => {
    const ta = lookupWeaponTier(a.id)?.tier ?? 0;
    const tb = lookupWeaponTier(b.id)?.tier ?? 0;
    return tb > ta ? b : a;
  });
  const info = lookupWeaponTier(best.id);
  if (info) {
    if (info.tier <= 2) {
      upgrades.push(`Best weapon: ${best.name} (${info.type}, ${info.stage}). Upgrade to: ${info.upgradeTo ?? 'better sword'} — ~${info.upgradeCost ?? '?'}`);
    } else if (info.tier <= 3) {
      upgrades.push(`Best weapon: ${best.name} (${info.type}, ${info.stage}). Good progress! Next: ${info.upgradeTo ?? 'higher-tier weapon'}`);
    } else {
      upgrades.push(`Best weapon: ${best.name} (${info.type}, ${info.stage}) — solid endgame weapon. ${info.upgradeTo ? `Future: ${info.upgradeTo}` : 'This is top-tier!'}`);
    }
  } else {
    upgrades.push(`Best weapon: ${best.name}. Not in known tier list — likely fine.`);
  }
  return upgrades;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function GearPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let error: string | null = null;
  let armorItems: ParsedItem[] = [];
  let equipItems: ParsedItem[] = [];
  let invWeapons: ParsedItem[] = [];
  let potionItems: ParsedItem[] = [];
  let fishingBagItems: ParsedItem[] = [];
  let quiverItems: ParsedItem[] = [];
  let sacksItems: ParsedItem[] = [];
  let rawProfile: SkyBlockProfile | null = null;
  let uuid = '';
  let resolvedName = username;

  try {
    const resolved = await resolvePlayer(username);
    uuid = resolved.uuid;
    resolvedName = resolved.username;

    const profilesRes = await getSkyBlockProfiles(uuid);
    if (!profilesRes.success || !profilesRes.profiles?.length) {
      error = 'No SkyBlock profiles found.';
    } else {
      let target = profilesRes.profiles.find(
        p => p.profile_id === profileId || p.cute_name.toLowerCase() === profileId?.toLowerCase()
      );
      if (!target) target = profilesRes.profiles.find(p => p.selected) ?? profilesRes.profiles[0];
      rawProfile = target;

      const member = target.members[uuid] ?? {};

      // Parse armor NBT
      const armorData = member.inventory?.inv_armor?.data;
      if (armorData) {
        try { armorItems = await parseInventoryNBT(armorData, true); } catch { /* skip */ }
      }

      // Parse equipment NBT
      const equipData = member.inventory?.equipment_contents?.data;
      if (equipData) {
        try { equipItems = await parseInventoryNBT(equipData, true); } catch { /* skip */ }
      }

      // Parse main inventory for weapons
      const invData = member.inventory?.inv_contents?.data;
      if (invData) {
        try {
          const inv = await parseInventoryNBT(invData);
          invWeapons = inv.filter(i => i.id && lookupWeaponTier(i.id) !== null);
        } catch { /* skip */ }
      }

      // Parse bags
      const bagContents = member.inventory?.bag_contents;
      await Promise.all([
        bagContents?.potion_bag?.data ? parseInventoryNBT(bagContents.potion_bag.data).then(r => { potionItems = r.filter(i => !!i.id); }).catch(() => {}) : Promise.resolve(),
        bagContents?.fishing_bag?.data ? parseInventoryNBT(bagContents.fishing_bag.data).then(r => { fishingBagItems = r.filter(i => !!i.id); }).catch(() => {}) : Promise.resolve(),
        bagContents?.quiver?.data ? parseInventoryNBT(bagContents.quiver.data).then(r => { quiverItems = r.filter(i => !!i.id); }).catch(() => {}) : Promise.resolve(),
        bagContents?.sacks_bag?.data ? parseInventoryNBT(bagContents.sacks_bag.data).then(r => { sacksItems = r.filter(i => !!i.id); }).catch(() => {}) : Promise.resolve(),
      ]);
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load profile.';
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="card p-8">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-white mb-2">Profile Not Found</h1>
          <p className="text-slate-400">{error}</p>
          <a href={`/player/${resolvedName}`} className="mt-6 inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white">
            ← Back to Profile
          </a>
        </div>
      </div>
    );
  }

  const hasArmorData = armorItems.some(i => i.id && i.id !== 'AIR' && i.name);
  const hasEquipData = equipItems.some(i => i.id && i.id !== 'AIR' && i.name);

  const score = gearScore(armorItems, equipItems, invWeapons);
  const armorUpgrades = getArmorUpgrades(armorItems);
  const weaponUpgrades = getWeaponUpgrades(invWeapons);

  // Compute armor set summary
  const armorSets = armorItems
    .filter(i => i.id && i.id !== 'AIR' && i.name)
    .map(i => lookupArmorTier(i.id)?.set ?? null)
    .filter(Boolean);
  const dominantSet = armorSets.length > 0
    ? armorSets.reduce((a, b, _, arr) =>
        arr.filter(x => x === a).length >= arr.filter(x => x === b).length ? a : b
      )
    : null;

  const avgArmorTier = armorItems
    .filter(i => i.id && i.id !== 'AIR' && i.name)
    .map(i => lookupArmorTier(i.id)?.tier ?? 2)
    .reduce((a, b, _, arr) => a + b / arr.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href={`/player/${resolvedName}`} className="text-slate-400 hover:text-white text-sm">← Profile</a>
        <div>
          <h1 className="text-2xl font-bold text-white">Gear Analyzer</h1>
          <p className="text-slate-400 text-sm">{resolvedName} — Equipment overview &amp; upgrade paths</p>
        </div>
      </div>

      {/* Gear Score */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Gear Score</h2>
          <span className={`text-3xl font-bold ${score >= 70 ? 'text-yellow-400' : score >= 45 ? 'text-blue-400' : score >= 25 ? 'text-green-400' : 'text-slate-400'}`}>
            {score}/100
          </span>
        </div>
        <div className="w-full h-3 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${score >= 70 ? 'bg-yellow-500' : score >= 45 ? 'bg-blue-500' : score >= 25 ? 'bg-green-500' : 'bg-slate-500'}`}
            style={{ width: `${score}%` }}
          />
        </div>
        {dominantSet && (
          <p className="text-slate-300 text-sm mt-3">
            Primary set: <span className="text-white font-medium">{dominantSet}</span>
            {avgArmorTier > 0 && (
              <span className={`ml-2 text-xs ${tierColor(Math.round(avgArmorTier))}`}>
                ({tierLabel(Math.round(avgArmorTier))} tier)
              </span>
            )}
          </p>
        )}
        {!hasArmorData && (
          <p className="text-amber-400 text-sm mt-3">
            ⚠️ Armor NBT not available — player may need to log in recently for the API to return inventory data.
          </p>
        )}
      </div>

      {/* Armor Grid */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Armor Slots</h2>
        {hasArmorData ? (
          <ClickableItemGrid
            items={armorItems.slice(0, 4).map((item, i): SerializableItem => {
              const info = lookupArmorTier(item.id);
              return {
                ...item,
                slotLabel: slotLabel(i, true),
                slotIcon: armorSlotIcon(i),
                tierLabel: info ? `${info.stage} — ${tierLabel(info.tier)}` : undefined,
                tierColor: info ? tierColor(info.tier) : undefined,
              };
            })}
          />
        ) : (
          <div className="text-slate-400 text-sm italic py-4 text-center">
            Armor data not available from API (requires recent login).
          </div>
        )}
      </div>

      {/* Equipment Grid */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Equipment Slots</h2>
        {hasEquipData ? (
          <ClickableItemGrid
            gridCols="grid-cols-2 sm:grid-cols-3"
            items={equipItems.slice(0, 6).map((item, i): SerializableItem => {
              const info = lookupEquipTier(item.id);
              return {
                ...item,
                slotLabel: slotLabel(i, false),
                slotIcon: equipSlotIcon(i),
                tierLabel: info ? `${info.stage}${info.set ? ` — ${info.set}` : ''}` : undefined,
                tierColor: info ? tierColor(info.tier) : undefined,
              };
            })}
          />
        ) : (
          <div className="text-slate-400 text-sm italic py-4 text-center">
            Equipment data not available from API.
          </div>
        )}
      </div>

      {/* Detected Weapons */}
      {invWeapons.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Detected Weapons</h2>
          <ClickableItemGrid
            layout="list"
            items={invWeapons.map((item): SerializableItem => {
              const info = lookupWeaponTier(item.id);
              return {
                ...item,
                weaponType: info?.type,
                weaponStage: info?.stage,
                tierColor: info ? tierColor(info.tier) : undefined,
              };
            })}
          />
        </div>
      )}

      {/* Upgrade Recommendations */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upgrade Recommendations</h2>
        <div className="space-y-4">
          {/* Armor upgrades */}
          {armorUpgrades.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">🛡️ Armor</h3>
              <ul className="space-y-1">
                {armorUpgrades.map((u, i) => (
                  <li key={i} className="text-sm text-slate-300 bg-slate-800/50 rounded px-3 py-2">{u}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Weapon upgrades */}
          {weaponUpgrades.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">⚔️ Weapon</h3>
              <ul className="space-y-1">
                {weaponUpgrades.map((u, i) => (
                  <li key={i} className="text-sm text-slate-300 bg-slate-800/50 rounded px-3 py-2">{u}</li>
                ))}
              </ul>
            </div>
          )}

          {/* General advice */}
          <div>
            <h3 className="text-sm font-medium text-slate-300 mb-2">💡 General Advice</h3>
            <div className="space-y-2 text-sm text-slate-300">
              <div className="bg-slate-800/50 rounded px-3 py-2">
                Reforge armor with <span className="text-yellow-300">Fierce</span> (damage builds) or <span className="text-blue-300">Ancient</span> (crit builds) for max stat gains.
              </div>
              <div className="bg-slate-800/50 rounded px-3 py-2">
                Always enchant armor with <span className="text-purple-300">Growth V</span>, <span className="text-purple-300">Protection V</span>, and <span className="text-purple-300">True Protection</span> (on chestplate).
              </div>
              <div className="bg-slate-800/50 rounded px-3 py-2">
                For dungeons: use <span className="text-yellow-300">Recomb</span> + <span className="text-yellow-300">Stars</span> on Necron/Goldor/Storm armor before spending on the next set tier.
              </div>
              <div className="bg-slate-800/50 rounded px-3 py-2">
                Equipment from Crimson Isle (Kuudra): <span className="text-orange-300">Necklace / Cloak / Belt / Bracelet</span> — even T1 Crimson equipment beats most early-game alternatives.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bags */}
      {(potionItems.length > 0 || fishingBagItems.length > 0 || quiverItems.length > 0 || sacksItems.length > 0) && (
        <div className="card p-6 space-y-5">
          <h2 className="text-lg font-semibold text-white">🎒 Bags</h2>
          {potionItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Potion Bag ({potionItems.length})</h3>
              <ClickableItemGrid items={potionItems.map(i => ({ ...i }))} gridCols="grid-cols-4 sm:grid-cols-8" />
            </div>
          )}
          {fishingBagItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Fishing Bag ({fishingBagItems.length})</h3>
              <ClickableItemGrid items={fishingBagItems.map(i => ({ ...i }))} gridCols="grid-cols-4 sm:grid-cols-8" />
            </div>
          )}
          {quiverItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Quiver ({quiverItems.length})</h3>
              <ClickableItemGrid items={quiverItems.map(i => ({ ...i }))} gridCols="grid-cols-4 sm:grid-cols-8" />
            </div>
          )}
          {sacksItems.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-300 mb-2">Sacks Bag ({sacksItems.length})</h3>
              <ClickableItemGrid items={sacksItems.map(i => ({ ...i }))} gridCols="grid-cols-4 sm:grid-cols-8" />
            </div>
          )}
        </div>
      )}

      {/* Reforge Guide */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Reforge Guide</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { reforge: 'Ancient', stat: '+Crit Dmg, +Str, +HP', use: 'Best for most combat builds on armor', color: 'text-yellow-300' },
            { reforge: 'Fierce', stat: '+Strength, +Crit Dmg', use: 'Damage focus, great for Berserk', color: 'text-red-300' },
            { reforge: 'Renowned', stat: '+Magic Find, +Stats', use: 'General purpose on armor', color: 'text-blue-300' },
            { reforge: 'Withered', stat: '+Crit Dmg, +Str', use: 'Best for wither armor (Necron etc.)', color: 'text-purple-300' },
            { reforge: 'Gilded', stat: '+Gold Tokens, +Stats', use: 'On Midas / Golden armor for bonus', color: 'text-yellow-400' },
            { reforge: 'Spiritual', stat: '+Intelligence, +Speed', use: 'Mage / Healer builds in dungeons', color: 'text-sky-300' },
            { reforge: 'Loving', stat: '+HP, +Ferocity', use: 'Tank builds, strong HP gains', color: 'text-pink-300' },
            { reforge: 'Giant', stat: '+HP, +Def', use: 'Max survivability on any armor', color: 'text-green-300' },
          ].map(r => (
            <div key={r.reforge} className="bg-slate-800/50 rounded-lg px-3 py-2">
              <div className="flex justify-between items-start">
                <span className={`font-medium text-sm ${r.color}`}>{r.reforge}</span>
                <span className="text-xs text-slate-400">{r.stat}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1">{r.use}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Gemstone Reference (from NEU-REPO) */}
      <div className="card p-5">
        <h2 className="text-lg font-semibold text-white mb-4">Gemstone Stats Reference</h2>
        <p className="text-xs text-slate-500 mb-3">Stats at FLAWLESS quality by item rarity. Source: NEU-REPO gemstones.json</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Object.entries(GEMSTONE_TYPES).map(([gemId, gemData]) => {
            const flawless = gemData.stats?.['FLAWLESS'] ?? {};
            const legVal = flawless['LEGENDARY'] ?? flawless['EPIC'] ?? null;
            return (
              <div key={gemId} className="rounded-lg border border-white/5 bg-slate-800/30 p-3">
                <div className="text-sm font-medium text-white mb-1">
                  {gemId.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}
                </div>
                <div className="text-xs text-slate-400">{gemData.statName}</div>
                {legVal !== null && (
                  <div className="text-xs text-indigo-300 mt-0.5">+{legVal} at LEG (Flawless)</div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Progression Roadmap */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Armor Progression Roadmap</h2>
        <div className="space-y-2">
          {[
            { stage: 'Starter',    armor: 'Fairy Armor / Zombie Soldier',   note: 'First days. Replace ASAP.' },
            { stage: 'Early',      armor: 'Hardened Diamond',               note: 'Cheap, great defense. 20k–50k.' },
            { stage: 'Mid',        armor: 'Perfect Armor (t12) / Dragon',   note: '500k–3M. Huge power spike.' },
            { stage: 'Mid-Late',   armor: 'Superior Dragon',                note: '8M–15M. All-around best mid-game.' },
            { stage: 'Late',       armor: 'Necron / Goldor / Storm',        note: 'F7 gear. Requires Cat 28+. 30M–100M.' },
            { stage: 'Endgame',    armor: 'Crimson / Terror / Molten',      note: 'Kuudra. Best-in-slot. 50M–300M.' },
          ].map((row, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span className="text-slate-500 w-20 shrink-0 pt-0.5 text-xs">{row.stage}</span>
              <span className="text-slate-200 font-medium w-48 shrink-0">{row.armor}</span>
              <span className="text-slate-400">{row.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
