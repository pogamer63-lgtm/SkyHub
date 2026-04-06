import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';
import { HOPPITY_DATA } from '@/lib/neu/data';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Chocolate Factory` };
}

// ─── Rarity Config ─────────────────────────────────────────────────────────────

const RARITY_COLORS: Record<string, string> = {
  common:   'text-slate-300 border-slate-500/30 bg-slate-500/5',
  uncommon: 'text-green-300 border-green-500/30 bg-green-500/5',
  rare:     'text-blue-300 border-blue-500/30 bg-blue-500/5',
  epic:     'text-purple-300 border-purple-500/30 bg-purple-500/5',
  legendary:'text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
  mythic:   'text-pink-300 border-pink-500/30 bg-pink-500/5',
  divine:   'text-cyan-300 border-cyan-500/30 bg-cyan-500/5',
};

const RARITY_LABEL: Record<string, string> = {
  common: 'Common', uncommon: 'Uncommon', rare: 'Rare',
  epic: 'Epic', legendary: 'Legendary', mythic: 'Mythic', divine: 'Divine',
};

// Chocolate per second from rabbits (chocolate per rabbit × count)
function computeChocolatePerSecond(
  foundRabbits: Record<string, number>,
): { cps: number; byRarity: Record<string, number>; totalFound: number; total: number } {
  let cps = 0;
  const byRarity: Record<string, number> = {};
  let totalFound = 0;
  let total = 0;

  for (const [rarity, rarityData] of Object.entries(HOPPITY_DATA.rarities)) {
    const rabbits = rarityData.rabbits ?? [];
    const chocPerRabbit = rarityData.chocolate ?? 0;
    total += rabbits.length;
    const found = rabbits.filter(name => (foundRabbits[name] ?? 0) > 0).length;
    totalFound += found;
    byRarity[rarity] = found;
    cps += found * chocPerRabbit;
  }

  // Special rabbits
  for (const [name, data] of Object.entries(HOPPITY_DATA.special)) {
    if ((foundRabbits[name] ?? 0) > 0) {
      cps += data.chocolate ?? 0;
    }
  }

  return { cps, byRarity, totalFound, total };
}

function formatChocolate(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(2)}T`;
  if (n >= 1_000_000_000)     return `${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000)         return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)             return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

export default async function ChocolatePage({ params, searchParams }: Props) {
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
      let target = profilesRes.profiles.find(
        p => p.profile_id === profileId || p.cute_name.toLowerCase() === profileId?.toLowerCase()
      );
      if (!target) target = profilesRes.profiles.find(p => p.selected) ?? profilesRes.profiles[0];
      profile = selectBestProfile([target], uuid, resolvedName);
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

  const foundRabbits = profile.chocolateRabbits ?? {};
  const hasData = Object.keys(foundRabbits).length > 0 || (profile.chocolate ?? 0) > 0;
  const { cps, byRarity, totalFound, total } = computeChocolatePerSecond(foundRabbits);
  const prestige = profile.chocolatePrestige ?? 0;
  const prestigeMultiplier = HOPPITY_DATA.prestigeMultipliers[String(prestige)] ?? 0;
  const effectiveCps = cps * (1 + prestigeMultiplier);
  const chocolate = profile.chocolate ?? 0;
  const totalChocolate = profile.totalChocolate ?? 0;

  const rarityOrder = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic', 'divine'];

  // Total rabbits per rarity from NEU
  const totalByRarity: Record<string, number> = {};
  for (const [r, data] of Object.entries(HOPPITY_DATA.rarities)) {
    totalByRarity[r] = (data.rabbits ?? []).length;
  }
  const specialTotal = Object.keys(HOPPITY_DATA.special).length;
  const specialFound = Object.keys(HOPPITY_DATA.special).filter(n => (foundRabbits[n] ?? 0) > 0).length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Chocolate Factory</h1>
        <span className="ml-auto rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs text-amber-300">
          {profile.profileName}
        </span>
      </div>

      {!hasData && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-amber-300">
          ⚠ Chocolate Factory data not available from the API for this profile. The Hoppity event data may not be exposed in the API, or this player hasn't started the factory yet.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-amber-300">{formatChocolate(chocolate)}</div>
          <div className="text-xs text-slate-500 mt-1">Current Chocolate</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-300">{cps.toLocaleString()}</div>
          <div className="text-xs text-slate-500 mt-1">Choc / Second (base)</div>
          {prestige > 0 && <div className="text-xs text-pink-300">×{(1 + prestigeMultiplier).toFixed(2)} = {effectiveCps.toFixed(0)} eff.</div>}
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalFound}/{total}</div>
          <div className="text-xs text-slate-500 mt-1">Rabbits Found</div>
          <div className="text-xs text-slate-600">+{specialFound}/{specialTotal} special</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-300">{prestige}</div>
          <div className="text-xs text-slate-500 mt-1">Prestige Level</div>
          {prestigeMultiplier > 0 && <div className="text-xs text-slate-600">+{(prestigeMultiplier * 100).toFixed(0)}% chocolate</div>}
        </div>
        {!!profile.chocolateSincePrestige && profile.chocolateSincePrestige > 0 && (
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-amber-300">{formatChocolate(profile.chocolateSincePrestige)}</div>
            <div className="text-xs text-slate-500 mt-1">Since Last Prestige</div>
          </div>
        )}
        {profile.chocolateLevel > 0 && (
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-orange-300">{profile.chocolateLevel}</div>
            <div className="text-xs text-slate-500 mt-1">Factory Level</div>
          </div>
        )}
      </div>

      {totalChocolate > 0 && (
        <div className="card p-4 flex items-center gap-3">
          <div className="text-amber-400 text-lg">🍫</div>
          <div>
            <div className="text-sm text-slate-400">Total Chocolate Produced</div>
            <div className="text-white font-semibold">{formatChocolate(totalChocolate)}</div>
          </div>
          <div className="ml-auto text-xs text-slate-500">
            {cps > 0 ? `~${formatChocolate(cps * 3600 * 24)}/day` : ''}
          </div>
        </div>
      )}

      {/* Rabbits by rarity */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          🐰 Rabbits by Rarity
          <span className="text-xs font-normal text-slate-500">from NEU-REPO ({total} total rabbits)</span>
        </h2>
        <div className="space-y-3">
          {rarityOrder.map(rarity => {
            const rarityData = HOPPITY_DATA.rarities[rarity];
            if (!rarityData) return null;
            const found = byRarity[rarity] ?? 0;
            const tot = totalByRarity[rarity] ?? 0;
            const pct = tot > 0 ? (found / tot) * 100 : 0;
            return (
              <div key={rarity}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className={`font-medium ${RARITY_COLORS[rarity]?.split(' ')[0]}`}>
                    {RARITY_LABEL[rarity]}
                    <span className="text-slate-500 ml-2">+{rarityData.chocolate}/s each</span>
                    {rarityData.multiplier > 0 && (
                      <span className="text-slate-500 ml-1">+{(rarityData.multiplier * 100).toFixed(1)}% mult.</span>
                    )}
                  </span>
                  <span className="text-slate-400">{found} / {tot}</span>
                </div>
                <div className="h-2 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  {tot - found > 0 ? `${tot - found} remaining` : '✓ Complete'}
                  {' · '}{found * rarityData.chocolate} choc/s from this rarity
                </div>
              </div>
            );
          })}
        </div>

        {/* Special rabbits */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-slate-300 font-medium">Special Rabbits</span>
            <span className="text-slate-400">{specialFound} / {specialTotal}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(HOPPITY_DATA.special).map(([name, data]) => {
              const found = (foundRabbits[name] ?? 0) > 0;
              return (
                <div key={name} className={`rounded-lg border px-2.5 py-1.5 text-xs ${found ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300' : 'border-white/5 bg-slate-800/20 text-slate-600'}`}>
                  <div className="font-medium capitalize">{name.replace(/_/g, ' ')}</div>
                  {data.chocolate > 0 && <div className="text-slate-500">+{data.chocolate} choc/s</div>}
                  {data.multiplier > 0 && <div className="text-slate-500">+{(data.multiplier * 100).toFixed(0)}% mult</div>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Prestige info */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-3">Prestige Multipliers</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(HOPPITY_DATA.prestigeMultipliers).map(([level, mult]) => (
            <div key={level} className={`rounded-lg border p-2 text-center text-xs ${
              prestige >= Number(level) && mult > 0
                ? 'border-pink-500/30 bg-pink-500/5 text-pink-300'
                : 'border-white/5 bg-slate-800/20 text-slate-500'
            }`}>
              <div className="font-bold">P{level}</div>
              <div>{mult > 0 ? `+${(mult * 100).toFixed(0)}%` : '—'}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade priority */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-3">Upgrade Priority</h2>
        <div className="space-y-2 text-sm">
          {rarityOrder.map(rarity => {
            const rarityData = HOPPITY_DATA.rarities[rarity];
            if (!rarityData) return null;
            const found = byRarity[rarity] ?? 0;
            const tot = totalByRarity[rarity] ?? 0;
            const remaining = tot - found;
            if (remaining === 0) return null;
            return (
              <div key={rarity} className={`rounded-lg border px-3 py-2 ${RARITY_COLORS[rarity] ?? ''}`}>
                <span className="font-medium">{RARITY_LABEL[rarity]}:</span>{' '}
                <span className="text-slate-400 text-xs">{remaining} rabbits remaining · +{remaining * rarityData.chocolate} choc/s potential</span>
              </div>
            );
          })}
          {specialFound < specialTotal && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-amber-300">
              <span className="font-medium">Special:</span>{' '}
              <span className="text-slate-400 text-xs">{specialTotal - specialFound} special rabbits not yet found</span>
            </div>
          )}
        </div>
      </div>

      {/* Employees */}
      {Object.keys(profile.chocolateEmployees).length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-3">👷 Employees</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(profile.chocolateEmployees)
              .sort(([, a], [, b]) => b - a)
              .map(([name, level]) => (
                <div key={name} className="flex items-center justify-between rounded-lg border border-white/5 px-3 py-2">
                  <span className="text-sm text-slate-300 capitalize">{name.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-mono text-amber-300">Lv {level}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
