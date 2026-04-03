import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SkyHub — Hypixel SkyBlock Progression Advisor',
    template: '%s | SkyHub',
  },
  description: 'Analyze your Hypixel SkyBlock profile. Find the best upgrades sorted by cost, speed, and impact.',
  keywords: ['Hypixel', 'SkyBlock', 'progression', 'upgrades', 'advisor', 'stats'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased" style={{ background: 'var(--bg-base)', color: 'var(--foreground)' }}>

        {/* ── Navigation ─────────────────────────────────────── */}
        <nav className="sticky top-0 z-50" style={{ background: 'rgba(7,11,20,0.92)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)' }}>

          {/* Gold top accent line */}
          <div style={{ height: 2, background: 'linear-gradient(90deg, transparent 0%, var(--gold) 40%, var(--gold) 60%, transparent 100%)' }} />

          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">

            {/* Logo lockup */}
            <a href="/" className="flex items-center gap-3 shrink-0">
              <img
                src="/logo.png"
                alt="SkyHub"
                style={{
                  height: 46,
                  width: 46,
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 2px 8px rgba(240,180,41,0.25))',
                }}
              />
              <span className="gradient-text font-bold text-lg tracking-tight leading-none">SkyHub</span>
            </a>

            {/* Nav links */}
            <div className="flex items-center gap-0.5">
              {[
                { href: '/',         label: 'Home'    },
                { href: '/items',    label: 'Items'   },
                { href: '/compare',  label: 'Compare' },
                { href: '/research', label: 'Data'    },
                { href: 'https://github.com/pogamer63-lgtm/SkyHub', label: 'GitHub', external: true },
              ].map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.external ? '_blank' : undefined}
                  rel={link.external ? 'noopener noreferrer' : undefined}
                  className="nav-link px-3.5 py-2 rounded-md text-sm font-medium"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </nav>

        <main>{children}</main>

        {/* ── Footer ─────────────────────────────────────────── */}
        <footer className="mt-24 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

            <div className="flex items-start gap-4">
              <img
                src="/logo.png"
                alt="SkyHub"
                style={{ height: 52, width: 52, objectFit: 'contain', opacity: 0.9 }}
              />
              <div>
                <span className="gradient-text font-bold text-base block mb-1">SkyHub</span>
                <p className="text-xs" style={{ color: 'var(--text-faint)' }}>Not affiliated with Hypixel Inc. or Mojang AB.</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>Player data via Hypixel API · Skins via Crafatar</p>
              </div>
            </div>

            <div className="flex gap-6 text-xs" style={{ color: 'var(--text-faint)' }}>
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/items" className="hover:text-white transition-colors">Items</a>
              <a href="/compare" className="hover:text-white transition-colors">Compare</a>
              <a href="/research" className="hover:text-white transition-colors">Data</a>
              <a href="https://github.com/pogamer63-lgtm/SkyHub" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </footer>

      </body>
    </html>
  );
}
