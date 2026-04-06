import { Metadata } from 'next';
import { REFORGE_STONES, ReforgeStone } from '@/lib/neu/data';

interface Props {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ type?: string; stat?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  return { title: `${username} — Reforge Advisor` };
}

// ─── Config ────────────────────────────────────────────────────────────────────

const ITEM_TYPE_LABELS: Record<string, string> = {
  SWORD:     '⚔️ Sword',
  BOW:       '🏹 Bow',
  ARMOR:     '🛡️ Armor',
  HELMET:    '⛑️ Helmet',
  PICKAXE:   '⛏ Pickaxe',
  AXE:       '🪓 Axe',
  HOE:       '🌾 Hoe',
  EQUIPMENT: '💍 Equipment',
  FISHING_ROD: '🎣 Fishing Rod',
};

const STAT_LABELS: Record<string, string> = {
  strength: 'Strength',
  crit_damage: 'Crit Damage',
  crit_chance: 'Crit Chance',
  intelligence: 'Intelligence',
  defense: 'Defense',
  health: 'Health',
  speed: 'Speed',
  magic_find: 'Magic Find',
  ferocity: 'Ferocity',
  mining_fortune: 'Mining Fortune',
  farming_fortune: 'Farming Fortune',
  foraging_fortune: 'Foraging Fortune',
  fishing_fortune: 'Fishing Fortune',
  mining_speed: 'Mining Speed',
};

const RARITY_ORDER = ['COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC', 'DIVINE'];

const RARITY_COLORS: Record<string, string> = {
  COMMON:   'text-slate-300',
  UNCOMMON: 'text-green-300',
  RARE:     'text-blue-300',
  EPIC:     'text-purple-300',
  LEGENDARY:'text-yellow-300',
  MYTHIC:   'text-pink-300',
  DIVINE:   'text-cyan-300',
};

function formatCoins(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

function getItemTypes(s: ReforgeStone): string[] {
  if (Array.isArray(s.itemTypes)) return s.itemTypes;
  return s.itemTypes.split(',').map(t => t.trim());
}

// Get unique item types from all reforge stones
const ALL_TYPES = [...new Set(
  REFORGE_STONES.flatMap(s => getItemTypes(s))
)].sort();

// Get all unique stats across all reforges
const ALL_STATS = [...new Set(
  REFORGE_STONES.flatMap(s =>
    Object.values(s.reforgeStats ?? {}).flatMap(rarityStats => Object.keys(rarityStats))
  )
)].sort();

export default async function ReforgesPage({ params, searchParams }: Props) {
  const { username } = await params;
  const { type: filterType, stat: filterStat } = await searchParams;

  // Filter reforges by item type
  const filtered: ReforgeStone[] = filterType
    ? REFORGE_STONES.filter(s => getItemTypes(s).includes(filterType))
    : REFORGE_STONES;

  // Sort by highest stat value at LEGENDARY rarity if filtering by stat
  const sorted = filterStat
    ? [...filtered].sort((a, b) => {
        const aVal = (a.reforgeStats?.['LEGENDARY'] ?? {})[filterStat] ?? 0;
        const bVal = (b.reforgeStats?.['LEGENDARY'] ?? {})[filterStat] ?? 0;
        return bVal - aVal;
      })
    : [...filtered].sort((a, b) => a.reforgeName.localeCompare(b.reforgeName));

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <a href={`/player/${username}`} className="text-slate-400 hover:text-white text-sm transition-colors">
          ← {username}
        </a>
        <span className="text-slate-600">/</span>
        <h1 className="text-white font-semibold">Reforge Advisor</h1>
        <span className="text-xs text-slate-500 ml-2">{sorted.length} reforges</span>
      </div>

      {/* Filters */}
      <div className="card p-4 space-y-3">
        <div>
          <div className="text-xs text-slate-500 mb-2">Filter by Item Type</div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/player/${username}/reforges${filterStat ? `?stat=${filterStat}` : ''}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${!filterType ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
            >
              All
            </a>
            {ALL_TYPES.map(type => (
              <a
                key={type}
                href={`/player/${username}/reforges?type=${type}${filterStat ? `&stat=${filterStat}` : ''}`}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${filterType === type ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
              >
                {ITEM_TYPE_LABELS[type] ?? type}
              </a>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs text-slate-500 mb-2">Sort by Stat (at LEGENDARY)</div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`/player/${username}/reforges${filterType ? `?type=${filterType}` : ''}`}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${!filterStat ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
            >
              Default
            </a>
            {ALL_STATS.filter(s => s in STAT_LABELS).map(stat => (
              <a
                key={stat}
                href={`/player/${username}/reforges?stat=${stat}${filterType ? `&type=${filterType}` : ''}`}
                className={`rounded-full border px-3 py-1 text-xs transition-colors ${filterStat === stat ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300' : 'border-white/10 text-slate-400 hover:border-white/30 hover:text-white'}`}
              >
                {STAT_LABELS[stat]}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Reforge Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(stone => {
          const legendaryStats = stone.reforgeStats?.['LEGENDARY'] ?? {};
          const epicStats = stone.reforgeStats?.['EPIC'] ?? {};
          const displayRarities = RARITY_ORDER.filter(r => stone.requiredRarities.includes(r));

          return (
            <div key={stone.internalName} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-white font-semibold">{stone.reforgeName}</div>
                  <div className="text-xs text-slate-500">{getItemTypes(stone).join(', ')} · {stone.reforgeType.split('/').pop()}</div>
                </div>
                {filterStat && (legendaryStats[filterStat] ?? 0) > 0 && (
                  <div className="text-yellow-300 font-bold text-sm">
                    +{legendaryStats[filterStat]} {STAT_LABELS[filterStat] ?? filterStat}
                  </div>
                )}
              </div>

              {/* Stats at LEGENDARY */}
              {Object.keys(legendaryStats).length > 0 && (
                <div className="mb-3">
                  <div className="text-xs text-slate-500 mb-1">At LEGENDARY</div>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(legendaryStats).map(([stat, val]) => (
                      <span key={stat} className={`text-xs rounded px-1.5 py-0.5 bg-slate-800/60 ${
                        filterStat === stat ? 'text-yellow-300' : 'text-slate-300'
                      }`}>
                        +{val} {STAT_LABELS[stat] ?? stat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cost at LEGENDARY */}
              {stone.reforgeCosts?.['LEGENDARY'] && (
                <div className="text-xs text-amber-300 mb-2">
                  Cost: {formatCoins(stone.reforgeCosts['LEGENDARY'])} at LEG
                </div>
              )}

              {/* Rarity range */}
              <div className="flex gap-1 flex-wrap">
                {displayRarities.map(r => (
                  <span key={r} className={`text-xs ${RARITY_COLORS[r] ?? 'text-slate-400'}`}>
                    {r.slice(0, 3)}
                  </span>
                ))}
              </div>

              {/* Ability note */}
              {stone.reforgeAbility?.['LEGENDARY'] && (
                <div className="mt-2 text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {stone.reforgeAbility['LEGENDARY'].replace(/§./g, '')}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
