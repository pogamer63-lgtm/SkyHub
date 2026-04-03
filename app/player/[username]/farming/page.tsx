import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
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

/** Known farming armor/equipment items and their FF bonus */
const FARMING_ARMOR_FF: Record<string, number> = {
  // Lotus set (Bazaar, ~5M/piece)
  LOTUS_HAT: 60, LOTUS_CHESTPLATE: 60, LOTUS_LEGGINGS: 60, LOTUS_BOOTS: 60,
  // Fermento set (Kuudra)
  FERMENTO_HAT: 60, FERMENTO_CHESTPLATE: 60, FERMENTO_LEGGINGS: 60, FERMENTO_BOOTS: 60,
  // Rancher's Boots (speed-based, rough estimate)
  RANCHER_BOOTS: 15,
  // Rabbit Hat (Hypixel shop / Jacob rewards)
  RABBIT_HAT: 5,
  // Melon Helmet (early game)
  MELON_HAT: 10,
};

/** Equipment reforges that give farming fortune */
const FARMING_REFORGE_FF: Record<string, number> = {
  'turbo-crop': 5,  // +5 FF per equipment piece
  'bountiful': 4,   // Bountiful reforge on equipment
};

/** Calculate FF from parsed armor/equipment items */
function calcGearFF(items: ParsedItem[]): { ff: number; breakdown: string[] } {
  let ff = 0;
  const breakdown: string[] = [];

  for (const item of items) {
    if (!item.id || item.id === 'AIR') continue;

    // Check armor/equipment FF by item ID
    for (const [key, bonus] of Object.entries(FARMING_ARMOR_FF)) {
      if (item.id.includes(key)) {
        ff += bonus;
        breakdown.push(`${item.name || key}: +${bonus} FF`);
        break;
      }
    }

    // Check reforge FF
    if (item.reforge) {
      const reforgeKey = item.reforge.toLowerCase();
      for (const [reforge, bonus] of Object.entries(FARMING_REFORGE_FF)) {
        if (reforgeKey.includes(reforge)) {
          ff += bonus;
          breakdown.push(`${item.name || item.id} (${item.reforge} reforge): +${bonus} FF`);
          break;
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

  // 3. Jacob's Farming Fortune Perk
  // API key is 'farming_level_cap' in jacobs_contest.perks (modern) — no direct FF perk key
  // Anita's Extra Farming Fortune perk maps to farming_level_cap levels
  const jacobFFLevel = farming.jacobPerks['farming_level_cap'] ?? farming.jacobPerks['farming_fortune'] ?? 0;
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

  // 6. Armor FF (from NBT if available)
  const armorGear = calcGearFF(armorItems);
  const hasArmorNBT = armorItems.some(i => i.id && i.id !== 'AIR' && i.name);
  sources.push({
    name: 'Armor Set',
    category: 'Gear',
    current: armorGear.ff,
    max: 240,
    notes: hasArmorNBT
      ? (armorGear.breakdown.length > 0 ? armorGear.breakdown.join(', ') : 'No farming armor detected')
      : 'Requires recent login for NBT data',
    needsNBT: !hasArmorNBT,
    upgradeHint: armorGear.ff === 0 ? 'Lotus or Fermento set gives +60 FF/piece (best farming armor)' : undefined,
  });

  // 7. Equipment FF (from NBT if available)
  const equipGear = calcGearFF(equipItems);
  const hasEquipNBT = equipItems.some(i => i.id && i.id !== 'AIR' && i.name);
  sources.push({
    name: 'Equipment Reforges',
    category: 'Gear',
    current: equipGear.ff,
    max: 25,
    notes: hasEquipNBT
      ? (equipGear.breakdown.length > 0 ? equipGear.breakdown.join(', ') : 'No farming equipment reforges detected')
      : 'Requires recent login for NBT data',
    needsNBT: !hasEquipNBT,
    upgradeHint: equipGear.ff < 20 ? 'Turbo-Crop reforge gives +5 FF per equipment piece' : undefined,
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

      // Parse armor + equipment NBT for real FF values
      const member = targetProfile.members[uuid] ?? {};
      const armorData = member.inventory?.armor?.data;
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
  const knownFF = ffSources.filter(s => !s.needsNBT).reduce((sum, s) => sum + s.current, 0);
  const maxKnownFF = ffSources.filter(s => !s.needsNBT).reduce((sum, s) => sum + s.max, 0);
  const cropProgress = getCropProgress(profile.farming.gardenResources);
  // Jacob's Extra FF perk is 'farming_level_cap' in the API (not 'farming_fortune')
  const jacobFF = profile.farming.jacobPerks['farming_level_cap'] ?? profile.farming.jacobPerks['farming_fortune'] ?? 0;

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
                  <tr key={source.name} className={source.needsNBT ? 'opacity-50' : ''}>
                    <td className="py-2.5 text-white font-medium">
                      {source.name}
                      {source.needsNBT && (
                        <span className="ml-2 text-xs text-amber-400/70 font-normal">[NBT]</span>
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

        <p className="mt-3 text-xs text-amber-400/60">
          ⚠ Sources marked [NBT] require inventory parsing (Phase 2). Equipment reforges and armor bonuses are not yet calculated.
        </p>
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
            title="Turbo-Crop Reforges on Equipment"
            gain="+5 FF per piece (max +25 FF)"
            cost="Reforge Stone from Bazaar"
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
