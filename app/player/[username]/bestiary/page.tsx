import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';
import { SkyBlockProfile } from '@/lib/types/hypixel';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Bestiary` };
}

// ─── Bestiary Knowledge Base ──────────────────────────────────────────────────

type BestiaryCategory = 'Hub' | 'Slayer' | 'Dungeons' | 'Nether' | 'Mining' | 'Farming' | 'Other';

interface BestiaryFamily {
  id: string;          // key prefix in API (e.g. "ZOMBIE")
  name: string;
  category: BestiaryCategory;
  maxMilestone: number; // highest milestone kill count
  emoji: string;
}

// Milestones: kills required per tier (Hypixel wiki)
// Each family has tiers at: 1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000
const MILESTONE_KILLS = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

const BESTIARY_FAMILIES: BestiaryFamily[] = [
  // Hub
  { id: 'ZOMBIE',           name: 'Zombie',           category: 'Hub',      maxMilestone: 10000, emoji: '🧟' },
  { id: 'SKELETON',         name: 'Skeleton',         category: 'Hub',      maxMilestone: 10000, emoji: '💀' },
  { id: 'SPIDER',           name: 'Spider',           category: 'Hub',      maxMilestone: 10000, emoji: '🕷' },
  { id: 'CREEPER',          name: 'Creeper',          category: 'Hub',      maxMilestone: 10000, emoji: '💚' },
  { id: 'WITCH',            name: 'Witch',            category: 'Hub',      maxMilestone: 5000,  emoji: '🧙' },
  { id: 'ENDERMAN',         name: 'Enderman',         category: 'Hub',      maxMilestone: 10000, emoji: '👁' },
  { id: 'BLAZE',            name: 'Blaze',            category: 'Hub',      maxMilestone: 10000, emoji: '🔥' },
  { id: 'MAGMA_CUBE',       name: 'Magma Cube',       category: 'Hub',      maxMilestone: 10000, emoji: '🟥' },
  { id: 'GHAST',            name: 'Ghast',            category: 'Hub',      maxMilestone: 5000,  emoji: '👻' },
  { id: 'SLIME',            name: 'Slime',            category: 'Hub',      maxMilestone: 5000,  emoji: '🟢' },
  // Slayer
  { id: 'REVENANT_HORROR',      name: 'Revenant Horror',      category: 'Slayer', maxMilestone: 10000, emoji: '🧟' },
  { id: 'TARANTULA_BROODFATHER',name: 'Tarantula Broodfather', category: 'Slayer', maxMilestone: 5000,  emoji: '🕷' },
  { id: 'SVEN_PACKMASTER',      name: 'Sven Packmaster',       category: 'Slayer', maxMilestone: 5000,  emoji: '🐺' },
  { id: 'VOIDGLOOM_SERAPH',     name: 'Voidgloom Seraph',      category: 'Slayer', maxMilestone: 2500,  emoji: '👁' },
  { id: 'INFERNO_DEMONLORD',    name: 'Inferno Demonlord',     category: 'Slayer', maxMilestone: 2500,  emoji: '🔥' },
  { id: 'RIFTSTALKER_BLOODFIEND',name:'Riftstalker Bloodfiend', category: 'Slayer', maxMilestone: 2500,  emoji: '🩸' },
  // Dungeons
  { id: 'BONZO',            name: 'Bonzo\'s Followers',  category: 'Dungeons', maxMilestone: 5000,  emoji: '🃏' },
  { id: 'SCARF',            name: 'Scarf\'s Studies',    category: 'Dungeons', maxMilestone: 5000,  emoji: '📚' },
  { id: 'PROFESSOR',        name: 'Prof\'s Guardians',   category: 'Dungeons', maxMilestone: 5000,  emoji: '⚡' },
  { id: 'THORN',            name: 'Thorn\'s Minions',    category: 'Dungeons', maxMilestone: 5000,  emoji: '🌿' },
  { id: 'LIVID',            name: 'Livid\'s Clones',     category: 'Dungeons', maxMilestone: 5000,  emoji: '🔮' },
  { id: 'SADAN',            name: 'Sadan\'s Giants',     category: 'Dungeons', maxMilestone: 5000,  emoji: '🗿' },
  { id: 'NECRON',           name: 'Necron\'s Army',      category: 'Dungeons', maxMilestone: 10000, emoji: '💀' },
  // Nether
  { id: 'KUUDRA',           name: 'Kuudra',              category: 'Nether',   maxMilestone: 2500,  emoji: '🦀' },
  { id: 'WITHER_SKELETON',  name: 'Wither Skeleton',     category: 'Nether',   maxMilestone: 10000, emoji: '💀' },
  { id: 'PIGLIN',           name: 'Piglin',              category: 'Nether',   maxMilestone: 5000,  emoji: '🐷' },
  // Mining
  { id: 'GOBLIN',           name: 'Goblin',              category: 'Mining',   maxMilestone: 10000, emoji: '👺' },
  { id: 'AUTOMATON',        name: 'Automaton',           category: 'Mining',   maxMilestone: 5000,  emoji: '🤖' },
  { id: 'YETI',             name: 'Yeti',                category: 'Mining',   maxMilestone: 2500,  emoji: '❄' },
  // Farming
  { id: 'CHICKEN',          name: 'Chicken',             category: 'Farming',  maxMilestone: 5000,  emoji: '🐔' },
  { id: 'COW',              name: 'Cow',                 category: 'Farming',  maxMilestone: 5000,  emoji: '🐄' },
  { id: 'PIG',              name: 'Pig',                 category: 'Farming',  maxMilestone: 5000,  emoji: '🐷' },
  { id: 'SHEEP',            name: 'Sheep',               category: 'Farming',  maxMilestone: 5000,  emoji: '🐑' },
];

function getMilestoneLevel(kills: number, maxMilestone: number): number {
  const caps = MILESTONE_KILLS.filter(m => m <= maxMilestone);
  let level = 0;
  for (const cap of caps) {
    if (kills >= cap) level++;
    else break;
  }
  return level;
}

function getMaxLevel(maxMilestone: number): number {
  return MILESTONE_KILLS.filter(m => m <= maxMilestone).length;
}

function nextMilestoneKills(kills: number, maxMilestone: number): number | null {
  const caps = MILESTONE_KILLS.filter(m => m <= maxMilestone);
  return caps.find(c => c > kills) ?? null;
}

const CATEGORY_COLORS: Record<BestiaryCategory, string> = {
  Hub:      'text-slate-300',
  Slayer:   'text-red-300',
  Dungeons: 'text-orange-300',
  Nether:   'text-rose-300',
  Mining:   'text-sky-300',
  Farming:  'text-emerald-300',
  Other:    'text-slate-400',
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

  // ── Parse bestiary kills from raw member data ──────────────────────────────
  const member = rawProfile.members[profile.uuid ?? ''] ?? Object.values(rawProfile.members)[0];
  const bestiaryRaw = (member?.bestiary ?? {}) as Record<string, unknown>;

  // API structure: kills_FAMILY or kills_FAMILY_TIER — we sum all variants
  function getKills(familyId: string): number {
    let total = 0;
    for (const [key, val] of Object.entries(bestiaryRaw)) {
      if (key.startsWith(`kills_${familyId}`) && typeof val === 'number') {
        total += val;
      }
    }
    return total;
  }

  const hasData = Object.keys(bestiaryRaw).length > 0;

  // Compute stats per family
  const families = BESTIARY_FAMILIES.map(f => {
    const kills = getKills(f.id);
    const level = getMilestoneLevel(kills, f.maxMilestone);
    const maxLevel = getMaxLevel(f.maxMilestone);
    const next = nextMilestoneKills(kills, f.maxMilestone);
    return { ...f, kills, level, maxLevel, next };
  });

  const totalLevel = families.reduce((s, f) => s + f.level, 0);
  const maxTotalLevel = families.reduce((s, f) => s + f.maxLevel, 0);
  const completedFamilies = families.filter(f => f.level >= f.maxLevel).length;
  const nearComplete = families.filter(f => f.next !== null && f.kills > 0 && f.kills >= (f.next * 0.75)).length;

  const categories: BestiaryCategory[] = ['Hub', 'Slayer', 'Dungeons', 'Nether', 'Mining', 'Farming'];

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
          <div className="text-xs text-slate-600">of {families.length}</div>
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

      {/* Per category */}
      {categories.map(cat => {
        const catFamilies = families.filter(f => f.category === cat);
        if (catFamilies.length === 0) return null;
        return (
          <div key={cat} className="card p-5 mb-4">
            <h2 className={`font-semibold mb-4 flex items-center gap-2 ${CATEGORY_COLORS[cat]}`}>
              {cat}
              <span className="text-xs font-normal text-slate-500">
                {catFamilies.reduce((s, f) => s + f.level, 0)} / {catFamilies.reduce((s, f) => s + f.maxLevel, 0)} levels
              </span>
            </h2>
            <div className="space-y-3">
              {catFamilies.map(f => {
                const pct = f.next ? Math.min(100, (f.kills / f.next) * 100) : 100;
                const isMax = f.level >= f.maxLevel;
                return (
                  <div key={f.id} className={isMax ? 'opacity-60' : ''}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-slate-300 font-medium">
                        {f.emoji} {f.name}
                        <span className="ml-2 text-slate-500">Lv {f.level}/{f.maxLevel}</span>
                      </span>
                      <span className="text-slate-500">
                        {isMax
                          ? <span className="text-emerald-400">✓ Max</span>
                          : `${f.kills.toLocaleString()} / ${f.next?.toLocaleString() ?? '—'} kills`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full transition-all ${isMax ? 'bg-emerald-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-indigo-500'}`}
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
