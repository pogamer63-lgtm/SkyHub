import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile, enrichWithNBT } from '@/lib/hypixel/parser';
import { getBazaarPrices, getBazaarBuyPrice } from '@/lib/api/bazaar';
import { ACCESSORY_LIST, ACCESSORY_BY_ID, AccessoryEntry } from '@/lib/data/accessories';
import { PlayerProfile } from '@/lib/types/player';
import { formatCoins } from '@/lib/utils/format';
import { MP_PER_RARITY, ItemRarity } from '@/lib/hypixel/nbt';
import { getUncuratedAccessories } from '@/lib/data/accessories-api';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Accessory Optimizer` };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RARITY_ORDER: ItemRarity[] = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'DIVINE', 'SPECIAL', 'VERY_SPECIAL'];

const RARITY_COLORS: Record<ItemRarity, string> = {
  COMMON:       'text-slate-300 border-slate-500/30 bg-slate-500/5',
  UNCOMMON:     'text-green-300 border-green-500/30 bg-green-500/5',
  RARE:         'text-blue-300 border-blue-500/30 bg-blue-500/5',
  EPIC:         'text-purple-300 border-purple-500/30 bg-purple-500/5',
  LEGENDARY:    'text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
  MYTHIC:       'text-pink-300 border-pink-500/30 bg-pink-500/5',
  DIVINE:       'text-sky-300 border-sky-500/30 bg-sky-500/5',
  SPECIAL:      'text-red-300 border-red-500/30 bg-red-500/5',
  VERY_SPECIAL: 'text-red-400 border-red-400/30 bg-red-400/5',
  UNKNOWN:      'text-slate-500 border-slate-600/30 bg-slate-600/5',
};

function formatCoinsCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AccessoriesPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let rawProfileData: { uuid: string; raw: Parameters<typeof enrichWithNBT>[1] } | null = null;
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
      rawProfileData = { uuid, raw: targetProfile };
    }
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load profile.';
  }

  if (error || !profile || !rawProfileData) {
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

  // Enrich with NBT (real accessory parsing)
  const enriched = await enrichWithNBT(profile, rawProfileData.raw, rawProfileData.uuid);
  const ownedIds = enriched.accessories.ownedIds ?? new Set<string>();
  const hasNBT = ownedIds.size > 0;

  // Fetch Bazaar prices for upgrade cost estimates
  let bazaarPrices = null;
  try { bazaarPrices = await getBazaarPrices(); } catch { /* non-fatal */ }

  // ── Compute missing accessories from our curated list ──
  const missing: Array<AccessoryEntry & { bazaarPrice: number | null; mpPerCoin: number | null }> = [];

  for (const acc of ACCESSORY_LIST) {
    // Skip if player owns a higher-tier version in the same family
    if (acc.family) {
      const familyItems = ACCESSORY_LIST.filter(a => a.family === acc.family);
      const ownsHigherTier = familyItems.some(a => {
        if (!ownedIds.has(a.id)) return false;
        return RARITY_ORDER.indexOf(a.rarity) >= RARITY_ORDER.indexOf(acc.rarity);
      });
      if (ownsHigherTier) continue;
    }

    if (ownedIds.has(acc.id)) continue;

    const bazaarPrice =
      acc.bazaarId && bazaarPrices ? getBazaarBuyPrice(bazaarPrices, acc.bazaarId) : null;
    const mpPerCoin = bazaarPrice && bazaarPrice > 0 ? acc.mp / bazaarPrice * 1_000_000 : null;

    missing.push({ ...acc, bazaarPrice, mpPerCoin });
  }

  // Sort missing: by mp/coin desc (bazaar first), then by rarity desc
  const sortedMissing = missing.sort((a, b) => {
    if (a.mpPerCoin !== null && b.mpPerCoin !== null) return b.mpPerCoin - a.mpPerCoin;
    if (a.mpPerCoin !== null) return -1;
    if (b.mpPerCoin !== null) return 1;
    return RARITY_ORDER.indexOf(b.rarity) - RARITY_ORDER.indexOf(a.rarity);
  });

  // ── Group owned by rarity ──
  const totalMP = enriched.magicalPower;
  const countByRarity = RARITY_ORDER.reduce((acc, r) => ({ ...acc, [r]: 0 }), {} as Record<string, number>);
  // Use accessories count from API as fallback
  const accessoryCount = enriched.accessories.count || profile.accessories.count;

  const bazaarMissing = sortedMissing.filter(a => a.bazaarPrice !== null && a.bazaarPrice > 0).slice(0, 15);
  const ahMissing = sortedMissing.filter(a => a.bazaarPrice === null || a.bazaarPrice === 0).slice(0, 10);

  // Fetch additional accessories from Hypixel Items API (all 400+ accessories)
  const curatedIds = new Set(ACCESSORY_LIST.map(a => a.id));
  const apiExtras = hasNBT
    ? (await getUncuratedAccessories(curatedIds))
        .filter(a => !ownedIds.has(a.id))
        .sort((a, b) => b.mp - a.mp)
        .slice(0, 30)
    : [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Accessory Optimizer</h1>
        <span className="ml-auto rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
          {profile.profileName}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Magical Power" value={`${totalMP}`} color="text-purple-300" />
        <StatCard label="Accessories" value={hasNBT ? `${accessoryCount}` : '?'} color="text-white" sub={hasNBT ? 'from bag' : 'NBT pending'} />
        <StatCard label="Missing (known)" value={`${sortedMissing.length}`} color="text-yellow-300" />
        <StatCard label="Bazaar upgrades" value={`${bazaarMissing.length}`} color="text-emerald-300" sub="available now" />
      </div>

      {!hasNBT && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 mb-6 text-sm text-amber-300">
          ⚠ Talisman bag data unavailable — real accessory count requires the API to return inventory NBT.
          MP shown is from Hypixel API highest_magical_power field.
        </div>
      )}

      {/* Cheapest Bazaar Upgrades */}
      {bazaarMissing.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            🛒 Best Bazaar Upgrades
            <span className="text-xs font-normal text-slate-500">sorted by MP per 1M coins</span>
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-xs">
                  <th className="text-left pb-2 font-medium">Accessory</th>
                  <th className="text-center pb-2 font-medium">Rarity</th>
                  <th className="text-right pb-2 font-medium">+MP</th>
                  <th className="text-right pb-2 font-medium">Price</th>
                  <th className="text-right pb-2 font-medium">MP / 1M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {bazaarMissing.map(acc => (
                  <tr key={acc.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5">
                      <div className="text-white font-medium">{acc.name}</div>
                      {acc.notes && <div className="text-xs text-slate-500">{acc.notes}</div>}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`rounded-full border px-2 py-0.5 text-xs ${RARITY_COLORS[acc.rarity]}`}>
                        {acc.rarity}
                      </span>
                    </td>
                    <td className="py-2.5 text-right font-mono text-purple-300 font-medium">+{acc.mp}</td>
                    <td className="py-2.5 text-right font-mono text-yellow-300">
                      {acc.bazaarPrice ? formatCoinsCompact(acc.bazaarPrice) : '—'}
                    </td>
                    <td className="py-2.5 text-right font-mono text-emerald-400 font-medium">
                      {acc.mpPerCoin ? acc.mpPerCoin.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* AH / Other Upgrades */}
      {ahMissing.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            🏷 Auction House Upgrades
            <span className="text-xs font-normal text-slate-500">price varies — check AH</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ahMissing.map(acc => (
              <div key={acc.id} className="rounded-lg border border-white/5 p-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-white font-medium">{acc.name}</div>
                  {acc.notes && <div className="text-xs text-slate-500">{acc.notes}</div>}
                </div>
                <div className="text-right shrink-0">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${RARITY_COLORS[acc.rarity]}`}>
                    {acc.rarity}
                  </span>
                  <div className="text-xs text-purple-300 mt-1">+{acc.mp} MP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MP Milestones */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4">⚡ MP Milestones</h2>
        <div className="space-y-2">
          {[100, 200, 300, 400, 500, 600, 700].map(target => {
            const reached = totalMP >= target;
            const progress = Math.min(100, (totalMP / target) * 100);
            return (
              <div key={target} className={reached ? 'opacity-50' : ''}>
                <div className="flex justify-between text-xs mb-1">
                  <span className={reached ? 'text-emerald-400' : 'text-slate-400'}>
                    {reached ? '✓ ' : ''}{target} MP
                  </span>
                  <span className="text-slate-500">
                    {reached ? 'Reached' : `${totalMP}/${target} (${(progress).toFixed(0)}%)`}
                  </span>
                </div>
                <div className="h-1 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${reached ? 'bg-emerald-500' : 'bg-purple-500'}`}
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-slate-500">
          Each MP milestone unlocks stronger stat scaling from your accessories.
        </p>
      </div>

      {/* API-sourced additional accessories */}
      {apiExtras.length > 0 && (
        <div className="card p-5 mt-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-white">Additional Missing Accessories</h2>
            <span className="text-xs text-slate-500 bg-slate-800 rounded-full px-2 py-0.5">
              From Hypixel Items API · {apiExtras.length} shown
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            These accessories exist in the full game data but are not in our curated database. Prices may not be available.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {apiExtras.map(acc => (
              <div key={acc.id} className={`rounded-lg border px-3 py-2 text-xs ${RARITY_COLORS[acc.rarity]}`}>
                <div className="font-medium truncate">{acc.name}</div>
                <div className="text-slate-500 mt-0.5">+{acc.mp} MP · {acc.rarity}</div>
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
