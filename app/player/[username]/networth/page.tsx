import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile, enrichWithNBT } from '@/lib/hypixel/parser';
import { getBazaarPrices, getBazaarSellPrice } from '@/lib/api/bazaar';
import { getAHPrices, getAHPrice } from '@/lib/api/auction';
import { PlayerProfile, ParsedPet } from '@/lib/types/player';
import { formatCoins } from '@/lib/utils/format';
import { getItemName } from '@/lib/neu/data';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Networth` };
}

// ─── Valuation Data ───────────────────────────────────────────────────────────

// Estimated value per pet tier at max level (simplified)
const PET_MAX_VALUE: Record<string, number> = {
  COMMON:    2_000,
  UNCOMMON:  10_000,
  RARE:      200_000,
  EPIC:      3_000_000,
  LEGENDARY: 50_000_000,
  MYTHIC:    100_000_000,
};

// Notable pets that are worth significantly more
const PET_PREMIUM: Record<string, number> = {
  GOLDEN_DRAGON:    250_000_000,
  SCATHA:           30_000_000,
  BAL:              15_000_000,
  ENDER_DRAGON:     200_000_000,
  LION:             80_000_000,
  WITHER_SKELETON:  60_000_000,
  TIGER:            40_000_000,
  ENDERMAN:         30_000_000,
  MOLE:             20_000_000,
  FLYING_FISH:      25_000_000,
};

function estimatePetValue(pet: ParsedPet): number {
  const premium = PET_PREMIUM[pet.type];
  if (premium) {
    // Scale by level
    const maxLevel = pet.tier === 'LEGENDARY' || pet.tier === 'MYTHIC' ? 200 : 100;
    return Math.round(premium * (pet.level / maxLevel) * 0.8 + premium * 0.2);
  }
  const base = PET_MAX_VALUE[pet.tier] ?? 2_000;
  const maxLevel = pet.tier === 'LEGENDARY' || pet.tier === 'MYTHIC' ? 200 : 100;
  return Math.round(base * Math.pow(pet.level / maxLevel, 1.5));
}

// Gear tier value estimates
const GEAR_TIER_VALUES: Record<string, number> = {
  NECRON_HELMET:          40_000_000,
  NECRON_CHESTPLATE:      40_000_000,
  NECRON_LEGGINGS:        40_000_000,
  NECRON_BOOTS:           40_000_000,
  STORM_HELMET:           25_000_000,
  SHADOW_ASSASSIN_HELMET: 20_000_000,
  AURORA_HELMET:          15_000_000,
  TERROR_HELMET:          30_000_000,
  HOLLOW_HELMET:          35_000_000,
  FERVOR_HELMET:          20_000_000,
  CRIMSON_HELMET:         25_000_000,
  ADAPTIVE_HELMET:        35_000_000,
  WITHER_CLOAK:           100_000_000,
  GIANTS_SWORD:           50_000_000,
  HYPERION:               200_000_000,
  ASTRAEA:                150_000_000,
  VALKYRIE:               300_000_000,
  SCYLLA:                 250_000_000,
  VORPAL_KATANA:          50_000_000,
  JUJU_SHORTBOW:          40_000_000,
};

// Common collection items worth tracking for bazaar value
const COLLECTION_ITEMS_VALUE: Array<{ id: string; bazaarId: string; name: string }> = [
  { id: 'WHEAT',         bazaarId: 'WHEAT',         name: 'Wheat' },
  { id: 'CARROT_ITEM',   bazaarId: 'CARROT_ITEM',   name: 'Carrot' },
  { id: 'POTATO_ITEM',   bazaarId: 'POTATO_ITEM',   name: 'Potato' },
  { id: 'MELON',         bazaarId: 'MELON',         name: 'Melon' },
  { id: 'SUGAR_CANE',    bazaarId: 'SUGAR_CANE',    name: 'Sugar Cane' },
  { id: 'COBBLESTONE',   bazaarId: 'COBBLESTONE',   name: 'Cobblestone' },
  { id: 'COAL',          bazaarId: 'COAL',          name: 'Coal' },
  { id: 'IRON_INGOT',    bazaarId: 'IRON_INGOT',    name: 'Iron' },
  { id: 'GOLD_INGOT',    bazaarId: 'GOLD_INGOT',    name: 'Gold' },
  { id: 'DIAMOND',       bazaarId: 'DIAMOND',       name: 'Diamond' },
  { id: 'EMERALD',       bazaarId: 'EMERALD',       name: 'Emerald' },
];

// Fairy soul bonus value
const FAIRY_SOUL_PER_VALUE = 1_000; // rough per-soul value in coins

// HOTM XP + powder to coins conversion
const MITHRIL_POWDER_RATE = 3;  // ~3 coins per mithril powder (rough)
const GEMSTONE_POWDER_RATE = 8; // ~8 coins per gemstone powder
const GLACITE_POWDER_RATE = 3;  // ~3 coins per glacite powder (rough)

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function NetworthPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let error: string | null = null;
  let rawProfileData: { uuid: string; raw: Parameters<typeof enrichWithNBT>[1] } | null = null;

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
      const parsed = selectBestProfile([target], uuid, resolvedName);
      rawProfileData = { uuid, raw: target };
      profile = await enrichWithNBT(parsed, target, uuid).catch(() => parsed);
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

  const [bazaarPrices, ahPrices] = await Promise.allSettled([getBazaarPrices(), getAHPrices()])
    .then(([b, a]) => [
      b.status === 'fulfilled' ? b.value : null,
      a.status === 'fulfilled' ? a.value : null,
    ] as const);

  // ── Calculate components ──

  // 1. Liquid coins
  const purseCoins = profile.purseCoins;
  const bankCoins = profile.bankCoins;
  const liquidCoins = purseCoins + bankCoins;

  // 2. Pets
  const petsValue = profile.pets.reduce((sum, pet) => sum + estimatePetValue(pet), 0);
  const topPets = [...profile.pets]
    .map(p => ({ pet: p, value: estimatePetValue(p) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // 3. Gear value (from NBT-parsed items if available)
  const ownedIds = profile.accessories.ownedIds ?? new Set<string>();
  let gearValue = 0;
  const gearItems: Array<{ name: string; value: number }> = [];
  for (const [itemId, value] of Object.entries(GEAR_TIER_VALUES)) {
    if (ownedIds.has(itemId)) {
      gearValue += value;
      gearItems.push({ name: getItemName(itemId), value });
    }
  }

  // 4. Fairy souls (raw account progression value)
  const fairySoulValue = profile.fairySouls * FAIRY_SOUL_PER_VALUE;

  // 5. Mining powder (convertible to coins eventually)
  const mithrilPowderValue = profile.mining.powderMithrilTotal * MITHRIL_POWDER_RATE;
  const gemstonePowderValue = profile.mining.powderGemstoneTotal * GEMSTONE_POWDER_RATE;
  const glacitePowderValue = profile.mining.powderGlaciteTotal * GLACITE_POWDER_RATE;
  const powderValue = mithrilPowderValue + gemstonePowderValue + glacitePowderValue;

  // 6. Real inventory value from NBT-parsed items × bazaar prices
  let inventoryValue = 0;
  const topInventoryItems: Array<{ name: string; count: number; value: number }> = [];
  const hasNBTItems = !!(
    profile.inventoryItems?.length || profile.enderChestItems?.length ||
    profile.backpackItems?.length || profile.wardrobeItems?.length ||
    profile.potionItems?.length || profile.fishingBagItems?.length ||
    profile.quiverItems?.length || profile.sacksItems?.length
  );

  if ((bazaarPrices || ahPrices) && hasNBTItems) {
    const allItems = [
      ...(profile.inventoryItems ?? []),
      ...(profile.enderChestItems ?? []),
      ...(profile.backpackItems ?? []),
      ...(profile.armorItems ?? []),
      ...(profile.equipmentItems ?? []),
      ...(profile.wardrobeItems ?? []),
      ...(profile.potionItems ?? []),
      ...(profile.fishingBagItems ?? []),
      ...(profile.quiverItems ?? []),
      ...(profile.sacksItems ?? []),
    ];
    const itemTotals = new Map<string, number>();
    for (const item of allItems) {
      if (item.id && !item.petInfo) {
        itemTotals.set(item.id, (itemTotals.get(item.id) ?? 0) + item.count);
      }
    }
    for (const [id, count] of itemTotals) {
      const name = getItemName(id);
      const bazaarPrice = bazaarPrices ? getBazaarSellPrice(bazaarPrices, id) : 0;
      const price = bazaarPrice > 0 ? bazaarPrice : (ahPrices ? (getAHPrice(ahPrices, name) ?? 0) : 0);
      if (price > 0) {
        const value = price * count;
        inventoryValue += value;
        if (value > 10_000) {
          topInventoryItems.push({ name, count, value });
        }
      }
    }
    topInventoryItems.sort((a, b) => b.value - a.value);
  }

  // Total
  const totalNetworth = liquidCoins + petsValue + gearValue + fairySoulValue + powderValue + inventoryValue;

  interface NetworthComponent {
    label: string;
    value: number;
    color: string;
    pct: number;
    note?: string;
  }

  const components: NetworthComponent[] = [
    { label: 'Liquid Coins', value: liquidCoins, color: 'bg-yellow-500', pct: 0, note: `Purse: ${formatCoins(purseCoins)} · Bank: ${formatCoins(bankCoins)}` },
    { label: 'Pets Portfolio', value: petsValue, color: 'bg-pink-500', pct: 0, note: `${profile.pets.length} pets estimated` },
    { label: 'Gear / Armor', value: gearValue, color: 'bg-slate-400', pct: 0, note: gearValue > 0 ? `${gearItems.length} known pieces` : 'Requires NBT data' },
    { label: 'Inventory & Storage', value: inventoryValue, color: 'bg-indigo-500', pct: 0, note: hasNBTItems ? `${topInventoryItems.length} bazaar items found` : 'Requires NBT data' },
    { label: 'Fairy Souls', value: fairySoulValue, color: 'bg-fuchsia-500', pct: 0, note: `${profile.fairySouls} souls × ~1k` },
    { label: 'Mining Powder', value: powderValue, color: 'bg-sky-500', pct: 0, note: `${profile.mining.powderMithrilTotal.toLocaleString()} mithril · ${profile.mining.powderGemstoneTotal.toLocaleString()} gemstone · ${profile.mining.powderGlaciteTotal.toLocaleString()} glacite` },
  ].filter(c => c.value > 0).map(c => ({ ...c, pct: totalNetworth > 0 ? (c.value / totalNetworth) * 100 : 0 }))
   .sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Networth</h1>
        <span className="ml-auto rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
          {profile.profileName}
        </span>
      </div>

      {/* Total */}
      <div className="card p-6 text-center border border-yellow-500/20 bg-yellow-500/5">
        <div className="text-xs text-slate-500 mb-1">Estimated Total Networth</div>
        <div className="text-4xl font-bold text-yellow-300">{formatCoins(totalNetworth)}</div>
        <div className="text-xs text-slate-600 mt-2">
          ⚠ Estimate only — gear and storage require NBT access. Actual networth may differ significantly.
        </div>
      </div>

      {/* Component breakdown */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4">Breakdown</h2>
        <div className="space-y-3">
          {components.map(c => (
            <div key={c.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-slate-300">{c.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">{c.pct.toFixed(1)}%</span>
                  <span className="text-sm font-mono font-medium text-yellow-300 w-24 text-right">{formatCoins(c.value)}</span>
                </div>
              </div>
              <div className="h-2 rounded-full bg-white/5 mb-0.5">
                <div className={`h-full rounded-full ${c.color}`} style={{ width: `${Math.min(100, c.pct)}%` }} />
              </div>
              {c.note && <div className="text-xs text-slate-600">{c.note}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Top Pets by Value */}
      {topPets.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4">🐾 Most Valuable Pets</h2>
          <div className="space-y-2">
            {topPets.map(({ pet, value }, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-5 text-right text-xs">{i + 1}.</span>
                  <span className={`text-xs font-medium ${
                    pet.tier === 'LEGENDARY' ? 'text-yellow-300' :
                    pet.tier === 'MYTHIC'    ? 'text-pink-300' :
                    pet.tier === 'EPIC'      ? 'text-purple-300' : 'text-slate-300'
                  }`}>{pet.type.replace(/_/g, ' ')}</span>
                  <span className="text-xs text-slate-500">Lv {pet.level} {pet.tier.slice(0, 3)}</span>
                  {pet.active && <span className="text-yellow-400 text-xs">★</span>}
                </div>
                <span className="text-yellow-300 font-mono text-sm">{formatCoins(value)}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
            <span className="text-slate-500">Total pets ({profile.pets.length})</span>
            <span className="text-yellow-300 font-mono">{formatCoins(petsValue)}</span>
          </div>
        </div>
      )}

      {/* Gear breakdown (if any) */}
      {gearItems.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4">🛡️ Detected Gear</h2>
          <div className="space-y-2">
            {gearItems.sort((a, b) => b.value - a.value).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300 capitalize">{item.name.toLowerCase()}</span>
                <span className="text-yellow-300 font-mono">{formatCoins(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Powder wealth */}
      {powderValue > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-4">⛏ Mining Powder</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-sky-300">{profile.mining.powderMithrilTotal.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Mithril Powder</div>
              <div className="text-xs text-slate-600">~{formatCoins(mithrilPowderValue)}</div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="text-lg font-bold text-emerald-300">{profile.mining.powderGemstoneTotal.toLocaleString()}</div>
              <div className="text-xs text-slate-500 mt-1">Gemstone Powder</div>
              <div className="text-xs text-slate-600">~{formatCoins(gemstonePowderValue)}</div>
            </div>
            {profile.mining.powderGlaciteTotal > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                <div className="text-lg font-bold text-cyan-300">{profile.mining.powderGlaciteTotal.toLocaleString()}</div>
                <div className="text-xs text-slate-500 mt-1">Glacite Powder</div>
                <div className="text-xs text-slate-600">~{formatCoins(glacitePowderValue)}</div>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-600 mt-2">Powder value is an approximation based on item conversion rates.</p>
        </div>
      )}

      {/* Inventory & Storage */}
      {topInventoryItems.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-white mb-1">📦 Inventory &amp; Storage</h2>
          <p className="text-xs text-slate-500 mb-4">Items found across all bags and storage — priced via Bazaar or Auction House.</p>
          <div className="space-y-2">
            {topInventoryItems.slice(0, 15).map((item, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-5 text-right text-xs">{i + 1}.</span>
                  <span className="text-slate-300">{item.name}</span>
                  <span className="text-xs text-slate-600">×{item.count.toLocaleString()}</span>
                </div>
                <span className="text-indigo-300 font-mono">{formatCoins(item.value)}</span>
              </div>
            ))}
            {topInventoryItems.length > 15 && (
              <div className="text-xs text-slate-600 text-right">+{topInventoryItems.length - 15} more items</div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5 flex justify-between text-sm">
            <span className="text-slate-500">Total ({topInventoryItems.length} distinct items)</span>
            <span className="text-indigo-300 font-mono">{formatCoins(inventoryValue)}</span>
          </div>
        </div>
      )}

      {/* Accuracy note */}
      <div className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 text-xs text-slate-500 space-y-1">
        <div className="font-medium text-slate-400 mb-1">About this estimate</div>
        <div>• Inventory value includes Bazaar-tradable items and Auction House BIN listings across all bags and storage.</div>
        <div>• Non-tradable items (custom gear, swords, etc.) are not priced; sack contents are not yet included.</div>
        <div>• Pet values are approximations — actual market price may differ by 20-50%.</div>
        <div>• Powder conversion rates are rough estimates, not real Bazaar prices.</div>
        <div>• For a more accurate networth, use sky.shiiyu.moe or similar dedicated calculators.</div>
      </div>
    </div>
  );
}
