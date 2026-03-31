import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';
import { SKILL_XP_TABLE, xpToNextLevel, xpForLevel, levelProgress } from '@/lib/data/xp-tables';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Skills Planner` };
}

// ─── Skill Meta ───────────────────────────────────────────────────────────────

const MAX_SKILL_LEVEL = 60;
const MAX_SPECIAL_LEVEL = 25; // runecrafting, social

interface SkillMeta {
  key: keyof PlayerProfile['skills'];
  xpKey: keyof PlayerProfile['skills'];
  name: string;
  emoji: string;
  maxLevel: number;
  bestMethods: Array<{ method: string; xpPerHour: string; note: string; cost: 'free' | 'cheap' | 'expensive' }>;
  bonuses: string[]; // what leveling this skill gives
}

const SKILLS: SkillMeta[] = [
  {
    key: 'farming', xpKey: 'farming_xp', name: 'Farming', emoji: '🌾', maxLevel: MAX_SKILL_LEVEL,
    bestMethods: [
      { method: 'Cactus farm (AFK)', xpPerHour: '300k–500k', note: 'Best XP/hr with Fortune IV', cost: 'cheap' },
      { method: 'Pumpkin/Melon farm', xpPerHour: '200k–400k', note: 'Good with Turbo-Crop reforge', cost: 'cheap' },
      { method: 'Sugar Cane auto', xpPerHour: '150k–300k', note: 'AFK friendly', cost: 'cheap' },
      { method: 'Garden farming', xpPerHour: '400k–800k', note: 'Best XP with Lotus + garden buffs', cost: 'expensive' },
    ],
    bonuses: ['+4 Farming Fortune per level', 'Unlocks Jacob contest entry at Lv 14', 'Unlocks garden plots at higher levels'],
  },
  {
    key: 'mining', xpKey: 'mining_xp', name: 'Mining', emoji: '⛏', maxLevel: MAX_SKILL_LEVEL,
    bestMethods: [
      { method: 'Mithril in Dwarven Mines', xpPerHour: '100k–200k', note: 'Good + HOTM XP at same time', cost: 'free' },
      { method: 'Ruby/Sapphire mining (Glacite)', xpPerHour: '200k–400k', note: 'Requires Glacite Tunnels access', cost: 'free' },
      { method: 'Hard Stone (Deep Caverns)', xpPerHour: '50k–100k', note: 'Early option, not efficient late', cost: 'free' },
      { method: 'Divan drill + gemstones', xpPerHour: '300k–600k', note: 'Endgame setup, very fast', cost: 'expensive' },
    ],
    bonuses: ['+1 Speed per 2 levels', '+0.5 Fishing Fortune per level', 'Unlocks new areas at Lv 15/30/50'],
  },
  {
    key: 'combat', xpKey: 'combat_xp', name: 'Combat', emoji: '⚔️', maxLevel: MAX_SKILL_LEVEL,
    bestMethods: [
      { method: 'Zombie Slayer (mid-game)', xpPerHour: '200k–400k', note: 'Great XP + slayer XP combo', cost: 'cheap' },
      { method: 'Endermen (End island)', xpPerHour: '300k–600k', note: 'Good late-game method', cost: 'free' },
      { method: 'Magma Cubes (Crimson Isle)', xpPerHour: '400k–800k', note: 'Excellent with Crimson armor', cost: 'free' },
      { method: 'Dungeons (F7/M7)', xpPerHour: '1M+', note: 'Best overall but requires high gear', cost: 'expensive' },
    ],
    bonuses: ['+0.5 Crit Chance per level', '+1% Damage at milestones', 'Unlocks stronger mob areas'],
  },
  {
    key: 'foraging', xpKey: 'foraging_xp', name: 'Foraging', emoji: '🌲', maxLevel: MAX_SKILL_LEVEL,
    bestMethods: [
      { method: 'Dark Oak (Park)', xpPerHour: '200k–350k', note: 'Best early with treecapitator', cost: 'cheap' },
      { method: 'Spruce auto-farm', xpPerHour: '150k–300k', note: 'AFK friendly', cost: 'cheap' },
      { method: 'Jungle tree (Flycatcher pet)', xpPerHour: '250k–400k', note: 'With Flycatcher pet bonus', cost: 'cheap' },
    ],
    bonuses: ['+1 Speed per 2 levels', 'Farming upgrade paths unlock', '+Strength bonus at milestones'],
  },
  {
    key: 'fishing', xpKey: 'fishing_xp', name: 'Fishing', emoji: '🎣', maxLevel: MAX_SKILL_LEVEL,
    bestMethods: [
      { method: 'Open ocean (AFK)', xpPerHour: '30k–60k', note: 'Slowest but passive', cost: 'free' },
      { method: 'Sea Creature farming', xpPerHour: '80k–150k', note: 'Good with Dolphin pet', cost: 'cheap' },
      { method: 'Trophy fishing (Blazing Fortress)', xpPerHour: '100k–200k', note: 'Active play required', cost: 'cheap' },
      { method: 'Worm Fishing (Dungeon hub)', xpPerHour: '200k–400k', note: 'Best XP/hr, requires unlocks', cost: 'cheap' },
    ],
    bonuses: ['+4 Fishing Fortune per level', 'Unlocks deeper sea areas', 'Sea creature spawns scale with level'],
  },
  {
    key: 'enchanting', xpKey: 'enchanting_xp', name: 'Enchanting', emoji: '✨', maxLevel: MAX_SKILL_LEVEL,
    bestMethods: [
      { method: 'Enchanting table + exp bottles', xpPerHour: '100k–200k', note: 'Cost-efficient with Grand XP bottles', cost: 'cheap' },
      { method: 'AH XP bottle grinding', xpPerHour: '300k–600k', note: 'Buy XP bottles from AH', cost: 'expensive' },
      { method: 'Dungeons grinding (enc XP)', xpPerHour: '200k+', note: 'Passive gain while playing', cost: 'cheap' },
    ],
    bonuses: ['+1 Intelligence per level', 'Stronger enchants at higher levels', 'More enchantment options unlock'],
  },
  {
    key: 'alchemy', xpKey: 'alchemy_xp', name: 'Alchemy', emoji: '⚗️', maxLevel: MAX_SKILL_LEVEL,
    bestMethods: [
      { method: 'Brew potions in bulk', xpPerHour: '50k–150k', note: 'Cheap ingredients from Bazaar', cost: 'cheap' },
      { method: 'Water Breathing / Swiftness spam', xpPerHour: '100k–200k', note: 'Cheapest method', cost: 'cheap' },
      { method: 'God Potion brewing', xpPerHour: '200k–400k', note: 'Expensive but good potion value', cost: 'expensive' },
    ],
    bonuses: ['+1 Intelligence per level', 'Longer potion durations', 'New potion recipes at higher levels'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatXP(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

function levelColor(level: number, max = 60): string {
  const pct = level / max;
  if (pct >= 1)    return 'text-yellow-300';
  if (pct >= 0.75) return 'text-emerald-300';
  if (pct >= 0.5)  return 'text-blue-300';
  if (pct >= 0.25) return 'text-slate-300';
  return 'text-slate-500';
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SkillsPage({ params, searchParams }: Props) {
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

  const skills = profile.skills;
  const avg = skills.average ?? 0;

  // Find weakest skill (most XP to level up relative to current level)
  const skillData = SKILLS.map(s => {
    const level = skills[s.key] as number;
    const xp = skills[s.xpKey] as number;
    const xpToNext = xp > 0 ? xpToNextLevel(xp, SKILL_XP_TABLE) : null;
    const xpToMax = xp > 0 ? Math.max(0, xpForLevel(s.maxLevel, SKILL_XP_TABLE) - xp) : null;
    const prog = xp > 0 ? levelProgress(xp, SKILL_XP_TABLE) : level / s.maxLevel;
    return { ...s, level, xp, xpToNext, xpToMax, prog };
  });

  const lowestSkills = [...skillData].sort((a, b) => a.level - b.level).slice(0, 3);
  const totalXPToMax = skillData.reduce((sum, s) => sum + (s.xpToMax ?? 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Skills Planner</h1>
        <span className="ml-auto rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs text-indigo-300">
          {profile.profileName}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Skill Average" value={avg.toFixed(1)} color="text-white" />
        <StatCard label="Maxed Skills" value={`${skillData.filter(s => s.level >= s.maxLevel).length}/${SKILLS.length}`} color="text-yellow-300" />
        <StatCard label="XP to All 60" value={formatXP(totalXPToMax)} color="text-indigo-300" sub="total remaining" />
        <StatCard label="Weakest" value={lowestSkills[0]?.name ?? '—'} color="text-red-300" sub={`Lv ${lowestSkills[0]?.level ?? 0}`} />
      </div>

      {/* Priority: Lowest Skills */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          🎯 Focus Areas
          <span className="text-xs font-normal text-slate-500">your lowest skills — prioritize these for skill average</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {lowestSkills.map(s => (
            <div key={s.key} className="rounded-lg bg-slate-800/40 border border-white/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span>{s.emoji}</span>
                <span className="font-medium text-white">{s.name}</span>
                <span className={`ml-auto text-sm font-bold ${levelColor(s.level)}`}>Lv {s.level}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 mb-2">
                <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(s.level / s.maxLevel) * 100}%` }} />
              </div>
              <div className="text-xs text-slate-500">
                {s.xpToNext !== null ? `${formatXP(s.xpToNext)} XP to Lv ${s.level + 1}` : 'MAX LEVEL'}
              </div>
              <div className="mt-2 text-xs text-emerald-400">
                Best: {s.bestMethods[0]?.method}
                <span className="text-slate-500"> · {s.bestMethods[0]?.xpPerHour} XP/hr</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Each Skill Deep Dive */}
      <div className="space-y-4">
        {skillData.map(s => {
          const maxed = s.level >= s.maxLevel;
          return (
            <div key={s.key} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl">{s.emoji}</span>
                    <h2 className="font-semibold text-white text-lg">{s.name}</h2>
                    <span className={`text-xl font-bold ${levelColor(s.level)}`}>{s.level}</span>
                    {maxed && <span className="text-xs text-yellow-300 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-2 py-0.5">MAX</span>}
                  </div>
                  <div className="text-xs text-slate-500">
                    {s.xp > 0 ? `${formatXP(s.xp)} total XP` : 'No XP data'}
                    {s.xpToMax && s.xpToMax > 0 ? ` · ${formatXP(s.xpToMax)} to Lv 60` : ''}
                  </div>
                </div>
                {!maxed && s.xpToNext !== null && (
                  <div className="text-right shrink-0">
                    <div className="text-sm font-mono text-indigo-300">{formatXP(s.xpToNext)}</div>
                    <div className="text-xs text-slate-500">XP to Lv {s.level + 1}</div>
                  </div>
                )}
              </div>

              {/* XP Bar */}
              {!maxed && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Progress to Lv {s.level + 1}</span>
                    <span>{(s.prog * 100).toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${s.prog * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Leveling Methods */}
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">Leveling Methods</div>
                  <div className="space-y-1.5">
                    {s.bestMethods.map((m, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <span className={`mt-0.5 shrink-0 ${
                          m.cost === 'free'      ? 'text-emerald-400' :
                          m.cost === 'cheap'     ? 'text-blue-400' :
                          'text-yellow-400'
                        }`}>●</span>
                        <div>
                          <span className="text-slate-300">{m.method}</span>
                          <span className="text-slate-500"> · {m.xpPerHour}/hr</span>
                          <div className="text-slate-600">{m.note}</div>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-3 text-xs mt-1 text-slate-600">
                      <span className="text-emerald-400">●</span> Free
                      <span className="text-blue-400">●</span> Cheap
                      <span className="text-yellow-400">●</span> Costly
                    </div>
                  </div>
                </div>

                {/* Bonuses */}
                <div>
                  <div className="text-xs font-medium text-slate-400 mb-2">Level Bonuses</div>
                  <div className="space-y-1">
                    {s.bonuses.map((b, i) => (
                      <div key={i} className="text-xs text-slate-400 flex items-center gap-2">
                        <span className="text-indigo-400">↑</span> {b}
                      </div>
                    ))}
                  </div>

                  {/* XP milestones */}
                  <div className="mt-3">
                    <div className="text-xs font-medium text-slate-400 mb-2">XP to milestone levels</div>
                    <div className="grid grid-cols-3 gap-1">
                      {[20, 30, 40, 50, 55, 60].map(target => {
                        const xpNeeded = xpForLevel(target, SKILL_XP_TABLE);
                        const remaining = Math.max(0, xpNeeded - s.xp);
                        const reached = s.level >= target;
                        return (
                          <div key={target} className={`rounded px-2 py-1 text-center ${reached ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/40 border border-white/5'}`}>
                            <div className={`text-xs font-bold ${reached ? 'text-emerald-300' : 'text-slate-400'}`}>Lv {target}</div>
                            <div className="text-xs text-slate-600">{reached ? '✓' : formatXP(remaining)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
      {sub && <div className="text-xs text-slate-600">{sub}</div>}
    </div>
  );
}
