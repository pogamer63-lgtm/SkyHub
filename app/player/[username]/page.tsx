import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { generateRecommendations } from '@/lib/recommendations/engine';
import { getAvatarUrl } from '@/lib/providers/skins/skin-provider';
import { formatCoins, levelColor, priorityColor, scoreColor } from '@/lib/utils/format';
import { PlayerProfile, Recommendation } from '@/lib/types/player';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — SkyBlock Profile` };
}

export default async function PlayerPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let allProfiles: Array<{ id: string; name: string; selected: boolean }> = [];
  let error: string | null = null;

  try {
    const { uuid, username: resolvedName } = await resolvePlayer(username);
    const profilesRes = await getSkyBlockProfiles(uuid);

    if (!profilesRes.success || !profilesRes.profiles?.length) {
      error = 'No SkyBlock profiles found for this player.';
    } else {
      allProfiles = profilesRes.profiles.map(p => ({
        id: p.profile_id,
        name: p.cute_name,
        selected: p.selected ?? false,
      }));

      let targetProfile = profilesRes.profiles.find(p =>
        p.profile_id === profileId || p.cute_name.toLowerCase() === profileId?.toLowerCase()
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
          <a href="/" className="mt-6 inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition-colors">
            ← Search Again
          </a>
        </div>
      </div>
    );
  }

  const recs = generateRecommendations(profile);
  const avatarUrl = getAvatarUrl(profile.uuid, 128);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Profile Header */}
      <div className="card p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <img
          src={avatarUrl}
          alt={`${profile.username}'s avatar`}
          width={80}
          height={80}
          className="rounded-xl border border-white/10"
          onError={undefined}
        />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{profile.username}</h1>
            <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-xs text-slate-400">
              {profile.profileName}
            </span>
            {profile.gameMode && (
              <span className="rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs text-yellow-300">
                {profile.gameMode}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-400">
            <span>SkyBlock Level <strong className="text-white">{profile.skyblockLevel}</strong></span>
            <span>Skill Avg <strong className="text-white">{(profile.skills.average ?? 0).toFixed(1)}</strong></span>
            <span>Catacombs <strong className="text-white">{profile.dungeons.catacombs.level}</strong></span>
            <span>Coins <strong className="text-yellow-300">{formatCoins(profile.purseCoins + profile.bankCoins)}</strong></span>
            <span>MP <strong className="text-purple-300">{profile.magicalPower}</strong></span>
          </div>
        </div>
        {/* Profile selector */}
        {allProfiles.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            {allProfiles.map(p => (
              <a
                key={p.id}
                href={`/player/${profile!.username}?profile=${p.name}`}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  p.name === profile!.profileName
                    ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
                    : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'
                }`}
              >
                {p.name}
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats Overview */}
        <div className="lg:col-span-1 space-y-4">
          <SkillsPanel skills={profile.skills} />
          <SlayerPanel slayers={profile.slayers} />
          <DungeonPanel dungeons={profile.dungeons} />
        </div>

        {/* Right: Recommendations */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top Pick */}
          {recs.topPick && (
            <div className="card p-5 border-indigo-500/30 bg-indigo-500/5">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🎯</span>
                <h2 className="font-semibold text-white">Best Next Step</h2>
                <span className="ml-auto text-xs text-indigo-300">Top Pick</span>
              </div>
              <RecommendationCard rec={recs.topPick} featured />
            </div>
          )}

          {/* Blockers */}
          {recs.blockers.length > 0 && (
            <div className="card p-5">
              <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span>🚨</span> Critical Blockers
                <span className="text-xs text-slate-500 font-normal ml-1">Fix these first</span>
              </h2>
              <div className="space-y-3">
                {recs.blockers.slice(0, 3).map(r => <RecommendationCard key={r.id} rec={r} />)}
              </div>
            </div>
          )}

          {/* All recommendations tabs */}
          <div className="card p-5">
            <h2 className="font-semibold text-white mb-4">All Recommendations</h2>
            <div className="space-y-3">
              {recs.all.slice(0, 8).map(r => <RecommendationCard key={r.id} rec={r} />)}
            </div>
            {recs.all.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">
                No recommendations generated. The engine may need more data about this profile.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────────

function SkillsPanel({ skills }: { skills: PlayerProfile['skills'] }) {
  const entries = [
    { name: 'Farming', level: skills.farming },
    { name: 'Mining', level: skills.mining },
    { name: 'Combat', level: skills.combat },
    { name: 'Foraging', level: skills.foraging },
    { name: 'Fishing', level: skills.fishing },
    { name: 'Enchanting', level: skills.enchanting },
    { name: 'Alchemy', level: skills.alchemy },
    { name: 'Taming', level: skills.taming },
  ];

  return (
    <div className="card p-4">
      <h3 className="font-medium text-white mb-3 text-sm flex items-center gap-2">
        📊 Skills
        <span className="ml-auto text-xs text-slate-500">Avg {(skills.average ?? 0).toFixed(1)}</span>
      </h3>
      <div className="space-y-2">
        {entries.map(({ name, level }) => (
          <div key={name} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-20">{name}</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{ width: `${Math.min(100, (level / 60) * 100)}%` }}
              />
            </div>
            <span className={`text-xs font-medium w-6 text-right ${levelColor(level)}`}>{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SlayerPanel({ slayers }: { slayers: PlayerProfile['slayers'] }) {
  const entries = [
    { name: 'Zombie', data: slayers.zombie },
    { name: 'Spider', data: slayers.spider },
    { name: 'Wolf', data: slayers.wolf },
    { name: 'Enderman', data: slayers.enderman },
    { name: 'Blaze', data: slayers.blaze },
    { name: 'Vampire', data: slayers.vampire },
  ];

  return (
    <div className="card p-4">
      <h3 className="font-medium text-white mb-3 text-sm">⚔️ Slayers</h3>
      <div className="grid grid-cols-2 gap-2">
        {entries.map(({ name, data }) => (
          <div key={name} className="flex items-center justify-between text-xs">
            <span className="text-slate-400">{name}</span>
            <span className={`font-medium ${levelColor(data.level, 9)}`}>Lv {data.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DungeonPanel({ dungeons }: { dungeons: PlayerProfile['dungeons'] }) {
  return (
    <div className="card p-4">
      <h3 className="font-medium text-white mb-3 text-sm">🏰 Dungeons</h3>
      <div className="space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-400">Catacombs</span>
          <span className={`font-medium ${levelColor(dungeons.catacombs.level, 50)}`}>
            Level {dungeons.catacombs.level}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Highest Floor</span>
          <span className="text-white font-medium">F{dungeons.catacombs.highestFloor}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Class</span>
          <span className="text-white font-medium capitalize">{dungeons.selectedClass}</span>
        </div>
        {Object.entries(dungeons.classes).map(([cls, data]) => (
          <div key={cls} className="flex justify-between">
            <span className="text-slate-500 capitalize">{cls}</span>
            <span className="text-slate-300">Lv {data.level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecommendationCard({ rec, featured = false }: { rec: Recommendation; featured?: boolean }) {
  const priorityStyle = priorityColor(rec.priority);

  return (
    <div className={`rounded-lg border p-4 ${featured ? 'border-indigo-500/40 bg-indigo-500/5' : 'border-white/8 bg-white/2'} hover:border-white/20 transition-colors`}>
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${priorityStyle}`}>
              {rec.priority}
            </span>
            <span className="text-xs text-slate-500 capitalize">{rec.category}</span>
          </div>
          <h4 className="font-medium text-white text-sm">{rec.title}</h4>
        </div>
        <div className="text-right shrink-0">
          <div className={`text-xs font-medium ${scoreColor(rec.roiScore)}`}>ROI {rec.roiScore}</div>
        </div>
      </div>
      <p className="text-xs text-slate-400 mb-3 leading-relaxed">{rec.description}</p>
      <div className="flex flex-wrap gap-3 text-xs">
        <span className="text-slate-500">
          Cost: <span className="text-slate-300">{rec.estimatedCostLabel}</span>
        </span>
        <span className="text-slate-500">
          Benefit: <span className="text-green-400">{rec.estimatedBenefit.slice(0, 50)}</span>
        </span>
      </div>
    </div>
  );
}
