import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin — SkyHub' };
export const dynamic = 'force-dynamic';

export default async function AdminPage() {

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm">System status, cache info, and database stats.</p>
      </div>

      {/* System Status */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Hypixel API', status: process.env.HYPIXEL_API_KEY ? 'Key set' : 'Missing key', ok: !!process.env.HYPIXEL_API_KEY },
            { label: 'Environment', status: process.env.NODE_ENV ?? 'unknown', ok: true },
            { label: 'Next.js', status: '16.x (App Router)', ok: true },
            { label: 'Database', status: 'Not configured', ok: false },
            { label: 'Routes', status: '16 active', ok: true },
          ].map(item => (
            <div key={item.label} className="bg-slate-800/50 rounded-lg px-4 py-3">
              <div className="text-xs text-slate-500 mb-0.5">{item.label}</div>
              <div className={`text-sm font-medium flex items-center gap-1.5 ${item.ok ? 'text-green-300' : 'text-red-300'}`}>
                <span>{item.ok ? '●' : '○'}</span>
                {item.status}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cache TTLs */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Cache Configuration</h2>
        <div className="space-y-2 text-sm">
          {[
            { source: 'Hypixel Player Profiles', ttl: '3 minutes', layer: 'In-memory' },
            { source: 'Hypixel Bazaar Prices', ttl: '5 minutes', layer: 'In-memory' },
            { source: 'Hypixel Auction House (BIN)', ttl: '10 minutes', layer: 'In-memory' },
            { source: 'Mojang UUID lookups', ttl: '60 minutes', layer: 'In-memory' },
            { source: 'Hypixel Items API (accessories)', ttl: '60 minutes', layer: 'In-memory' },
            { source: 'Skin / Avatar images', ttl: 'CDN cached', layer: 'Crafatar CDN' },
          ].map(c => (
            <div key={c.source} className="flex items-center justify-between bg-slate-800/40 rounded px-3 py-2">
              <span className="text-slate-300">{c.source}</span>
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500">{c.layer}</span>
                <span className="text-yellow-300 font-mono">{c.ttl}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-600 mt-3">
          In-memory cache resets on server restart.
        </p>
      </div>

      {/* DB Stats */}
      <div className="card p-6 border border-slate-700/50">
        <h2 className="text-lg font-semibold text-white mb-2">Database</h2>
        <p className="text-slate-400 text-sm">No database configured. Player lookups fetch live from Hypixel on every request.</p>
      </div>

      {/* Planner Coverage */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Feature Coverage</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          {[
            { name: 'Player Profile Overview', status: 'live', path: '/player/[username]' },
            { name: 'Farming Fortune Planner', status: 'live', path: '/player/[username]/farming' },
            { name: 'Mining / HOTM Planner', status: 'live', path: '/player/[username]/mining' },
            { name: 'Dungeon Planner', status: 'live', path: '/player/[username]/dungeons' },
            { name: 'Slayer Planner', status: 'live', path: '/player/[username]/slayer' },
            { name: 'Gear Analyzer', status: 'live', path: '/player/[username]/gear' },
            { name: 'Accessory Optimizer', status: 'live', path: '/player/[username]/accessories' },
            { name: 'Money Making Analyzer', status: 'live', path: '/player/[username]/money' },
            { name: 'Fishing Planner', status: 'live', path: '/player/[username]/fishing' },
            { name: 'Collections & Minions', status: 'live', path: '/player/[username]/collections' },
            { name: 'Profile Comparison', status: 'live', path: '/compare' },
            { name: 'Data & Research', status: 'live', path: '/research' },
            { name: 'Recommendation Engine', status: 'live', note: '11 rule modules' },
            { name: 'PostgreSQL Snapshots', status: 'not configured', path: '/admin' },
            { name: 'Bazaar Price Integration', status: 'live', note: '5min cache' },
            { name: 'AH BIN Price Integration', status: 'live', note: '10min cache' },
            { name: 'NBT Inventory Parsing', status: 'live', note: 'armor+equip+accessories' },
          ].map(f => (
            <div key={f.name} className="flex items-center gap-3 bg-slate-800/40 rounded px-3 py-2">
              <span className={`text-xs shrink-0 ${f.status === 'live' ? 'text-green-400' : 'text-yellow-400'}`}>●</span>
              <span className="text-slate-300 flex-1">{f.name}</span>
              <span className="text-slate-600 text-xs">{f.note ?? f.path}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
