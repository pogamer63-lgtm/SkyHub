'use client';

import { useState, useEffect } from 'react';
import ItemIcon from '@/components/ItemIcon';
import { MinecraftText } from '@/components/MinecraftText';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SerializablePet {
  type: string;
  tier: string;
  level: number;
  xp: number;
  maxed: boolean;
  active: boolean;
  heldItem?: string;
  skin?: string;
  candyUsed: number;
  maxLevel: number;
  xpIntoLevel: number;
  xpForNextLevel: number | null;
  progressPct: number;
  stats: Array<{ key: string; label: string; value: number }>;
  // Lore for the modal (pre-built server-side)
  petName: string;
  lore: string[];
}

// ─── Colors ───────────────────────────────────────────────────────────────────

const TIER_HEX: Record<string, string> = {
  COMMON:    '#FFFFFF',
  UNCOMMON:  '#55FF55',
  RARE:      '#5555FF',
  EPIC:      '#AA00AA',
  LEGENDARY: '#FFAA00',
  MYTHIC:    '#FF55FF',
};

const TIER_CLASS: Record<string, string> = {
  COMMON:    'text-slate-300 border-slate-500/30 bg-slate-500/5',
  UNCOMMON:  'text-green-300 border-green-500/30 bg-green-500/5',
  RARE:      'text-blue-300 border-blue-500/30 bg-blue-500/5',
  EPIC:      'text-purple-300 border-purple-500/30 bg-purple-500/5',
  LEGENDARY: 'text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
  MYTHIC:    'text-pink-300 border-pink-500/30 bg-pink-500/5',
};

const TIER_BAR: Record<string, string> = {
  COMMON:    'bg-slate-400',
  UNCOMMON:  'bg-green-400',
  RARE:      'bg-blue-400',
  EPIC:      'bg-purple-500',
  LEGENDARY: 'bg-yellow-500',
  MYTHIC:    'bg-pink-500',
};

function formatXP(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}k`;
  return n.toFixed(0);
}

// ─── Pet Modal ────────────────────────────────────────────────────────────────

function PetModal({ pet, onClose }: { pet: SerializablePet | null; onClose: () => void }) {
  useEffect(() => {
    if (!pet) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [pet, onClose]);

  if (!pet) return null;

  const color = TIER_HEX[pet.tier] ?? '#AAAAAA';
  const iconId = `PET_${pet.type}`;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm rounded-xl overflow-hidden shadow-2xl"
        style={{
          background: '#0f1119',
          border: `2px solid ${color}`,
          boxShadow: `0 0 32px ${color}44`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: `1px solid ${color}33`, background: `${color}11` }}
        >
          <ItemIcon itemId={iconId} size={40} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight" style={{ color }}>
              {pet.active ? `★ ${pet.petName}` : pet.petName}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium" style={{ color }}>{pet.tier}</span>
              {pet.skin && <span className="text-xs text-slate-500">· {pet.skin.replace(/_/g, ' ')}</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors shrink-0 text-lg leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Lore body — Minecraft tooltip style */}
        <div className="px-4 py-3 max-h-[70vh] overflow-y-auto">
          <div className="space-y-0.5">
            {pet.lore.map((line, i) => (
              <div key={i} className="text-xs leading-relaxed font-mono">
                {line.trim() === '' ? <span>&nbsp;</span> : <MinecraftText raw={line} />}
              </div>
            ))}
          </div>
          {/* Candy */}
          {pet.candyUsed > 0 && (
            <div className="mt-3 pt-2 border-t border-white/5 text-xs text-slate-500">
              🍬 {pet.candyUsed} candy used
            </div>
          )}
          {/* Item ID */}
          <div className="mt-2 pt-1 border-t border-white/5">
            <div className="text-xs text-slate-700 font-mono">{pet.type}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Pet Grid ─────────────────────────────────────────────────────────────────

export function PetGrid({ pets }: { pets: SerializablePet[] }) {
  const [selected, setSelected] = useState<SerializablePet | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {pets.map((pet, i) => {
          const colorClass = TIER_CLASS[pet.tier] ?? 'text-slate-400 border-white/5 bg-slate-800/30';
          const iconId = `PET_${pet.type}`;
          return (
            <button
              key={i}
              onClick={() => setSelected(pet)}
              className={`rounded-lg border p-3 text-left w-full transition-colors cursor-pointer hover:border-white/30 ${
                pet.active
                  ? 'border-yellow-500/30 bg-yellow-500/5 hover:border-yellow-400/50'
                  : colorClass
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  {pet.active && <span className="text-yellow-400 text-xs">★</span>}
                  <ItemIcon itemId={iconId} size={20} />
                  <span className="text-sm font-medium text-white">{pet.type.replace(/_/g, ' ')}</span>
                </div>
                <span className={`text-xs rounded-full border px-1.5 py-0.5 ${TIER_CLASS[pet.tier] ?? 'text-slate-400'}`}>
                  {pet.tier.slice(0, 3)}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                {pet.maxed ? (
                  <span className="text-green-400 font-semibold">MAXED</span>
                ) : (
                  <span>Lv {pet.level}/{pet.maxLevel}</span>
                )}
                {!pet.maxed && (
                  <span className="text-slate-600">{formatXP(pet.xpForNextLevel != null ? pet.xpForNextLevel - pet.xpIntoLevel : 0)} to next</span>
                )}
              </div>
              {!pet.maxed && (
                <div className="h-1 rounded-full bg-white/5">
                  <div
                    className={`h-full rounded-full ${TIER_BAR[pet.tier] ?? 'bg-slate-400'}`}
                    style={{ width: `${Math.min(100, pet.progressPct)}%` }}
                  />
                </div>
              )}
              {pet.heldItem && (
                <div className="text-xs text-slate-600 mt-1 flex items-center gap-1">
                  <ItemIcon itemId={pet.heldItem} size={12} />
                  {pet.heldItem.replace(/_/g, ' ')}
                </div>
              )}
              {pet.candyUsed > 0 && (
                <div className="text-xs text-slate-600">🍬 {pet.candyUsed} candy</div>
              )}
              {/* Top stat preview */}
              {pet.stats.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {pet.stats.slice(0, 3).map(s => (
                    <span key={s.key} className="text-xs text-indigo-300 bg-indigo-500/10 rounded px-1.5 py-0.5">
                      +{Math.round(s.value)} {s.label}
                    </span>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      <PetModal pet={selected} onClose={() => setSelected(null)} />
    </>
  );
}
