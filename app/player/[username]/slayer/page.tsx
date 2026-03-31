import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { getBazaarPrices, getBazaarBuyPrice, BazaarPrices } from '@/lib/api/bazaar';
import { PlayerProfile, SlayerInfo } from '@/lib/types/player';
import ItemIcon from '@/components/ItemIcon';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Slayer Planner` };
}

// ─── Slayer Data Definitions ──────────────────────────────────────────────────

interface SlayerBossConfig {
  key: keyof PlayerProfile['slayers'];
  name: string;
  emoji: string;
  bossIconId?: string;
  color: string;
  borderColor: string;
  /** XP needed to reach each level (cumulative) */
  xpBreakpoints: number[];
  maxLevel: number;
  tiers: SlayerTierInfo[];
  /** Bazaar item ID for main drop (for cost estimates) */
  mainDropBazaarId?: string;
  /** Approximate coins per run at each tier */
  coinsPerRun: number[];
}

interface SlayerTierInfo {
  tier: number;
  name: string;
  minCombat: number;
  rewardHighlight: string;
  unlockLevel: number; // slayer level required to unlock
}

interface SlayerReward {
  level: number;
  reward: string;
  important: boolean;
}

const SLAYER_BOSSES: SlayerBossConfig[] = [
  {
    key: 'zombie',
    name: 'Revenant Horror',
    emoji: '🧟',
    bossIconId: 'REVENANT_HORROR',
    color: 'text-green-300',
    borderColor: 'border-green-500/20',
    xpBreakpoints: [5, 15, 200, 1000, 5000, 20000, 100000, 400000, 1000000],
    maxLevel: 9,
    mainDropBazaarId: 'REVENANT_FLESH',
    coinsPerRun: [1000, 3000, 8000, 25000, 80000],
    tiers: [
      { tier: 1, name: 'T1', minCombat: 0,  rewardHighlight: 'Revenant Flesh',    unlockLevel: 0 },
      { tier: 2, name: 'T2', minCombat: 0,  rewardHighlight: 'Undead Catalyst',    unlockLevel: 1 },
      { tier: 3, name: 'T3', minCombat: 0,  rewardHighlight: 'Revenant Catalyst',  unlockLevel: 2 },
      { tier: 4, name: 'T4', minCombat: 0,  rewardHighlight: 'Scythe Blade',       unlockLevel: 3 },
      { tier: 5, name: 'T5', minCombat: 0,  rewardHighlight: 'Revenant Catalyst+', unlockLevel: 5 },
    ],
  },
  {
    key: 'spider',
    name: 'Tarantula Broodfather',
    emoji: '🕷️',
    bossIconId: 'TARANTULA_BROODFATHER',
    color: 'text-orange-300',
    borderColor: 'border-orange-500/20',
    xpBreakpoints: [5, 25, 200, 1000, 5000, 20000, 100000, 400000, 1000000],
    maxLevel: 9,
    mainDropBazaarId: 'TARANTULA_WEB',
    coinsPerRun: [1500, 4000, 10000, 30000, 90000],
    tiers: [
      { tier: 1, name: 'T1', minCombat: 0,  rewardHighlight: 'Tarantula Web',     unlockLevel: 0 },
      { tier: 2, name: 'T2', minCombat: 0,  rewardHighlight: 'Spider Catalyst',   unlockLevel: 1 },
      { tier: 3, name: 'T3', minCombat: 0,  rewardHighlight: 'Digested Mosquito', unlockLevel: 2 },
      { tier: 4, name: 'T4', minCombat: 0,  rewardHighlight: 'Tarantula Talisman',unlockLevel: 3 },
    ],
  },
  {
    key: 'wolf',
    name: 'Sven Packmaster',
    emoji: '🐺',
    bossIconId: 'SVEN_PACKMASTER',
    color: 'text-blue-300',
    borderColor: 'border-blue-500/20',
    xpBreakpoints: [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000],
    maxLevel: 9,
    mainDropBazaarId: 'WOLF_TOOTH',
    coinsPerRun: [2000, 5000, 14000, 40000, 100000],
    tiers: [
      { tier: 1, name: 'T1', minCombat: 0,  rewardHighlight: 'Wolf Tooth',        unlockLevel: 0 },
      { tier: 2, name: 'T2', minCombat: 0,  rewardHighlight: 'Wolf Fur',          unlockLevel: 1 },
      { tier: 3, name: 'T3', minCombat: 0,  rewardHighlight: 'Spirit Rune',       unlockLevel: 2 },
      { tier: 4, name: 'T4', minCombat: 0,  rewardHighlight: 'Couture Rune',      unlockLevel: 3 },
    ],
  },
  {
    key: 'enderman',
    name: 'Voidgloom Seraph',
    emoji: '🌑',
    bossIconId: 'VOIDGLOOM_SERAPH',
    color: 'text-purple-300',
    borderColor: 'border-purple-500/20',
    xpBreakpoints: [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000],
    maxLevel: 9,
    mainDropBazaarId: 'SUMMONING_EYE',
    coinsPerRun: [3000, 8000, 20000, 60000, 150000],
    tiers: [
      { tier: 1, name: 'T1', minCombat: 0,  rewardHighlight: 'Null Atom',         unlockLevel: 0 },
      { tier: 2, name: 'T2', minCombat: 0,  rewardHighlight: 'Summoning Eye',     unlockLevel: 1 },
      { tier: 3, name: 'T3', minCombat: 0,  rewardHighlight: 'Judgement Core',    unlockLevel: 2 },
      { tier: 4, name: 'T4', minCombat: 0,  rewardHighlight: 'Wither Catalyst',   unlockLevel: 3 },
    ],
  },
  {
    key: 'blaze',
    name: 'Inferno Demonlord',
    emoji: '🔥',
    bossIconId: 'INFERNO_DEMONLORD',
    color: 'text-red-300',
    borderColor: 'border-red-500/20',
    xpBreakpoints: [10, 30, 250, 1500, 5000, 20000, 100000, 400000, 1000000],
    maxLevel: 9,
    mainDropBazaarId: 'BLAZE_ROD',
    coinsPerRun: [5000, 12000, 30000, 80000, 200000],
    tiers: [
      { tier: 1, name: 'T1', minCombat: 0,  rewardHighlight: 'Blaze Rune',        unlockLevel: 0 },
      { tier: 2, name: 'T2', minCombat: 0,  rewardHighlight: 'Mage Blood',        unlockLevel: 1 },
      { tier: 3, name: 'T3', minCombat: 0,  rewardHighlight: 'Demonlord material',unlockLevel: 2 },
      { tier: 4, name: 'T4', minCombat: 0,  rewardHighlight: 'Kuudra Eye',        unlockLevel: 3 },
    ],
  },
  {
    key: 'vampire',
    name: 'Riftstalker Bloodfiend',
    emoji: '🧛',
    color: 'text-rose-300',
    borderColor: 'border-rose-500/20',
    xpBreakpoints: [20, 75, 240, 840, 2400],
    maxLevel: 5,
    coinsPerRun: [2000, 6000, 15000, 40000, 100000],
    tiers: [
      { tier: 1, name: 'T1', minCombat: 0, rewardHighlight: 'Rift Bell',          unlockLevel: 0 },
      { tier: 2, name: 'T2', minCombat: 0, rewardHighlight: 'Vampire Rune',       unlockLevel: 1 },
      { tier: 3, name: 'T3', minCombat: 0, rewardHighlight: 'Adrenaline Stone',   unlockLevel: 2 },
      { tier: 4, name: 'T4', minCombat: 0, rewardHighlight: 'Hamster Wheel',      unlockLevel: 3 },
      { tier: 5, name: 'T5', minCombat: 0, rewardHighlight: 'Viper Fang',         unlockLevel: 4 },
    ],
  },
];

const SLAYER_REWARDS: Record<string, SlayerReward[]> = {
  zombie: [
    { level: 1, reward: 'Revenant Armor craftable',     important: false },
    { level: 2, reward: 'Undead Catalyst drops',         important: false },
    { level: 3, reward: 'Revenant Catalyst drops',       important: true  },
    { level: 4, reward: 'Scythe Blade drops, Leaping Sword', important: true },
    { level: 5, reward: 'T5 boss, Revenant Armor (full)', important: true },
    { level: 6, reward: 'Beheaded Horror drops',         important: false },
    { level: 7, reward: 'Pestilence Rune drops',         important: false },
    { level: 8, reward: 'Undead Sword craftable',        important: true  },
    { level: 9, reward: 'Max level',                     important: false },
  ],
  spider: [
    { level: 1, reward: 'Tarantula Armor craftable',     important: false },
    { level: 2, reward: 'Spider Catalyst drops',         important: false },
    { level: 3, reward: 'Digested Mosquito drops',       important: true  },
    { level: 4, reward: 'Tarantula Talisman',            important: true  },
    { level: 5, reward: 'Spider Boots / Tarantula full', important: true  },
  ],
  wolf: [
    { level: 1, reward: 'Wolf Armor craftable',          important: false },
    { level: 2, reward: 'Wolf Fur drops',                important: false },
    { level: 3, reward: 'Spirit Rune drops',             important: true  },
    { level: 4, reward: 'Couture Rune, Wolf full set',   important: true  },
    { level: 5, reward: 'Wolp upgrade materials',        important: false },
  ],
  enderman: [
    { level: 1, reward: 'Null Sphere / Atom drops',      important: false },
    { level: 2, reward: 'Summoning Eye drops',           important: true  },
    { level: 3, reward: 'Judgement Core',                important: true  },
    { level: 4, reward: 'Wither armor craftable',        important: true  },
    { level: 5, reward: 'Endersnake drops',              important: false },
  ],
  blaze: [
    { level: 1, reward: 'Blaze armor craftable',         important: false },
    { level: 2, reward: 'Mage Blood drops',              important: true  },
    { level: 3, reward: 'Demonlord materials',           important: false },
    { level: 4, reward: 'Kuudra Eye drops, Demonlord full', important: true },
    { level: 5, reward: 'Crimson armor mats',            important: false },
  ],
  vampire: [
    { level: 1, reward: 'Rift Bell craftable',           important: false },
    { level: 2, reward: 'Vampire Fang drops',            important: false },
    { level: 3, reward: 'Adrenaline Stone',              important: true  },
    { level: 4, reward: 'Hamster Wheel',                 important: true  },
    { level: 5, reward: 'Viper Fang, Rift max',          important: true  },
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getXPToNextLevel(config: SlayerBossConfig, slayer: SlayerInfo): number | null {
  const { xpBreakpoints, maxLevel } = config;
  if (slayer.level >= maxLevel) return null;
  return xpBreakpoints[slayer.level] - slayer.xp;
}

function getLevelProgress(config: SlayerBossConfig, slayer: SlayerInfo): number {
  if (slayer.level >= config.maxLevel) return 100;
  const currentXP = slayer.xp;
  const prevBreak = slayer.level > 0 ? config.xpBreakpoints[slayer.level - 1] : 0;
  const nextBreak = config.xpBreakpoints[slayer.level];
  if (nextBreak <= prevBreak) return 100;
  return Math.min(100, ((currentXP - prevBreak) / (nextBreak - prevBreak)) * 100);
}

function estimateRunsToNextLevel(config: SlayerBossConfig, slayer: SlayerInfo): number | null {
  const xpNeeded = getXPToNextLevel(config, slayer);
  if (xpNeeded === null || xpNeeded <= 0) return null;
  // XP per run depends on tier — T1: ~5, T2: ~25, T3: ~100, T4: ~350, T5: ~1200
  const xpPerRun = [5, 25, 100, 350, 1200];
  const bestTier = Math.min(config.tiers.length, slayer.level + 1) - 1;
  const rate = xpPerRun[bestTier] ?? 100;
  return Math.ceil(xpNeeded / rate);
}

function getMainDropPrice(config: SlayerBossConfig, bazaar: BazaarPrices | null): number | null {
  if (!config.mainDropBazaarId || !bazaar) return null;
  const price = getBazaarBuyPrice(bazaar, config.mainDropBazaarId);
  return price > 0 ? price : null;
}

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function SlayerPage({ params, searchParams }: Props) {
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
      let targetProfile = profilesRes.profiles.find(
        p => p.profile_id === profileId || p.cute_name.toLowerCase() === profileId?.toLowerCase()
      );
      if (!targetProfile) targetProfile = profilesRes.profiles.find(p => p.selected) ?? profilesRes.profiles[0];
      profile = selectBestProfile([targetProfile], uuid, resolvedName);
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

  const bazaar = await getBazaarPrices().catch(() => null);
  const { slayers, skills } = profile;

  // Compute total slayer XP across all bosses
  const totalSlayerXP = Object.values(slayers).reduce((sum, s) => sum + s.xp, 0);
  const highestLevel = Math.max(...Object.values(slayers).map(s => s.level));

  // Determine most urgent slayer to level
  const priorityBoss = SLAYER_BOSSES.reduce<SlayerBossConfig | null>((best, cfg) => {
    const slayer = slayers[cfg.key];
    if (!best) return cfg;
    const bestSlayer = slayers[best.key];
    // Prioritize: low-level bosses first (zombie → spider → wolf → enderman)
    if (slayer.level < bestSlayer.level && slayer.level < cfg.maxLevel) return cfg;
    return best;
  }, null);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Slayer Planner</h1>
        <span className="ml-auto rounded-full border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-300">
          {profile.profileName}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Slayer XP" value={formatNum(totalSlayerXP)} color="text-white" />
        <StatCard label="Highest Level" value={`${highestLevel}`} color="text-yellow-300" />
        <StatCard label="Combat Level" value={`${skills.combat}`} color="text-red-300" />
        <StatCard label="Active Bosses" value={`${SLAYER_BOSSES.filter(b => slayers[b.key].xp > 0).length}/6`} color="text-slate-300" />
      </div>

      {/* Each Slayer Boss */}
      {SLAYER_BOSSES.map(config => {
        const slayer = slayers[config.key];
        const progress = getLevelProgress(config, slayer);
        const xpToNext = getXPToNextLevel(config, slayer);
        const runsToNext = estimateRunsToNextLevel(config, slayer);
        const dropPrice = getMainDropPrice(config, bazaar);
        const rewards = SLAYER_REWARDS[config.key as string] ?? [];
        const nextRewards = rewards.filter(r => r.level > slayer.level).slice(0, 3);
        const maxed = slayer.level >= config.maxLevel;

        return (
          <div key={config.key} className={`card p-5 mb-4 ${slayer.level > 0 ? '' : 'opacity-60'}`}>
            {/* Boss Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {config.bossIconId ? (
                  <ItemIcon itemId={config.bossIconId} size={32} useModel={false} />
                ) : (
                  <span className="text-2xl">{config.emoji}</span>
                )}
                <div>
                  <h2 className={`font-semibold ${config.color}`}>{config.name}</h2>
                  <div className="text-xs text-slate-500">{formatNum(slayer.xp)} XP</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">Lv {slayer.level}</div>
                <div className="text-xs text-slate-500">/ {config.maxLevel}</div>
              </div>
            </div>

            {/* XP Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Level {slayer.level} → {maxed ? 'MAX' : slayer.level + 1}</span>
                {xpToNext !== null && <span>{formatNum(xpToNext)} XP to next</span>}
                {maxed && <span className="text-emerald-400">MAX LEVEL</span>}
              </div>
              <div className="h-2 rounded-full bg-white/5">
                <div
                  className={`h-full rounded-full ${maxed ? 'bg-emerald-500' : 'bg-indigo-500'} transition-all`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {runsToNext !== null && (
                <div className="text-xs text-slate-600 mt-1">
                  ~{runsToNext} runs at best available tier
                </div>
              )}
            </div>

            {/* Tier Grid + Rewards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tier Status */}
              <div>
                <div className="text-xs text-slate-500 font-medium mb-2">Tiers</div>
                <div className="flex gap-2 flex-wrap">
                  {config.tiers.map(tier => {
                    const unlocked = slayer.level >= tier.unlockLevel;
                    const killKey = `tier_${tier.tier}`;
                    const kills = slayer.kills[killKey] ?? 0;
                    return (
                      <div
                        key={tier.tier}
                        className={`rounded-lg border px-3 py-2 text-center min-w-[60px] ${
                          unlocked
                            ? `${config.borderColor} bg-white/3`
                            : 'border-white/5 opacity-40'
                        }`}
                      >
                        <div className={`text-sm font-bold ${unlocked ? config.color : 'text-slate-600'}`}>
                          T{tier.tier}
                        </div>
                        <div className="text-xs text-slate-500">{kills} kills</div>
                        {!unlocked && <div className="text-xs text-slate-600">Lv {tier.unlockLevel}</div>}
                      </div>
                    );
                  })}
                </div>
                {dropPrice && (
                  <div className="mt-2 text-xs text-slate-500">
                    Main drop: <span className="text-yellow-300">{formatNum(dropPrice)} coins</span> / unit (Bazaar)
                  </div>
                )}
              </div>

              {/* Next Rewards */}
              {nextRewards.length > 0 && (
                <div>
                  <div className="text-xs text-slate-500 font-medium mb-2">Upcoming Rewards</div>
                  <div className="space-y-1.5">
                    {nextRewards.map(r => (
                      <div
                        key={r.level}
                        className={`rounded border px-2.5 py-1.5 text-xs ${
                          r.important
                            ? 'border-yellow-500/20 bg-yellow-500/5 text-yellow-300'
                            : 'border-white/5 text-slate-400'
                        }`}
                      >
                        <span className="font-medium">Level {r.level}:</span> {r.reward}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {maxed && (
                <div className="flex items-center justify-center">
                  <span className="text-emerald-400 text-sm font-medium">✓ All rewards unlocked</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Progression Guide */}
      <div className="card p-5">
        <h2 className="font-semibold text-white mb-4">📋 Recommended Progression Order</h2>
        <ol className="space-y-2">
          {[
            { step: 1, text: 'Zombie Slayer 1-5 → unlocks Revenant Armor (best early defense)',     done: slayers.zombie.level >= 5 },
            { step: 2, text: 'Spider Slayer 1-4 → Tarantula Armor (strong mid-game set)',           done: slayers.spider.level >= 4 },
            { step: 3, text: 'Wolf Slayer 1-4 → Wolf Armor + Spirit Rune',                          done: slayers.wolf.level >= 4 },
            { step: 4, text: 'Enderman Slayer 1-4 → Summoning Eyes + Wither Armor pathway',         done: slayers.enderman.level >= 4 },
            { step: 5, text: 'Zombie Slayer 7-9 → Reaper Scythe + endgame zombie drops',           done: slayers.zombie.level >= 7 },
            { step: 6, text: 'Blaze Slayer 1-4 → Kuudra Eyes + Demonlord set',                     done: slayers.blaze.level >= 4 },
            { step: 7, text: 'All slayers to max for completionist / best drops',                   done: highestLevel >= 9 },
          ].map(({ step, text, done }) => (
            <li key={step} className={`flex items-start gap-3 text-sm ${done ? 'opacity-40' : ''}`}>
              <span className={`rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 ${
                done ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-slate-400'
              }`}>
                {done ? '✓' : step}
              </span>
              <span className={done ? 'line-through text-slate-600' : 'text-slate-300'}>{text}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
