import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';
import { SkyBlockProfile } from '@/lib/types/hypixel';
import ItemIcon from '@/components/ItemIcon';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Museum Tracker` };
}

// ─── Museum Knowledge Base ────────────────────────────────────────────────────

type MuseumCategory = 'Weapons' | 'Armor' | 'Rarities' | 'Fishing' | 'Other';

interface MuseumItem {
  id: string;               // SkyBlock item ID
  name: string;
  category: MuseumCategory;
  value: number;            // Museum appraisal value (coins)
  notes?: string;
}

// Notable items that can be donated to the museum
const NOTABLE_MUSEUM_ITEMS: MuseumItem[] = [
  // ── Weapons ──
  { id: 'HYPERION',              name: 'Hyperion',              category: 'Weapons', value: 180_000_000 },
  { id: 'VALKYRIE',              name: 'Valkyrie',              category: 'Weapons', value: 200_000_000 },
  { id: 'ASTRAEA',               name: 'Astraea',               category: 'Weapons', value: 150_000_000 },
  { id: 'SCYLLA',                name: 'Scylla',                category: 'Weapons', value: 120_000_000 },
  { id: 'RAGNAROK',              name: 'Ragnarök',              category: 'Weapons', value: 100_000_000 },
  { id: 'NECRON_BLADE',          name: 'Necron\'s Blade',       category: 'Weapons', value: 80_000_000 },
  { id: 'ASPECT_OF_THE_DRAGONS', name: 'Aspect of the Dragons', category: 'Weapons', value: 3_000_000 },
  { id: 'LIVID_DAGGER',          name: 'Livid Dagger',          category: 'Weapons', value: 30_000_000 },
  { id: 'SHADOW_FURY',           name: 'Shadow Fury',           category: 'Weapons', value: 50_000_000 },
  { id: 'TERMINATOR',            name: 'Terminator',            category: 'Weapons', value: 200_000_000 },
  { id: 'GIANT_SWORD',           name: 'Giant\'s Sword',        category: 'Weapons', value: 200_000_000 },
  { id: 'MIDAS_SWORD',           name: 'Midas\' Sword',         category: 'Weapons', value: 50_000_000 },
  { id: 'MIDAS_STAFF',           name: 'Midas\' Staff',         category: 'Weapons', value: 50_000_000 },
  { id: 'PIGMAN_SWORD',          name: 'Pigman Sword',          category: 'Weapons', value: 5_000_000 },
  { id: 'REAPER_SCYTHE',         name: 'Reaper Scythe',         category: 'Weapons', value: 80_000_000 },
  { id: 'WITHER_CLOAK_SWORD',    name: 'Wither Cloak Sword',    category: 'Weapons', value: 200_000_000 },
  { id: 'VORPAL_KATANA',         name: 'Vorpal Katana',         category: 'Weapons', value: 50_000_000 },
  { id: 'BLOOD_REAPER',          name: 'Blood Reaper',          category: 'Weapons', value: 60_000_000 },
  { id: 'VOIDEDGE_KATANA',       name: 'Voidedge Katana',       category: 'Weapons', value: 50_000_000 },
  // ── Armor sets ──
  { id: 'NECRON_HELMET',         name: 'Necron\'s Armor Set',   category: 'Armor',   value: 300_000_000, notes: 'Full set required' },
  { id: 'GOLDOR_HELMET',         name: 'Goldor\'s Armor Set',   category: 'Armor',   value: 150_000_000, notes: 'Full set required' },
  { id: 'STORM_HELMET',          name: 'Storm\'s Armor Set',    category: 'Armor',   value: 100_000_000, notes: 'Full set required' },
  { id: 'MAXOR_HELMET',          name: 'Maxor\'s Armor Set',    category: 'Armor',   value: 100_000_000, notes: 'Full set required' },
  { id: 'SADAN_HELMET',          name: 'Sadan\'s Helmet',       category: 'Armor',   value: 100_000_000 },
  { id: 'SUPERIOR_DRAGON_HELMET',name: 'Superior Dragon Armor', category: 'Armor',   value: 20_000_000,  notes: 'Full set required' },
  { id: 'CRIMSON_HELMET',        name: 'Crimson Armor Set',     category: 'Armor',   value: 50_000_000,  notes: 'Full set required' },
  { id: 'TERROR_HELMET',         name: 'Terror Armor Set',      category: 'Armor',   value: 200_000_000, notes: 'Full set required' },
  { id: 'FERVOR_HELMET',         name: 'Fervor Armor Set',      category: 'Armor',   value: 200_000_000, notes: 'Full set required' },
  { id: 'MOLTEN_HELMET',         name: 'Molten Armor Set',      category: 'Armor',   value: 1_000_000_000, notes: 'Full set required' },
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

// Museum value reward tiers (SkyBlock wiki)
const VALUE_TIERS = [
  { value: 0,               label: 'Starter',      reward: 'Museum unlocked' },
  { value: 2_500_000,       label: 'Apprentice',   reward: '+1 Magical Power' },
  { value: 7_500_000,       label: 'Journeyman',   reward: '+1 Magical Power' },
  { value: 20_000_000,      label: 'Artisan',      reward: '+1 Magical Power' },
  { value: 50_000_000,      label: 'Expert',       reward: '+1 Magical Power' },
  { value: 100_000_000,     label: 'Master',       reward: '+2 Magical Power' },
  { value: 250_000_000,     label: 'Grandmaster',  reward: '+2 Magical Power' },
  { value: 500_000_000,     label: 'Champion',     reward: '+2 Magical Power' },
  { value: 1_000_000_000,   label: 'Legend',       reward: '+3 Magical Power' },
  { value: 2_500_000_000,   label: 'Mythic',       reward: '+3 Magical Power' },
  { value: 5_000_000_000,   label: 'Divine',       reward: '+4 Magical Power' },
  { value: 10_000_000_000,  label: 'Transcendent', reward: '+4 Magical Power' },
];

function formatValue(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000)     return `${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000)         return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

