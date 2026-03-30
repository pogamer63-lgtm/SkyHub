import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';
import { formatCoins } from '@/lib/utils/format';

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

/** FF per garden level */
const FF_PER_GARDEN_LEVEL = 4;

/** Jacob's Farming Fortune perk: FF per perk level */
const FF_PER_JACOB_FF_PERK = 4;

/** Max Jacob FF perk level */
const JACOB_FF_PERK_MAX = 4;

/**
 * Crop milestone FF contribution.
 * Each milestone level gives +1 FF.
 * Based on garden resources_collected (crops harvested in garden).
 */
const CROP_MILESTONE_THRESHOLDS: Record<string, number[]> = {
  WHEAT:         [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000],
  CARROT:        [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000],
  POTATO:        [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000],
  PUMPKIN:       [40, 100, 200, 400, 1_000, 2_000, 4_000, 10_000, 20_000, 40_000, 100_000, 200_000, 400_000, 1_000_000, 2_000_000, 4_000_000, 10_000_000, 20_000_000],
  MELON:         [250, 625, 1_250, 2_500, 6_250, 12_500, 25_000, 62_500, 125_000, 250_000, 625_000, 1_250_000, 2_500_000, 6_250_000, 12_500_000, 25_000_000, 62_500_000, 125_000_000],
  SUGAR_CANE:    [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000],
  CACTUS:        [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000],
  MUSHROOM:      [90, 225, 450, 900, 2_250, 4_500, 9_000, 22_500, 45_000, 90_000, 225_000, 450_000, 900_000, 2_250_000, 4_500_000, 9_000_000, 22_500_000, 45_000_000],
  COCOA_BEANS:   [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000],
  NETHER_WART:   [100, 250, 500, 1_000, 2_500, 5_000, 10_000, 25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000, 2_500_000, 5_000_000, 10_000_000, 25_000_000, 50_000_000],
};

/** Display names for garden resource keys */
const CROP_NAMES: Record<string, string> = {
  WHEAT: 'Wheat',
  CARROT: 'Carrot',
  POTATO: 'Potato',
  PUMPKIN: 'Pumpkin',
  MELON: 'Melon',
  SUGAR_CANE: 'Sugar Cane',
  CACTUS: 'Cactus',
  MUSHROOM: 'Mushroom',
  COCOA_BEANS: 'Cocoa Beans',
  NETHER_WART: 'Nether Wart',
};

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

function calculateFFSources(profile: PlayerProfile): FFSource[] {
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

  // 2. Garden Level
  const gardenFF = farming.gardenLevel * FF_PER_GARDEN_LEVEL;
  sources.push({
    name: 'Garden Level',
    category: 'Garden',
    current: gardenFF,
    max: 15 * FF_PER_GARDEN_LEVEL,
    notes: `Level ${farming.gardenLevel}/15`,
    upgradeHint: farming.gardenLevel < 15 ? `Level up Garden for +${FF_PER_GARDEN_LEVEL} FF` : 'Maxed',
    upgradeCost: 'Garden XP (farm crops)',
  });

  // 3. Jacob's Farming Fortune Perk
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
      // Elephant gives FF based on farming level: +1 FF per 2 farming levels at base
      petFF = Math.floor(activePet.level * 0.3); // rough estimate
      petNote = `Elephant Lv ${activePet.level} (${activePet.tier})`;
    } else if (petType === 'BEE') {
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
      max: petFF > 0 ? Math.floor(200 * 0.3) : 0,
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

  // 6. Equipment Reforges (NBT required)
  sources.push({
    name: 'Equipment Reforges',
    category: 'Gear',
    current: 0,
    max: 120,
    notes: 'Requires gear scan',
    needsNBT: true,
    upgradeHint: 'Turbo-Crop reforges give +5 FF each (5 equipment slots)',
  });

  // 7. Farming Armor (NBT required)
  sources.push({
    name: 'Armor Bonus',
    category: 'Gear',
    current: 0,
    max: 200,
    notes: 'Requires gear scan',
    needsNBT: true,
    upgradeHint: 'Rancher → Fermento → Blessed armor for FF',
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

  const ffSources = calculateFFSources(profile);
  const knownFF = ffSources.filter(s => !s.needsNBT).reduce((sum, s) => sum + s.current, 0);
  const maxKnownFF = ffSources.filter(s => !s.needsNBT).reduce((sum, s) => sum + s.max, 0);
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
              gain={`+${FF_PER_GARDEN_LEVEL} FF`}
              cost="Farm in Garden for Garden XP"
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
