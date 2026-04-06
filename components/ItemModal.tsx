'use client';

import { useEffect } from 'react';
import type { ItemRarity } from '@/lib/hypixel/nbt';
import ItemIcon from '@/components/ItemIcon';
import { MinecraftText } from '@/components/MinecraftText';
import { formatCoins } from '@/lib/utils/format';

export interface ItemModalData {
  id: string;
  name: string;
  rarity: ItemRarity;
  lore: string[];
  reforge?: string;
  enchantments?: Record<string, number>;
  petInfo?: { type: string; tier: string };
  bazaarPrice?: number | null;
  count?: number;
}

const RARITY_COLOR: Record<string, string> = {
  COMMON:       '#FFFFFF',
  UNCOMMON:     '#55FF55',
  RARE:         '#5555FF',
  EPIC:         '#AA00AA',
  LEGENDARY:    '#FFAA00',
  MYTHIC:       '#FF55FF',
  DIVINE:       '#55FFFF',
  SPECIAL:      '#FF5555',
  VERY_SPECIAL: '#FF5555',
  UNKNOWN:      '#AAAAAA',
};

const STAT_NAMES: Record<string, string> = {
  strength: 'Strength', crit_damage: 'Crit Damage', crit_chance: 'Crit Chance',
  intelligence: 'Intelligence', health: 'Health', defense: 'Defense',
  speed: 'Speed', magic_find: 'Magic Find', ferocity: 'Ferocity',
  bonus_attack_speed: 'Attack Speed', mining_speed: 'Mining Speed',
  farming_fortune: 'Farming Fortune', mining_fortune: 'Mining Fortune',
  foraging_fortune: 'Foraging Fortune', fishing_speed: 'Fishing Speed',
};

export function ItemModal({ item, onClose }: { item: ItemModalData | null; onClose: () => void }) {
  useEffect(() => {
    if (!item) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [item, onClose]);

  if (!item) return null;

  const rarityColor = RARITY_COLOR[item.rarity] ?? '#AAAAAA';
  const enchantEntries = Object.entries(item.enchantments ?? {}).sort((a, b) => b[1] - a[1]);
  const hasLore = item.lore.length > 0;

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
          border: `2px solid ${rarityColor}`,
          boxShadow: `0 0 32px ${rarityColor}44`,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: `1px solid ${rarityColor}33`, background: `${rarityColor}11` }}
        >
          <ItemIcon itemId={item.id} size={40} />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-sm leading-tight" style={{ color: rarityColor }}>
              {item.count && item.count > 1 ? `${item.name} ×${item.count}` : item.name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-medium" style={{ color: rarityColor }}>
                {item.rarity.replace(/_/g, ' ')}
              </span>
              {item.reforge && (
                <span className="text-xs text-slate-500">· {item.reforge} reforge</span>
              )}
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

        {/* Body */}
        <div className="px-4 py-3 space-y-3 max-h-[70vh] overflow-y-auto">

          {/* Pet info */}
          {item.petInfo && (
            <div className="text-xs text-slate-400">
              Pet · <span style={{ color: rarityColor }}>{item.petInfo.tier}</span> {item.petInfo.type.replace(/_/g, ' ')}
            </div>
          )}

          {/* Lore */}
          {hasLore && (
            <div className="space-y-0.5">
              {item.lore.map((line, i) => (
                <div key={i} className="text-xs leading-relaxed font-mono">
                  {line.trim() === '' ? <span>&nbsp;</span> : <MinecraftText raw={line} />}
                </div>
              ))}
            </div>
          )}

          {/* Enchantments */}
          {enchantEntries.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">Enchantments</div>
              <div className="flex flex-wrap gap-1">
                {enchantEntries.map(([name, level]) => (
                  <span key={name} className="text-xs rounded px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300">
                    {STAT_NAMES[name] ?? name.replace(/_/g, ' ')} {level}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Bazaar price */}
          {item.bazaarPrice != null && item.bazaarPrice > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-xs text-slate-500">Bazaar sell price</span>
              <span className="text-sm font-mono text-yellow-300">{formatCoins(item.bazaarPrice)}</span>
            </div>
          )}

          {/* Item ID */}
          <div className="pt-1 border-t border-white/5">
            <div className="text-xs text-slate-700 font-mono">{item.id}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
