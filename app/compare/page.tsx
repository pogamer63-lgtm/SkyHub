import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';
import { formatCoins } from '@/lib/utils/format';
import CompareSearchForm from './compare-form';

interface Props {
  searchParams: Promise<{ a?: string; b?: string }>;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { a, b } = await searchParams;
  if (a && b) return { title: `${a} vs ${b} — SkyHub Compare` };
  return { title: 'Compare Players — SkyHub' };
}

// ─── Comparison helpers ────────────────────────────────────────────────────────

interface StatRow {
  label: string;
  icon: string;
  aVal: number | string;
  bVal: number | string;
  numeric: boolean;
  higherIsBetter: boolean;
  format?: (v: number) => string;
}

function pct(a: number, b: number): string {
  if (b === 0) return '—';
  const diff = ((a - b) / b) * 100;
  if (Math.abs(diff) < 1) return 'Equal';
  return `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`;
}

function buildStats(a: PlayerProfile, b: PlayerProfile): StatRow[] {
  const skillAvg = (p: PlayerProfile) =>
    (['farming', 'mining', 'combat', 'foraging', 'fishing', 'enchanting', 'alchemy', 'taming'] as const)
      .reduce((s, k) => s + p.skills[k], 0) / 8;

  const maxSlayer = (p: PlayerProfile) =>
    Math.max(p.slayers.zombie.level, p.slayers.spider.level, p.slayers.wolf.level,
             p.slayers.enderman.level, p.slayers.blaze.level, p.slayers.vampire.level);

  const totalSlayerXP = (p: PlayerProfile) =>
    Object.values(p.slayers).reduce((s, sl) => s + sl.xp, 0);

  return [
    { label: 'SkyBlock Level', icon: '⭐', aVal: a.skyblockLevel, bVal: b.skyblockLevel, numeric: true, higherIsBetter: true },
    { label: 'Skill Average', icon: '📊', aVal: +skillAvg(a).toFixed(1), bVal: +skillAvg(b).toFixed(1), numeric: true, higherIsBetter: true },
    { label: 'Farming', icon: '🌾', aVal: a.skills.farming, bVal: b.skills.farming, numeric: true, higherIsBetter: true },
    { label: 'Mining', icon: '⛏️', aVal: a.skills.mining, bVal: b.skills.mining, numeric: true, higherIsBetter: true },
    { label: 'Combat', icon: '⚔️', aVal: a.skills.combat, bVal: b.skills.combat, numeric: true, higherIsBetter: true },
    { label: 'Foraging', icon: '🪓', aVal: a.skills.foraging, bVal: b.skills.foraging, numeric: true, higherIsBetter: true },
    { label: 'Fishing', icon: '🎣', aVal: a.skills.fishing, bVal: b.skills.fishing, numeric: true, higherIsBetter: true },
    { label: 'Enchanting', icon: '📚', aVal: a.skills.enchanting, bVal: b.skills.enchanting, numeric: true, higherIsBetter: true },
    { label: 'Alchemy', icon: '⚗️', aVal: a.skills.alchemy, bVal: b.skills.alchemy, numeric: true, higherIsBetter: true },
    { label: 'Taming', icon: '🐾', aVal: a.skills.taming, bVal: b.skills.taming, numeric: true, higherIsBetter: true },
    { label: 'Catacombs Level', icon: '🏰', aVal: a.dungeons.catacombs.level, bVal: b.dungeons.catacombs.level, numeric: true, higherIsBetter: true },
    { label: 'Highest Floor', icon: '🗝️', aVal: a.dungeons.catacombs.highestFloor, bVal: b.dungeons.catacombs.highestFloor, numeric: true, higherIsBetter: true },
    { label: 'MM Highest Floor', icon: '👑', aVal: a.dungeons.masterMode.highestFloor, bVal: b.dungeons.masterMode.highestFloor, numeric: true, higherIsBetter: true },
    { label: 'Max Slayer Level', icon: '🗡️', aVal: maxSlayer(a), bVal: maxSlayer(b), numeric: true, higherIsBetter: true },
    { label: 'Total Slayer XP', icon: '💀', aVal: totalSlayerXP(a), bVal: totalSlayerXP(b), numeric: true, higherIsBetter: true, format: n => n.toLocaleString() },
    { label: 'Magical Power', icon: '💍', aVal: a.magicalPower, bVal: b.magicalPower, numeric: true, higherIsBetter: true },
    { label: 'HOTM Level', icon: '⛰️', aVal: a.mining.hotmLevel, bVal: b.mining.hotmLevel, numeric: true, higherIsBetter: true },
    { label: 'Garden Level', icon: '🌱', aVal: a.farming.gardenLevel, bVal: b.farming.gardenLevel, numeric: true, higherIsBetter: true },
    { label: 'Fairy Souls', icon: '🧚', aVal: a.fairySouls, bVal: b.fairySouls, numeric: true, higherIsBetter: true },
    { label: 'Coins (Purse)', icon: '💰', aVal: a.purseCoins, bVal: b.purseCoins, numeric: true, higherIsBetter: true, format: formatCoins },
  ];
}

