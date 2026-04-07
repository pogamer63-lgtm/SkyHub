import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles, getSkyBlockGarden } from '@/lib/hypixel/client';
import { selectBestProfile, enrichWithGarden } from '@/lib/hypixel/parser';
import { parseInventoryNBT, ParsedItem } from '@/lib/hypixel/nbt';
import { PlayerProfile } from '@/lib/types/player';
import { SkyBlockProfile } from '@/lib/types/hypixel';
import { formatCoins } from '@/lib/utils/format';
import {
  CROP_MILESTONE_THRESHOLDS,
  CROP_DISPLAY_NAMES as CROP_NAMES,
  GARDEN_PLOT_COUNT,
} from '@/lib/neu/data';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Farming Fortune Planner` };
}

// ─── Farming Fortune Constants ────────────────────────────────────────────────

/** FF per farming skill level */
const FF_PER_SKILL_LEVEL = 4;

/** FF per garden plot unlocked (+3 FF per plot) */
const FF_PER_PLOT = 3;
/** Total garden plots available. Source: NEU-REPO garden.json */
const MAX_PLOTS = GARDEN_PLOT_COUNT;

/** Jacob's Farming Fortune perk: FF per perk level */
const FF_PER_JACOB_FF_PERK = 4;

/** Max Jacob FF perk level (Anita's Extra Farming Fortune: 15 tiers × +4 FF = +60 FF max, wiki-confirmed) */
const JACOB_FF_PERK_MAX = 15;

/**
 * Crop milestone FF: each milestone level gives +1 FF.
 * CROP_MILESTONE_THRESHOLDS and CROP_NAMES are imported from NEU-REPO data.
 * NEU-REPO has 46 milestone tiers per crop (vs our old 18 — those were wrong).
 */

function getCropMilestoneLevel(cropKey: string, collected: number): number {
  const thresholds = CROP_MILESTONE_THRESHOLDS[cropKey];
  if (!thresholds) return 0;
  let level = 0;
  for (const t of thresholds) {
    if (collected >= t) level++;
    else break;
  }
  return level;
}

function getNextMilestoneAt(cropKey: string, currentLevel: number): number | null {
  const thresholds = CROP_MILESTONE_THRESHOLDS[cropKey];
  if (!thresholds || currentLevel >= thresholds.length) return null;
  return thresholds[currentLevel];
}

// ─── Farming Equipment FF Database ───────────────────────────────────────────

// ─── Farming Armor FF (per-piece, from NEU items_index — verified April 2026) ──
// Full set totals: Melon +70, Cropie +90, Squash +110, Fermento +130, Helianthus +150
const FARMING_ARMOR_FF: Record<string, number> = {
  // Melon Armor (early, Farming 1)
  MELON_HELMET: 15, MELON_CHESTPLATE: 20, MELON_LEGGINGS: 20, MELON_BOOTS: 15,
  // Cropie Armor (Farming 20 required)
  CROPIE_HELMET: 20, CROPIE_CHESTPLATE: 25, CROPIE_LEGGINGS: 25, CROPIE_BOOTS: 20,
  // Squash Armor (Farming 30 required)
  SQUASH_HELMET: 25, SQUASH_CHESTPLATE: 30, SQUASH_LEGGINGS: 30, SQUASH_BOOTS: 25,
  // Fermento Armor (Farming 40 required)
  FERMENTO_HELMET: 30, FERMENTO_CHESTPLATE: 35, FERMENTO_LEGGINGS: 35, FERMENTO_BOOTS: 30,
  // Helianthus Armor (Farming 50 required, December 2025 BIS)
  HELIANTHUS_HELMET: 35, HELIANTHUS_CHESTPLATE: 40, HELIANTHUS_LEGGINGS: 40, HELIANTHUS_BOOTS: 35,
};

// ─── Farming Equipment FF (Lotus/Blossom equipment — BELT/NECKLACE/CLOAK/BRACELET) ─
const FARMING_EQUIP_FF: Record<string, number> = {
  LOTUS_NECKLACE: 5, LOTUS_BELT: 5, LOTUS_CLOAK: 5, LOTUS_BRACELET: 5,
  BLOSSOM_NECKLACE: 7, BLOSSOM_BELT: 7, BLOSSOM_CLOAK: 7, BLOSSOM_BRACELET: 7,
};

// ─── Reforges on armor that give farming fortune (by NBT modifier, LEGENDARY FF value) ─
// Source: NEU reforgestones.json, itemTypes=ARMOR
const ARMOR_REFORGE_FF: Record<string, Record<string, number>> = {
  // mossy (OVERGROWN_GRASS): +5/10/15/20/25/30 FF by rarity
  'mossy': { COMMON: 5, UNCOMMON: 10, RARE: 15, EPIC: 20, LEGENDARY: 25, MYTHIC: 30 },
  // mantid (MANTID_CLAW): +2/4/6/8/10/12 FF by rarity
  'mantid': { COMMON: 2, UNCOMMON: 4, RARE: 6, EPIC: 8, LEGENDARY: 10, MYTHIC: 12 },
  // bustling (SKYMART_BROCHURE): +1/2/4/6/8/10 FF by rarity
  'bustling': { COMMON: 1, UNCOMMON: 2, RARE: 4, EPIC: 6, LEGENDARY: 8, MYTHIC: 10 },
};

// ─── Reforges on equipment that give farming fortune ─────────────────────────
// Source: NEU reforgestones.json, itemTypes=EQUIPMENT
const EQUIP_REFORGE_FF: Record<string, Record<string, number>> = {
  // rooted (BURROWING_SPORES): +6/9/12/15/18/21 FF by rarity
  'rooted': { COMMON: 6, UNCOMMON: 9, RARE: 12, EPIC: 15, LEGENDARY: 18, MYTHIC: 21 },
  // blooming (FLOWERING_BOUQUET): +1/2/3/4/5/6 FF by rarity
  'blooming': { COMMON: 1, UNCOMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 5, MYTHIC: 6 },
  // squeaky (SQUEAKY_TOY): +2/4/6/8/10/12 FF by rarity
  'squeaky': { COMMON: 2, UNCOMMON: 4, RARE: 6, EPIC: 8, LEGENDARY: 10, MYTHIC: 12 },
};

/** Calculate FF from parsed armor items (armor set bonuses + armor reforges) */
function calcArmorFF(items: ParsedItem[]): { ff: number; breakdown: string[] } {
  let ff = 0;
  const breakdown: string[] = [];

  for (const item of items) {
    if (!item.id || item.id === 'AIR') continue;

    // Armor set FF by item ID
    const armorBonus = FARMING_ARMOR_FF[item.id];
    if (armorBonus) {
      ff += armorBonus;
      breakdown.push(`${item.name || item.id}: +${armorBonus} FF`);
    }

    // Armor reforge FF (rarity-scaled)
    if (item.reforge) {
      const reforgeKey = item.reforge.toLowerCase();
      const reforgeTable = ARMOR_REFORGE_FF[reforgeKey];
      if (reforgeTable) {
        const bonus = reforgeTable[item.rarity] ?? reforgeTable['LEGENDARY'] ?? 0;
        if (bonus > 0) {
          ff += bonus;
          breakdown.push(`${item.name || item.id} (${item.reforge}): +${bonus} FF`);
        }
      }
    }
  }

  return { ff, breakdown };
}

/** Calculate FF from parsed equipment items (item base FF + equipment reforges) */
function calcEquipFF(items: ParsedItem[]): { ff: number; breakdown: string[] } {
  let ff = 0;
  const breakdown: string[] = [];

  for (const item of items) {
    if (!item.id || item.id === 'AIR') continue;

    // Equipment base FF by item ID (Lotus, Blossom)
    const equipBonus = FARMING_EQUIP_FF[item.id];
    if (equipBonus) {
      ff += equipBonus;
      breakdown.push(`${item.name || item.id}: +${equipBonus} FF`);
    }

    // Equipment reforge FF (rarity-scaled)
    if (item.reforge) {
      const reforgeKey = item.reforge.toLowerCase();
      const reforgeTable = EQUIP_REFORGE_FF[reforgeKey];
      if (reforgeTable) {
        const bonus = reforgeTable[item.rarity] ?? reforgeTable['LEGENDARY'] ?? 0;
        if (bonus > 0) {
          ff += bonus;
          breakdown.push(`${item.name || item.id} (${item.reforge}): +${bonus} FF`);
        }
      }
    }
  }

  return { ff, breakdown };
}

// ─── FF Source Calculation ────────────────────────────────────────────────────

interface FFSource {
  name: string;
  category: string;
  current: number;
  max: number;
  notes: string;
  needsNBT?: boolean;
  /** API doesn't expose this stat at all — shown as informational only */
  noAPI?: boolean;
  upgradeHint?: string;
  upgradeCost?: string;
}

function calculateFFSources(profile: PlayerProfile, armorItems: ParsedItem[], equipItems: ParsedItem[]): FFSource[] {
  const sources: FFSource[] = [];
  const { skills, farming, pets } = profile;

  // 1. Farming Skill
  const skillFF = skills.farming * FF_PER_SKILL_LEVEL;
  sources.push({
    name: 'Farming Skill',
    category: 'Skill',
    current: skillFF,
    max: 60 * FF_PER_SKILL_LEVEL,
    notes: `Level ${skills.farming}/60`,
    upgradeHint: skills.farming < 60 ? `Level ${skills.farming} → ${skills.farming + 1} gives +${FF_PER_SKILL_LEVEL} FF` : 'Maxed',
  });

  // 2. Garden Plots (wiki: +3 FF per plot, 25 plots max = +75 FF total)
  const plotFF = (farming.plots ?? 0) * FF_PER_PLOT;
  sources.push({
    name: 'Garden Plots',
    category: 'Garden',
    current: plotFF,
    max: MAX_PLOTS * FF_PER_PLOT,
    notes: `${farming.plots ?? 0}/${MAX_PLOTS} plots unlocked`,
    upgradeHint: (farming.plots ?? 0) < MAX_PLOTS ? `Unlock more plots for +${FF_PER_PLOT} FF each` : 'All plots unlocked',
    upgradeCost: 'Compost (farm → compost → plots)',
  });

  // 3. Jacob's Farming Fortune Perk (Anita's Extra Farming Fortune)
  // API key is 'farming_fortune' in jacobs_contest.perks. Note: 'farming_level_cap' is a separate perk.
  const jacobFFLevel = farming.jacobPerks['farming_fortune'] ?? 0;
  const jacobFF = jacobFFLevel * FF_PER_JACOB_FF_PERK;
  sources.push({
    name: "Anita's FF Perk",
    category: "Jacob's",
    current: jacobFF,
    max: JACOB_FF_PERK_MAX * FF_PER_JACOB_FF_PERK,
    notes: `Level ${jacobFFLevel}/${JACOB_FF_PERK_MAX}`,
    upgradeHint: jacobFFLevel < JACOB_FF_PERK_MAX ? `Level ${jacobFFLevel} → ${jacobFFLevel + 1} gives +${FF_PER_JACOB_FF_PERK} FF` : 'Maxed',
    upgradeCost: 'Gold/Diamond medals from Jacob contests',
  });

  // 4. Crop Milestones (from garden resources)
  let totalMilestoneFF = 0;
  let maxMilestoneFF = 0;
  const cropDetails: string[] = [];

  for (const [cropKey, thresholds] of Object.entries(CROP_MILESTONE_THRESHOLDS)) {
    const collected = farming.gardenResources[cropKey] ?? 0;
    const milestoneLevel = getCropMilestoneLevel(cropKey, collected);
    totalMilestoneFF += milestoneLevel;
    maxMilestoneFF += thresholds.length;
    if (milestoneLevel > 0) {
      cropDetails.push(`${CROP_NAMES[cropKey] ?? cropKey}: Milestone ${milestoneLevel}`);
    }
  }

  sources.push({
    name: 'Crop Milestones',
    category: 'Garden',
    current: totalMilestoneFF,
    max: maxMilestoneFF,
    notes: `${totalMilestoneFF}/${maxMilestoneFF} total milestones`,
    upgradeHint: 'Farm more crops in Garden to reach next milestones',
  });

  // 5. Active farming pet estimate
  const activePet = pets.find(p => p.active);
  if (activePet) {
    const petType = activePet.type;
    let petFF = 0;
    let petNote = '';

    if (petType === 'ELEPHANT') {
      // Elephant: +1.8 FF per level, max +180 at level 100 (research-confirmed 2026)
      petFF = Math.floor(activePet.level * 1.8);
      petNote = `Elephant Lv ${activePet.level} (${activePet.tier})`;
    } else if (petType === 'MOOSHROOM_COW') {
      // Mooshroom Cow: converts Strength → FF at 1 FF per 20 STR (wiki/research 2026)
      // Cannot calculate exact value without knowing player's total Strength; show 0 with note
      petFF = 0;
      petNote = `Mooshroom Cow Lv ${activePet.level} (${activePet.tier}) — +1 FF per 20 Strength (stat-dependent, best overall pet)`;
    } else if (petType === 'BEE') {
      // Bee: +0.2 FF per level, max +20 at level 100 (wiki-confirmed)
      petFF = Math.floor(activePet.level * 0.2);
      petNote = `Bee Lv ${activePet.level} (${activePet.tier})`;
    } else if (petType === 'RABBIT') {
      petFF = Math.floor(activePet.level * 0.1);
      petNote = `Rabbit Lv ${activePet.level} (${activePet.tier})`;
    } else {
      petNote = `${petType} Lv ${activePet.level} — not a farming pet`;
    }

    sources.push({
      name: 'Active Pet',
      category: 'Pet',
      current: petFF,
      max: petFF > 0 ? 180 : 0, // Elephant max +180 (2026), Mooshroom scales with Strength
      notes: petNote,
      upgradeHint: petFF === 0 ? 'Equip an Elephant pet for farming fortune' : undefined,
    });
  } else {
    sources.push({
      name: 'Active Pet',
      category: 'Pet',
      current: 0,
      max: 60,
      notes: 'No active pet',
      upgradeHint: 'Equip an Elephant pet (best farming pet)',
    });
  }

  // 5b. Pet held item — Bandana FF
  if (activePet?.heldItem === 'GREEN_BANDANA') {
    const bandanaFF = 4 * farming.gardenLevel;
    sources.push({
      name: 'Green Bandana',
      category: 'Pet',
      current: bandanaFF,
      max: 60, // 4 × 15 max garden level
      notes: `+4 FF × Garden Level ${farming.gardenLevel}`,
    });
  } else if (activePet?.heldItem === 'YELLOW_BANDANA') {
    sources.push({
      name: 'Yellow Bandana',
      category: 'Pet',
      current: 30,
      max: 30,
      notes: '+30 FF flat',
    });
  }

  // 5c. Active buffs — Booster Cookie / God Potion
  const cookieActive = profile.tempStatBuffs.some(b => b.key === 'booster_cookie');
  const godPotionActive = profile.activeEffects.some(e => e.effect === 'GOD_POTION_ALL');
  if (cookieActive || godPotionActive) {
    const buffFF = (cookieActive ? 15 : 0) + (godPotionActive ? 20 : 0);
    const buffNames = [
      cookieActive && 'Booster Cookie (+15 FF)',
      godPotionActive && 'God Potion (+20 FF)',
    ].filter(Boolean).join(', ');
    sources.push({
      name: 'Active Buffs',
      category: 'Buffs',
      current: buffFF,
      max: 35,
      notes: buffNames as string,
    });
  }

  // 6. Armor FF (armor set + armor reforges, from NBT)
  const armorResult = calcArmorFF(armorItems);
  const hasArmorNBT = armorItems.some(i => i.id && i.id !== 'AIR' && i.name);
  sources.push({
    name: 'Armor Set',
    category: 'Gear',
    current: armorResult.ff,
    // Helianthus full set = +150 FF; +30 from Mossy reforge on each piece = +270 total endgame
    max: 270,
    notes: hasArmorNBT
      ? (armorResult.breakdown.length > 0 ? armorResult.breakdown.join(', ') : 'No farming armor equipped')
      : 'Requires recent login — armor data not loaded',
    needsNBT: !hasArmorNBT,
    upgradeHint: armorResult.ff === 0
      ? 'Farming armor path: Melon → Cropie → Squash → Fermento → Helianthus. Mossy (OVERGROWN_GRASS) reforge gives up to +25 FF per piece.'
      : undefined,
  });

  // 7. Equipment FF (Lotus/Blossom base + equipment reforges, from NBT)
  const equipResult = calcEquipFF(equipItems);
  const hasEquipNBT = equipItems.some(i => i.id && i.id !== 'AIR' && i.name);
  sources.push({
    name: 'Equipment',
    category: 'Gear',
    current: equipResult.ff,
    // 4 slots × 21 FF (Rooted/BURROWING_SPORES Mythic) = 84 max
    max: 84,
    notes: hasEquipNBT
      ? (equipResult.breakdown.length > 0 ? equipResult.breakdown.join(', ') : 'No farming equipment detected')
      : 'Requires recent login — equipment data not loaded',
    needsNBT: !hasEquipNBT,
    upgradeHint: equipResult.ff < 72
      ? 'Rooted (BURROWING_SPORES) reforge gives up to +18 FF per equipment piece. Lotus Necklace/Belt/Cloak/Bracelet give +5 FF base each.'
      : undefined,
  });

  // 8. Untracked sources — API doesn't expose these; shown as informational hints
  sources.push({
    name: 'Crop Shot Chip',
    category: 'Garden Chip',
    current: 0,
    max: 100,
    notes: 'Garden Chip — Hypixel API does not expose chip levels; max +100 FF at full upgrade',
    noAPI: true,
    upgradeHint: 'Upgrade via Garden Desk using Sodust (earned while farming)',
  });
  sources.push({
    name: 'Celestial Mason Jar',
    category: 'Mixin',
    current: 0,
    max: 15,
    notes: 'Mixin from Harvest Feast — API does not expose active mixin buffs; gives +15 FF when consumed',
    noAPI: true,
    upgradeHint: 'Earn during Harvest Feast by donating Seasonings to the communal stew',
  });

  return sources;
}

// ─── Crop Progress Table ──────────────────────────────────────────────────────

interface CropProgress {
  name: string;
  collected: number;
  milestoneLevel: number;
  maxMilestone: number;
  nextAt: number | null;
  toNext: number | null;
  ff: number;
}

function getCropProgress(gardenResources: Record<string, number>): CropProgress[] {
  return Object.entries(CROP_MILESTONE_THRESHOLDS).map(([key, thresholds]) => {
    const collected = gardenResources[key] ?? 0;
    const level = getCropMilestoneLevel(key, collected);
    const nextAt = getNextMilestoneAt(key, level);
    return {
      name: CROP_NAMES[key] ?? key,
      collected,
      milestoneLevel: level,
      maxMilestone: thresholds.length,
      nextAt,
      toNext: nextAt !== null ? nextAt - collected : null,
      ff: level,
    };
  });
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FarmingPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let armorItems: ParsedItem[] = [];
  let equipItems: ParsedItem[] = [];
  let error: string | null = null;
  let composter = { organicsMatter: 0, fuelUnits: 0, compostUnits: 0, taps: 0 };

  try {
    const { uuid, username: resolvedName } = await resolvePlayer(username);
    const profilesRes = await getSkyBlockProfiles(uuid);

    if (!profilesRes.success || !profilesRes.profiles?.length) {
      error = 'No SkyBlock profiles found.';
    } else {
      let targetProfile = profilesRes.profiles.find(
        p => p.profile_id === profileId || p.cute_name.toLowerCase() === profileId?.toLowerCase()
      );
      if (!targetProfile) targetProfile = profilesRes.profiles.find(p => p.selected) ?? profilesRes.profiles[0];
      profile = selectBestProfile([targetProfile], uuid, resolvedName);

      // Fetch garden data from separate endpoint (not in profiles response)
      try {
        const gardenRes = await getSkyBlockGarden(targetProfile.profile_id);
        if (gardenRes.success && gardenRes.garden) {
          profile = enrichWithGarden(profile, gardenRes.garden);
          // Composter data comes from garden endpoint
          const cd = gardenRes.garden.composter_data ?? {};
          const upgrades = (cd.upgrades ?? {}) as Record<string, number>;
          composter = {
            organicsMatter: (cd.organic_matter as number) ?? 0,
            fuelUnits:      (cd.fuel_units as number) ?? 0,
            compostUnits:   (cd.compost_units as number) ?? 0,
            taps:           (cd.conversion_taps as number) ?? 0,
          };
          void upgrades; // available if needed later
        }
      } catch { /* non-fatal */ }

      // Parse armor + equipment NBT for real FF values
      const member = targetProfile.members[uuid] ?? {};
      const armorData = member.inventory?.inv_armor?.data;
      if (armorData) {
        try { armorItems = await parseInventoryNBT(armorData, true); } catch { /* non-fatal */ }
      }
      const equipData = member.inventory?.equipment_contents?.data;
      if (equipData) {
        try { equipItems = await parseInventoryNBT(equipData, true); } catch { /* non-fatal */ }
      }
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load profile.';
  }

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <div className="card p-8">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-semibold text-white mb-2">Profile Not Found</h1>
          <p className="text-slate-400">{error ?? 'Unknown error'}</p>
          <a href={`/player/${username}`} className="mt-6 inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white">
            ← Back to Profile
          </a>
        </div>
      </div>
    );
  }

  const ffSources = calculateFFSources(profile, armorItems, equipItems);
  const hasAnyNBTMissing = ffSources.some(s => s.needsNBT);
  // Include NBT sources in total if data was loaded; exclude if not
  const knownFF = ffSources.filter(s => !s.noAPI).reduce((sum, s) => sum + s.current, 0);
  const maxKnownFF = ffSources.filter(s => !s.noAPI).reduce((sum, s) => sum + s.max, 0);
  const cropProgress = getCropProgress(profile.farming.gardenResources);
  const jacobFF = profile.farming.jacobPerks['farming_fortune'] ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Farming Fortune Planner</h1>
        <span className="ml-auto rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
          {profile.profileName}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Farming Level" value={`${profile.skills.farming}/60`} color="text-yellow-300" />
        <StatCard label="Garden Level" value={`${profile.farming.gardenLevel}/15`} color="text-emerald-300" />
        <StatCard label="Known FF" value={`${knownFF}`} color="text-indigo-300" />
        <StatCard label="Max Calculable" value={`${maxKnownFF}`} color="text-slate-300" sub="gear excluded" />
      </div>

      {/* FF Sources Table */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          🌾 Farming Fortune Sources
          <span className="text-xs font-normal text-slate-500 ml-1">sorted by contribution</span>
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs">
                <th className="text-left pb-2 font-medium">Source</th>
                <th className="text-left pb-2 font-medium">Category</th>
                <th className="text-right pb-2 font-medium">Current FF</th>
                <th className="text-right pb-2 font-medium">Max FF</th>
                <th className="text-left pb-2 font-medium pl-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {ffSources
                .sort((a, b) => b.current - a.current)
                .map(source => (
                  <tr key={source.name} className={source.needsNBT || source.noAPI ? 'opacity-50' : ''}>
                    <td className="py-2.5 text-white font-medium">
                      {source.name}
                      {source.needsNBT && (
                        <span className="ml-2 text-xs text-amber-400/70 font-normal">[NBT]</span>
                      )}
                      {source.noAPI && (
                        <span className="ml-2 text-xs text-slate-500 font-normal">[No API]</span>
                      )}
                    </td>
                    <td className="py-2.5 text-slate-500 text-xs">{source.category}</td>
                    <td className={`py-2.5 text-right font-mono font-medium ${source.current > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                      +{source.current}
                    </td>
                    <td className="py-2.5 text-right font-mono text-slate-500 text-xs">+{source.max}</td>
                    <td className="py-2.5 pl-4 text-slate-400 text-xs">{source.notes}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td colSpan={2} className="pt-3 text-slate-400 text-xs font-medium">
                  Known Total (excl. gear)
                </td>
                <td className="pt-3 text-right font-mono font-bold text-emerald-300">+{knownFF}</td>
                <td className="pt-3 text-right font-mono text-slate-400 text-xs">+{maxKnownFF}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>

        {hasAnyNBTMissing && (
          <p className="mt-3 text-xs text-amber-400/60">
            ⚠ Armor and equipment data unavailable — player must have logged in recently for inventory data to appear. Visit this page after the player has been online.
          </p>
        )}
      </div>

      {/* Upgrade Priorities */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-4">⚡ Upgrade Priorities</h2>
        <div className="space-y-3">
          {profile.skills.farming < 60 && (
            <UpgradeRow
              title={`Farming Skill: Level ${profile.skills.farming} → ${profile.skills.farming + 1}`}
              gain={`+${FF_PER_SKILL_LEVEL} FF`}
              cost="Farm crops (wheat, carrot, etc.)"
              priority="high"
            />
          )}
          {profile.farming.gardenLevel < 15 && (
            <UpgradeRow
              title={`Garden Level: ${profile.farming.gardenLevel} → ${profile.farming.gardenLevel + 1}`}
              gain={`+${FF_PER_PLOT} FF per plot`}
              cost="Farm in Garden for Garden XP + Compost for plots"
              priority="high"
            />
          )}
          {jacobFF < JACOB_FF_PERK_MAX && (
            <UpgradeRow
              title={`Anita FF Perk: Level ${jacobFF} → ${jacobFF + 1}`}
              gain={`+${FF_PER_JACOB_FF_PERK} FF`}
              cost="Gold/Diamond medals from Jacob contests"
              priority="medium"
            />
          )}
          <UpgradeRow
            title="Rooted Reforge on Equipment (BURROWING_SPORES)"
            gain="+18 FF per piece at Legendary (max +72 FF)"
            cost="BURROWING_SPORES from Bazaar"
            priority="medium"
          />
          <UpgradeRow
            title="Elephant Pet (LEGENDARY)"
            gain="Best farming pet for FF"
            cost="AH — price varies by level"
            priority={!profile.pets.find(p => p.active && p.type === 'ELEPHANT') ? 'high' : 'low'}
          />
        </div>
      </div>

      {/* Crop Upgrades */}
      {Object.keys(profile.farming.cropUpgrades ?? {}).length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
            🌿 Crop Upgrades
            <span className="text-xs font-normal text-slate-500">+5 FF per tier (up to +45 at Tier IX)</span>
          </h2>
          <p className="text-xs text-slate-500 mb-4">Upgraded with Copper from Garden visitors. Max Tier IX per crop — +45 FF total.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(profile.farming.cropUpgrades ?? {}).sort(([, a], [, b]) => b - a).map(([crop, level]) => (
              <div key={crop} className="rounded-lg border border-white/5 p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-slate-300 font-medium capitalize">{crop.replace(/_/g, ' ')}</span>
                  <span className="text-xs font-mono text-emerald-400">+{level * 5} FF</span>
                </div>
                <div className="h-1 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-emerald-500/70" style={{ width: `${(level / 9) * 100}%` }} />
                </div>
                <div className="text-xs text-slate-600 mt-0.5">Tier {level}/9</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jacob's Farming */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          🏅 Jacob&apos;s Farming
          <span className="text-xs font-normal text-slate-500">{profile.farming.contestsParticipated} contests entered</span>
          {profile.farming.participationMilestones > 0 && (
            <span className="ml-auto text-xs font-normal text-emerald-400">{profile.farming.participationMilestones} milestones</span>
          )}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { key: 'bronze',   label: 'Bronze',   color: 'text-amber-700',   bg: 'border-amber-700/20 bg-amber-700/5' },
            { key: 'silver',   label: 'Silver',   color: 'text-slate-300',   bg: 'border-slate-500/20 bg-slate-500/5' },
            { key: 'gold',     label: 'Gold',     color: 'text-yellow-300',  bg: 'border-yellow-500/20 bg-yellow-500/5' },
            { key: 'platinum', label: 'Platinum', color: 'text-cyan-300',    bg: 'border-cyan-500/20 bg-cyan-500/5' },
            { key: 'diamond',  label: 'Diamond',  color: 'text-blue-300',    bg: 'border-blue-500/20 bg-blue-500/5' },
          ].filter(m => (profile.farming.jacobMedals[m.key] ?? 0) > 0 || (profile.farming.jacobMedalsEarned as Record<string, number>)[m.key] > 0 || m.key === 'gold').map(medal => (
            <div key={medal.key} className={`rounded-lg border p-3 text-center ${medal.bg}`}>
              <div className={`text-xl font-bold ${medal.color}`}>{(profile.farming.jacobMedalsEarned as Record<string, number>)[medal.key] ?? 0}</div>
              <div className="text-xs text-slate-500 mt-0.5">{medal.label} Earned</div>
              {(profile.farming.jacobMedals[medal.key] ?? 0) > 0 && (
                <div className="text-xs text-slate-600">{profile.farming.jacobMedals[medal.key]} in bag</div>
              )}
            </div>
          ))}
        </div>
        {profile.farming.uniqueGolds.length > 0 && (
          <div>
            <div className="text-xs text-yellow-400 font-medium mb-2">🥇 Gold Medal Crops ({profile.farming.uniqueGolds.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.farming.uniqueGolds.map(crop => (
                <span key={crop} className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2 py-0.5 text-xs text-yellow-300 capitalize">
                  {crop.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}
        {profile.farming.uniquePlatinums.length > 0 && (
          <div>
            <div className="text-xs text-cyan-400 font-medium mb-2">🏆 Platinum Medal Crops ({profile.farming.uniquePlatinums.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.farming.uniquePlatinums.map(crop => (
                <span key={crop} className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs text-cyan-300 capitalize">
                  {crop.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}
        {profile.farming.uniqueDiamonds.length > 0 && (
          <div>
            <div className="text-xs text-blue-400 font-medium mb-2">💎 Diamond Medal Crops ({profile.farming.uniqueDiamonds.length})</div>
            <div className="flex flex-wrap gap-1.5">
              {profile.farming.uniqueDiamonds.map(crop => (
                <span key={crop} className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs text-blue-300 capitalize">
                  {crop.replace(/_/g, ' ').toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}
        {profile.farming.uniqueGolds.length === 0 && profile.farming.contestsParticipated > 0 && (
          <p className="text-xs text-slate-500">No gold medals yet — aim for top placement in Jacob contests to earn gold medals per crop.</p>
        )}
      </div>

      {/* Crop Milestones */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          🌱 Crop Milestones
          <span className="text-xs font-normal text-slate-500">from Garden harvests</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cropProgress.sort((a, b) => b.ff - a.ff).map(crop => (
            <div key={crop.name} className="rounded-lg border border-white/5 p-3">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm text-white font-medium">{crop.name}</span>
                <span className="text-xs font-mono text-emerald-400">+{crop.ff} FF</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 mb-1.5">
                <div
                  className="h-full rounded-full bg-emerald-500"
                  style={{ width: `${(crop.milestoneLevel / crop.maxMilestone) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Milestone {crop.milestoneLevel}/{crop.maxMilestone}</span>
                {crop.toNext !== null && crop.collected > 0 && (
                  <span>{formatNum(crop.toNext)} more to next</span>
                )}
                {crop.collected === 0 && <span className="text-slate-600">Not started</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Garden Extra Stats */}
      {(profile.visitorsServed > 0 || profile.larvaeConsumed > 0) && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-3">🌿 Garden Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            {profile.visitorsServed > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-emerald-300">{profile.visitorsServed.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Visitors Served</div>
              </div>
            )}
            {profile.larvaeConsumed > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-green-300">{profile.larvaeConsumed.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Larvae Consumed</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Composter */}
      {(composter.organicsMatter > 0 || composter.fuelUnits > 0 || composter.compostUnits > 0 || composter.taps > 0) && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-3">🌱 Composter</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {composter.organicsMatter > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-lime-300">{composter.organicsMatter.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Organic Matter</div>
              </div>
            )}
            {composter.fuelUnits > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-300">{composter.fuelUnits.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Fuel Units</div>
              </div>
            )}
            {composter.compostUnits > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-brown-300 text-amber-700">{composter.compostUnits.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Compost Units</div>
              </div>
            )}
            {composter.taps > 0 && (
              <div className="text-center">
                <div className="text-xl font-bold text-sky-300">{composter.taps}</div>
                <div className="text-xs text-slate-500 mt-1">Conversion Taps</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </div>
  );
}

function UpgradeRow({
  title,
  gain,
  cost,
  priority,
}: {
  title: string;
  gain: string;
  cost: string;
  priority: 'high' | 'medium' | 'low';
}) {
  const colors = {
    high: 'border-red-500/20 bg-red-500/5',
    medium: 'border-yellow-500/20 bg-yellow-500/5',
    low: 'border-white/5 bg-white/2',
  };
  const badgeColors = {
    high: 'text-red-400 border-red-500/30',
    medium: 'text-yellow-400 border-yellow-500/30',
    low: 'text-slate-400 border-white/10',
  };

  return (
    <div className={`rounded-lg border p-3 ${colors[priority]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="text-sm text-white font-medium mb-0.5">{title}</div>
          <div className="text-xs text-slate-500">{cost}</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-emerald-400">{gain}</span>
          <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeColors[priority]}`}>
            {priority}
          </span>
        </div>
      </div>
    </div>
  );
}
