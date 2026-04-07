import { getRecentSearches } from '@/lib/db/snapshots';
import { getElectionData } from '@/lib/api/election';
import { getFireSales, isActive, formatTimeLeft } from '@/lib/api/firesales';
import { getItemName } from '@/lib/neu/data';
import FireSaleItemImage from './fire-sale-item-image';
import SearchForm from './search-form';

// ─── Minecraft § color-code renderer ─────────────────────────────────────────

const MC_COLORS: Record<string, string> = {
  '0': '#000000', '1': '#0000AA', '2': '#00AA00', '3': '#00AAAA',
  '4': '#AA0000', '5': '#AA00AA', '6': '#FFAA00', '7': '#AAAAAA',
  '8': '#555555', '9': '#5555FF', 'a': '#55FF55', 'b': '#55FFFF',
  'c': '#FF5555', 'd': '#FF55FF', 'e': '#FFFF55', 'f': '#FFFFFF',
};

interface Span { text: string; color?: string; bold?: boolean }

function parseMinecraftText(raw: string): Span[] {
  const spans: Span[] = [];
  let color: string | undefined;
  let bold = false;
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '§' && i + 1 < raw.length) {
      const code = raw[i + 1].toLowerCase();
      if (MC_COLORS[code]) { color = MC_COLORS[code]; bold = false; }
      else if (code === 'l') { bold = true; }
      else if (code === 'r') { color = undefined; bold = false; }
      i += 2;
    } else {
      // collect until next §
      let end = raw.indexOf('§', i);
      if (end === -1) end = raw.length;
      spans.push({ text: raw.slice(i, end), color, bold });
      i = end;
    }
  }
  return spans.filter(s => s.text);
}

function McText({ text }: { text: string }) {
  const spans = parseMinecraftText(text);
  return (
    <>
      {spans.map((s, i) => (
        <span key={i} style={{ color: s.color ?? 'var(--text-muted)', fontWeight: s.bold ? 700 : undefined }}>
          {s.text}
        </span>
      ))}
    </>
  );
}

// ─── Feature groups ───────────────────────────────────────────────────────────

const FEATURE_GROUPS = [
  {
    label: 'Progression',
    accent: '#f0b429',
    items: [
      { title: 'Upgrade Advisor',     desc: 'Ranked upgrades by cost, benefit, and ROI for your account.' },
      { title: 'Progression Planner', desc: 'Step-by-step path from early game to endgame.' },
      { title: 'Skills Planner',      desc: 'XP tracking per skill with ranked leveling methods.' },
    ],
  },
  {
    label: 'Combat',
    accent: '#ef4444',
    items: [
      { title: 'Dungeon Advisor', desc: 'Gear checks, floor gates, class advice, catacombs milestones.' },
      { title: 'Slayer Planner',  desc: 'All 6 bosses tracked with XP, level progress, and next tier.' },
      { title: 'Gear Analyzer',   desc: 'Slot-by-slot armor and weapon analysis with tier ratings.' },
    ],
  },
  {
    label: 'Gathering',
    accent: '#10b981',
    items: [
      { title: 'Farming Planner',  desc: 'Farming Fortune sources, Garden upgrades, and crop paths.' },
      { title: 'Mining Planner',   desc: 'HOTM tree, powder allocation, mining speed and fortune.' },
      { title: 'Fishing Planner',  desc: 'Trophy fish progress, rod tiers, Fishing Fortune sources.' },
      { title: 'Foraging Planner', desc: 'Foraging Fortune, Skill Tree whispers, best pets, and daily trees.' },
    ],
  },
  {
    label: 'Economy',
    accent: '#6366f1',
    items: [
      { title: 'Money Making',        desc: 'Income methods ranked by unlocked potential and coins/hr.' },
      { title: 'Cost Optimizer',      desc: 'Cheapest meaningful upgrades — no inefficient purchases.' },
      { title: 'Accessory Optimizer', desc: 'Missing accessories ranked by Magical Power per coin.' },
    ],
  },
  {
    label: 'Account',
    accent: '#a78bfa',
    items: [
      { title: 'Networth Estimate',     desc: 'Coins, pets, gear, powder, and fairy souls breakdown.' },
      { title: 'Collections & Minions', desc: 'Minion slots, collection milestones, near-milestone alerts.' },
      { title: 'Museum Tracker',        desc: 'Donated items, museum value milestones, Magical Power earned.' },
    ],
  },
  {
    label: 'Other',
    accent: '#64748b',
    items: [
      { title: 'Pets Planner', desc: 'Best-in-slot pets per activity, XP leveling guide, tier breakdown.' },
      { title: 'Bestiary',     desc: 'Mob kill tracking, milestone progress per family.' },
    ],
  },
];

