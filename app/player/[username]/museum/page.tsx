import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles, getSkyBlockMuseum } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';
import ItemIcon from '@/components/ItemIcon';
import { ESSENCE_COSTS } from '@/lib/neu/data';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Museum Tracker` };
}

// ─── Museum Knowledge Base ────────────────────────────────────────────────────
// NOTE: Museum was overhauled in patch 0.20.7.
// NEW system: 30 milestones based on total donated value.
// Each milestone: +1% Bits Multiplier + +2% Bank Interest Rate.
// Museum NO LONGER gives Magical Power.

type MuseumCategory = 'Weapons' | 'Armor' | 'Rarities' | 'Fishing' | 'Other';

interface MuseumItem {
  id: string;
  name: string;
  category: MuseumCategory;
  value: number;
  notes?: string;
}

const NOTABLE_MUSEUM_ITEMS: MuseumItem[] = [
  // ── Weapons ──
  { id: 'HYPERION',              name: 'Hyperion',              category: 'Weapons', value: 180_000_000 },
  { id: 'VALKYRIE',              name: 'Valkyrie',              category: 'Weapons', value: 200_000_000 },
  { id: 'ASTRAEA',               name: 'Astraea',               category: 'Weapons', value: 150_000_000 },
  { id: 'SCYLLA',                name: 'Scylla',                category: 'Weapons', value: 120_000_000 },
  { id: 'RAGNAROK',              name: 'Ragnarök',              category: 'Weapons', value: 100_000_000 },
  { id: 'NECRON_BLADE',          name: "Necron's Blade",        category: 'Weapons', value: 80_000_000 },
  { id: 'ASPECT_OF_THE_DRAGONS', name: 'Aspect of the Dragons', category: 'Weapons', value: 3_000_000 },
  { id: 'LIVID_DAGGER',          name: 'Livid Dagger',          category: 'Weapons', value: 30_000_000 },
  { id: 'SHADOW_FURY',           name: 'Shadow Fury',           category: 'Weapons', value: 50_000_000 },
  { id: 'TERMINATOR',            name: 'Terminator',            category: 'Weapons', value: 200_000_000 },
  { id: 'GIANT_SWORD',           name: "Giant's Sword",         category: 'Weapons', value: 200_000_000 },
  { id: 'MIDAS_SWORD',           name: "Midas' Sword",          category: 'Weapons', value: 50_000_000 },
  { id: 'MIDAS_STAFF',           name: "Midas' Staff",          category: 'Weapons', value: 50_000_000 },
  { id: 'PIGMAN_SWORD',          name: 'Pigman Sword',          category: 'Weapons', value: 5_000_000 },
  { id: 'REAPER_SCYTHE',         name: 'Reaper Scythe',         category: 'Weapons', value: 80_000_000 },
  { id: 'WITHER_CLOAK_SWORD',    name: 'Wither Cloak Sword',    category: 'Weapons', value: 200_000_000 },
  { id: 'VORPAL_KATANA',         name: 'Vorpal Katana',         category: 'Weapons', value: 50_000_000 },
  { id: 'BLOOD_REAPER',          name: 'Blood Reaper',          category: 'Weapons', value: 60_000_000 },
  { id: 'VOIDEDGE_KATANA',       name: 'Voidedge Katana',       category: 'Weapons', value: 50_000_000 },
  // ── Armor sets ──
  { id: 'NECRON_HELMET',         name: "Necron's Armor Set",    category: 'Armor',   value: 300_000_000, notes: 'Full set required' },
  { id: 'GOLDOR_HELMET',         name: "Goldor's Armor Set",    category: 'Armor',   value: 150_000_000, notes: 'Full set required' },
  { id: 'STORM_HELMET',          name: "Storm's Armor Set",     category: 'Armor',   value: 100_000_000, notes: 'Full set required' },
  { id: 'MAXOR_HELMET',          name: "Maxor's Armor Set",     category: 'Armor',   value: 100_000_000, notes: 'Full set required' },
  { id: 'SADAN_HELMET',          name: "Sadan's Helmet",        category: 'Armor',   value: 100_000_000 },
  { id: 'SUPERIOR_DRAGON_HELMET',name: 'Superior Dragon Armor', category: 'Armor',   value: 20_000_000,  notes: 'Full set required' },
  { id: 'CRIMSON_HELMET',        name: 'Crimson Armor Set',     category: 'Armor',   value: 50_000_000,  notes: 'Full set required' },
  { id: 'TERROR_HELMET',         name: 'Terror Armor Set',      category: 'Armor',   value: 200_000_000, notes: 'Full set required' },
  { id: 'FERVOR_HELMET',         name: 'Fervor Armor Set',      category: 'Armor',   value: 200_000_000, notes: 'Full set required' },
  { id: 'MOLTEN_TERROR_HELMET',  name: 'Molten Armor Set',      category: 'Armor',   value: 1_000_000_000, notes: 'Full set required' },
  // ── Rarities ──
  { id: 'COINS_TALISMAN',        name: 'Coins Talisman',        category: 'Rarities', value: 1_000_000 },
  { id: 'AMBER_MATERIAL',        name: 'Amber Material',        category: 'Rarities', value: 5_000_000 },
  { id: 'JADERALD',              name: 'Jaderald',              category: 'Rarities', value: 10_000_000 },
  { id: 'PLASMA',                name: 'Plasma',                category: 'Rarities', value: 8_000_000 },
  // ── Fishing ──
  { id: 'ROD_OF_LEGENDS',        name: 'Rod of Legends',        category: 'Fishing',  value: 20_000_000 },
  { id: 'PHANTOM_ROD',           name: 'Phantom Rod',           category: 'Fishing',  value: 15_000_000 },
  { id: 'HELLFIRE_ROD',          name: 'Hellfire Rod',          category: 'Fishing',  value: 10_000_000 },
  { id: 'AUGER_ROD',             name: 'Auger Rod',             category: 'Fishing',  value: 5_000_000 },
];

// Museum milestone thresholds (post-patch 0.20.7, 30 milestones total, approximate community values)
// Each milestone: +1% Bits Multiplier, +2% Bank Interest Rate
const MILESTONE_THRESHOLDS = [
  0, 2_500_000, 7_500_000, 15_000_000, 25_000_000, 40_000_000,
  60_000_000, 90_000_000, 130_000_000, 180_000_000, 250_000_000,
  350_000_000, 500_000_000, 700_000_000, 1_000_000_000, 1_400_000_000,
  1_900_000_000, 2_500_000_000, 3_300_000_000, 4_300_000_000, 5_500_000_000,
  7_000_000_000, 9_000_000_000, 11_000_000_000, 14_000_000_000, 18_000_000_000,
  23_000_000_000, 30_000_000_000, 40_000_000_000, 55_000_000_000, 75_000_000_000,
];
const MAX_MILESTONES = 30;

function formatValue(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

function milestonesReached(value: number): number {
  let count = 0;
  for (const threshold of MILESTONE_THRESHOLDS) {
    if (value >= threshold) count++;
  }
  // milestone 0 is the "unlocked" state, so subtract 1
  return Math.min(Math.max(count - 1, 0), MAX_MILESTONES);
}

export default async function MuseumPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let error: string | null = null;
  let donatedItems = new Set<string>();
  let specialItems: string[] = [];
  let hasMuseumData = false;
  /** Actual total appraisal value from the museum API (used for milestone calc when available) */
  let apiMuseumValue: number | null = null;

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

      // Museum data is at a separate API endpoint — NOT in the profiles response
      const museumRes = await getSkyBlockMuseum(targetProfile.profile_id).catch(() => null);
      if (museumRes?.success && museumRes.members) {
        hasMuseumData = true;
        const memberMuseum = museumRes.members[uuid];
        donatedItems = new Set(Object.keys(memberMuseum?.items ?? {}));
        specialItems = (memberMuseum?.special ?? [])
          .map(s => s.tag?.ExtraAttributes?.id ?? '')
          .filter(Boolean);
        // Use the API-provided total appraisal value for milestone calculation;
        // it includes ALL donated items, not just the notable ones we know about.
        if (typeof memberMuseum?.value === 'number') {
          apiMuseumValue = memberMuseum.value;
        }
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
          <a href={`/player/${username}`} className="mt-6 inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white">
            ← Back to Profile
          </a>
        </div>
      </div>
    );
  }

  // ── Museum value from donated notable items ────────────────────────────────
  const totalDonated = donatedItems.size + specialItems.length;

  // Estimate museum value from donated notable items (fallback when API value is unavailable).
  // The API value (apiMuseumValue) is preferred because it covers all donations, not just
  // the ~35 notable items we know about.
  let estimatedValue = 0;
  for (const item of NOTABLE_MUSEUM_ITEMS) {
    if (donatedItems.has(item.id)) estimatedValue += item.value;
  }
  const museumValue = apiMuseumValue ?? estimatedValue;

  const milestones = milestonesReached(museumValue);
  const bitsBonus = milestones; // +1% per milestone
  const bankBonus = milestones * 2; // +2% per milestone

  // Next milestone threshold
  const nextMilestoneThreshold = MILESTONE_THRESHOLDS[milestones + 1] ?? null;

  const categories: MuseumCategory[] = ['Weapons', 'Armor', 'Fishing', 'Rarities', 'Other'];
  const seenDonated = new Set<string>();
  const seenMissing = new Set<string>();
  const categorized = categories.map(cat => {
    const catItems = NOTABLE_MUSEUM_ITEMS.filter(i => i.category === cat);
    const donated = catItems.filter(i => {
      if (donatedItems.has(i.id) && !seenDonated.has(i.id)) { seenDonated.add(i.id); return true; }
      return false;
    });
    const missing = catItems.filter(i => {
      if (!donatedItems.has(i.id) && !seenMissing.has(i.id)) { seenMissing.add(i.id); return true; }
      return false;
    });
    return { cat, donated, missing };
  });

  const progressPct = nextMilestoneThreshold
    ? Math.min(100, (museumValue / nextMilestoneThreshold) * 100)
    : 100;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Museum Tracker</h1>
        <span className="ml-auto rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
          {profile.profileName}
        </span>
      </div>

      {/* System note */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4 mb-6 text-sm text-blue-300">
        <span className="font-medium">Museum (post-patch 0.20.7):</span> Donations unlock up to 30 milestones.
        Each milestone grants <span className="text-yellow-300">+1% Bits Multiplier</span> and{' '}
        <span className="text-emerald-300">+2% Bank Interest Rate</span>.
        Museum no longer gives Magical Power.
      </div>

      {!hasMuseumData && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6 text-sm text-amber-300">
          Museum data not available in API response. Showing estimates from known donated items only.
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-300">{formatValue(museumValue)}</div>
          <div className="text-xs text-slate-500 mt-1">{apiMuseumValue !== null ? 'Museum Value' : 'Est. Museum Value'}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalDonated}</div>
          <div className="text-xs text-slate-500 mt-1">Items Donated</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-300">+{bitsBonus}%</div>
          <div className="text-xs text-slate-500 mt-1">Bits Multiplier</div>
          <div className="text-xs text-slate-600">{milestones}/{MAX_MILESTONES} milestones</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-300">+{bankBonus}%</div>
          <div className="text-xs text-slate-500 mt-1">Bank Interest</div>
          <div className="text-xs text-slate-600">{milestones}/{MAX_MILESTONES} milestones</div>
        </div>
      </div>

      {/* Milestone progress */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-3">Museum Milestones</h2>
        <div className="flex gap-1 flex-wrap mb-3">
          {Array.from({ length: MAX_MILESTONES }, (_, i) => (
            <div
              key={i}
              className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                i < milestones
                  ? 'bg-yellow-500 text-black'
                  : 'bg-white/5 text-slate-600'
              }`}
              title={`Milestone ${i + 1}: +${i + 1}% Bits, +${(i + 1) * 2}% Bank Interest`}
            >
              {i + 1}
            </div>
          ))}
        </div>
        {nextMilestoneThreshold && (
          <>
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Milestone {milestones + 1}</span>
              <span>{formatValue(estimatedValue)} / {formatValue(nextMilestoneThreshold)}</span>
            </div>
            <div className="h-2 rounded-full bg-white/5">
              <div
                className="h-full rounded-full bg-yellow-500 transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Need {formatValue(nextMilestoneThreshold - estimatedValue)} more museum value for next milestone
              (→ +{milestones + 1}% Bits, +{(milestones + 1) * 2}% Bank Interest)
            </p>
          </>
        )}
        {!nextMilestoneThreshold && (
          <p className="text-xs text-emerald-400">All 30 milestones reached — max Bits/Bank bonuses!</p>
        )}
      </div>

      {/* Item Categories */}
      {categorized.filter(c => c.donated.length > 0 || c.missing.length > 0).map(({ cat, donated, missing }) => (
        <div key={cat} className="card p-5 mb-4">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            {cat === 'Weapons' ? '⚔' : cat === 'Armor' ? '🛡' : cat === 'Fishing' ? '🎣' : cat === 'Rarities' ? '💎' : '📦'}
            {cat}
            <span className="text-xs font-normal text-slate-500">
              {donated.length} / {donated.length + missing.length} notable items donated
            </span>
          </h2>

          {donated.length > 0 && (
            <div className="mb-3">
              <div className="text-xs text-emerald-400 mb-1 font-medium">Donated</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {donated.map(item => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                    <ItemIcon itemId={item.id} size={20} />
                    <div>
                      <div className="text-xs font-medium text-emerald-300 truncate">{item.name}</div>
                      <div className="text-xs text-slate-500">{formatValue(item.value)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {missing.length > 0 && (
            <div>
              <div className="text-xs text-slate-400 mb-1 font-medium">Missing (notable)</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {missing.map(item => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
                    <ItemIcon itemId={item.id} size={20} />
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-slate-300 truncate">{item.name}</div>
                      <div className="text-xs text-yellow-500">{formatValue(item.value)}</div>
                      {item.notes && <div className="text-xs text-slate-600 truncate">{item.notes}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      <p className="text-xs text-slate-600 text-center mt-2">
        Museum value is estimated from donated notable items. Milestone thresholds are approximate. Actual in-game value from API is authoritative.
      </p>

      {/* Essence Costs for missing items */}
      {(() => {
        const missingWithEssence = categorized
          .flatMap(c => c.missing)
          .filter(item => ESSENCE_COSTS[item.id])
          .map(item => ({ id: item.id, cost: ESSENCE_COSTS[item.id] }))
          .slice(0, 12);
        if (missingWithEssence.length === 0) return null;
        return (
          <div className="card p-5 mt-4">
            <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
              ✨ Essence Upgrade Costs
              <span className="text-xs font-normal text-slate-500">for missing museum items (from NEU-REPO)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {missingWithEssence.map(({ id, cost }) => (
                <div key={id} className="rounded-lg border border-white/5 bg-slate-800/30 px-3 py-2 text-xs">
                  <div className="text-slate-300 font-medium mb-1">{id.replace(/_/g, ' ')}</div>
                  <div className="flex gap-3 text-slate-500">
                    <span>Type: <span className="text-purple-300">{cost.type}</span></span>
                    {([1,2,3,4,5] as const).map(tier => {
                      const val = cost[String(tier)];
                      if (!val || typeof val !== 'number') return null;
                      return <span key={tier}>T{tier}: <span className="text-white">{val}</span></span>;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
