import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile, ParsedPet } from '@/lib/types/player';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Pets Planner` };
}

// ─── Pet Data ─────────────────────────────────────────────────────────────────

const TIER_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];

const TIER_COLOR: Record<string, string> = {
  COMMON:    'text-slate-300 border-slate-500/30 bg-slate-500/5',
  UNCOMMON:  'text-green-300 border-green-500/30 bg-green-500/5',
  RARE:      'text-blue-300 border-blue-500/30 bg-blue-500/5',
  EPIC:      'text-purple-300 border-purple-500/30 bg-purple-500/5',
  LEGENDARY: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
  MYTHIC:    'text-pink-300 border-pink-500/30 bg-pink-500/5',
};

// XP required per level bracket (approximate, from SkyBlock wiki)
// Levels 1-100: use common_pet_xp table; L200 pets have extended table
const PET_LEVEL_XP: number[] = [
  0, 100, 210, 440, 700, 1000, 1430, 2100, 3000, 4350, 6300,
  9000, 13000, 18000, 24000, 32000, 43000, 57000, 75000, 100000,
  133333, 177777, 236852, 315802, 421069, 561425, 748566, 997988, 1330650, 1774200,
  2365600, 3154133, 4205510, 5607346, 7476461, 9968614, 13291485, 17721980, 23629306, 31505741,
  42007655, 56010206, 74680274, 99573698, 132764930, 177019906, 236026541, 314702054, 419602738, 559470317,
  745960422, 994613896, 1326151861, 1768202481, 2357603307, 3143471076, 4191294767, 5588393022, 7451190696, 9934920928,
  // L60-100 (simplified)
  13246561237, 17662081649, 23549442198, 31399256264, 41865675018,
  55820900024, 74427866698, 99237155597, 132316207462, 176421609949,
  235228813265, 313638417686, 418184556914, 557579409218, 743439212290,
  990585616386, 1320780821848, 1761041095797, 2348054794395, 3130739725860,
  4174319634480, 5565759512640, 7420346016853, 9893794689137, 13191726252182,
  17588968336242, 23451957781656, 31269277042207, 41692369389609, 55589825852812,
  74119767803749, 98826357071666, 131768476095554, 175691301460738, 234255068614317,
  312340091485756, 416453455314341, 555271273752454, 740361698336604, 987148931115472,
];

function xpForLevel(level: number): number {
  return PET_LEVEL_XP[level - 1] ?? PET_LEVEL_XP[PET_LEVEL_XP.length - 1];
}

function petProgressToNextLevel(pet: ParsedPet): { progress: number; xpToNext: number; maxLevel: number } {
  const maxLevel = pet.tier === 'LEGENDARY' || pet.tier === 'MYTHIC' ? 200 : 100;
  if (pet.level >= maxLevel) return { progress: 1, xpToNext: 0, maxLevel };
  const currentLevelXP = xpForLevel(pet.level);
  const nextLevelXP = xpForLevel(pet.level + 1);
  const xpThisLevel = pet.xp - currentLevelXP;
  const xpNeeded = nextLevelXP - currentLevelXP;
  return {
    progress: xpNeeded > 0 ? Math.min(1, xpThisLevel / xpNeeded) : 1,
    xpToNext: Math.max(0, xpNeeded - xpThisLevel),
    maxLevel,
  };
}

function formatXP(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

// Best-in-slot pets per activity
const BIS_PETS: Array<{
  activity: string;
  emoji: string;
  pets: Array<{ type: string; tier: string; reason: string }>;
}> = [
  {
    activity: 'Farming',
    emoji: '🌾',
    pets: [
      { type: 'ELEPHANT', tier: 'LEGENDARY', reason: '+Farming Fortune per farming level' },
      { type: 'BEE', tier: 'LEGENDARY', reason: '+Farming Fortune, Honey production boost' },
      { type: 'RABBIT', tier: 'LEGENDARY', reason: '+Speed, +Farming Fortune (carrot specialist)' },
      { type: 'SLUG', tier: 'LEGENDARY', reason: '+Farming Fortune, good for most crops' },
    ],
  },
  {
    activity: 'Mining / HOTM',
    emoji: '⛏',
    pets: [
      { type: 'SCATHA', tier: 'RARE', reason: 'Best early mining pet (rare drop), extra powder' },
      { type: 'MOLE', tier: 'LEGENDARY', reason: '+Mining Fortune, compact blocks' },
      { type: 'BAL', tier: 'EPIC', reason: '+Mining Fortune in Magma Fields' },
      { type: 'ROCK', tier: 'LEGENDARY', reason: 'Slow but +Mining Fortune, endgame' },
    ],
  },
  {
    activity: 'Dungeons',
    emoji: '🏰',
    pets: [
      { type: 'LION', tier: 'LEGENDARY', reason: '+First Strikes crit damage, scales with runs' },
      { type: 'TIGER', tier: 'LEGENDARY', reason: '+Crit Damage, great for all classes' },
      { type: 'JELLY_FISH', tier: 'LEGENDARY', reason: '+HP, healing efficiency for Healer' },
      { type: 'SPIRIT', tier: 'EPIC', reason: 'Spirit Wings for Berserk, speed boost' },
    ],
  },
  {
    activity: 'Slayer / Combat',
    emoji: '⚔️',
    pets: [
      { type: 'WITHER_SKELETON', tier: 'LEGENDARY', reason: 'Best for most slayer (Wither mob damage)' },
      { type: 'ENDERMAN', tier: 'LEGENDARY', reason: 'Best for Enderman slayer' },
      { type: 'BLAZE', tier: 'LEGENDARY', reason: 'Best for Blaze slayer, +Fire Damage' },
      { type: 'SPIDER', tier: 'LEGENDARY', reason: 'Best for Spider slayer' },
    ],
  },
  {
    activity: 'Fishing',
    emoji: '🎣',
    pets: [
      { type: 'FLYING_FISH', tier: 'LEGENDARY', reason: '+Fishing Fortune per fishing level' },
      { type: 'DOLPHIN', tier: 'LEGENDARY', reason: '+Sea Creature Chance, spawn speed' },
      { type: 'SQUID', tier: 'LEGENDARY', reason: 'Good fishing pet, ink drops' },
    ],
  },
  {
    activity: 'Money Making',
    emoji: '💰',
    pets: [
      { type: 'PIGMAN', tier: 'LEGENDARY', reason: '+Magic Find, +item luck in various areas' },
      { type: 'GOLDEN_DRAGON', tier: 'LEGENDARY', reason: '+Coins from kills, scales past Lv 100' },
      { type: 'FAIRY', tier: 'LEGENDARY', reason: '+Magic Find, general-purpose luck' },
    ],
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function PetsPage({ params, searchParams }: Props) {
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

  const pets = profile.pets;
  const active = pets.find(p => p.active);

  // Sort pets: tier desc, then level desc
  const sortedPets = [...pets].sort((a, b) => {
    const tierDiff = TIER_ORDER.indexOf(b.tier) - TIER_ORDER.indexOf(a.tier);
    return tierDiff !== 0 ? tierDiff : b.level - a.level;
  });

  // Count by tier
  const byTier = TIER_ORDER.reduce((acc, t) => {
    acc[t] = pets.filter(p => p.tier === t).length;
    return acc;
  }, {} as Record<string, number>);

  const legendaryCount = byTier['LEGENDARY'] ?? 0;
  const mythicCount = byTier['MYTHIC'] ?? 0;

  // Pets close to maxing (within 10 levels of max)
  const almostMaxed = sortedPets.filter(p => {
    const max = p.tier === 'LEGENDARY' || p.tier === 'MYTHIC' ? 200 : 100;
    return p.level >= max - 10 && p.level < max;
  });

  // Check which BIS pets the player owns
  const ownedTypes = new Set(pets.map(p => p.type));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Pets Planner</h1>
        <span className="ml-auto rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs text-pink-300">
          {profile.profileName}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Pets" value={`${pets.length}`} color="text-white" />
        <StatCard label="Legendary" value={`${legendaryCount}`} color="text-yellow-300" sub={mythicCount > 0 ? `+${mythicCount} Mythic` : undefined} />
        <StatCard label="Active Pet" value={active ? active.type.replace(/_/g, ' ').slice(0, 12) : '—'} color="text-emerald-300" sub={active ? `Lv ${active.level} ${active.tier.slice(0, 3)}` : 'none active'} />
        <StatCard label="Near Max" value={`${almostMaxed.length}`} color="text-amber-300" sub="within 10 levels" />
      </div>

      {/* Active Pet Highlight */}
      {active && (
        <div className="card p-5 border border-yellow-500/20 bg-yellow-500/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">★</span>
                <h2 className="font-semibold text-white">Active Pet</h2>
                <span className={`rounded-full border px-2 py-0.5 text-xs ${TIER_COLOR[active.tier] ?? 'text-slate-400'}`}>
                  {active.tier}
                </span>
              </div>
              <div className="text-lg text-yellow-300 font-bold mb-1">
                {active.type.replace(/_/g, ' ')}
              </div>
              <div className="text-sm text-slate-400">Level {active.level}</div>
              {active.heldItem && (
                <div className="text-xs text-slate-500 mt-1">
                  Held: {active.heldItem.replace(/_/g, ' ')}
                </div>
              )}
            </div>
            <div className="text-right">
              {(() => {
                const { progress, xpToNext, maxLevel } = petProgressToNextLevel(active);
                return (
                  <div>
                    <div className="text-xs text-slate-500 mb-1">
                      {active.level >= maxLevel ? 'MAX LEVEL' : `${(progress * 100).toFixed(1)}% to Lv ${active.level + 1}`}
                    </div>
                    <div className="w-32 h-2 rounded-full bg-white/5 mb-1">
                      <div className="h-full rounded-full bg-yellow-500" style={{ width: `${progress * 100}%` }} />
                    </div>
                    {xpToNext > 0 && (
                      <div className="text-xs text-slate-600">{formatXP(xpToNext)} XP needed</div>
                    )}
                    <div className="text-xs text-slate-600 mt-1">Max: {maxLevel}</div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Near-maxed pets */}
      {almostMaxed.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            ⚡ Almost Maxed
            <span className="text-xs font-normal text-slate-500">within 10 levels of cap</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {almostMaxed.map((pet, i) => {
              const { progress, xpToNext, maxLevel } = petProgressToNextLevel(pet);
              return (
                <div key={i} className="rounded-lg bg-slate-800/40 border border-white/5 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-white">{pet.type.replace(/_/g, ' ')}</span>
                    <span className={`text-xs rounded-full border px-1.5 py-0.5 ${TIER_COLOR[pet.tier] ?? 'text-slate-400'}`}>
                      {pet.tier.slice(0, 3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Lv {pet.level} / {maxLevel}</span>
                    <span className="text-amber-400">{formatXP(xpToNext)} XP to next</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5">
                    <div className="h-full rounded-full bg-amber-500" style={{ width: `${progress * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* BIS Pets by Activity */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4">🏆 Best-In-Slot Pets</h2>
        <div className="space-y-4">
          {BIS_PETS.map(entry => (
            <div key={entry.activity}>
              <div className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                <span>{entry.emoji}</span> {entry.activity}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {entry.pets.map(bis => {
                  const owned = ownedTypes.has(bis.type);
                  const ownedPet = owned ? pets.find(p => p.type === bis.type) : null;
                  return (
                    <div
                      key={bis.type}
                      className={`rounded-lg border p-2.5 flex items-start gap-2 ${
                        owned ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 bg-slate-800/30'
                      }`}
                    >
                      <span className={`text-xs mt-0.5 shrink-0 ${owned ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {owned ? '✓' : '○'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${owned ? 'text-white' : 'text-slate-400'}`}>
                            {bis.type.replace(/_/g, ' ')}
                          </span>
                          <span className={`text-xs rounded-full border px-1.5 py-0.5 ${TIER_COLOR[bis.tier] ?? 'text-slate-400'}`}>
                            {bis.tier.slice(0, 3)}
                          </span>
                          {ownedPet && (
                            <span className="text-xs text-slate-500">Lv {ownedPet.level}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{bis.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Pets */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          🐾 All Pets
          <span className="text-xs font-normal text-slate-500">{pets.length} total · sorted by tier/level</span>
        </h2>
        {pets.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No pets found in this profile.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sortedPets.map((pet, i) => {
              const { progress, xpToNext, maxLevel } = petProgressToNextLevel(pet);
              const maxed = pet.level >= maxLevel;
              return (
                <div key={i} className={`rounded-lg border p-3 ${pet.active ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5 bg-slate-800/30'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {pet.active && <span className="text-yellow-400 text-xs">★</span>}
                      <span className="text-sm font-medium text-white">{pet.type.replace(/_/g, ' ')}</span>
                    </div>
                    <span className={`text-xs rounded-full border px-1.5 py-0.5 ${TIER_COLOR[pet.tier] ?? 'text-slate-400'}`}>
                      {pet.tier.slice(0, 3)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Lv {pet.level}{maxed ? ' (MAX)' : `/${maxLevel}`}</span>
                    {!maxed && <span className="text-slate-600">{formatXP(xpToNext)} to next</span>}
                  </div>
                  {!maxed && (
                    <div className="h-1 rounded-full bg-white/5">
                      <div
                        className={`h-full rounded-full ${
                          pet.tier === 'LEGENDARY' ? 'bg-yellow-500' :
                          pet.tier === 'MYTHIC' ? 'bg-pink-500' :
                          pet.tier === 'EPIC' ? 'bg-purple-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  )}
                  {pet.heldItem && (
                    <div className="text-xs text-slate-600 mt-1">🎒 {pet.heldItem.replace(/_/g, ' ')}</div>
                  )}
                  {pet.candyUsed > 0 && (
                    <div className="text-xs text-slate-600">🍬 {pet.candyUsed} candy</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Tier breakdown */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="text-xs text-slate-500 mb-2">Tier Breakdown</div>
          <div className="flex flex-wrap gap-2">
            {TIER_ORDER.slice().reverse().map(tier => {
              const count = byTier[tier] ?? 0;
              if (count === 0) return null;
              return (
                <span key={tier} className={`rounded-full border px-2 py-0.5 text-xs ${TIER_COLOR[tier]}`}>
                  {count}× {tier.slice(0, 3)}
                </span>
              );
            })}
          </div>
        </div>
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
