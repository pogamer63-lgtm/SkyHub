import { Metadata } from 'next';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile } from '@/lib/hypixel/parser';
import { PlayerProfile } from '@/lib/types/player';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ profile?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Mining / HOTM Planner` };
}

// ─── HOTM Node Definitions ────────────────────────────────────────────────────

interface HOTMNode {
  key: string;
  displayName: string;
  maxLevel: number;
  hotmRequired: number;
  /** What the node does per level */
  benefit: string;
  /** Powder type needed */
  powder: 'mithril' | 'gemstone' | 'glacite' | 'tokens';
  /** Powder cost per level (approximate) */
  powderPerLevel: number[];
  priority: 'essential' | 'high' | 'medium' | 'low';
}

const HOTM_NODES: HOTMNode[] = [
  // HOTM 1
  {
    key: 'mining_speed',
    displayName: 'Mining Speed',
    maxLevel: 5,
    hotmRequired: 1,
    benefit: '+20 Mining Speed per level',
    powder: 'mithril',
    powderPerLevel: [2, 4, 6, 8, 10],
    priority: 'essential',
  },
  {
    key: 'mining_fortune',
    displayName: 'Mining Fortune',
    maxLevel: 5,
    hotmRequired: 1,
    benefit: '+20 Mining Fortune per level',
    powder: 'mithril',
    powderPerLevel: [2, 4, 6, 8, 10],
    priority: 'essential',
  },
  // HOTM 2
  {
    key: 'forge_time',
    displayName: 'Quick Forge',
    maxLevel: 20,
    hotmRequired: 2,
    benefit: '-0.5% forge time per level (−10% max)',
    powder: 'mithril',
    powderPerLevel: [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80],
    priority: 'high',
  },
  {
    key: 'titanium_insanium',
    displayName: 'Titanium Insanium',
    maxLevel: 5,
    hotmRequired: 2,
    benefit: '+0.1% titanium chance per level',
    powder: 'mithril',
    powderPerLevel: [5, 10, 15, 20, 25],
    priority: 'medium',
  },
  // HOTM 3
  {
    key: 'daily_powder',
    displayName: 'Daily Powder',
    maxLevel: 5,
    hotmRequired: 3,
    benefit: '+36 daily powder commission cap per level',
    powder: 'tokens',
    powderPerLevel: [1, 1, 1, 1, 1],
    priority: 'high',
  },
  {
    key: 'luck_of_the_cave',
    displayName: 'Luck of the Cave',
    maxLevel: 45,
    hotmRequired: 3,
    benefit: '+0.05% extra drops chance per level',
    powder: 'mithril',
    powderPerLevel: new Array(45).fill(2),
    priority: 'low',
  },
  // HOTM 4
  {
    key: 'efficient_miner',
    displayName: 'Efficient Miner',
    maxLevel: 100,
    hotmRequired: 4,
    benefit: '+0.1% chance per level to mine extra block',
    powder: 'mithril',
    powderPerLevel: new Array(100).fill(4),
    priority: 'medium',
  },
  {
    key: 'professional',
    displayName: 'Professional',
    maxLevel: 140,
    hotmRequired: 4,
    benefit: '+50 Mining Speed in Dwarven Mines base, +1 per level',
    powder: 'mithril',
    powderPerLevel: new Array(140).fill(5),
    priority: 'high',
  },
  {
    key: 'front_loaded',
    displayName: 'Front Loaded',
    maxLevel: 1,
    hotmRequired: 4,
    benefit: '2× powder from first hour of mining per day',
    powder: 'tokens',
    powderPerLevel: [1],
    priority: 'high',
  },
  {
    key: 'mining_madness',
    displayName: 'Mining Madness',
    maxLevel: 1,
    hotmRequired: 4,
    benefit: 'Chance for bonus HOTM XP + powder on mine',
    powder: 'tokens',
    powderPerLevel: [1],
    priority: 'medium',
  },
  // HOTM 5
  {
    key: 'sky_mall',
    displayName: 'Sky Mall',
    maxLevel: 1,
    hotmRequired: 5,
    benefit: 'Daily random mining buff (Speed, Fortune, etc.)',
    powder: 'tokens',
    powderPerLevel: [1],
    priority: 'essential',
  },
  {
    key: 'precision_mining',
    displayName: 'Precision Mining',
    maxLevel: 1,
    hotmRequired: 5,
    benefit: '+30 Mining Speed when targeting ore veins',
    powder: 'tokens',
    powderPerLevel: [1],
    priority: 'high',
  },
  {
    key: 'great_explorer',
    displayName: 'Great Explorer',
    maxLevel: 20,
    hotmRequired: 5,
    benefit: '+2% treasure chest chance per level',
    powder: 'gemstone',
    powderPerLevel: new Array(20).fill(20),
    priority: 'medium',
  },
  {
    key: 'lonesome_miner',
    displayName: 'Lonesome Miner',
    maxLevel: 45,
    hotmRequired: 5,
    benefit: '+0.5% powder while mining solo per level',
    powder: 'mithril',
    powderPerLevel: new Array(45).fill(5),
    priority: 'low',
  },
  {
    key: 'powder_buff',
    displayName: 'Powder Buff',
    maxLevel: 50,
    hotmRequired: 5,
    benefit: '+1% all powder gained per level',
    powder: 'mithril',
    powderPerLevel: new Array(50).fill(5),
    priority: 'high',
  },
  // HOTM 6
  {
    key: 'fortunate',
    displayName: 'Fortunate',
    maxLevel: 20,
    hotmRequired: 6,
    benefit: '+4 Gemstone Fortune per level',
    powder: 'gemstone',
    powderPerLevel: new Array(20).fill(50),
    priority: 'high',
  },
  {
    key: 'gems_in_the_rough',
    displayName: 'Gems in the Rough',
    maxLevel: 100,
    hotmRequired: 6,
    benefit: '+1 extra gemstone per level (chance)',
    powder: 'gemstone',
    powderPerLevel: new Array(100).fill(25),
    priority: 'medium',
  },
  // HOTM 7
  {
    key: 'orbiter',
    displayName: 'Orbiter',
    maxLevel: 80,
    hotmRequired: 7,
    benefit: '+0.3% chance for bonus HOTM XP per level',
    powder: 'gemstone',
    powderPerLevel: new Array(80).fill(70),
    priority: 'low',
  },
  {
    key: 'goblin_killer',
    displayName: 'Goblin Killer',
    maxLevel: 1,
    hotmRequired: 7,
    benefit: 'Goblins drop extra powder',
    powder: 'tokens',
    powderPerLevel: [1],
    priority: 'medium',
  },
  // HOTM 8+
  {
    key: 'old_blood',
    displayName: 'Old Blood',
    maxLevel: 80,
    hotmRequired: 8,
    benefit: '+0.1% chance for extra tokens from bosses per level',
    powder: 'gemstone',
    powderPerLevel: new Array(80).fill(100),
    priority: 'low',
  },
  {
    key: 'mining_experience',
    displayName: 'Mining Experience',
    maxLevel: 100,
    hotmRequired: 8,
    benefit: '+0.1% HOTM XP gained per level',
    powder: 'gemstone',
    powderPerLevel: new Array(100).fill(100),
    priority: 'low',
  },
  {
    key: 'daily_grind',
    displayName: 'Daily Grind',
    maxLevel: 100,
    hotmRequired: 9,
    benefit: '+36 Glacite powder daily cap per level',
    powder: 'glacite',
    powderPerLevel: new Array(100).fill(75),
    priority: 'high',
  },
  {
    key: 'peak_of_the_mountain',
    displayName: 'Peak of the Mountain',
    maxLevel: 5,
    hotmRequired: 10,
    benefit: 'Legendary HOTM rewards (tokens, abilities)',
    powder: 'tokens',
    powderPerLevel: [1, 1, 1, 1, 1],
    priority: 'essential',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return n.toLocaleString();
}

function getTotalPowderCostToMax(node: HOTMNode, currentLevel: number): number {
  return node.powderPerLevel.slice(currentLevel).reduce((a, b) => a + b, 0);
}

function getPowderBalance(profile: PlayerProfile): Record<string, number> {
  return {
    mithril: profile.mining.powderMithril,
    gemstone: profile.mining.powderGemstone,
    glacite: profile.mining.powderGlacite,
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MiningPage({ params, searchParams }: Props) {
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

  const { mining } = profile;
  const powder = getPowderBalance(profile);
  const nodes = mining.hotmNodes;

  // Compute node status for nodes available at this HOTM level
  const availableNodes = HOTM_NODES.filter(n => n.hotmRequired <= mining.hotmLevel);
  const lockedNodes = HOTM_NODES.filter(n => n.hotmRequired > mining.hotmLevel);

  const nodeStatus = availableNodes.map(node => {
    const currentLevel = nodes[node.key] ?? 0;
    const isCapped = currentLevel >= node.maxLevel;
    const costToMax = isCapped ? 0 : getTotalPowderCostToMax(node, currentLevel);
    const canAfford =
      node.powder === 'tokens' ? true : powder[node.powder] >= (node.powderPerLevel[currentLevel] ?? 0);

    return { node, currentLevel, isCapped, costToMax, canAfford };
  });

  // Sort: essential uncapped first, then by priority
  const priorityOrder = { essential: 0, high: 1, medium: 2, low: 3 };
  const sorted = [...nodeStatus].sort((a, b) => {
    if (a.isCapped !== b.isCapped) return a.isCapped ? 1 : -1;
    return priorityOrder[a.node.priority] - priorityOrder[b.node.priority];
  });

  // Next upgrades: non-capped essential/high nodes you can afford
  const nextUpgrades = sorted
    .filter(s => !s.isCapped && (s.node.priority === 'essential' || s.node.priority === 'high'))
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <a href={`/player/${profile.username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {profile.username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Mining / HOTM Planner</h1>
        <span className="ml-auto rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs text-sky-300">
          {profile.profileName}
        </span>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <StatCard label="HOTM Level" value={`${mining.hotmLevel}/10`} color="text-sky-300" />
        <StatCard label="Mithril" value={formatNum(mining.powderMithril)} color="text-cyan-300" />
        <StatCard label="Gemstone" value={formatNum(mining.powderGemstone)} color="text-purple-300" />
        <StatCard label="Glacite" value={formatNum(mining.powderGlacite)} color="text-blue-300" />
        <StatCard
          label="Tokens Available"
          value={`${(mining.hotmNodes.tokens ?? 0)}`}
          color="text-yellow-300"
        />
      </div>

      {/* Priority Upgrades */}
      {nextUpgrades.length > 0 && (
        <div className="card p-5 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            ⚡ Priority Upgrades
            <span className="text-xs font-normal text-slate-500">essential + high nodes</span>
          </h2>
          <div className="space-y-2.5">
            {nextUpgrades.map(({ node, currentLevel, costToMax }) => (
              <div
                key={node.key}
                className={`rounded-lg border p-3 ${
                  node.priority === 'essential'
                    ? 'border-red-500/20 bg-red-500/5'
                    : 'border-yellow-500/20 bg-yellow-500/5'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm text-white font-medium">{node.displayName}</span>
                      <span className={`rounded-full border px-1.5 py-0.5 text-xs ${
                        node.priority === 'essential'
                          ? 'border-red-500/30 text-red-400'
                          : 'border-yellow-500/30 text-yellow-400'
                      }`}>
                        {node.priority}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">{node.benefit}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-white font-medium">
                      {currentLevel}/{node.maxLevel}
                    </div>
                    <div className="text-xs text-slate-500">
                      {node.powder === 'tokens'
                        ? `${node.maxLevel - currentLevel} tokens to max`
                        : `${formatNum(costToMax)} ${node.powder} to max`}
                    </div>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-sky-500"
                    style={{ width: `${(currentLevel / node.maxLevel) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Nodes Table */}
      <div className="card p-5 mb-6">
        <h2 className="font-semibold text-white mb-4">⛏ All HOTM Nodes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs">
                <th className="text-left pb-2 font-medium">Node</th>
                <th className="text-center pb-2 font-medium">Level</th>
                <th className="text-center pb-2 font-medium">Progress</th>
                <th className="text-left pb-2 font-medium pl-4">Benefit</th>
                <th className="text-right pb-2 font-medium">Cost to Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sorted.map(({ node, currentLevel, isCapped, costToMax }) => (
                <tr key={node.key} className={isCapped ? 'opacity-40' : ''}>
                  <td className="py-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        node.priority === 'essential' ? 'bg-red-400' :
                        node.priority === 'high' ? 'bg-yellow-400' :
                        node.priority === 'medium' ? 'bg-slate-400' :
                        'bg-slate-600'
                      }`} />
                      <span className="text-white font-medium">{node.displayName}</span>
                      {isCapped && <span className="text-xs text-emerald-400">✓ MAX</span>}
                    </div>
                  </td>
                  <td className="py-2.5 text-center font-mono text-slate-300">
                    {currentLevel}/{node.maxLevel}
                  </td>
                  <td className="py-2.5 px-4">
                    <div className="w-16 h-1 rounded-full bg-white/5 mx-auto">
                      <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${(currentLevel / node.maxLevel) * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="py-2.5 pl-4 text-slate-400 text-xs max-w-[200px]">{node.benefit}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-slate-500">
                    {isCapped ? '—' : node.powder === 'tokens'
                      ? `${node.maxLevel - currentLevel} tokens`
                      : `${formatNum(costToMax)} ${node.powder.slice(0, 3)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Locked Nodes */}
      {lockedNodes.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-slate-500 mb-3 text-sm">
            🔒 Locked (HOTM {mining.hotmLevel + 1}+ required)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {lockedNodes.map(node => (
              <div key={node.key} className="rounded-lg border border-white/5 p-2.5 opacity-40">
                <div className="text-xs text-slate-400 font-medium">{node.displayName}</div>
                <div className="text-xs text-slate-600 mt-0.5">HOTM {node.hotmRequired} required</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-Components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card p-4 text-center">
      <div className={`text-xl font-bold ${color}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