function totalMPFromTiers(value: number): number {
  return VALUE_TIERS.reduce((sum, tier, i) => {
    if (value < tier.value) return sum;
    const mpMatch = tier.reward.match(/\+(\d+) Magical Power/);
    return sum + (mpMatch ? parseInt(mpMatch[1]) : 0);
  }, 0);
}

export default async function MuseumPage({ params, searchParams }: Props) {
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

  // ── Parse museum data ──────────────────────────────────────────────────────
  const museumData = rawProfile.museum;
  const memberMuseum = museumData?.members?.[profile.uuid ?? ''];
  const donatedItems: Set<string> = new Set(Object.keys(memberMuseum?.items ?? {}));
  const specialItems: string[] = (memberMuseum?.special ?? []).map((s: unknown) => {
    if (typeof s === 'object' && s !== null && 'tag' in s) {
      const tag = (s as { tag?: { ExtraAttributes?: { id?: string } } }).tag;
      return tag?.ExtraAttributes?.id ?? '';
    }
    return '';
  }).filter(Boolean);

  // Total donated count (items + special armor sets)
  const totalDonated = donatedItems.size + specialItems.length;

  // Estimate museum value from donated notable items
  let estimatedValue = 0;
  for (const item of NOTABLE_MUSEUM_ITEMS) {
    if (donatedItems.has(item.id)) estimatedValue += item.value;
  }

  const hasMuseumData = museumData !== undefined;
  const mpFromMuseum = totalMPFromTiers(estimatedValue);

  // Categorize notable items by donated / missing — deduplicate by ID
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

  // Next reward tier
  const currentTierIdx = VALUE_TIERS.findIndex(t => estimatedValue < t.value) - 1;
  const nextTier = VALUE_TIERS[currentTierIdx + 1] ?? null;

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

      {!hasMuseumData && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6 text-sm text-amber-300">
          ⚠ Museum data not available in API response. This profile may not have a museum, or the API didn't return museum data.
          Showing estimated data based on known items only.
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-yellow-300">{formatValue(estimatedValue)}</div>
          <div className="text-xs text-slate-500 mt-1">Museum Value</div>
          <div className="text-xs text-slate-600">estimated</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-white">{totalDonated}</div>
          <div className="text-xs text-slate-500 mt-1">Items Donated</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-purple-300">+{mpFromMuseum}</div>
          <div className="text-xs text-slate-500 mt-1">Magical Power</div>
          <div className="text-xs text-slate-600">from museum</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-bold text-emerald-300">{VALUE_TIERS[currentTierIdx < 0 ? 0 : currentTierIdx]?.label ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-1">Current Tier</div>
        </div>
      </div>

      {/* Value Progress */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-4">⚡ Museum Value Tiers</h2>
        <div className="space-y-2">
          {VALUE_TIERS.slice(1).map(tier => {
            const reached = estimatedValue >= tier.value;
            const progress = Math.min(100, (estimatedValue / tier.value) * 100);
            const mpMatch = tier.reward.match(/\+(\d+) Magical Power/);
            return (
              <div key={tier.label} className={reached ? 'opacity-50' : ''}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={`font-medium ${reached ? 'text-emerald-400' : 'text-slate-300'}`}>
                    {reached ? '✓ ' : ''}{tier.label}
                    {mpMatch && <span className="ml-1 text-purple-400">{tier.reward}</span>}
                  </span>
                  <span className="text-slate-500">
                    {reached ? 'Reached' : `${formatValue(estimatedValue)} / ${formatValue(tier.value)}`}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${reached ? 'bg-emerald-500' : 'bg-yellow-500'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        {nextTier && (
          <p className="mt-3 text-xs text-slate-500">
            Next tier: {nextTier.label} at {formatValue(nextTier.value)} — need {formatValue(nextTier.value - estimatedValue)} more value
          </p>
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
              <div className="text-xs text-slate-400 mb-1 font-medium">Missing</div>
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
        Museum value is estimated from a curated list of known high-value items. Actual in-game value may differ.
      </p>
    </div>
  );
}
