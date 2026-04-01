import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { getBazaarPrices, getBazaarSellPrice } from '@/lib/api/bazaar';
import { PlayerProfile } from '@/lib/types/player';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Fishing Planner` };
}

// ─── Trophy Fish Data ─────────────────────────────────────────────────────────

interface TrophyFish {
  id: string;
  name: string;
  location: string;
  rarity: 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';
  bazaarId?: string;
  dropChance: string;
  notes: string;
}

const TROPHY_FISH: TrophyFish[] = [
  { id: 'SULPHER_SKITTER', name: 'Sulphur Skitter', location: 'Blazing Fortress', rarity: 'BRONZE', dropChance: 'Common', notes: 'Starter trophy fish.' },
  { id: 'OBFUSCATED_FISH_1', name: 'Obfuscated Fish', location: 'Various', rarity: 'BRONZE', dropChance: 'Common', notes: 'Counts toward fishing milestone.' },
  { id: 'STEAMING_HOT_FLOUNDER', name: 'Steaming-Hot Flounder', location: 'Blazing Fortress', rarity: 'SILVER', dropChance: 'Uncommon', notes: 'Mid-tier trophy fish.' },
  { id: 'GUSHER', name: 'Gusher', location: 'Blazing Fortress', rarity: 'SILVER', dropChance: 'Rare', notes: 'Rarer Blazing Fortress fish.' },
  { id: 'BLOBFISH', name: 'Blobfish', location: 'Deep Caverns', rarity: 'GOLD', dropChance: 'Very Rare', notes: 'Valuable gold trophy.' },
  { id: 'LAVAHORSE', name: 'Lavahorse', location: 'Blazing Fortress', rarity: 'GOLD', dropChance: 'Very Rare', notes: 'Fire-based trophy fish.' },
  { id: 'MANA_RAY', name: 'Mana Ray', location: 'The End', rarity: 'GOLD', dropChance: 'Rare', notes: 'End dimension fishing.' },
  { id: 'VANILLE', name: 'Vanille', location: 'Crimson Isle', rarity: 'GOLD', dropChance: 'Rare', notes: 'Crimson Isle trophy.' },
  { id: 'SKELETON_FISH', name: 'Skeleton Fish', location: 'Graveyard', rarity: 'GOLD', bazaarId: 'SKELETON_FISH', dropChance: 'Very Rare', notes: 'Valuable mid-game trophy.' },
  { id: 'GREAT_WHITE_SHARK', name: 'Great White Shark', location: 'Open Ocean', rarity: 'DIAMOND', bazaarId: 'GREAT_WHITE_SHARK_TOOTH', dropChance: 'Ultra Rare', notes: 'Most valuable common trophy. Tooth drops.' },
  { id: 'MOLDFIN', name: 'Moldfin', location: 'Mushroom Desert', rarity: 'DIAMOND', dropChance: 'Ultra Rare', notes: 'Desert area diamond trophy.' },
  { id: 'SLUGFISH', name: 'Slugfish', location: 'Mushroom Desert', rarity: 'DIAMOND', dropChance: 'Ultra Rare', notes: 'Rare diamond drop.' },
  { id: 'FLYFISH', name: 'Flyfish', location: 'Spider Den', rarity: 'DIAMOND', dropChance: 'Ultra Rare', notes: 'Spider Den diamond trophy.' },
];

// ─── Fishing Rod Tiers ────────────────────────────────────────────────────────

interface RodTier {
  name: string;
  tier: number;
  fishingPower: number;
  source: string;
  cost: string;
  notes: string;
}

const ROD_PROGRESSION: RodTier[] = [
  { name: 'Basic Rod', tier: 1, fishingPower: 0, source: 'Starter', cost: 'Free', notes: 'Starting rod. Replace immediately.' },
  { name: 'Fishing Rod', tier: 2, fishingPower: 10, source: 'Bazaar / Shops', cost: '~500', notes: 'Basic upgrade.' },
  { name: 'Decent Rod', tier: 3, fishingPower: 20, source: 'Bazaar', cost: '~5k', notes: 'Early game fishing.' },
  { name: 'Angler Rod', tier: 4, fishingPower: 40, source: 'Crafting', cost: '~50k', notes: 'Good early rod. Easy to craft.' },
  { name: 'Blessed Bait Rod', tier: 4, fishingPower: 45, source: 'Bazaar', cost: '~100k', notes: 'Nice for sea creatures.' },
  { name: 'Rod of the Sea', tier: 5, fishingPower: 65, source: 'Crafting', cost: '~500k', notes: 'Strong mid-game rod.' },
  { name: 'Rod of the Nexus', tier: 5, fishingPower: 75, source: 'AH', cost: '~1M', notes: 'Good AH purchase.' },
  { name: 'Challenging Rod', tier: 6, fishingPower: 80, source: 'Deep Caverns', cost: '~3M', notes: 'For sea creature farming.' },
  { name: 'Tactical Fishing Rod', tier: 6, fishingPower: 90, source: 'Fishing Festival', cost: '~5M', notes: 'Festival limited.' },
  { name: 'Hellfire Rod', tier: 7, fishingPower: 100, source: 'Blazing Fortress', cost: '~8M', notes: 'Best for Blazing Fortress trophy fishing.' },
  { name: 'Shining Compass', tier: 7, fishingPower: 110, source: 'AH', cost: '~15M', notes: 'Top-tier general rod.' },
  { name: 'Aurora Staff', tier: 8, fishingPower: 130, source: 'Kuudra', cost: '~30M+', notes: 'Endgame fishing rod.' },
];

// ─── Fishing Sea Creatures ────────────────────────────────────────────────────

const SEA_CREATURES = [
  { name: 'Sea Walker', hp: '1,000', requires: 'Any water', loot: 'Fishing XP', tier: 1 },
  { name: 'Night Squid', hp: '3,000', requires: 'Night / Deep ocean', loot: 'Ink Sack, Fishing XP', tier: 1 },
  { name: 'Guardian Defender', hp: '10,000', requires: 'Deep ocean', loot: 'Prismarine, XP', tier: 2 },
  { name: 'Deep Sea Protector', hp: '20,000', requires: 'Deep ocean', loot: 'Rod of the Sea mats', tier: 2 },
  { name: 'Sea Emperor', hp: '500,000', requires: 'Ocean, Fishing 15+', loot: 'Enchanted items, XP', tier: 3 },
  { name: 'Carrot King', hp: '2,000,000', requires: 'Farm / Garden', loot: 'Carrot Candy, farming items', tier: 3 },
  { name: 'Phantom Fisher', hp: '1,500,000', requires: 'Graveyard at night', loot: 'Phantom Rod mats, rare drops', tier: 4 },
  { name: 'Grim Reaper', hp: '7,500,000', requires: 'Graveyard, Fishing 20+', loot: 'Great White teeth, rare drops', tier: 4 },
  { name: 'Thunder', hp: '10,000,000', requires: 'Special spawn, Jerry / Festival', loot: 'Thunder Bottle, huge loot', tier: 5 },
  { name: 'Lord Jawbus', hp: '20,000,000', requires: 'Deep ocean, Fishing 24+', loot: 'Jawbus items, trophy fish', tier: 5 },
];

// ─── Fishing Fortune Sources ──────────────────────────────────────────────────

interface FFishingSource {
  name: string;
  current: number;
  max: number;
  category: string;
  tip: string;
}

function getFishingFortuneSources(profile: PlayerProfile): FFishingSource[] {
  return [
    {
      name: 'Fishing Skill',
      current: profile.skills.fishing * 4,
      max: 50 * 4,
      category: 'Skill',
      tip: `Level ${profile.skills.fishing}/50 — each level gives +4 HP (not Fishing Fortune)`,
    },
    {
      name: 'Pets (estimate)',
      current: (() => {
        const active = profile.pets.find(p => p.active);
        if (!active) return 0;
        if (active.type === 'FLYING_FISH') return Math.floor(active.level * 1.5);
        if (active.type === 'DOLPHIN') return Math.floor(active.level * 0.8);
        if (active.type === 'SQUID') return Math.floor(active.level * 0.5);
        return 0;
      })(),
      max: 300,
      category: 'Pet',
      tip: 'Flying Fish pet is best for Fishing Fortune. Dolphin good for sea creature spawn speed.',
    },
  ];
}

const RARITY_COLORS = {
  BRONZE:  'text-orange-300 border-orange-500/30 bg-orange-500/5',
  SILVER:  'text-slate-300 border-slate-400/30 bg-slate-400/5',
  GOLD:    'text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
  DIAMOND: 'text-sky-300 border-sky-500/30 bg-sky-500/5',
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function FishingPage({ params, searchParams }: Props) {
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

  let bazaarPrices = null;
  try { bazaarPrices = await getBazaarPrices(); } catch { /* non-fatal */ }

  const fishingLevel = profile.skills.fishing;
  const fishingXP = profile.skills.fishing_xp ?? 0;
  const ffSources = getFishingFortuneSources(profile);
  const totalFF = ffSources.reduce((s, f) => s + f.current, 0);
  const activePet = profile.pets.find(p => p.active);

  // Recommend best rod for fishing level
  const recommendedRod = ROD_PROGRESSION.filter(r => r.fishingPower <= fishingLevel * 2 + 20).pop()
    ?? ROD_PROGRESSION[0];

  // Sea creature kills from collections
  const seaWalkerKills = profile.collections['SEA_CREATURE_MEAT'] ?? 0;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <a href={`/player/${resolvedName}`} className="text-slate-400 hover:text-white text-sm">← Profile</a>
        <div>
          <h1 className="text-2xl font-bold text-white">Fishing Planner</h1>
          <p className="text-slate-400 text-sm">{resolvedName} — Trophy fish, sea creatures, rod progression</p>
        </div>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Fishing Level</div>
          <div className={`text-2xl font-bold ${fishingLevel >= 50 ? 'text-yellow-300' : fishingLevel >= 30 ? 'text-blue-300' : 'text-slate-200'}`}>{fishingLevel}</div>
          <div className="text-xs text-slate-500">/ 60</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Fishing Fortune</div>
          <div className="text-2xl font-bold text-sky-300">{totalFF}</div>
          <div className="text-xs text-slate-500">estimated</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Active Pet</div>
          <div className="text-sm font-bold text-white truncate">{activePet ? activePet.type : 'None'}</div>
          <div className="text-xs text-slate-500">{activePet ? `Lv ${activePet.level} ${activePet.tier}` : 'Equip a pet!'}</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-xs text-slate-400 mb-1">Recommended Rod</div>
          <div className="text-xs font-bold text-green-300 leading-tight">{recommendedRod.name}</div>
          <div className="text-xs text-slate-500">{recommendedRod.cost}</div>
        </div>
      </div>

      {/* Fishing Fortune Sources */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Fishing Fortune Sources</h2>
        <div className="space-y-3">
          {ffSources.map(src => (
            <div key={src.name}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-300">{src.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-xs">{src.category}</span>
                  <span className="text-sky-300 font-medium">{src.current} / {src.max}</span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-slate-700">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, (src.current / src.max) * 100)}%` }} />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{src.tip}</div>
            </div>
          ))}
        </div>

        {/* Pet recommendation */}
        <div className="mt-4 bg-slate-800/40 rounded-lg p-3 text-sm">
          <div className="text-white font-medium mb-1">Best Fishing Pets</div>
          <div className="space-y-1 text-xs text-slate-400">
            <div><span className="text-yellow-300">Flying Fish</span> — Best Fishing Fortune pet. Big multiplier.</div>
            <div><span className="text-blue-300">Dolphin</span> — Increases sea creature spawn rate (+% sea creatures). Great for income.</div>
            <div><span className="text-purple-300">Squid</span> — Intelligence-based, decent for fishing XP.</div>
            <div><span className="text-green-300">Ocelot</span> — Speed + Fishing Fortune at high levels.</div>
          </div>
        </div>
      </div>

      {/* Rod Progression */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Rod Progression</h2>
        <div className="space-y-2">
          {ROD_PROGRESSION.map((rod, i) => {
            const isRecommended = rod.name === recommendedRod.name;
            const isBetter = rod.fishingPower > recommendedRod.fishingPower;
            return (
              <div key={i} className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors
                ${isRecommended ? 'bg-green-500/10 border border-green-500/30' : isBetter ? 'bg-slate-800/30' : 'bg-slate-800/20 opacity-50'}`}>
                <div className={`w-16 shrink-0 text-xs font-mono ${isRecommended ? 'text-green-300' : isBetter ? 'text-slate-300' : 'text-slate-600'}`}>
                  +{rod.fishingPower}
                </div>
                <div className="flex-1">
                  <span className={`font-medium ${isRecommended ? 'text-green-200' : 'text-slate-200'}`}>{rod.name}</span>
                  {isRecommended && <span className="ml-2 text-xs text-green-400">← recommended</span>}
                </div>
                <div className="text-xs text-slate-500 shrink-0">{rod.source}</div>
                <div className="text-xs text-yellow-300 shrink-0">{rod.cost}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trophy Fish */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-1">Trophy Fish</h2>
        <p className="text-slate-400 text-xs mb-4">Trophy fishing requires a Trophy Fishing Rod or better. Each trophy fish caught counts toward milestones.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TROPHY_FISH.map(fish => {
            const price = fish.bazaarId && bazaarPrices
              ? getBazaarSellPrice(bazaarPrices, fish.bazaarId)
              : null;
            return (
              <div key={fish.id} className={`rounded-lg border px-3 py-2 ${RARITY_COLORS[fish.rarity]}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-sm font-medium">{fish.name}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{fish.location} · {fish.dropChance}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{fish.notes}</div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <div className="text-xs font-medium">{fish.rarity}</div>
                    {price !== null && price > 0 && (
                      <div className="text-xs text-yellow-300 mt-0.5">
                        {price >= 1_000_000 ? `${(price / 1_000_000).toFixed(1)}M` : `${Math.round(price / 1_000)}k`}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sea Creatures */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Sea Creatures</h2>
        <div className="space-y-2">
          {SEA_CREATURES.map(sc => (
            <div key={sc.name} className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm
              ${sc.tier >= 5 ? 'bg-purple-500/5 border border-purple-500/20' :
                sc.tier >= 4 ? 'bg-yellow-500/5 border border-yellow-500/20' :
                sc.tier >= 3 ? 'bg-blue-500/5 border border-blue-500/20' :
                'bg-slate-800/30'}`}>
              <div className="flex-1">
                <div className="font-medium text-white">{sc.name}</div>
                <div className="text-xs text-slate-400">Requires: {sc.requires}</div>
              </div>
              <div className="text-right text-xs shrink-0">
                <div className="text-red-300">{sc.hp} HP</div>
                <div className="text-slate-400 mt-0.5">{sc.loot}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade priority */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Upgrade Priority for {resolvedName}</h2>
        <div className="space-y-2 text-sm">
          {fishingLevel < 25 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 text-red-200">
              🎯 <strong>Priority:</strong> Reach Fishing Level 25 — unlocks sea creature upgrades and better trophy fish locations.
            </div>
          )}
          {!activePet && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 text-yellow-200">
              🐾 <strong>Equip a pet!</strong> A Dolphin or Flying Fish pet multiplies fishing income significantly.
            </div>
          )}
          {activePet && activePet.type !== 'FLYING_FISH' && activePet.type !== 'DOLPHIN' && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2 text-blue-200">
              🐬 Consider switching to a <strong>Dolphin pet</strong> (sea creature rate) or <strong>Flying Fish pet</strong> (fortune) for fishing.
            </div>
          )}
          {fishingLevel >= 20 && (
            <div className="bg-sky-500/10 border border-sky-500/20 rounded-lg px-3 py-2 text-sky-200">
              🎣 Fish in <strong>Blazing Fortress</strong> for Trophy Fish income — even Bronze drops count toward milestones.
            </div>
          )}
          {fishingLevel >= 30 && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-green-200">
              💰 <strong>Mob fishing</strong> in Graveyard/Deep Ocean for Grim Reaper spawns — Great White Shark Tooth drops are very valuable.
            </div>
          )}
          <div className="bg-slate-800/40 rounded-lg px-3 py-2 text-slate-300">
            💡 Use <strong>Blessed Bait</strong> and a high-tier rod together — bait type affects which sea creatures can spawn.
          </div>
          <div className="bg-slate-800/40 rounded-lg px-3 py-2 text-slate-300">
            📊 Fishing Festival events (periodic SkyBlock events) are the best time to fish — double drop rates, special sea creatures.
          </div>
        </div>
      </div>
    </div>
  );
}
