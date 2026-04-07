import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { getBazaarPrices } from '@/lib/api/bazaar';
import { getElectionData } from '@/lib/api/election';
import { PlayerProfile } from '@/lib/types/player';
import { formatCoins } from '@/lib/utils/format';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Money Making` };
}

// ─── Income Method Definitions ────────────────────────────────────────────────

interface IncomeMethod {
  id: string;
  name: string;
  category: 'farming' | 'mining' | 'dungeons' | 'slayer' | 'fishing' | 'misc';
  icon: string;
  /** Minimum requirements to unlock this method */
  requirements: string[];
  /** Check if player qualifies */
  isUnlocked: (p: PlayerProfile) => boolean;
  /** Estimated coins per hour (coins) */
  estimateCoinsPerHr: (p: PlayerProfile, bazaar: Record<string, number>) => number;
  /** Short description */
  description: string;
  /** How to improve this income */
  tips: string[];
  /** Difficulty 1-5 */
  difficulty: number;
  /** Is this consistent or luck-based */
  consistency: 'consistent' | 'variable' | 'luck';
}

// Bazaar item IDs used in calculations
const BZ = {
  WHEAT:        'WHEAT',
  SUGAR_CANE:   'SUGAR_CANE',
  POTATO_ITEM:  'POTATO_ITEM',
  CARROT_ITEM:  'CARROT_ITEM',
  MELON:        'MELON',
  PUMPKIN:      'PUMPKIN',
  NETHER_WART:  'NETHER_WART',
  CACTUS:       'CACTUS',
  MUSHROOM:     'RED_MUSHROOM',
  COCOA_BEANS:  'INK_SACK:3',
  MITHRIL_ORE:  'MITHRIL_ORE',
  GEMSTONE_RUBY: 'RUBY_GEM',
  GEMSTONE_JASPER: 'JASPER_GEM',
  ENCHANTED_DIAMOND: 'ENCHANTED_DIAMOND',
  ENCHANTED_GOLD: 'ENCHANTED_GOLD',
  REVENANT_FLESH: 'REVENANT_FLESH',
  TARANTULA_SILK: 'TARANTULA_SILK',
  SLUDGE_JUICE: 'SLUDGE_JUICE',
  BLAZE_ROD: 'BLAZE_ROD',
  MAGMA_FISH: 'MAGMA_FISH',
  GREAT_WHITE_SHARK_TOOTH: 'GREAT_WHITE_SHARK_TOOTH',
  ENCHANTED_RAW_FISH: 'RAW_FISH:4',
};

// Crops per hour per 1 Farming Fortune (roughly)
// At 100 FF, you get baseline + bonus. This is a simplification.
// Wheat: ~300k raw/hr at 300 FF → 1k/FF/hr
const CROP_BASE_PER_HR: Record<string, number> = {
  WHEAT: 300_000,       // raw wheat blocks/hr at 300 FF
  CARROT_ITEM: 180_000,
  POTATO_ITEM: 180_000,
  PUMPKIN: 6_000,
  MELON: 45_000,
  SUGAR_CANE: 100_000,
  CACTUS: 50_000,
  RED_MUSHROOM: 15_000,
  'INK_SACK:3': 70_000,
  NETHER_WART: 80_000,
};
const CROP_FF_BASELINE = 300; // FF at which base rates apply

const INCOME_METHODS: IncomeMethod[] = [
  // ── Farming ──────────────────────────────────────────────────────────────
  {
    id: 'farming_wheat',
    name: 'Wheat Farming',
    category: 'farming',
    icon: '🌾',
    requirements: ['Farming 10+', 'Garden Level 1+'],
    isUnlocked: p => p.skills.farming >= 10 && p.farming.gardenLevel >= 1,
    estimateCoinsPerHr: (p, bz) => {
      const ff = Math.max(p.farming.farmingFortune, p.skills.farming * 4 + p.farming.plots * 3);
      const cropHr = CROP_BASE_PER_HR.WHEAT * (ff / CROP_FF_BASELINE);
      const price = bz[BZ.WHEAT] ?? 2;
      return Math.round(cropHr * price);
    },
    description: 'Most accessible crop. Consistent income, good early-mid game.',
    tips: ['Upgrade Farming Fortune from skills, garden, and Jacob perks first.', 'Use Elephant pet for Farming Fortune bonus.', 'Mooshroom Cow pet scales crop drops nicely.'],
    difficulty: 1,
    consistency: 'consistent',
  },
  {
    id: 'farming_cane',
    name: 'Sugar Cane Farming',
    category: 'farming',
    icon: '🎋',
    requirements: ['Farming 15+', 'Garden Level 3+'],
    isUnlocked: p => p.skills.farming >= 15 && p.farming.gardenLevel >= 3,
    estimateCoinsPerHr: (p, bz) => {
      const ff = Math.max(p.farming.farmingFortune, p.skills.farming * 4 + p.farming.plots * 3);
      const cropHr = CROP_BASE_PER_HR.SUGAR_CANE * (ff / CROP_FF_BASELINE);
      const price = bz[BZ.SUGAR_CANE] ?? 3;
      return Math.round(cropHr * price);
    },
    description: 'Popular high-value crop. Great after mid-game investments.',
    tips: ['Rabbit pet gives +1 FF per 100 crop milestone level.', 'Use speed caps to maximize clicks per hour.', 'Garden crop upgrade (Sugar Cane) increases yield significantly.'],
    difficulty: 2,
    consistency: 'consistent',
  },
  {
    id: 'farming_nwart',
    name: 'Nether Wart Farming',
    category: 'farming',
    icon: '🍄',
    requirements: ['Farming 20+', 'Garden Level 5+'],
    isUnlocked: p => p.skills.farming >= 20 && p.farming.gardenLevel >= 5,
    estimateCoinsPerHr: (p, bz) => {
      const ff = Math.max(p.farming.farmingFortune, p.skills.farming * 4 + p.farming.plots * 3);
      const cropHr = CROP_BASE_PER_HR.NETHER_WART * (ff / CROP_FF_BASELINE);
      const price = bz[BZ.NETHER_WART] ?? 6;
      return Math.round(cropHr * price);
    },
    description: 'Consistently valuable. Great for mid-late game farmers.',
    tips: ['Combine Mooshroom Cow pet with Nether Wart for high yields.', 'Enchant tools with Turbo-Warts V.'],
    difficulty: 2,
    consistency: 'consistent',
  },

  // ── Mining ────────────────────────────────────────────────────────────────
  {
    id: 'mining_mithril',
    name: 'Mithril Mining',
    category: 'mining',
    icon: '⛏️',
    requirements: ['Mining 15+', 'HOTM 1+'],
    isUnlocked: p => p.skills.mining >= 15 && p.mining.hotmLevel >= 1,
    estimateCoinsPerHr: (p, bz) => {
      const hotm = p.mining.hotmLevel;
      // Rough estimate: 800 mithril ore/hr at HOTM 1, scales with HOTM nodes
      const orePerHr = 800 * (1 + hotm * 0.3);
      const price = bz[BZ.MITHRIL_ORE] ?? 15;
      return Math.round(orePerHr * price);
    },
    description: 'Basic HOTM income. Replace with gemstone mining ASAP.',
    tips: ['Upgrade Mining Speed nodes in HOTM first.', 'Get a Blue Whale / Bat pet for mining.', 'Mithril Powder from mining helps unlock better HOTM nodes.'],
    difficulty: 2,
    consistency: 'consistent',
  },
  {
    id: 'mining_gemstones',
    name: 'Gemstone Mining',
    category: 'mining',
    icon: '💎',
    requirements: ['Mining 20+', 'HOTM 5+'],
    isUnlocked: p => p.skills.mining >= 20 && p.mining.hotmLevel >= 5,
    estimateCoinsPerHr: (p, bz) => {
      const hotm = p.mining.hotmLevel;
      // Rough: 150 rough gemstones/hr at HOTM 5 (flawed = 5 rough), scales
      const gemsPerHr = 120 * (1 + (hotm - 5) * 0.25);
      // Average gemstone price (ruby/jasper mix)
      const rubyPrice = bz[BZ.GEMSTONE_RUBY] ?? 800;
      const jasperPrice = bz[BZ.GEMSTONE_JASPER] ?? 600;
      const avgGemPrice = (rubyPrice + jasperPrice) / 2;
      return Math.round(gemsPerHr * avgGemPrice * 0.15); // rough → flawed conversion
    },
    description: 'Primary late-game mining income. Scales well with HOTM progression.',
    tips: ['Unlock Gemstone Infusion in HOTM for massive yield boost.', 'Scatha / Mole pet increases drop rates significantly.', 'Use Titanium Drill with Gemstone Gauntlet for max speed.', 'Jasper/Ruby are usually the most profitable gems.'],
    difficulty: 3,
    consistency: 'consistent',
  },

  // ── Dungeons ──────────────────────────────────────────────────────────────
  {
    id: 'dungeons_f4',
    name: 'F4 Farming (Thorn)',
    category: 'dungeons',
    icon: '🏰',
    requirements: ['Catacombs 15+', 'Completed F4'],
    isUnlocked: p => p.dungeons.catacombs.level >= 15 && (p.dungeons.catacombs.floorCompletions['4'] ?? 0) > 0,
    estimateCoinsPerHr: (p, _bz) => {
      // F4 drops: Spirit Sceptre, misc essence — avg ~200k/run, 6 runs/hr at fast pace
      const level = p.dungeons.catacombs.level;
      const runsPerHr = level >= 20 ? 6 : level >= 16 ? 4 : 3;
      return runsPerHr * 200_000;
    },
    description: 'Spirit Sceptre drops + essence. Good early dungeon income.',
    tips: ['Run in full parties for faster clear times.', 'Get S+ score for better loot rolls.', 'Spirit Sceptre averages ~1M every ~5-10 runs.'],
    difficulty: 3,
    consistency: 'variable',
  },
  {
    id: 'dungeons_f5',
    name: 'F5 Farming (Livid)',
    category: 'dungeons',
    icon: '🏰',
    requirements: ['Catacombs 20+', 'Completed F5'],
    isUnlocked: p => p.dungeons.catacombs.level >= 20 && (p.dungeons.catacombs.floorCompletions['5'] ?? 0) > 0,
    estimateCoinsPerHr: (p, _bz) => {
      const level = p.dungeons.catacombs.level;
      const runsPerHr = level >= 25 ? 5 : 3;
      return runsPerHr * 450_000; // Livid Dagger + essence + misc
    },
    description: 'Livid Dagger drops are very valuable. High-value mid-game dungeon.',
    tips: ['Livid Dagger sells for 1M–4M.', 'Get class to 25+ for faster clear times.', 'S+ for better chest rewards.'],
    difficulty: 3,
    consistency: 'variable',
  },
  {
    id: 'dungeons_f7',
    name: 'F7 Farming (Necron)',
    category: 'dungeons',
    icon: '💀',
    requirements: ['Catacombs 28+', 'Completed F7'],
    isUnlocked: p => p.dungeons.catacombs.level >= 28 && (p.dungeons.catacombs.floorCompletions['7'] ?? 0) > 0,
    estimateCoinsPerHr: (p, _bz) => {
      const level = p.dungeons.catacombs.level;
      const runsPerHr = level >= 35 ? 3 : level >= 30 ? 2 : 1.5;
      return runsPerHr * 3_500_000; // Necron armor pieces + misc
    },
    description: 'Best-in-slot dungeon loot (Necron, Hyperion shards). High income/hr.',
    tips: ['Necron Helmet alone sells for 8M+.', 'Hyperion is ~100M — rare drop.', 'Maximize Secrets found for better chest loot.', 'Party up to cut clear times significantly.'],
    difficulty: 5,
    consistency: 'variable',
  },
  {
    id: 'dungeons_mm',
    name: 'Master Mode (MM7)',
    category: 'dungeons',
    icon: '👑',
    requirements: ['Catacombs 43+', 'Completed MM7'],
    isUnlocked: p => p.dungeons.catacombs.level >= 43 && (p.dungeons.masterMode?.floorCompletions?.['7'] ?? 0) > 0,
    estimateCoinsPerHr: (_p, _bz) => {
      return 2 * 6_000_000; // MM7 avg 2 runs/hr at 6M per run (high-end estimate)
    },
    description: 'Highest-end dungeon income. Crimson essence + Storm/Goldor/Maxor/Necron.',
    tips: ['S+ score gives extra Crimson Essence.', 'Full progression class comp speeds things up greatly.', 'Each run can drop 1M+ in essence alone.'],
    difficulty: 5,
    consistency: 'variable',
  },

  // ── Slayer ────────────────────────────────────────────────────────────────
  {
    id: 'slayer_zombie',
    name: 'Zombie Slayer (Revenant)',
    category: 'slayer',
    icon: '🧟',
    requirements: ['Zombie Slayer Level 3+', 'Combat 15+'],
    isUnlocked: p => p.slayers.zombie.level >= 3 && p.skills.combat >= 15,
    estimateCoinsPerHr: (p, bz) => {
      const level = p.slayers.zombie.level;
      // T3 = ~300k/hr, T4 = ~600k/hr, T5 = ~1.5M/hr (from drops)
      const dropRates: Record<number, number> = { 3: 300_000, 4: 600_000, 5: 1_500_000, 6: 2_500_000, 7: 4_000_000 };
      const fleshPrice = bz[BZ.REVENANT_FLESH] ?? 100;
      const base = dropRates[Math.min(level, 7)] ?? 200_000;
      return Math.round(base * (fleshPrice / 100));
    },
    description: 'Consistent income from Revenant Flesh + rare drops (Scythe Blade, etc.).',
    tips: ['Revenant Flesh price fluctuates — check Bazaar before farming.', 'T4 is very popular and relatively accessible.', 'Rare drops (Recomb, Scythe Blade) are huge income spikes.'],
    difficulty: 3,
    consistency: 'variable',
  },
  {
    id: 'slayer_spider',
    name: 'Spider Slayer (Tarantula)',
    category: 'slayer',
    icon: '🕷️',
    requirements: ['Spider Slayer Level 3+', 'Combat 20+'],
    isUnlocked: p => p.slayers.spider.level >= 3 && p.skills.combat >= 20,
    estimateCoinsPerHr: (p, bz) => {
      const level = p.slayers.spider.level;
      const base = level >= 5 ? 800_000 : level >= 4 ? 400_000 : 200_000;
      const silkPrice = bz[BZ.TARANTULA_SILK] ?? 1500;
      return Math.round(base * (silkPrice / 1500));
    },
    description: 'Tarantula Silk sells well on Bazaar. Good mid-game slayer income.',
    tips: ['Tarantula Silk price scales with demand — check Bazaar.', 'Web Bows (rare drop) can sell for millions.', 'T4 is the sweet spot for time vs reward.'],
    difficulty: 3,
    consistency: 'variable',
  },
  {
    id: 'slayer_wolf',
    name: 'Wolf Slayer (Sven Packmaster)',
    category: 'slayer',
    icon: '🐺',
    requirements: ['Wolf Slayer Level 3+', 'Combat 18+'],
    isUnlocked: p => p.slayers.wolf.level >= 3 && p.skills.combat >= 18,
    estimateCoinsPerHr: (p, _bz) => {
      const level = p.slayers.wolf.level;
      // T3: ~500k/hr, T4: ~1.5M/hr, T5: ~3M/hr (Spirit Rune + Wolf Armor pieces)
      const base = level >= 5 ? 3_000_000 : level >= 4 ? 1_500_000 : 500_000;
      return base;
    },
    description: 'Wolf Armor + Spirit Rune + Couture Rune drops. Decent mid-game slayer income.',
    tips: ['Spirit Rune can sell for 1M+.', 'T4 gives best time vs reward ratio.', 'Also drops Sludge Juice used for Blaze tier-up costs.', 'Primary value is progression unlock (Enderman Slayer) over raw income.'],
    difficulty: 3,
    consistency: 'variable',
  },
  {
    id: 'slayer_blaze',
    name: 'Blaze Slayer (Inferno Demonlord)',
    category: 'slayer',
    icon: '🔥',
    requirements: ['Blaze Slayer Level 3+', 'Combat 20+'],
    isUnlocked: p => p.slayers.blaze.level >= 3 && p.skills.combat >= 20,
    estimateCoinsPerHr: (p, bz) => {
      const level = p.slayers.blaze.level;
      const base = level >= 6 ? 2_000_000 : level >= 5 ? 900_000 : level >= 4 ? 500_000 : 200_000;
      const blazePrice = bz[BZ.BLAZE_ROD] ?? 80;
      return Math.round(base * (blazePrice / 80));
    },
    description: 'Crimson essence + Mage Outfit drops make this very lucrative.',
    tips: ['Mage Outfit pieces sell for 5M+.', 'Good Crimson essence income per hour.', 'Requires solid gear for efficient T4/T5 kills.'],
    difficulty: 4,
    consistency: 'variable',
  },

  {
    id: 'slayer_vampire',
    name: 'Vampire Slayer (Riftstalker)',
    category: 'slayer',
    icon: '🧛',
    requirements: ['In The Rift', 'Vampire Slayer Level 2+'],
    isUnlocked: p => p.slayers.vampire.level >= 2,
    estimateCoinsPerHr: (p, _bz) => {
      const level = p.slayers.vampire.level;
      // Rift slayer — lower coins vs overworld due to market size, but farmable as side activity
      const base = level >= 4 ? 800_000 : level >= 3 ? 400_000 : 150_000;
      return base;
    },
    description: 'Rift-specific slayer. Adrenaline Stone + Vampire Fang drops. Niche but farmable as a side activity in The Rift.',
    tips: ['Adrenaline Stone is the main valuable drop at level 3+.', 'Best done as side income while doing other Rift content.', 'Lower overall coins/hr vs overworld slayers but unique to The Rift.'],
    difficulty: 2,
    consistency: 'variable',
  },

  // ── Fishing ───────────────────────────────────────────────────────────────
  {
    id: 'fishing_mob',
    name: 'Mob Fishing (Shark/Trophy)',
    category: 'fishing',
    icon: '🎣',
    requirements: ['Fishing 20+'],
    isUnlocked: p => p.skills.fishing >= 20,
    estimateCoinsPerHr: (_p, bz) => {
      // Trophy fish sell for 50k–500k each; avg 3–5/hr at good fishing spots
      const toothPrice = bz[BZ.GREAT_WHITE_SHARK_TOOTH] ?? 200_000;
      return Math.round(3 * toothPrice * 0.1 + 400_000); // mix of trophies + misc
    },
    description: 'Trophy fish (Great White, Skeleton Fish) are extremely valuable.',
    tips: ['Use Crystallized Heart in Blazing Fortress for Magma Slug fishing.', 'Trophy Fishing rod upgrades massively improve drop rates.', 'Festival events make fishing extremely lucrative.', 'Shining Compass + Blessed Bait for best trophy rates.'],
    difficulty: 2,
    consistency: 'variable',
  },

  // ── Farming (advanced) ───────────────────────────────────────────────────
  {
    id: 'pest_farming',
    name: 'Pest/Pelt Farming',
    category: 'farming',
    icon: '🦟',
    requirements: ['Garden Level 5+', 'Farming 30+'],
    isUnlocked: p => p.farming.gardenLevel >= 5 && p.skills.farming >= 30,
    estimateCoinsPerHr: (p, _bz) => {
      // Base: ~40M/hr pest drops + pelts. Scales slightly with garden level.
      const gardenBonus = Math.max(0, p.farming.gardenLevel - 5) * 500_000;
      return 40_000_000 + gardenBonus;
    },
    description: 'Farm pests while auto-farming crops. Pelts + pest shards sell for 40M–90M/hr (Finnegan mayor doubles rates).',
    tips: [
      'Use Mosquito pet to maximize pest spawns, then swap to Hedgehog pet to kill them.',
      'During Mayor Finnegan pelt rates double — 80M–90M/hr.',
      'Vermin Vaporizer Garden Chip boosts pest spawn chance.',
      'Set pet auto-swap rules: Elephant/Mooshroom while farming, Hedgehog during vacuum.',
    ],
    difficulty: 3,
    consistency: 'consistent',
  },
  {
    id: 'greenhouse_plots',
    name: 'Greenhouse Plots (Ashreath)',
    category: 'farming',
    icon: '🌿',
    requirements: ['Garden Level 12+', '100M+ coins invested'],
    isUnlocked: p => p.farming.gardenLevel >= 12,
    estimateCoinsPerHr: (p, _bz) => {
      // Active Ashreath mutation: ~45M/hr. Semi-passive (twice daily): ~30M/day → ~1.25M/hr equivalent.
      // Show active rate since this is an income methods page.
      const gardenBonus = Math.max(0, p.farming.gardenLevel - 12) * 1_000_000;
      return 45_000_000 + gardenBonus;
    },
    description: 'Unlock all 3 Greenhouse plots (~100M investment). Ashreath mutation active clearing nets 40–50M/hr; twice-daily harvesting yields 30M/day passive.',
    tips: [
      'Ashreath mutation is ~20% better than alternatives for raw NPC value.',
      'Requires ~100M in Ethereal Vines + compost to unlock all plots.',
      'Semi-passive: harvest twice daily for ~30M/day with minimal time.',
      'Unlocks at Garden Level 12 from the Garden Desk.',
    ],
    difficulty: 4,
    consistency: 'consistent',
  },

  // ── Misc ──────────────────────────────────────────────────────────────────
  {
    id: 'misc_bazaar_flip',
    name: 'Bazaar Flipping',
    category: 'misc',
    icon: '📊',
    requirements: ['Any stage', '100k+ coins to start'],
    isUnlocked: _p => true,
    estimateCoinsPerHr: (p, _bz) => {
      // Scales with capital. Very rough: 5% margin on 1M = 50k/flip, 30 flips/hr
      const capital = Math.min(p.purseCoins + p.bankCoins, 50_000_000);
      return Math.round(capital * 0.03); // ~3% return/hr with active flipping
    },
    description: 'Buy orders + sell offers. Scales with starting capital. Very consistent.',
    tips: ['Look for items with >2% margin.', 'Unstackable items have less competition.', 'Check "Sell Price / Buy Price" ratio — aim for >1.02.', 'Set orders and come back every hour.'],
    difficulty: 3,
    consistency: 'consistent',
  },
  {
    id: 'misc_minions',
    name: 'Minion Farm (AFK Income)',
    category: 'misc',
    icon: '🏭',
    requirements: ['Any stage'],
    isUnlocked: _p => true,
    estimateCoinsPerHr: (p, _bz) => {
      // Rough: average T11 minion = ~12k coins/hr passively
      // Players typically have 5-25 minion slots
      const slotEstimate = Math.min(Math.floor(p.skyblockLevel / 10) + 5, 25);
      return slotEstimate * 15_000; // T11 minion estimate
    },
    description: 'Passive income while offline. Scales with number of minion slots.',
    tips: ['Best AFK minions: Diamond Minion, Lapis Minion (Enchanted), Gold Minion.', 'Super Compactor 3000 + Budget Hopper in each minion maximizes output.', 'Upgrade minions to T11 for best passive returns.', 'Compactor + Inferno upgrade doubles some output.'],
    difficulty: 1,
    consistency: 'consistent',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function categoryColor(cat: IncomeMethod['category']): string {
  return {
    farming:  'text-green-400 bg-green-400/10 border-green-400/20',
    mining:   'text-blue-400 bg-blue-400/10 border-blue-400/20',
    dungeons: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
    slayer:   'text-red-400 bg-red-400/10 border-red-400/20',
    fishing:  'text-sky-400 bg-sky-400/10 border-sky-400/20',
    misc:     'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  }[cat] ?? 'text-slate-400';
}

function consistencyBadge(c: IncomeMethod['consistency']): string {
  if (c === 'consistent') return 'text-green-300 bg-green-400/10';
  if (c === 'variable') return 'text-yellow-300 bg-yellow-400/10';
  return 'text-red-300 bg-red-400/10';
}

function difficultyStars(d: number): string {
  return '★'.repeat(d) + '☆'.repeat(5 - d);
}

function formatCoinsHr(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M/hr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k/hr`;
  return `${n}/hr`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MoneyPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { profile: profileId } = await searchParams;

  let profile: PlayerProfile | null = null;
  let error: string | null = null;
  let resolvedName = username;

  try {
    const resolved = await resolvePlayer(username);
    resolvedName = resolved.username;
    const { uuid } = resolved;

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
          <a href={`/player/${resolvedName}`} className="mt-6 inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 px-5 py-2 text-sm font-medium text-white">
            ← Back to Profile
          </a>
        </div>
      </div>
    );
  }

  // Fetch Bazaar prices and election data
  let bazaarMap: Record<string, number> = {};
  let bazaarFetchedAt: string | null = null;
  let bazaarItemCount = 0;
  let isFinnegan = false;
  try {
    const [prices, election] = await Promise.all([
      getBazaarPrices().catch(() => null),
      getElectionData().catch(() => null),
    ]);
    if (prices) {
      bazaarFetchedAt = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      for (const [id, p] of Object.entries(prices)) {
        bazaarMap[id] = (p as { sellPrice?: number; buyPrice?: number }).buyPrice ?? 0;
        bazaarItemCount++;
      }
    }
    isFinnegan = election?.currentMayor.name === 'Finnegan';
  } catch { /* non-fatal */ }

  // Evaluate all methods
  interface EvaluatedMethod extends IncomeMethod {
    coinsPerHr: number;
    unlocked: boolean;
  }

  const evaluated: EvaluatedMethod[] = INCOME_METHODS.map(method => ({
    ...method,
    coinsPerHr: method.estimateCoinsPerHr(profile!, bazaarMap),
    unlocked: method.isUnlocked(profile!),
  }));

  const unlocked = evaluated.filter(m => m.unlocked).sort((a, b) => b.coinsPerHr - a.coinsPerHr);
  const locked = evaluated.filter(m => !m.unlocked).sort((a, b) => b.coinsPerHr - a.coinsPerHr);

  const topMethod = unlocked[0] ?? null;

  const totalPassive = evaluated
    .filter(m => m.unlocked && m.id === 'misc_minions')
    .reduce((s, m) => s + m.coinsPerHr, 0);

  const currentCoins = (profile.purseCoins ?? 0) + (profile.bankCoins ?? 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href={`/player/${resolvedName}`} className="text-slate-400 hover:text-white text-sm">← Profile</a>
        <div>
          <h1 className="text-2xl font-bold text-white">Money Making</h1>
          <p className="text-slate-400 text-sm">{resolvedName} — Account-specific income analysis</p>
        </div>
      </div>

      {/* Finnegan alert */}
      {isFinnegan && (
        <div className="rounded-lg border border-orange-400/30 bg-orange-400/10 p-4 flex items-start gap-3">
          <span className="text-xl shrink-0">🔥</span>
          <div>
            <div className="font-semibold text-orange-300 mb-0.5">Mayor Finnegan is Active</div>
            <div className="text-sm text-orange-200/70">Pest Farming and Pelt Farming rates are doubled right now — 80M–90M/hr. If you have Garden Level 5+ and Farming 30+, this is your best method until the next mayor.</div>
          </div>
        </div>
      )}

      {/* Summary strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Current Coins</div>
          <div className="text-lg font-bold text-yellow-300">{formatCoins(currentCoins)}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Best Method</div>
          <div className="text-sm font-bold text-green-300">{topMethod?.name ?? '—'}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Peak Income</div>
          <div className="text-lg font-bold text-green-400">{topMethod ? formatCoinsHr(topMethod.coinsPerHr) : '—'}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Methods Unlocked</div>
          <div className="text-lg font-bold text-white">{unlocked.length}/{evaluated.length}</div>
        </div>
      </div>

      {/* Top Recommendation */}
      {topMethod && (
        <div className="card p-6 border border-green-500/30 bg-green-500/5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium text-green-400 uppercase tracking-wide mb-1">Best Method For You Right Now</div>
              <h2 className="text-xl font-bold text-white mb-1">{topMethod.icon} {topMethod.name}</h2>
              <p className="text-slate-300 text-sm mb-3">{topMethod.description}</p>
              <ul className="space-y-1">
                {topMethod.tips.map((tip, i) => (
                  <li key={i} className="text-sm text-slate-400 flex gap-2">
                    <span className="text-green-400 shrink-0">→</span>
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-right shrink-0">
              <div className="text-3xl font-bold text-green-400">{formatCoinsHr(topMethod.coinsPerHr)}</div>
              <div className="text-xs text-slate-400 mt-1">estimated</div>
              <div className={`text-xs mt-2 px-2 py-0.5 rounded-full inline-block ${consistencyBadge(topMethod.consistency)}`}>
                {topMethod.consistency}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unlocked Methods */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Unlocked Income Methods ({unlocked.length})</h2>
        <div className="space-y-3">
          {unlocked.map((method, rank) => (
            <div key={method.id} className="flex items-center gap-4 bg-slate-800/40 rounded-lg px-4 py-3">
              <div className="text-slate-500 text-sm font-mono w-6 text-right">#{rank + 1}</div>
              <div className="text-2xl w-8">{method.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-white text-sm">{method.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor(method.category)}`}>
                    {method.category}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${consistencyBadge(method.consistency)}`}>
                    {method.consistency}
                  </span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">{method.description}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-bold text-green-400 text-sm">{formatCoinsHr(method.coinsPerHr)}</div>
                <div className="text-xs text-yellow-400">{difficultyStars(method.difficulty)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Locked Methods */}
      {locked.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-1">Locked Methods — Unlock These Next</h2>
          <p className="text-slate-400 text-xs mb-4">Income estimates show potential once unlocked.</p>
          <div className="space-y-3">
            {locked.map(method => (
              <div key={method.id} className="flex items-center gap-4 bg-slate-800/20 rounded-lg px-4 py-3 opacity-60">
                <div className="text-2xl w-8 grayscale">{method.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-slate-300 text-sm">{method.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${categoryColor(method.category)}`}>
                      {method.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Requires: {method.requirements.join(', ')}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-slate-500 text-sm">{formatCoinsHr(method.coinsPerHr)}</div>
                  <div className="text-xs text-slate-500">locked</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Passive Income section */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Passive Income (AFK)</h2>
        <div className="bg-slate-800/40 rounded-lg px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-white font-medium text-sm">🏭 Minion Farm</div>
            <div className="text-xs text-slate-400 mt-0.5">Based on your SkyBlock level (minion slots estimate)</div>
            <div className="text-xs text-slate-500 mt-1">
              Upgrade minions to T11 + Super Compactor 3000 + Budget Hopper for maximum passive income.
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-yellow-400">{formatCoinsHr(totalPassive)}</div>
            <div className="text-xs text-slate-400">while offline</div>
          </div>
        </div>
      </div>

      {/* Progression Advice */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">How to Finance Upgrades</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            {
              title: 'Under 5M coins',
              icon: '🌱',
              advice: [
                'Focus on Bazaar flipping with small margins.',
                'Farm wheat or sugar cane — consistent and safe.',
                'Start Zombie Slayer T3 for Revenant Flesh income.',
                'T7-T11 minion upgrades pay off fast.',
              ],
            },
            {
              title: '5M – 30M coins',
              icon: '⚡',
              advice: [
                'Invest in Farming Fortune upgrades for crop income scaling.',
                'Push dungeons to F5 for Livid Dagger income.',
                'Spider Slayer T4 for Tarantula Silk income.',
                'Bazaar flip higher-value items with more capital.',
              ],
            },
            {
              title: '30M – 100M coins',
              icon: '🔥',
              advice: [
                'Run F7 dungeons — Necron pieces sell for 8M–30M each.',
                'Blaze Slayer T4/T5 for Mage Outfit drops.',
                'Gemstone mining with HOTM 7+ for consistent income.',
                'Invest in Hyperion or Terminator for faster clears.',
              ],
            },
            {
              title: '100M+ coins',
              icon: '👑',
              advice: [
                'Master Mode for Crimson Essence + top armor.',
                'Bazaar flip high-value items (millions in margin possible).',
                'Trophy fishing for rare 100M+ drops.',
                'Invest in full Kuudra progression for Fervor/Terror income.',
              ],
            },
          ].map(tier => (
            <div key={tier.title} className="bg-slate-800/40 rounded-lg p-4">
              <div className="text-sm font-semibold text-white mb-2">{tier.icon} {tier.title}</div>
              <ul className="space-y-1">
                {tier.advice.map((a, i) => (
                  <li key={i} className="text-xs text-slate-400 flex gap-2">
                    <span className="text-slate-600 shrink-0">•</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Live price banner */}
      <div className="rounded-lg border border-emerald-500/15 bg-emerald-500/5 px-4 py-3 flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-2 text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {bazaarFetchedAt
            ? `Live Bazaar prices loaded at ${bazaarFetchedAt} — ${bazaarItemCount} items tracked`
            : 'Bazaar prices unavailable — using fallback estimates'}
        </div>
        <span className="text-slate-600">Prices refresh on each page load</span>
      </div>

      {/* Disclaimer */}
      <div className="text-center text-xs text-slate-600 pb-4">
        Income estimates are approximate and vary based on gear, skill, Bazaar prices, and market conditions.
        All estimates assume active, optimized gameplay unless stated as passive/AFK.
      </div>
    </div>
  );
}
