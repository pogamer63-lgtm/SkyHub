import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'SkyHub — Hypixel SkyBlock Progression Advisor',
    template: '%s | SkyHub',
  },
  description: 'Your personal Hypixel SkyBlock coach. Analyze your profile, find the best next upgrades, and optimize your progression.',
  keywords: ['Hypixel', 'SkyBlock', 'progression', 'upgrades', 'advisor', 'stats'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0a0e1a] text-slate-100 antialiased">
        <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0e1a]/80 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <a href="/" className="flex items-center gap-2 font-bold text-lg">
              <span className="gradient-text">SkyHub</span>
              <span className="text-xs text-slate-500 font-normal hidden sm:inline">SkyBlock Advisor</span>
            </a>
            <div className="flex items-center gap-6 text-sm text-slate-400">
              <a href="/" className="hover:text-white transition-colors">Home</a>
              <a href="/compare" className="hover:text-white transition-colors">Compare</a>
              <a href="/research" className="hover:text-white transition-colors">Data</a>
              <a href="/admin" className="hover:text-white transition-colors">Admin</a>
              <a href="https://github.com/pogamer63-lgtm/SkyHub" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            </div>
          </div>
        </nav>
        <main>{children}</main>
        <footer className="mt-20 border-t border-white/5 py-8 text-center text-sm text-slate-600">
          <p>SkyHub is not affiliated with Hypixel Inc. or Mojang AB.</p>
          <p className="mt-1">Player data sourced from the Hypixel API. Skin rendering via Crafatar.</p>
        </footer>
      </body>
    </html>
  );
}