const STATS = [
  { value: '23',   label: 'Pages' },
  { value: '15+',  label: 'Planners' },
  { value: '29',   label: 'Rule Checks' },
  { value: 'Live', label: 'Prices' },
];

export default async function HomePage() {
  const [recentRows, election, fireSales] = await Promise.all([
    getRecentSearches(6),
    getElectionData().catch(() => null),
    getFireSales().catch(() => [] as Awaited<ReturnType<typeof getFireSales>>),
  ]);
  const recentNames = recentRows.map(r => r.username);
  const activeSales = fireSales.filter(isActive);

  return (
    <div className="hero-glow">

      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className="px-4 pt-14 pb-10 md:pt-20 md:pb-14">
        <div className="mx-auto max-w-5xl flex flex-col md:flex-row items-center md:items-start justify-between gap-10">

          {/* Left — text + search */}
          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4 inline-flex items-center gap-2"
              style={{ color: 'var(--gold)' }}
            >
              <span style={{
                display: 'inline-block', width: 18, height: 1.5,
                background: 'var(--gold)', borderRadius: 2, verticalAlign: 'middle',
              }} />
              Hypixel SkyBlock Advisor
              <span style={{
                display: 'inline-block', width: 18, height: 1.5,
                background: 'var(--gold)', borderRadius: 2, verticalAlign: 'middle',
              }} />
            </p>

            <h1 className="text-4xl md:text-[3.25rem] font-bold leading-[1.1] tracking-tight mb-5">
              Stop guessing.<br />
              <span className="gradient-text">Start optimizing.</span>
            </h1>

            <p className="text-base mb-2 max-w-[480px]" style={{ color: 'var(--text-muted)', lineHeight: 1.65 }}>
              Paste your username — SkyHub reads your profile and ranks every
              upgrade by actual in-game impact.
            </p>

            {/* Inline stats */}
            <div className="flex flex-wrap gap-x-6 gap-y-1 mb-8 mt-4">
              {STATS.map(s => (
                <span key={s.label} className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--gold)', fontVariantNumeric: 'tabular-nums' }}>{s.value}</strong>
                  {' '}{s.label}
                </span>
              ))}
            </div>

            <SearchForm recentSearches={recentNames} />
          </div>

          {/* Right — logo as hero visual */}
          <div className="hidden md:flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="SkyHub"
              style={{
                width: 300,
                height: 300,
                objectFit: 'contain',
                filter: 'drop-shadow(0 4px 32px rgba(240,180,41,0.22)) drop-shadow(0 0 80px rgba(99,102,241,0.08))',
              }}
            />
          </div>

        </div>
      </section>

      {/* ── Mayor + Fire Sales ────────────────────────────────── */}
      {(election || activeSales.length > 0) && (
        <section className="px-4 pb-10">
          <div className="mx-auto max-w-5xl">
            <div className="flex flex-wrap gap-4 items-start">

              {/* Mayor card — Minecraft tooltip style */}
              {election && (
                <div
                  className="shrink-0"
                  style={{
                    minWidth: 240,
                    maxWidth: 320,
                    background: 'linear-gradient(160deg, #0d1a2a 0%, #0a1520 100%)',
                    border: '2px solid',
                    borderColor: '#1a6060',
                    borderImage: 'linear-gradient(180deg, #55FFFF 0%, #1a6060 60%, #002222 100%) 1',
                    borderImageSlice: 1,
                    borderRadius: 0,
                    boxShadow: 'inset 0 0 0 1px rgba(85,255,255,0.07), 0 4px 24px rgba(0,0,0,0.6)',
                    padding: '10px 12px',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  {/* Mayor name */}
                  <div style={{ color: '#FFAA00', fontWeight: 700, marginBottom: 6 }}>
                    Mayor {election.currentMayor.name}
                  </div>

                  {/* Mayor description */}
                  <div style={{ color: '#AAAAAA', fontSize: 12, marginBottom: 8, lineHeight: 1.55 }}>
                    The mayor has been elected by the whole SkyBlock community.
                  </div>

                  {/* Separator */}
                  <div style={{
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, #1a6060 20%, #1a6060 80%, transparent)',
                    margin: '6px 0 10px',
                  }} />

                  {/* Perks */}
                  <div className="space-y-2.5">
                    {election.currentMayor.perks.map(perk => (
                      <div key={perk.name}>
                        <div style={{
                          color: perk.minister ? '#FFFF55' : '#FF55FF',
                          fontWeight: 700,
                          fontSize: 13,
                          marginBottom: 2,
                        }}>
                          {perk.name}
                          {perk.minister && (
                            <span style={{ color: '#FFAA00', fontSize: 11, fontWeight: 400, marginLeft: 6 }}>
                              ✦ minister
                            </span>
                          )}
                        </div>
                        <div style={{ color: '#AAAAAA', fontSize: 12, lineHeight: 1.55 }}>
                          <McText text={perk.description} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Separator + footer note */}
                  <div style={{
                    height: 1,
                    background: 'linear-gradient(90deg, transparent, #1a6060 20%, #1a6060 80%, transparent)',
                    margin: '10px 0 8px',
                  }} />
                  <div style={{ color: '#555555', fontSize: 11, lineHeight: 1.5, fontStyle: 'italic' }}>
                    The listed perks are available to all players until the closing of the next elections.
                  </div>
                </div>
              )}

              {/* Fire Sales */}
              {activeSales.length > 0 && (
                <div className="flex-1 min-w-[200px]">
                  <div
                    className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                    style={{ color: '#FF5555' }}
                  >
                    <span style={{
                      display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                      background: '#FF5555', boxShadow: '0 0 6px #FF5555',
                    }} />
                    Active Fire Sales
                  </div>
                  <div className="flex flex-col gap-2">
                    {activeSales.map(sale => (
                      <div key={sale.itemId}>
                        <div
                          style={{
                            background: 'rgba(255,85,0,0.06)',
                            border: '1px solid rgba(255,85,0,0.25)',
                            borderRadius: 6,
                            padding: '8px 12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                          }}
                        >
                          <span style={{ fontSize: 18, lineHeight: 1 }}>🔥</span>
                          <div>
                            <div style={{ color: '#FFAA00', fontWeight: 600, fontSize: 13 }}>
                              {getItemName(sale.itemId)}
                            </div>
                            <div style={{ color: '#AAAAAA', fontSize: 12, marginTop: 1 }}>
                              <span style={{ color: '#55FF55' }}>{sale.price.toLocaleString()}</span>
                              {' Gems · '}
                              <span style={{ color: '#55FFFF' }}>{sale.amount.toLocaleString()}</span>
                              {' left · '}
                              <span style={{ color: '#FFFF55' }}>{formatTimeLeft(sale.end)}</span>
                              {' remaining'}
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-col items-center gap-1.5">
                          <FireSaleItemImage itemId={sale.itemId} size={160} />
                          <div style={{ color: '#FFAA00', fontSize: 12, fontWeight: 600, letterSpacing: '0.04em', textAlign: 'center' }}>
                            {getItemName(sale.itemId)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* ── Divider ───────────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-4">
        <hr className="rule" />
      </div>

      {/* ── Feature Groups ────────────────────────────────────── */}
      <section className="px-4 py-14">
        <div className="mx-auto max-w-5xl">

          <div className="mb-10">
            <h2 className="text-xl font-bold mb-1.5" style={{ color: 'var(--foreground)' }}>
              What SkyHub covers
            </h2>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              Every page is built around one question:{' '}
              <em style={{ color: 'var(--foreground)' }}>what should I do next?</em>
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURE_GROUPS.map(group => (
              <div
                key={group.label}
                className="card p-5"
                style={{ borderLeftWidth: '3px', borderLeftColor: group.accent }}
              >
                <h3
                  className="text-[0.7rem] font-bold uppercase tracking-widest mb-3.5 flex items-center gap-2"
                  style={{ color: group.accent }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: group.accent, display: 'inline-block', flexShrink: 0 }} />
                  {group.label}
                </h3>
                <ul className="space-y-3">
                  {group.items.map(item => (
                    <li key={item.title}>
                      <span className="block text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                        {item.title}
                      </span>
                      <span className="block text-xs mt-0.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {item.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>
      </section>

    </div>
  );
}
