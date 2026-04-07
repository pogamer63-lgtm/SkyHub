import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile, ParsedPet } from '@/lib/types/player';
import { computePetLevel, computePetStats, computePetLore, PET_SCORE_REWARDS, PET_MAX_200_TYPES } from '@/lib/neu/data';
import { PetGrid, SerializablePet } from './pet-grid';

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

// Use NEU-authoritative pet level XP curve
function petProgressToNextLevel(pet: ParsedPet): { progress: number; xpToNext: number; maxLevel: number } {
  const maxLevel = PET_MAX_200_TYPES.has(pet.type) ? 200 : 100;
  if (pet.maxed) return { progress: 1, xpToNext: 0, maxLevel };
  const { xpIntoLevel, xpForNextLevel } = computePetLevel(pet.xp, pet.type);
  const needed = xpForNextLevel ?? 1;
  return {
    progress: needed > 0 ? Math.min(1, xpIntoLevel / needed) : 1,
    xpToNext: Math.max(0, needed - xpIntoLevel),
    maxLevel,
  };
}

// Key stats to display from petnums (human-readable labels)
const STAT_LABELS: Record<string, string> = {
  FARMING_FORTUNE: 'Farming Fortune',
  FISHING_FORTUNE: 'Fishing Fortune',
  FORAGING_FORTUNE: 'Foraging Fortune',
  MINING_FORTUNE: 'Mining Fortune',
  MINING_SPEED: 'Mining Speed',
  SEA_CREATURE_CHANCE: 'Sea Creature Chance',
  FEROCITY: 'Ferocity',
  STRENGTH: 'Strength',
  CRIT_DAMAGE: 'Crit Damage',
  CRIT_CHANCE: 'Crit Chance',
  INTELLIGENCE: 'Intelligence',
  HEALTH: 'Health',
  DEFENSE: 'Defense',
  SPEED: 'Speed',
  MAGIC_FIND: 'Magic Find',
  PET_LUCK: 'Pet Luck',
};

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
      { type: 'MOOSHROOM_COW', tier: 'LEGENDARY', reason: 'Squash buff + converts Strength to FF (1 FF per 20 STR). Good if you have high Strength. Coin multiplier bonus.' },
      { type: 'ELEPHANT', tier: 'LEGENDARY', reason: 'Most raw Farming Fortune per level — +1.5 FF/level, +150 FF at Lv 100 (NEU-verified). Best if you want simple FF stacking.' },
      { type: 'HEDGEHOG', tier: 'LEGENDARY', reason: 'BIS for pest control and pest-related Farming Fortune' },
      { type: 'BEE', tier: 'LEGENDARY', reason: '+Farming Fortune, Honey production boost' },
    ],
  },
  {
    activity: 'Mining / HOTM',
    emoji: '⛏',
    pets: [
      { type: 'SCATHA', tier: 'LEGENDARY', reason: 'Current BIS general mining — extra powder + Mining Fortune' },
      { type: 'GLACITE_GOLEM', tier: 'LEGENDARY', reason: 'BIS for Glacite Tunnels specifically' },
      { type: 'MOLE', tier: 'LEGENDARY', reason: '+Mining Fortune, compact blocks' },
      { type: 'BAL', tier: 'EPIC', reason: '+Mining Fortune in Magma Fields' },
    ],
  },
  {
    activity: 'Dungeons',
    emoji: '🏰',
    pets: [
      { type: 'BLACK_CAT', tier: 'LEGENDARY', reason: 'Current BIS — movement speed for S+ rank; essential for fast runs' },
      { type: 'LION', tier: 'LEGENDARY', reason: '+First Strikes crit damage, scales with runs' },
      { type: 'TIGER', tier: 'LEGENDARY', reason: '+Crit Damage, great for all classes' },
      { type: 'SPIRIT', tier: 'EPIC', reason: 'Spirit Wings for Berserker, speed boost' },
    ],
  },
  {
    activity: 'Slayer / Combat',
    emoji: '⚔️',
    pets: [
      { type: 'GOLDEN_DRAGON', tier: 'LEGENDARY', reason: 'Current BIS general combat at Lv200 — top DPS pet' },
      { type: 'WITHER_SKELETON', tier: 'LEGENDARY', reason: 'Best for Wither-type slayer bosses' },
      { type: 'ENDERMAN', tier: 'LEGENDARY', reason: 'Best for Enderman slayer' },
      { type: 'BLAZE', tier: 'LEGENDARY', reason: 'Best for Blaze slayer, +Fire Damage' },
    ],
  },
  {
    activity: 'Fishing',
    emoji: '🎣',
    pets: [
      { type: 'AMMONITE', tier: 'LEGENDARY', reason: 'Current BIS fishing pet — highest Fishing Fortune' },
      { type: 'FLYING_FISH', tier: 'LEGENDARY', reason: '+Fishing Fortune per Fishing level' },
      { type: 'DOLPHIN', tier: 'LEGENDARY', reason: '+Sea Creature Chance, spawn speed' },
      { type: 'SQUID', tier: 'LEGENDARY', reason: 'Good fishing pet, ink drops' },
    ],
  },
  {
    activity: 'Money Making',
    emoji: '💰',
    pets: [
      { type: 'GOLDEN_DRAGON', tier: 'LEGENDARY', reason: '+Coins from kills, scales significantly past Lv 100' },
      { type: 'PIGMAN', tier: 'LEGENDARY', reason: '+Magic Find, +item luck in various areas' },
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

  // Pre-compute serializable pet data for client PetGrid
  const serializablePets: SerializablePet[] = sortedPets.map(pet => {
    const maxLevel = PET_MAX_200_TYPES.has(pet.type) ? 200 : 100;
    const { xpIntoLevel, xpForNextLevel, progressPct } = computePetLevel(pet.xp, pet.type);
    const rawStats = computePetStats(pet.type, pet.tier, pet.level);
    const stats = Object.entries(rawStats)
      .filter(([k]) => k in STAT_LABELS)
      .map(([key, value]) => ({ key, label: STAT_LABELS[key], value }));
    const { name: petName, lore } = computePetLore(
      pet.type, pet.tier, pet.level, pet.xp, pet.maxed, pet.heldItem,
    );
    return {
      type: pet.type, tier: pet.tier, level: pet.level, xp: pet.xp,
      maxed: pet.maxed, active: pet.active, heldItem: pet.heldItem,
      skin: pet.skin, candyUsed: pet.candyUsed, maxLevel,
      xpIntoLevel, xpForNextLevel, progressPct, stats, petName, lore,
    };
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
    const max = PET_MAX_200_TYPES.has(p.type) ? 200 : 100;
    return p.level >= max - 10 && !p.maxed;
  });

  // Check which BIS pets the player owns
  const ownedTypes = new Set(pets.map(p => p.type));

  // Pet score milestones
  const petScore = profile.highestPetScore;
  const petScoreMilestones = Object.entries(PET_SCORE_REWARDS)
    .map(([s, stats]) => ({ score: Number(s), stats, earned: petScore >= Number(s) }))
    .sort((a, b) => a.score - b.score);
  const nextPetMilestone = petScoreMilestones.find(m => !m.earned);

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
        <StatCard label="Active Pet" value={active ? active.type.replace(/_/g, ' ').slice(0, 12) : '—'} color="text-emerald-300" sub={active ? (active.maxed ? `MAXED ${active.tier.slice(0, 3)}` : `Lv ${active.level} ${active.tier.slice(0, 3)}`) : 'none active'} />
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
              <div className="text-sm text-slate-400">
                {active.maxed ? (
                  <span className="text-green-400 font-semibold">MAXED</span>
                ) : `Level ${active.level}`}
              </div>
              {active.heldItem && (
                <div className="text-xs text-slate-500 mt-1">
                  Held: {active.heldItem.replace(/_/g, ' ')}
                </div>
              )}
              {/* Active pet stat bonuses */}
              {(() => {
                const stats = computePetStats(active.type, active.tier, active.level);
                const displayStats = Object.entries(stats).filter(([k]) => k in STAT_LABELS);
                if (displayStats.length === 0) return null;
                return (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {displayStats.map(([stat, val]) => (
                      <span key={stat} className="text-xs text-yellow-300 bg-yellow-500/10 rounded px-1.5 py-0.5">
                        +{Math.round(val * 10) / 10} {STAT_LABELS[stat]}
                      </span>
                    ))}
                  </div>
                );
              })()}
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
                            <span className="text-xs text-slate-500">
                              {ownedPet.maxed ? <span className="text-green-400">MAXED</span> : `Lv ${ownedPet.level}`}
                            </span>
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
          <span className="text-xs font-normal text-slate-500">{pets.length} total · click a pet for details</span>
        </h2>
        {pets.length === 0 ? (
          <p className="text-slate-500 text-sm text-center py-4">No pets found in this profile.</p>
        ) : (
          <PetGrid pets={serializablePets} />
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
      {/* Pet Score Milestones */}
      {petScoreMilestones.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white">🐾 Pet Score Bonuses</h2>
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-300">{petScore}</div>
              <div className="text-xs text-slate-500">Pet Score</div>
            </div>
          </div>
          {nextPetMilestone && (
            <div className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-300">
              Next milestone: <strong>{nextPetMilestone.score}</strong> — {Object.entries(nextPetMilestone.stats).map(([k, v]) => `+${v} ${k.replace(/_/g, ' ')}`).join(', ')}
            </div>
          )}
          <div className="space-y-1">
            {petScoreMilestones.map(m => (
              <div key={m.score} className={`flex items-center gap-3 text-sm rounded px-3 py-1.5 ${m.earned ? 'bg-yellow-500/5' : 'opacity-40'}`}>
                <span className={`w-10 text-xs font-mono shrink-0 ${m.earned ? 'text-yellow-300' : 'text-slate-500'}`}>{m.score}</span>
                <span className="text-slate-300 flex-1 text-xs">
                  {Object.entries(m.stats).map(([k, v]) => `+${v} ${k.replace(/_/g, ' ').toLowerCase()}`).join(', ')}
                </span>
                {m.earned && <span className="text-yellow-400 text-xs shrink-0">✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}
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
