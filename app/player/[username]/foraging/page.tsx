import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { parseInventoryNBT, ParsedItem } from '@/lib/hypixel/nbt';
import { PlayerProfile } from '@/lib/types/player';
import { SKILL_XP_TABLE, xpForLevel } from '@/lib/data/xp-tables';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Foraging Planner` };
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FORAGING_MAX_LEVEL = 54; // Foraging Update Part I raised cap from 50 to 54
const FF_PER_SKILL_LEVEL = 4; // +4 Foraging Fortune per skill level (wiki-confirmed)

// Best foraging pets and their Foraging Fortune per level
const FORAGING_PETS = [
  { type: 'OCELOT',    name: 'Ocelot',     ffPerLevel: 0.3,  maxFF: 30,  note: 'Best foraging pet — +0.3 FF/level' },
  { type: 'RABBIT',    name: 'Rabbit',      ffPerLevel: 0.3,  maxFF: 30,  note: '+0.3 FF/level' },
  { type: 'BEE',       name: 'Bee',         ffPerLevel: 0.2,  maxFF: 20,  note: '+0.2 FF/level' },
  { type: 'BABY_YETI', name: 'Baby Yeti',   ffPerLevel: 0,    maxFF: 0,   note: 'No FF — boosts Speed for faster foraging' },
];

// ─── Fortune Source Calculation ───────────────────────────────────────────────

interface ForagingFortuneSource {
  name: string;
  category: string;
  current: number;
  max: number;
  notes: string;
  needsNBT?: boolean;
  upgradeHint?: string;
}

function calcForagingFortuneSources(profile: PlayerProfile, equipItems: ParsedItem[]): ForagingFortuneSource[] {
  const sources: ForagingFortuneSource[] = [];
  const foragingLevel = profile.skills.foraging;

  // 1. Foraging Skill FF
  sources.push({
    name: 'Foraging Skill',
    category: 'Skill',
    current: foragingLevel * FF_PER_SKILL_LEVEL,
    max: FORAGING_MAX_LEVEL * FF_PER_SKILL_LEVEL,
    notes: `Level ${foragingLevel}/${FORAGING_MAX_LEVEL}`,
    upgradeHint: foragingLevel < FORAGING_MAX_LEVEL
      ? `Level ${foragingLevel} → ${foragingLevel + 1} gives +${FF_PER_SKILL_LEVEL} FF`
      : 'Maxed',
  });

  // 2. Active Pet
  const activePet = profile.pets.find(p => p.active);
  if (activePet) {
    const petConfig = FORAGING_PETS.find(p => p.type === activePet.type);
    if (petConfig && petConfig.ffPerLevel > 0) {
      const petFF = Math.floor(activePet.level * petConfig.ffPerLevel);
      sources.push({
        name: `${petConfig.name} Pet`,
        category: 'Pet',
        current: petFF,
        max: petConfig.maxFF,
        notes: `Lv ${activePet.level} ${activePet.tier} — ${petConfig.note}`,
      });
    } else if (petConfig) {
      sources.push({
        name: `${petConfig.name} Pet`,
        category: 'Pet',
        current: 0,
        max: 0,
        notes: `Lv ${activePet.level} ${activePet.tier} — ${petConfig.note}`,
        upgradeHint: 'Swap to Ocelot pet for Foraging Fortune',
      });
    } else {
      sources.push({
        name: 'Active Pet',
        category: 'Pet',
        current: 0,
        max: 30,
        notes: `${activePet.type} Lv ${activePet.level} — not a foraging pet`,
        upgradeHint: 'Equip an Ocelot pet for Foraging Fortune',
      });
    }
  } else {
    sources.push({
      name: 'Active Pet',
      category: 'Pet',
      current: 0,
      max: 30,
      notes: 'No active pet',
      upgradeHint: 'Equip an Ocelot pet (best foraging pet)',
    });
  }

  // 3. Equipment reforges (NBT-based)
  // Source: NEU reforgestones.json, itemTypes=EQUIPMENT — rarity-scaled FF
  // rooted (BURROWING_SPORES): +6/9/12/15/18/21, blooming (FLOWERING_BOUQUET): +1/2/3/4/5/6
  // squeaky (SQUEAKY_TOY): +2/4/6/8/10/12, bountiful is HOE only (not equipment)
  const FORAGING_EQUIP_REFORGE_FF: Record<string, Record<string, number>> = {
    'rooted':   { COMMON: 6, UNCOMMON: 9, RARE: 12, EPIC: 15, LEGENDARY: 18, MYTHIC: 21 },
    'blooming': { COMMON: 1, UNCOMMON: 2, RARE: 3,  EPIC: 4,  LEGENDARY: 5,  MYTHIC: 6  },
    'squeaky':  { COMMON: 2, UNCOMMON: 4, RARE: 6,  EPIC: 8,  LEGENDARY: 10, MYTHIC: 12 },
  };
  const hasEquipNBT = equipItems.some(i => i.id && i.id !== 'AIR' && i.name);
  let equipFF = 0;
  const equipBreakdown: string[] = [];
  if (hasEquipNBT) {
    for (const item of equipItems) {
      if (!item.id || item.id === 'AIR' || !item.reforge) continue;
      const key = item.reforge.toLowerCase();
      const reforgeTable = FORAGING_EQUIP_REFORGE_FF[key];
      if (reforgeTable) {
        const bonus = reforgeTable[item.rarity] ?? reforgeTable['LEGENDARY'] ?? 0;
        if (bonus > 0) {
          equipFF += bonus;
          equipBreakdown.push(`${item.name || item.id} (${item.reforge}): +${bonus} FF`);
        }
      }
    }
  }
  sources.push({
    name: 'Equipment Reforges',
    category: 'Gear',
    current: equipFF,
    max: 84, // 4 equipment slots × 21 FF (Rooted Mythic)
    notes: hasEquipNBT
      ? (equipBreakdown.length > 0 ? equipBreakdown.join(', ') : 'No foraging equipment reforges detected')
      : 'Requires recent login — equipment data not loaded',
    needsNBT: !hasEquipNBT,
    upgradeHint: equipFF < 72 ? 'Rooted (BURROWING_SPORES) reforge gives up to +18 Foraging Fortune per equipment piece' : undefined,
  });

  return sources;
}

// ─── XP Progress ─────────────────────────────────────────────────────────────

function calcXpProgress(level: number, xp: number): { pct: number; currentLevelXp: number; nextLevelXp: number } {
  if (level >= FORAGING_MAX_LEVEL) return { pct: 100, currentLevelXp: 0, nextLevelXp: 0 };
  const atLevel = xpForLevel(level, SKILL_XP_TABLE);
  const atNext = xpForLevel(level + 1, SKILL_XP_TABLE);
  const span = atNext - atLevel;
  const done = xp - atLevel;
  return {
    pct: span > 0 ? Math.min(100, Math.round((done / span) * 100)) : 0,
    currentLevelXp: Math.max(0, done),
    nextLevelXp: span,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ForagingPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let equipItems: ParsedItem[] = [];
  let error: string | null = null;
  let resolvedName = username;

  try {
    const resolved = await resolvePlayer(username);
    resolvedName = resolved.username;
    const profilesRes = await getSkyBlockProfiles(resolved.uuid);
    if (!profilesRes.success || !profilesRes.profiles?.length) {
      error = 'No SkyBlock profiles found.';
    } else {
      let target = profilesRes.profiles.find(
        p => p.profile_id === profileId || p.cute_name.toLowerCase() === profileId?.toLowerCase()
      );
      if (!target) target = profilesRes.profiles.find(p => p.selected) ?? profilesRes.profiles[0];
      profile = selectBestProfile([target], resolved.uuid, resolvedName);

      // Parse equipment NBT locally for reforge detection (same pattern as farming page)
      const member = target.members[resolved.uuid] ?? {};
      const equipData = member.inventory?.equipment_contents?.data;
      if (equipData) {
        try { equipItems = await parseInventoryNBT(equipData, true); } catch { /* non-fatal */ }
      }
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
          <a href={`/player/${resolvedName}`} className="mt-6 inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white">
            ← Back to Profile
          </a>
        </div>
      </div>
    );
  }

  const foragingLevel = profile.skills.foraging;
  const foragingXP = profile.skills.foraging_xp ?? 0;
  const xpProgress = calcXpProgress(foragingLevel, foragingXP);
  const fortuneSources = calcForagingFortuneSources(profile, equipItems);
  const totalFF = fortuneSources.reduce((sum, s) => sum + s.current, 0);
  const maxFF = fortuneSources.filter(s => !s.needsNBT).reduce((sum, s) => sum + s.max, 0);

  const hasTreeData = profile.foragingTreeTokensSpent > 0
    || Object.keys(profile.foragingTreeNodes).length > 0
    || profile.foragingWhispers > 0
    || profile.foragingDailyTreesCut > 0;

  // Find best foraging pet the player owns
  const ownedForagingPets = FORAGING_PETS.map(petCfg => ({
    ...petCfg,
    owned: profile!.pets.find(p => p.type === petCfg.type),
  })).filter(p => p.owned);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-4">
        <a href={`/player/${resolvedName}`} className="text-slate-400 hover:text-white text-sm">← Profile</a>
        <div>
          <h1 className="text-2xl font-bold text-white">Foraging Planner</h1>
          <p className="text-slate-400 text-sm">{resolvedName} — Foraging Fortune & Skill Tree</p>
        </div>
      </div>

      {/* Skill Level Banner */}
      <div className="card p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-center shrink-0">
            <div className="text-4xl font-bold text-lime-300">{foragingLevel}</div>
            <div className="text-xs text-slate-500 mt-0.5">Foraging Level</div>
            <div className="text-xs text-slate-600">/ {FORAGING_MAX_LEVEL}</div>
          </div>
          <div className="flex-1 w-full">
            {foragingLevel < FORAGING_MAX_LEVEL ? (
              <>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Progress to Level {foragingLevel + 1}</span>
                  <span>{xpProgress.pct}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/5 w-full">
                  <div
                    className="h-full rounded-full bg-lime-500 transition-all"
                    style={{ width: `${xpProgress.pct}%` }}
                  />
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  {xpProgress.currentLevelXp.toLocaleString()} / {xpProgress.nextLevelXp.toLocaleString()} XP
                </div>
              </>
            ) : (
              <div className="text-sm text-lime-300 font-medium">Max Level Reached</div>
            )}
            <div className="mt-2 flex gap-4 text-xs text-slate-500">
              <span>Total XP: <span className="text-white">{foragingXP.toLocaleString()}</span></span>
              <span>Known FF: <span className="text-lime-300 font-medium">+{totalFF}</span></span>
              <span>Max FF: <span className="text-slate-400">+{maxFF}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Foraging Fortune Sources */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-1">Foraging Fortune Sources</h2>
        <p className="text-xs text-slate-500 mb-4">Each point of Foraging Fortune increases wood drops by 1%.</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slate-500 border-b border-white/5">
                <th className="text-left pb-2 font-medium">Source</th>
                <th className="text-left pb-2 font-medium">Category</th>
                <th className="text-right pb-2 font-medium">Current FF</th>
                <th className="text-right pb-2 font-medium">Max FF</th>
                <th className="text-left pb-2 font-medium pl-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fortuneSources.map(source => (
                <tr key={source.name} className={source.needsNBT ? 'opacity-50' : ''}>
                  <td className="py-2.5 text-white font-medium">
                    {source.name}
                    {source.needsNBT && (
                      <span className="ml-2 text-xs text-amber-400/70 font-normal">[NBT]</span>
                    )}
                  </td>
                  <td className="py-2.5 text-slate-500 text-xs">{source.category}</td>
                  <td className={`py-2.5 text-right font-mono font-medium ${source.current > 0 ? 'text-lime-400' : 'text-slate-600'}`}>
                    +{source.current}
                  </td>
                  <td className="py-2.5 text-right font-mono text-slate-500 text-xs">+{source.max}</td>
                  <td className="py-2.5 pl-4 text-slate-400 text-xs">{source.notes}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/10">
                <td colSpan={2} className="pt-3 text-slate-400 text-xs font-medium">Known Total</td>
                <td className="pt-3 text-right font-mono font-bold text-lime-300">+{totalFF}</td>
                <td className="pt-3 text-right font-mono text-slate-400 text-xs">+{maxFF}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        {fortuneSources.some(s => s.upgradeHint) && (
          <div className="mt-4 space-y-1.5">
            <div className="text-xs font-medium text-slate-400 mb-2">Upgrade hints</div>
            {fortuneSources.filter(s => s.upgradeHint).map(s => (
              <div key={s.name} className="text-xs text-slate-500 flex items-start gap-2">
                <span className="text-lime-500 shrink-0">→</span>
                <span><span className="text-slate-300">{s.name}:</span> {s.upgradeHint}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Tree */}
      {hasTreeData && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            🌲 Foraging Skill Tree
            <span className="text-xs font-normal text-slate-500">whispers, tokens, unlocked nodes</span>
          </h2>
          <div className="flex flex-wrap items-center gap-6 mb-4">
            {profile.foragingTreeTokensSpent > 0 && (
              <div>
                <div className="text-2xl font-bold text-emerald-300">{profile.foragingTreeTokensSpent}</div>
                <div className="text-xs text-slate-500">Tokens Spent</div>
              </div>
            )}
            {Object.keys(profile.foragingTreeNodes).length > 0 && (
              <div>
                <div className="text-2xl font-bold text-green-300">{Object.keys(profile.foragingTreeNodes).length}</div>
                <div className="text-xs text-slate-500">Nodes Unlocked</div>
              </div>
            )}
            {profile.foragingWhispers > 0 && (
              <div>
                <div className="text-2xl font-bold text-teal-300">{profile.foragingWhispers.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Whispers Available</div>
              </div>
            )}
            {profile.foragingWhispersSpent > 0 && (
              <div>
                <div className="text-2xl font-bold text-slate-400">{profile.foragingWhispersSpent.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Whispers Spent</div>
              </div>
            )}
            {profile.foragingDailyTreesCut > 0 && (
              <div>
                <div className="text-2xl font-bold text-lime-300">{profile.foragingDailyTreesCut.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Trees Cut Today</div>
              </div>
            )}
          </div>
          {profile.foragingDailyEffect && (
            <div className="mb-3 text-xs rounded border border-lime-500/20 bg-lime-500/5 px-3 py-1.5 text-lime-300 inline-block">
              Daily Effect: {profile.foragingDailyEffect.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
            </div>
          )}
          {Object.keys(profile.foragingTreeNodes).length > 0 && (
            <div className="flex flex-wrap gap-2">
              {Object.entries(profile.foragingTreeNodes).map(([node, level]) => (
                <span key={node} className="rounded border border-emerald-500/20 bg-emerald-500/5 px-2 py-1 text-xs text-emerald-300">
                  {node.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  {typeof level === 'number' && level > 1 ? ` Lv ${level}` : ''}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Best Foraging Pets */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-3">Best Foraging Pets</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FORAGING_PETS.map(pet => {
            const owned = profile!.pets.find(p => p.type === pet.type);
            const isActive = owned?.active;
            return (
              <div
                key={pet.type}
                className={`rounded-lg border p-3 ${
                  isActive
                    ? 'border-lime-500/40 bg-lime-500/5'
                    : owned
                    ? 'border-white/10 bg-slate-800/30'
                    : 'border-white/5 bg-slate-900/20 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{pet.name}</span>
                  {isActive && <span className="text-xs text-lime-400 font-medium">Active</span>}
                  {owned && !isActive && <span className="text-xs text-slate-500">Owned</span>}
                  {!owned && <span className="text-xs text-slate-600">Not owned</span>}
                </div>
                <div className="text-xs text-slate-400">{pet.note}</div>
                {pet.ffPerLevel > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    Max FF: <span className="text-lime-300">+{pet.maxFF}</span> at level 100
                    {owned && (
                      <span className="ml-2">
                        (currently <span className="text-lime-300">+{Math.floor(owned.level * pet.ffPerLevel)}</span>)
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          Foraging Fortune increases the amount of wood you receive when chopping trees. Higher FF = more income per hour.
        </p>
      </div>

      {/* Tips */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-3">Foraging Tips</h2>
        <ul className="space-y-2 text-sm text-slate-400">
          <li className="flex items-start gap-2"><span className="text-lime-500 shrink-0">→</span>Chop trees in the Park or Spruce Wood biome for the fastest Foraging XP.</li>
          <li className="flex items-start gap-2"><span className="text-lime-500 shrink-0">→</span>Use Whispers of the Forest (earned from chopping) to unlock Foraging Skill Tree nodes for bonuses.</li>
          <li className="flex items-start gap-2"><span className="text-lime-500 shrink-0">→</span>Ocelot pet is the best Foraging pet — gives +0.3 FF per level (+30 FF at level 100).</li>
          <li className="flex items-start gap-2"><span className="text-lime-500 shrink-0">→</span>There is a daily cap on trees cut — the Treecapitator or Jungle Axe breaks multiple logs per swing and helps hit the cap faster.</li>
          <li className="flex items-start gap-2"><span className="text-lime-500 shrink-0">→</span>Foraging is primarily used for leveling and Whispers — it is not a top money-making method in 2026.</li>
        </ul>
      </div>

    </div>
  );
}
