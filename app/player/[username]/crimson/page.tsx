import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Crimson Isle` };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const KUUDRA_TIERS: { key: string; label: string; color: string }[] = [
  { key: 'none',      label: 'Basic (T1)',   color: 'text-slate-300' },
  { key: 'hot',       label: 'Hot (T2)',     color: 'text-orange-300' },
  { key: 'burning',   label: 'Burning (T3)', color: 'text-red-400' },
  { key: 'fiery',     label: 'Fiery (T4)',   color: 'text-rose-300' },
  { key: 'infernal',  label: 'Infernal (T5)',color: 'text-purple-300' },
];

const DOJO_CHALLENGES: { key: string; label: string }[] = [
  { key: 'mob_kb',      label: 'Mob Knockback' },
  { key: 'wall_jump',   label: 'Wall Jumping' },
  { key: 'ground_jump', label: 'Ground Jump' },
  { key: 'archer',      label: 'Archery' },
  { key: 'lock_head',   label: 'Lock Head' },
  { key: 'sword_swap',  label: 'Sword Swap' },
  { key: 'fireball',    label: 'Fireball Deflect' },
];

const FACTION_REP_MAX = 3000;

function dojoGrade(score: number): { grade: string; color: string } {
  if (score >= 1000) return { grade: 'S', color: 'text-yellow-300' };
  if (score >= 800)  return { grade: 'A', color: 'text-emerald-300' };
  if (score >= 600)  return { grade: 'B', color: 'text-blue-300' };
  if (score >= 400)  return { grade: 'C', color: 'text-purple-300' };
  if (score >= 200)  return { grade: 'D', color: 'text-slate-400' };
  return { grade: 'F', color: 'text-red-400' };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CrimsonPage({ params, searchParams }: Props) {
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

  const { crimson } = profile;
  const totalKuudraRuns = Object.values(crimson.kuudraTiers).reduce((s, v) => s + v, 0);
  const hasAnyData = totalKuudraRuns > 0 || crimson.magesReputation > 0 || crimson.barbiansReputation > 0 || Object.keys(crimson.dojo).length > 0 || crimson.fairySoulCollected > 0 || crimson.abiphoneContacts > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Crimson Isle</h1>
        <span className="ml-auto rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
          {profile.profileName}
        </span>
      </div>

      {!hasAnyData && (
        <div className="card p-8 text-center text-slate-500">
          No Crimson Isle data found for this profile.
        </div>
      )}

      {hasAnyData && (
        <div className="space-y-6">
          {/* Kuudra */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
              🔥 Kuudra
              {totalKuudraRuns > 0 && (
                <span className="text-xs text-slate-500 font-normal">{totalKuudraRuns} total runs</span>
              )}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {KUUDRA_TIERS.map(tier => {
                const count = crimson.kuudraTiers[tier.key] ?? 0;
                return (
                  <div
                    key={tier.key}
                    className={`rounded-lg border p-3 text-center ${count > 0 ? 'border-red-500/20 bg-red-500/5' : 'border-white/5 opacity-40'}`}
                  >
                    <div className={`text-lg font-bold font-mono ${tier.color}`}>{count}</div>
                    <div className="text-xs text-slate-400 mt-1">{tier.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Faction */}
          {(crimson.selectedFaction || crimson.magesReputation > 0 || crimson.barbiansReputation > 0) && (
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-4">⚔️ Faction</h2>
              {crimson.selectedFaction && (
                <div className="mb-4">
                  <span className="text-xs text-slate-500 uppercase tracking-wide">Selected Faction</span>
                  <div className={`mt-1 text-sm font-semibold capitalize ${crimson.selectedFaction === 'mages' ? 'text-blue-300' : 'text-red-300'}`}>
                    {crimson.selectedFaction === 'mages' ? '🔮 Mages' : '🪓 Barbarians'}
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <FactionBar
                  label="Mages Reputation"
                  value={crimson.magesReputation}
                  max={FACTION_REP_MAX}
                  color="bg-blue-500"
                  textColor="text-blue-300"
                  active={crimson.selectedFaction === 'mages'}
                />
                <FactionBar
                  label="Barbarians Reputation"
                  value={crimson.barbiansReputation}
                  max={FACTION_REP_MAX}
                  color="bg-red-500"
                  textColor="text-red-300"
                  active={crimson.selectedFaction === 'barbarian'}
                />
              </div>
            </div>
          )}

          {/* Abiphone */}
          {crimson.abiphoneContacts > 0 && (
            <div className="card p-4 text-center">
              <div className="text-2xl mb-1">📱</div>
              <div className="text-xl font-bold text-cyan-300">{crimson.abiphoneContacts}</div>
              <div className="text-xs text-slate-500 mt-1">Abiphone Contacts</div>
            </div>
          )}

          {/* Nether Fairy Souls */}
          {crimson.fairySoulCollected > 0 && (
            <div className="card p-4 text-center">
              <div className="text-2xl mb-1">🧚</div>
              <div className="text-xl font-bold text-pink-300">{crimson.fairySoulCollected}</div>
              <div className="text-xs text-slate-500 mt-1">Nether Fairy Souls</div>
            </div>
          )}

          {/* Dojo */}
          {Object.keys(crimson.dojo).length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-4">🥋 Dojo</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {DOJO_CHALLENGES.map(challenge => {
                  const data = crimson.dojo[challenge.key];
                  if (!data) return null;
                  const { grade, color } = dojoGrade(data.score);
                  return (
                    <div key={challenge.key} className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-2">
                      <div>
                        <div className="text-sm text-white">{challenge.label}</div>
                        {data.wave != null && <div className="text-xs text-slate-500">Wave {data.wave}</div>}
                      </div>
                      <div className="text-right">
                        <div className={`text-lg font-bold ${color}`}>{grade}</div>
                        <div className="text-xs text-slate-500">{data.score.toLocaleString()} pts</div>
                      </div>
                    </div>
                  );
                })}
                {/* Unknown challenges from API not in our list */}
                {Object.entries(crimson.dojo)
                  .filter(([key]) => !DOJO_CHALLENGES.some(c => c.key === key))
                  .map(([key, data]) => {
                    const { grade, color } = dojoGrade(data.score);
                    return (
                      <div key={key} className="flex items-center justify-between rounded-lg border border-white/5 px-4 py-2">
                        <div className="text-sm text-slate-400 capitalize">{key.replace(/_/g, ' ')}</div>
                        <div className="text-right">
                          <div className={`text-lg font-bold ${color}`}>{grade}</div>
                          <div className="text-xs text-slate-500">{data.score.toLocaleString()} pts</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FactionBar({
  label, value, max, color, textColor, active,
}: {
  label: string; value: number; max: number; color: string; textColor: string; active: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className={`text-sm ${active ? textColor : 'text-slate-400'}`}>
          {label}
          {active && <span className="ml-2 text-xs opacity-60">(active)</span>}
        </span>
        <span className="text-xs text-slate-500">{value.toLocaleString()} / {max.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color} ${active ? 'opacity-80' : 'opacity-30'}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
