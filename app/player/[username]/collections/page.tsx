import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { getBazaarPrices, getBazaarSellPrice } from '@/lib/api/bazaar';
import { PlayerProfile } from '@/lib/types/player';
import { formatCoins } from '@/lib/utils/format';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Collections & Minions` };
}

// ─── Minion Data ──────────────────────────────────────────────────────────────

// Unique minions needed per slot unlock threshold (wiki-confirmed, 2026-04-01)
// Slots 5-25 from unique minions; +5 from Community Shop = 30 base; max 31 total
// Thresholds: 0→5, 5→6, 15→7, 30→8, 50→9, 75→10, 100→11, 125→12, 150→13,
//   175→14, 200→15, 225→16, 250→17, 275→18, 300→19, 325→20, 350→21, 375→22, 400→23, 450→24, 500→25
const MINION_SLOT_THRESHOLDS = [0, 5, 15, 30, 50, 75, 100, 125, 150, 175, 200, 225, 250, 275, 300, 325, 350, 375, 400, 450, 500];

function getMinionSlots(uniqueMinions: number): number {
  let slots = 5; // start at 5
  for (let i = 0; i < MINION_SLOT_THRESHOLDS.length; i++) {
    if (uniqueMinions >= MINION_SLOT_THRESHOLDS[i]) slots = 5 + i;
  }
  return slots;
}

function getNextSlotThreshold(uniqueMinions: number): number | null {
  for (const t of MINION_SLOT_THRESHOLDS) {
    if (t > uniqueMinions) return t;
  }
  return null;
}

// Minion tier names for display
const MINION_TIERS: Record<number, string> = {
  1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
  6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
  11: 'XI', 12: 'XII',
};

// ─── Top Collections ──────────────────────────────────────────────────────────

// Curated list of notable collections with category and bazaar ID
interface CollectionEntry {
  id: string;
  name: string;
  category: 'farming' | 'mining' | 'combat' | 'fishing' | 'foraging';
  bazaarId?: string;
  milestones: number[]; // key XP milestones
}

const NOTABLE_COLLECTIONS: CollectionEntry[] = [
  // Farming
  { id: 'WHEAT',         name: 'Wheat',         category: 'farming', bazaarId: 'WHEAT',         milestones: [100, 1_000, 10_000, 100_000, 1_000_000] },
  { id: 'CARROT_ITEM',   name: 'Carrot',        category: 'farming', bazaarId: 'CARROT_ITEM',   milestones: [100, 1_000, 10_000, 100_000, 1_000_000] },
  { id: 'POTATO_ITEM',   name: 'Potato',        category: 'farming', bazaarId: 'POTATO_ITEM',   milestones: [100, 1_000, 10_000, 100_000, 1_000_000] },
  { id: 'PUMPKIN',       name: 'Pumpkin',       category: 'farming', bazaarId: 'PUMPKIN',       milestones: [100, 1_000, 10_000, 100_000, 1_000_000] },
  { id: 'MELON',         name: 'Melon',         category: 'farming', bazaarId: 'MELON',         milestones: [250, 2_500, 25_000, 250_000, 2_500_000] },
  { id: 'SUGAR_CANE',    name: 'Sugar Cane',    category: 'farming', bazaarId: 'SUGAR_CANE',    milestones: [100, 2_500, 25_000, 250_000, 1_000_000] },
  { id: 'MUSHROOM_COLLECTION', name: 'Mushroom', category: 'farming', bazaarId: 'BROWN_MUSHROOM', milestones: [50, 500, 5_000, 50_000, 500_000] },
  // Mining
  { id: 'COBBLESTONE',   name: 'Cobblestone',   category: 'mining',  bazaarId: 'COBBLESTONE',   milestones: [50, 500, 5_000, 50_000, 1_000_000] },
  { id: 'COAL',          name: 'Coal',          category: 'mining',  bazaarId: 'COAL',          milestones: [50, 500, 5_000, 50_000, 250_000] },
  { id: 'IRON_INGOT',    name: 'Iron',          category: 'mining',  bazaarId: 'IRON_INGOT',    milestones: [50, 500, 5_000, 50_000, 500_000] },
  { id: 'GOLD_INGOT',    name: 'Gold',          category: 'mining',  bazaarId: 'GOLD_INGOT',    milestones: [50, 500, 5_000, 50_000, 250_000] },
  { id: 'DIAMOND',       name: 'Diamond',       category: 'mining',  bazaarId: 'DIAMOND',       milestones: [50, 500, 5_000, 50_000, 250_000] },
  { id: 'EMERALD',       name: 'Emerald',       category: 'mining',  bazaarId: 'EMERALD',       milestones: [50, 500, 5_000, 50_000, 250_000] },
  { id: 'LAPIS_LAZULI',  name: 'Lapis',         category: 'mining',  bazaarId: 'INK_SACK:4',    milestones: [50, 500, 5_000, 50_000, 250_000] },
  { id: 'REDSTONE',      name: 'Redstone',      category: 'mining',  bazaarId: 'REDSTONE',      milestones: [50, 500, 5_000, 50_000, 250_000] },
  { id: 'QUARTZ',        name: 'Nether Quartz',  category: 'mining', bazaarId: 'QUARTZ',        milestones: [50, 500, 5_000, 50_000, 250_000] },
  { id: 'OBSIDIAN',      name: 'Obsidian',      category: 'mining',  bazaarId: 'OBSIDIAN',      milestones: [50, 500, 5_000, 50_000, 100_000] },
  // Combat
  { id: 'ROTTEN_FLESH',  name: 'Rotten Flesh',  category: 'combat',  bazaarId: 'ROTTEN_FLESH',  milestones: [50, 500, 5_000, 50_000, 500_000] },
  { id: 'BONE',          name: 'Bone',          category: 'combat',  bazaarId: 'BONE',          milestones: [50, 500, 5_000, 50_000, 500_000] },
  { id: 'STRING',        name: 'String',        category: 'combat',  bazaarId: 'STRING',        milestones: [50, 500, 5_000, 50_000, 250_000] },
  { id: 'SPIDER_EYE',    name: 'Spider Eye',    category: 'combat',  bazaarId: 'SPIDER_EYE',    milestones: [50, 500, 5_000, 50_000, 100_000] },
  { id: 'BLAZE_ROD',     name: 'Blaze Rod',     category: 'combat',  bazaarId: 'BLAZE_ROD',     milestones: [50, 500, 5_000, 50_000, 100_000] },
  { id: 'ENDER_PEARL',   name: 'Ender Pearl',   category: 'combat',  bazaarId: 'ENDER_PEARL',   milestones: [50, 500, 5_000, 50_000, 100_000] },
  // Fishing
  { id: 'RAW_FISH',      name: 'Raw Fish',      category: 'fishing', bazaarId: 'RAW_FISH',      milestones: [50, 500, 5_000, 50_000, 500_000] },
  { id: 'INK_SACK',      name: 'Ink Sack',      category: 'fishing', bazaarId: 'INK_SACK',      milestones: [50, 500, 5_000, 50_000, 100_000] },
  // Foraging
  { id: 'OAK_LOG',       name: 'Oak Wood',      category: 'foraging', bazaarId: 'LOG',          milestones: [50, 500, 5_000, 50_000, 500_000] },
  { id: 'BIRCH_LOG',     name: 'Birch Wood',    category: 'foraging', bazaarId: 'LOG:2',        milestones: [50, 500, 5_000, 50_000, 500_000] },
];

const CATEGORY_COLORS: Record<string, string> = {
  farming:  'text-emerald-300',
  mining:   'text-sky-300',
  combat:   'text-red-300',
  fishing:  'text-cyan-300',
  foraging: 'text-lime-300',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CollectionsPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let craftedMinions: string[] = [];
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

      // Get crafted_generators (minions) from raw member data
      const member = target.members[uuid];
      craftedMinions = member?.crafted_generators ?? [];
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

  let bazaarPrices = null;
  try { bazaarPrices = await getBazaarPrices(); } catch { /* non-fatal */ }

  // ── Parse minion data ──
  // craftedMinions: ["COBBLESTONE_1", "COBBLESTONE_2", "WHEAT_5", ...]
  const minionMap: Record<string, number> = {};
  for (const gen of craftedMinions) {
    const lastUnderscore = gen.lastIndexOf('_');
    const minionId = gen.slice(0, lastUnderscore);
    const tier = parseInt(gen.slice(lastUnderscore + 1), 10);
    if (!minionMap[minionId] || minionMap[minionId] < tier) {
      minionMap[minionId] = tier;
    }
  }

  const uniqueMinions = Object.keys(minionMap).length;
  const minionSlots = getMinionSlots(uniqueMinions);
  const nextThreshold = getNextSlotThreshold(uniqueMinions);
  const totalTiers = Object.values(minionMap).reduce((s, t) => s + t, 0);

  // Sort minions by name
  const minionEntries = Object.entries(minionMap)
    .map(([id, tier]) => ({ id, name: id.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' '), tier }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // ── Collections analysis ──
  const collections = profile.collections;
  const enrichedCollections = NOTABLE_COLLECTIONS.map(col => {
    const count = collections[col.id] ?? 0;
    const bazaarPrice = col.bazaarId && bazaarPrices ? getBazaarSellPrice(bazaarPrices, col.bazaarId) : null;
    const nextMilestone = col.milestones.find(m => m > count);
    const milestoneIdx = nextMilestone ? col.milestones.indexOf(nextMilestone) : col.milestones.length;
    const progress = nextMilestone
      ? (count - (col.milestones[milestoneIdx - 1] ?? 0)) / (nextMilestone - (col.milestones[milestoneIdx - 1] ?? 0))
      : 1;
    return { ...col, count, bazaarPrice, nextMilestone, milestoneIdx, progress: Math.min(1, Math.max(0, progress)) };
  });

  // Group by category
  const byCategory = enrichedCollections.reduce((acc, col) => {
    if (!acc[col.category]) acc[col.category] = [];
    acc[col.category].push(col);
    return acc;
  }, {} as Record<string, typeof enrichedCollections>);

  // Near milestone (within 20% of next)
  const nearMilestone = enrichedCollections
    .filter(c => c.nextMilestone && c.progress >= 0.8)
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Collections & Minions</h1>
        <span className="ml-auto rounded-full border border-teal-500/30 bg-teal-500/10 px-3 py-1 text-xs text-teal-300">
          {profile.profileName}
        </span>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Minion Slots" value={`${minionSlots}`} color="text-teal-300" sub={nextThreshold ? `${uniqueMinions}/${nextThreshold} for next` : 'Max reached'} />
        <StatCard label="Unique Minions" value={`${uniqueMinions}`} color="text-white" />
        <StatCard label="Total Tiers" value={`${totalTiers}`} color="text-sky-300" sub="all minions combined" />
        <StatCard label="Collections" value={`${Object.keys(collections).length}`} color="text-emerald-300" sub="tracked items" />
      </div>

      {/* Minion Slot Progress */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          🤖 Minion Slots
          <span className="text-xs font-normal text-slate-500">unique crafted minions unlock more slots</span>
        </h2>
        <div className="space-y-2 mb-4">
          {MINION_SLOT_THRESHOLDS.map((threshold, i) => {
            const slots = 5 + i;
            const reached = uniqueMinions >= threshold;
            return (
              <div key={threshold} className={`flex items-center gap-3 text-sm ${reached ? 'opacity-60' : ''}`}>
                <span className={`w-6 text-right text-xs font-mono ${reached ? 'text-teal-400' : 'text-slate-500'}`}>
                  {reached ? '✓' : slots}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${reached ? 'bg-teal-500' : 'bg-slate-600'}`}
                    style={{ width: reached ? '100%' : `${Math.min(100, (uniqueMinions / threshold) * 100)}%` }}
                  />
                </div>
                <span className={`text-xs w-24 text-right ${reached ? 'text-slate-600' : 'text-slate-400'}`}>
                  {reached ? `${slots} slots` : `${uniqueMinions}/${threshold}`}
                </span>
              </div>
            );
          })}
        </div>
        {nextThreshold && (
          <p className="text-sm text-amber-300">
            🎯 Craft <strong>{nextThreshold - uniqueMinions}</strong> more unique minion type{nextThreshold - uniqueMinions !== 1 ? 's' : ''} to unlock slot #{minionSlots + 1}
          </p>
        )}
      </div>

      {/* Crafted Minions Grid */}
      {minionEntries.length > 0 ? (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            📋 Crafted Minions
            <span className="text-xs font-normal text-slate-500">{minionEntries.length} types · showing highest tier per type</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {minionEntries.map(m => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-800/40 border border-white/5 px-3 py-2">
                <span className="text-sm text-slate-300 truncate">{m.name}</span>
                <span className={`ml-2 text-xs font-mono font-bold shrink-0 ${
                  m.tier >= 11 ? 'text-yellow-300' :
                  m.tier >= 8  ? 'text-purple-300' :
                  m.tier >= 5  ? 'text-blue-300'   :
                  'text-slate-400'
                }`}>
                  {MINION_TIERS[m.tier] ?? `T${m.tier}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card p-5 border border-amber-500/20 bg-amber-500/5">
          <p className="text-amber-300 text-sm">
            ⚠ No minion data available. The Hypixel API may not include crafted generators for this profile, or no minions have been crafted.
          </p>
        </div>
      )}

      {/* Near-milestone collections */}
      {nearMilestone.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            🎯 Near Milestone
            <span className="text-xs font-normal text-slate-500">within 20% of next unlock</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nearMilestone.map(col => (
              <div key={col.id} className="rounded-lg bg-slate-800/40 border border-white/5 p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${CATEGORY_COLORS[col.category]}`}>{col.name}</span>
                  <span className="text-xs text-slate-500 capitalize">{col.category}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>{col.count.toLocaleString()} / {col.nextMilestone!.toLocaleString()}</span>
                  <span className="text-emerald-400">{(col.progress * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${col.progress * 100}%` }} />
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Need {(col.nextMilestone! - col.count).toLocaleString()} more
                  {col.bazaarPrice ? ` · ~${formatCoins((col.nextMilestone! - col.count) * col.bazaarPrice)} to buy` : ''}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Collections by category */}
      {(['farming', 'mining', 'combat', 'fishing', 'foraging'] as const).map(cat => {
        const cols = byCategory[cat];
        if (!cols?.length) return null;
        return (
          <div key={cat} className="card p-5">
            <h2 className={`font-semibold mb-4 capitalize flex items-center gap-2 ${CATEGORY_COLORS[cat]}`}>
              {cat === 'farming' ? '🌾' : cat === 'mining' ? '⛏' : cat === 'combat' ? '⚔️' : cat === 'fishing' ? '🎣' : '🌲'} {cat} Collections
            </h2>
            <div className="space-y-2.5">
              {cols.map(col => (
                <div key={col.id}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="text-slate-300">{col.name}</span>
                    <span className="text-slate-500">
                      {col.count.toLocaleString()}
                      {col.nextMilestone && ` / ${col.nextMilestone.toLocaleString()}`}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-white/5">
                    <div
                      className={`h-full rounded-full ${col.milestoneIdx >= col.milestones.length ? 'bg-yellow-500' : 'bg-indigo-500'}`}
                      style={{ width: `${col.progress * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
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
