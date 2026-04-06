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
  return { title: `${username} — The Rift` };
}

// Maximums sourced from the SkyBlock wiki
const ENIGMA_SOULS_MAX = 42;
const DEAD_CATS_MAX = 26;
const WITHER_EYES_MAX = 6;

export default async function RiftPage({ params, searchParams }: Props) {
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

  const { rift } = profile;
  const hasAnyData = rift.enigmaSouls > 0 || rift.deadCats > 0 || rift.galleryTrophies > 0 ||
    rift.witherEyes > 0 || rift.grubberStacks > 0 || rift.motesPurse > 0 || rift.motesOrbPickup > 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">The Rift</h1>
        <span className="ml-auto rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
          {profile.profileName}
        </span>
      </div>

      {!hasAnyData && (
        <div className="card p-8 text-center text-slate-500">
          No Rift data found for this profile.
        </div>
      )}

      {hasAnyData && (
        <div className="space-y-6">
          {/* Summary grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <RiftCard
              icon="👻"
              label="Enigma Souls"
              value={rift.enigmaSouls}
              max={ENIGMA_SOULS_MAX}
              color="text-purple-300"
            />
            <RiftCard
              icon="🐱"
              label="Dead Cats"
              value={rift.deadCats}
              max={DEAD_CATS_MAX}
              color="text-orange-300"
            />
            <RiftCard
              icon="👁️"
              label="Wither Eyes"
              value={rift.witherEyes}
              max={WITHER_EYES_MAX}
              color="text-red-300"
            />
            {rift.galleryTrophies > 0 && (
              <RiftCard
                icon="🏆"
                label="Gallery Trophies"
                value={rift.galleryTrophies}
                color="text-yellow-300"
              />
            )}
            {rift.grubberStacks > 0 && (
              <RiftCard
                icon="🍔"
                label="Grubber Stacks"
                value={rift.grubberStacks}
                color="text-green-300"
              />
            )}
            {rift.motesPurse > 0 && (
              <div className="card p-4 text-center">
                <div className="text-2xl mb-1">🪙</div>
                <div className="text-lg font-bold text-cyan-300">
                  {rift.motesPurse.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-1">Motes Purse</div>
              </div>
            )}
            {rift.motesOrbPickup > 0 && (
              <div className="card p-4 text-center">
                <div className="text-2xl mb-1">✨</div>
                <div className="text-xl font-bold text-violet-300">
                  {rift.motesOrbPickup.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500 mt-1">Motes Orbs Picked Up</div>
              </div>
            )}
          </div>

          {/* Progress bars */}
          <div className="card p-5 space-y-4">
            <h2 className="font-semibold text-white">Progress</h2>
            <ProgressBar label="Enigma Souls" value={rift.enigmaSouls} max={ENIGMA_SOULS_MAX} color="bg-purple-500" />
            <ProgressBar label="Dead Cats" value={rift.deadCats} max={DEAD_CATS_MAX} color="bg-orange-500" />
            <ProgressBar label="Wither Eyes" value={rift.witherEyes} max={WITHER_EYES_MAX} color="bg-red-500" />
          </div>
        </div>
      )}
    </div>
  );
}

function RiftCard({
  icon, label, value, max, color,
}: {
  icon: string; label: string; value: number; max?: number; color: string;
}) {
  return (
    <div className="card p-4 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className={`text-xl font-bold font-mono ${color}`}>
        {value}{max != null ? <span className="text-slate-600 text-sm font-normal"> / {max}</span> : ''}
      </div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  const done = value >= max;
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className={done ? 'text-emerald-400' : 'text-slate-400'}>{label}{done ? ' ✓' : ''}</span>
        <span className="text-slate-500">{value} / {max}</span>
      </div>
      <div className="h-2 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${done ? 'bg-emerald-500' : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
