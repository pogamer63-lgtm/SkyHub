import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile, DungeonProgress } from '@/lib/types/player';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Dungeon Planner` };
}

// ─── Constants ────────────────────────────────────────────────────────────────

interface FloorInfo {
  floor: number;
  name: string;
  boss: string;
  minCatLevel: number;
  keyGear: string;
  notes: string;
}

// Entrance requirements (wiki): F1=Cat1, F2=Cat3, F3=Cat5, F4=Cat9, F5=Cat14, F6=Cat19, F7=Cat24
// minCatLevel shown as "recommended" = entrance req + small buffer
const FLOORS: FloorInfo[] = [
  { floor: 1, name: 'Floor 1',  boss: 'Bonzo',        minCatLevel: 1,  keyGear: 'Bonzo Staff',                    notes: 'Starter floor. Easy intro to dungeons. (Entrance: Cat 1)' },
  { floor: 2, name: 'Floor 2',  boss: 'Scarf',        minCatLevel: 4,  keyGear: "Scarf's Studies (accessory)",    notes: 'Learn puzzle mechanics. Scarf drops useful accessories. (Entrance: Cat 3)' },
  { floor: 3, name: 'Floor 3',  boss: 'Professor',    minCatLevel: 7,  keyGear: 'Giant Sword shards',             notes: 'Key early-game milestone. Professor is a skill check. (Entrance: Cat 5)' },
  { floor: 4, name: 'Floor 4',  boss: 'Thorn',        minCatLevel: 11, keyGear: 'Spirit Sceptre',                notes: 'Thorn is easy. Spirit Sceptre is a great weapon. (Entrance: Cat 9)' },
  { floor: 5, name: 'Floor 5',  boss: 'Livid',        minCatLevel: 16, keyGear: 'Livid Dagger, Shadow Assassin armor', notes: 'Shadow Assassin drops here — major gear milestone. (Entrance: Cat 14)' },
  { floor: 6, name: 'Floor 6',  boss: 'Sadan',        minCatLevel: 21, keyGear: 'Giant Sword, Necron armor parts', notes: 'F6 unlocks Wither armor progression. (Entrance: Cat 19)' },
  { floor: 7, name: 'Floor 7',  boss: 'Necron',       minCatLevel: 26, keyGear: 'Necron armor, Hyperion',         notes: 'Endgame dungeon content. Best gear in the game. (Entrance: Cat 24)' },
];

// MM entrance requirements: MM1=Cat24, MM2=Cat26, MM3=Cat28, MM4=Cat30, MM5=Cat32, MM6=Cat34, MM7=Cat36
const MASTER_FLOORS: FloorInfo[] = [
  { floor: 1, name: 'MM Floor 1', boss: 'Bonzo (MM)',     minCatLevel: 24, keyGear: 'Crimson Essence',               notes: 'Master Mode starts here. Requires F7 clear. (Entrance: Cat 24)' },
  { floor: 2, name: 'MM Floor 2', boss: 'Scarf (MM)',     minCatLevel: 27, keyGear: 'Crimson armor',                 notes: '(Entrance: Cat 26)' },
  { floor: 3, name: 'MM Floor 3', boss: 'Professor (MM)', minCatLevel: 29, keyGear: '',                              notes: '(Entrance: Cat 28)' },
  { floor: 4, name: 'MM Floor 4', boss: 'Thorn (MM)',     minCatLevel: 31, keyGear: '',                              notes: '(Entrance: Cat 30)' },
  { floor: 5, name: 'MM Floor 5', boss: 'Livid (MM)',     minCatLevel: 33, keyGear: 'Warden Helmet',                 notes: '(Entrance: Cat 32)' },
  { floor: 6, name: 'MM Floor 6', boss: 'Sadan (MM)',     minCatLevel: 35, keyGear: 'Plasma',                        notes: '(Entrance: Cat 34)' },
  { floor: 7, name: 'MM Floor 7', boss: 'Necron (MM)',    minCatLevel: 37, keyGear: 'Storm/Goldor/Necron armor',     notes: 'Endgame. Best-in-slot armor. (Entrance: Cat 36)' },
];

const CLASS_NAMES: Record<string, { emoji: string; role: string }> = {
  healer:  { emoji: '💚', role: 'Support — keeps party alive' },
  mage:    { emoji: '🔮', role: 'Magic damage + cleanup' },
  berserk: { emoji: '⚔️', role: 'Melee DPS' },
  archer:  { emoji: '🏹', role: 'Ranged DPS + secrets' },
  tank:    { emoji: '🛡️', role: 'Damage absorption' },
};

function formatMs(ms: number): string {
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

function getCompletions(dungeons: DungeonProgress, floor: number, master = false): number {
  const key = String(floor);
  if (master) return dungeons.masterMode.floorCompletions[key] ?? 0;
  return dungeons.catacombs.floorCompletions[key] ?? 0;
}

function getFastestTime(dungeons: DungeonProgress, floor: number): number | null {
  const t = dungeons.catacombs.fastestTimes[String(floor)];
  return typeof t === 'number' ? t : null;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DungeonsPage({ params, searchParams }: Props) {
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

  const { dungeons } = profile;
  const catLevel = dungeons.catacombs.level;
  const highestFloor = dungeons.catacombs.highestFloor;
  const highestMM = dungeons.masterMode.highestFloor;

  // Next recommended floor
  const nextFloor = FLOORS.find(f => f.floor > highestFloor);
  const nextMM = highestFloor >= 7 ? MASTER_FLOORS.find(f => f.floor > highestMM) : null;

  // Class levels sorted
  const classEntries = Object.entries(dungeons.classes).sort(([, a], [, b]) => b.level - a.level);
  const selectedClass = dungeons.selectedClass;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Dungeon Planner</h1>
        <span className="ml-auto rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-300">
          {profile.profileName}
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Catacombs Level" value={`${catLevel}`} color="text-orange-300" />
        <StatCard label="Highest Floor" value={highestFloor > 0 ? `F${highestFloor}` : 'None'} color="text-white" />
        <StatCard label="Master Mode" value={highestMM > 0 ? `MM${highestMM}` : 'N/A'} color="text-red-300" />
        <StatCard label="Class" value={selectedClass || '—'} color="text-indigo-300" sub="selected" />
      </div>

      {/* Next Step */}
      {(nextFloor || nextMM) && (
        <div className="card p-5 mb-6 border-orange-500/20 bg-orange-500/5">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            🎯 Next Milestone
          </h2>
          {nextMM ? (
            <div>
              <div className="text-white font-medium mb-1">{nextMM.name} — {nextMM.boss}</div>
              <div className="text-sm text-slate-400 mb-2">Recommended Catacombs level: {nextMM.minCatLevel}</div>
              {nextMM.keyGear && <div className="text-sm text-yellow-300">Key loot: {nextMM.keyGear}</div>}
            </div>
          ) : nextFloor ? (
            <div>
              <div className="text-white font-medium mb-1">{nextFloor.name} — {nextFloor.boss}</div>
              <div className="text-sm text-slate-400 mb-2">Recommended Catacombs level: {nextFloor.minCatLevel} (you: {catLevel})</div>
              {nextFloor.notes && <div className="text-sm text-slate-400 mb-1">{nextFloor.notes}</div>}
              {nextFloor.keyGear && <div className="text-sm text-yellow-300">Key loot: {nextFloor.keyGear}</div>}
              {catLevel < nextFloor.minCatLevel && (
                <div className="mt-2 text-sm text-amber-400">
                  ⚠ You need {nextFloor.minCatLevel - catLevel} more Catacombs levels. Farm lower floors for XP.
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Floor Progress */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-4">🏰 Floor Progress</h2>
        <div className="space-y-2">
          {FLOORS.map(floor => {
            const completions = getCompletions(dungeons, floor.floor);
            const fastest = getFastestTime(dungeons, floor.floor);
            const cleared = floor.floor <= highestFloor;
            const isNext = floor.floor === highestFloor + 1;

            return (
              <div
                key={floor.floor}
                className={`rounded-lg border p-3 ${
                  isNext ? 'border-orange-500/30 bg-orange-500/5' :
                  cleared ? 'border-emerald-500/10 bg-emerald-500/3' :
                  'border-white/5 opacity-50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className={`text-sm font-medium w-6 text-center ${cleared ? 'text-emerald-400' : 'text-slate-600'}`}>
                      {cleared ? '✓' : `F${floor.floor}`}
                    </span>
                    <div>
                      <div className="text-sm text-white font-medium">
                        {floor.name} <span className="text-slate-500 font-normal">— {floor.boss}</span>
                      </div>
                      {floor.keyGear && cleared && (
                        <div className="text-xs text-yellow-300/70">{floor.keyGear}</div>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {cleared ? (
                      <>
                        <div className="text-xs text-emerald-400">{completions}× cleared</div>
                        {fastest && <div className="text-xs text-slate-500">{formatMs(fastest)}</div>}
                      </>
                    ) : (
                      <div className="text-xs text-slate-600">Not cleared</div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Master Mode (if relevant) */}
      {highestFloor >= 7 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-white mb-4">💀 Master Mode</h2>
          <div className="space-y-2">
            {MASTER_FLOORS.map(floor => {
              const completions = getCompletions(dungeons, floor.floor, true);
              const cleared = floor.floor <= highestMM;
              const isNext = floor.floor === highestMM + 1;

              return (
                <div
                  key={floor.floor}
                  className={`rounded-lg border p-3 ${
                    isNext ? 'border-red-500/30 bg-red-500/5' :
                    cleared ? 'border-emerald-500/10 bg-emerald-500/3' :
                    'border-white/5 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-sm w-5 ${cleared ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {cleared ? '✓' : '○'}
                      </span>
                      <div>
                        <div className="text-sm text-white font-medium">{floor.name}</div>
                        {floor.keyGear && cleared && <div className="text-xs text-yellow-300/70">{floor.keyGear}</div>}
                      </div>
                    </div>
                    <div className="text-xs text-right">
                      {cleared
                        ? <span className="text-emerald-400">{completions}× cleared</span>
                        : <span className="text-slate-600">Cat {floor.minCatLevel} req.</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fastest Times */}
      {Object.keys(dungeons.catacombs.fastestTimes).length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-white mb-4">⚡ Fastest S+ Times</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {Object.entries(dungeons.catacombs.fastestTimes)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([floor, ms]) => {
                const totalSec = Math.floor((ms as number) / 1000);
                const mins = Math.floor(totalSec / 60);
                const secs = totalSec % 60;
                const label = floor === '0' ? 'Entrance' : `Floor ${floor}`;
                return (
                  <div key={floor} className="rounded-lg border border-white/5 p-3 text-center">
                    <div className="text-xs text-slate-500 mb-1">{label}</div>
                    <div className="text-sm font-mono font-bold text-emerald-300">
                      {mins}:{secs.toString().padStart(2, '0')}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Class Levels */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4">👤 Class Levels</h2>
        {classEntries.length === 0 ? (
          <p className="text-slate-500 text-sm">No class data available.</p>
        ) : (
          <div className="space-y-3">
            {classEntries.map(([cls, data]) => {
              const info = CLASS_NAMES[cls];
              const isSelected = cls === selectedClass;
              return (
                <div key={cls} className={`rounded-lg border p-3 ${isSelected ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/5'}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{info?.emoji ?? '⚔️'}</span>
                      <span className={`text-sm font-medium capitalize ${isSelected ? 'text-indigo-300' : 'text-white'}`}>
                        {cls}
                        {isSelected && <span className="ml-2 text-xs text-indigo-400">(active)</span>}
                      </span>
                    </div>
                    <span className="text-sm font-mono text-white">Lv {data.level}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${isSelected ? 'bg-indigo-500' : 'bg-slate-500'}`}
                      style={{ width: `${Math.min(100, (data.level / 50) * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    {info && <div className="text-xs text-slate-500">{info.role}</div>}
                    <div className="text-xs text-slate-600 ml-auto">{data.xp.toLocaleString()} XP</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
