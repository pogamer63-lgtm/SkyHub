import { getRecentSearches } from '@/lib/db/snapshots';
import SearchForm from './search-form';

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
      { title: 'Farming Planner', desc: 'Farming Fortune sources, Garden upgrades, and crop paths.' },
      { title: 'Mining Planner',  desc: 'HOTM tree, powder allocation, mining speed and fortune.' },
      { title: 'Fishing Planner', desc: 'Trophy fish progress, rod tiers, Fishing Fortune sources.' },
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
  { value: '22',   label: 'Pages' },
  { value: '14+',  label: 'Planners' },
  { value: '15',   label: 'Rules' },
  { value: 'Live', label: 'Prices' },
];

export default async function HomePage() {
  const recentRows  = await getRecentSearches(6);
  const recentNames = recentRows.map(r => r.username);

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
