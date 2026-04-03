import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';
import { SkyBlockProfile } from '@/lib/types/hypixel';
import {
  BESTIARY_ZONES,
  BESTIARY_BRACKETS,
  getBestiaryMilestoneLevel,
  getBestiaryMaxLevel,
} from '@/lib/neu/data';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Bestiary` };
}

// Zone display config
const ZONE_CONFIG: Record<string, { emoji: string; color: string }> = {
  hub:                   { emoji: '🏠', color: 'text-slate-300' },
  farming_1:             { emoji: '🌾', color: 'text-emerald-300' },
  combat_1:              { emoji: '🕷', color: 'text-red-300' },
  combat_3:              { emoji: '🌌', color: 'text-purple-300' },
  crimson_isle:          { emoji: '🔥', color: 'text-rose-300' },
  mining_2:              { emoji: '⛏', color: 'text-sky-300' },
  mining_3:              { emoji: '⛰', color: 'text-blue-300' },
  crystal_hollows:       { emoji: '💎', color: 'text-cyan-300' },
  foraging_1:            { emoji: '🌲', color: 'text-green-300' },
  foraging_2:            { emoji: '🏹', color: 'text-lime-300' },
  spooky_festival:       { emoji: '🎃', color: 'text-orange-300' },
  mythological_creatures:{ emoji: '⚡', color: 'text-yellow-300' },
  jerry:                 { emoji: '🎁', color: 'text-pink-300' },
  kuudra:                { emoji: '🦀', color: 'text-amber-300' },
  fishing:               { emoji: '🎣', color: 'text-teal-300' },
  catacombs:             { emoji: '🏰', color: 'text-orange-300' },
  garden:                { emoji: '🌱', color: 'text-emerald-400' },
};

export default async function BestiaryPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let rawProfile: SkyBlockProfile | null = null;
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
      rawProfile = targetProfile;
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load profile.';
  }

  if (error || !profile || !rawProfile) {
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

  // ── Parse bestiary kills ────────────────────────────────────────────────────
  const member = rawProfile.members[profile.uuid ?? ''] ?? Object.values(rawProfile.members)[0];
  const bestiaryKills = (member?.bestiary?.kills ?? {}) as Record<string, number>;
  const hasData = Object.keys(bestiaryKills).length > 0;

  /**
   * Get total kills for a mob family by summing all matching API keys.
   * Each family has exact apiKeys from NEU (e.g. "farming_chicken_1", "enderman_50").
   */
  function getKills(apiKeys: string[]): number {
    return apiKeys.reduce((sum, key) => sum + (bestiaryKills[key] ?? 0), 0);
  }

  // ── Compute stats for all zones and families ───────────────────────────────
  const zonesWithStats = BESTIARY_ZONES.map(zone => {
    const families = zone.families.map(family => {
      const kills = getKills(family.apiKeys);
      const level = getBestiaryMilestoneLevel(kills, family.cap, family.bracket);
      const maxLevel = getBestiaryMaxLevel(family.cap, family.bracket);
      const thresholds = BESTIARY_BRACKETS[String(family.bracket)] ?? [];
      const capThresholds = thresholds.filter(t => t <= family.cap);
      const nextThreshold = capThresholds.find(t => t > kills) ?? null;
      return { ...family, kills, level, maxLevel, nextThreshold };
    });
    const zoneLevel = families.reduce((s, f) => s + f.level, 0);
    const zoneMaxLevel = families.reduce((s, f) => s + f.maxLevel, 0);
    return { ...zone, families, zoneLevel, zoneMaxLevel };
  });

  const totalLevel = zonesWithStats.reduce((s, z) => s + z.zoneLevel, 0);
  const maxTotalLevel = zonesWithStats.reduce((s, z) => s + z.zoneMaxLevel, 0);
  const totalFamilies = zonesWithStats.reduce((s, z) => s + z.families.length, 0);
  const completedFamilies = zonesWithStats.reduce(
    (s, z) => s + z.families.filter(f => f.level >= f.maxLevel).length, 0
  );
  const nearComplete = zonesWithStats.reduce(
    (s, z) => s + z.families.filter(f => f.nextThreshold !== null && f.kills > 0 && f.kills >= f.nextThreshold * 0.75).length, 0
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Bestiary</h1>
        <span className="ml-auto rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
          {profile.profileName}
        </span>
      </div>

      {!hasData && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6 text-sm text-amber-300">
          ⚠ Bestiary data not available from the API for this profile.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalLevel}</div>
          <div className="text-xs text-slate-500 mt-1">Total Milestone Levels</div>
          <div className="text-xs text-slate-600">of {maxTotalLevel} max</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-300">{completedFamilies}</div>
          <div className="text-xs text-slate-500 mt-1">Completed Families</div>
          <div className="text-xs text-slate-600">of {totalFamilies}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-300">{nearComplete}</div>
          <div className="text-xs text-slate-500 mt-1">Near Next Milestone</div>
          <div className="text-xs text-slate-600">≥75% to next tier</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-300">
            {maxTotalLevel > 0 ? Math.round((totalLevel / maxTotalLevel) * 100) : 0}%
          </div>
          <div className="text-xs text-slate-500 mt-1">Completion</div>
        </div>
      </div>

      {/* Per zone */}
      {zonesWithStats.map(zone => {
        const cfg = ZONE_CONFIG[zone.key] ?? { emoji: '📖', color: 'text-slate-300' };
        return (
          <div key={zone.key} className="card p-5 mb-4">
            <h2 className={`font-semibold mb-4 flex items-center gap-2 ${cfg.color}`}>
              <span>{cfg.emoji}</span> {zone.name}
              <span className="text-xs font-normal text-slate-500 ml-1">
                {zone.zoneLevel} / {zone.zoneMaxLevel} levels
              </span>
            </h2>
            <div className="space-y-3">
              {zone.families.map(f => {
                const isMax = f.level >= f.maxLevel;
                const pct = f.nextThreshold
                  ? Math.min(100, (f.kills / f.nextThreshold) * 100)
                  : isMax ? 100 : 0;
                return (
                  <div key={f.name} className={isMax ? 'opacity-60' : ''}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">
                        {f.name}
                        <span className="ml-2 text-slate-500">Lv {f.level}/{f.maxLevel}</span>
                      </span>
                      <span className="text-slate-500">
                        {isMax
                          ? <span className="text-emerald-400">✓ Max</span>
                          : f.nextThreshold !== null
                          ? `${f.kills.toLocaleString()} / ${f.nextThreshold.toLocaleString()}`
                          : `${f.kills.toLocaleString()} kills`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isMax ? 'bg-emerald-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${isMax ? 100 : pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