// ─── Async data loader ─────────────────────────────────────────────────────────

async function loadPlayer(usernameOrEmpty: string | undefined): Promise<{ profile: PlayerProfile; username: string } | { error: string }> {
  if (!usernameOrEmpty?.trim()) return { error: 'No username provided' };
  try {
    const { uuid, username } = await resolvePlayer(usernameOrEmpty.trim());
    const profilesRes = await getSkyBlockProfiles(uuid);
    if (!profilesRes.success || !profilesRes.profiles?.length) return { error: 'No SkyBlock profiles found.' };
    const profile = selectBestProfile(profilesRes.profiles, uuid, username);
    return { profile, username };
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Failed to load profile.' };
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ComparePage({ searchParams }: Props) {
  const { a: nameA, b: nameB } = await searchParams;

  const bothProvided = !!nameA && !!nameB;
  const [resultA, resultB] = bothProvided
    ? await Promise.all([loadPlayer(nameA), loadPlayer(nameB)])
    : [null, null];

  const profileA = resultA && 'profile' in resultA ? resultA.profile : null;
  const profileB = resultB && 'profile' in resultB ? resultB.profile : null;
  const errorA = resultA && 'error' in resultA ? resultA.error : null;
  const errorB = resultB && 'error' in resultB ? resultB.error : null;

  const stats = profileA && profileB ? buildStats(profileA, profileB) : null;

  // Count wins
  const wins = stats ? stats.reduce(
    (acc, row) => {
      if (!row.numeric) return acc;
      const av = row.aVal as number, bv = row.bVal as number;
      if (av > bv) acc.a++;
      else if (bv > av) acc.b++;
      else acc.tie++;
      return acc;
    },
    { a: 0, b: 0, tie: 0 }
  ) : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Profile Comparison</h1>
        <p className="text-slate-400 text-sm">Compare two players side-by-side across all stats.</p>
      </div>

      {/* Search form */}
      <CompareSearchForm defaultA={nameA ?? ''} defaultB={nameB ?? ''} />

      {/* Errors */}
      {(errorA || errorB) && (
        <div className="space-y-2">
          {errorA && <div className="card p-4 border-red-500/30 bg-red-500/5 text-red-300 text-sm">Player A: {errorA}</div>}
          {errorB && <div className="card p-4 border-red-500/30 bg-red-500/5 text-red-300 text-sm">Player B: {errorB}</div>}
        </div>
      )}

      {/* Empty state */}
      {!bothProvided && (
        <div className="card p-12 text-center">
          <div className="text-5xl mb-4">⚔️</div>
          <h2 className="text-lg font-semibold text-white mb-2">Enter two usernames to compare</h2>
          <p className="text-slate-400 text-sm">Type two Minecraft usernames above and click Compare.</p>
        </div>
      )}

      {/* Comparison table */}
      {profileA && profileB && stats && wins && (
        <>
          {/* Score banner */}
          <div className="card p-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <a href={`/player/${profileA.username}`} className="text-xl font-bold text-indigo-300 hover:text-white transition-colors">
                  {profileA.username}
                </a>
                <div className="text-3xl font-bold text-white mt-1">{wins.a}</div>
                <div className="text-xs text-slate-500">categories ahead</div>
              </div>
              <div className="flex flex-col items-center justify-center">
                <div className="text-slate-600 text-sm font-medium">VS</div>
                <div className="text-xs text-slate-600 mt-1">{wins.tie} tied</div>
              </div>
              <div>
                <a href={`/player/${profileB.username}`} className="text-xl font-bold text-purple-300 hover:text-white transition-colors">
                  {profileB.username}
                </a>
                <div className="text-3xl font-bold text-white mt-1">{wins.b}</div>
                <div className="text-xs text-slate-500">categories ahead</div>
              </div>
            </div>
          </div>

          {/* Stats table */}
          <div className="card overflow-hidden">
            <div className="grid grid-cols-[1fr,2fr,1fr] text-xs text-slate-500 font-medium uppercase tracking-wide px-4 py-2 bg-slate-800/50">
              <div className="text-indigo-400">{profileA.username}</div>
              <div className="text-center">Stat</div>
              <div className="text-right text-purple-400">{profileB.username}</div>
            </div>
            <div className="divide-y divide-white/5">
              {stats.map((row, i) => {
                const av = row.aVal as number;
                const bv = row.bVal as number;
                const aWins = av > bv;
                const bWins = bv > av;
                const fmt = row.format ?? ((n: number) => n.toLocaleString());
                const aStr = row.numeric ? fmt(av) : String(row.aVal);
                const bStr = row.numeric ? fmt(bv) : String(row.bVal);

                return (
                  <div key={i} className="grid grid-cols-[1fr,2fr,1fr] items-center px-4 py-2.5 hover:bg-white/5 transition-colors text-sm">
                    {/* A value */}
                    <div className={`font-semibold ${aWins ? 'text-indigo-300' : bWins ? 'text-slate-500' : 'text-slate-300'}`}>
                      {aStr}
                      {aWins && <span className="ml-1.5 text-xs text-indigo-400">{pct(av, bv)}</span>}
                    </div>

                    {/* Label */}
                    <div className="text-center text-xs text-slate-400">
                      <span className="mr-1">{row.icon}</span>{row.label}
                    </div>

                    {/* B value */}
                    <div className={`text-right font-semibold ${bWins ? 'text-purple-300' : aWins ? 'text-slate-500' : 'text-slate-300'}`}>
                      {bWins && <span className="mr-1.5 text-xs text-purple-400">{pct(bv, av)}</span>}
                      {bStr}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gap analysis */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Gap Analysis — What {profileA.username} needs to catch {profileB.username}</h2>
            <div className="space-y-2">
              {stats
                .filter(r => r.numeric && (r.bVal as number) > (r.aVal as number))
                .sort((x, y) => {
                  const xGap = (x.bVal as number) - (x.aVal as number);
                  const yGap = (y.bVal as number) - (y.aVal as number);
                  return (yGap / (x.bVal as number)) - (xGap / (y.bVal as number));
                })
                .slice(0, 8)
                .map((row, i) => {
                  const gap = (row.bVal as number) - (row.aVal as number);
                  const fmt = row.format ?? ((n: number) => n.toLocaleString());
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm bg-slate-800/40 rounded-lg px-3 py-2">
                      <span className="text-slate-500 w-5 shrink-0">{row.icon}</span>
                      <span className="text-slate-300 flex-1">{row.label}</span>
                      <span className="text-slate-500 text-xs">{fmt(row.aVal as number)}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-purple-300 text-xs font-medium">{fmt(row.bVal as number)}</span>
                      <span className="text-red-400 text-xs shrink-0">−{fmt(gap)}</span>
                    </div>
                  );
                })}
              {stats.filter(r => r.numeric && (r.bVal as number) > (r.aVal as number)).length === 0 && (
                <p className="text-slate-400 text-sm">{profileA.username} leads in all compared stats!</p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
