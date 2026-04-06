'use client';

import { useState } from 'react';
import ItemIcon from '@/components/ItemIcon';
import { ItemModal, ItemModalData } from '@/components/ItemModal';
import type { ItemRarity } from '@/lib/hypixel/nbt';

export interface SerializableItem {
  id: string;
  name: string;
  rarity: ItemRarity;
  lore: string[];
  reforge?: string;
  enchantments: Record<string, number>;
  petInfo?: { type: string; tier: string };
  count?: number;
  // pre-computed display strings (server-side)
  slotLabel?: string;
  slotIcon?: string;
  tierLabel?: string;
  tierColor?: string;
  bazaarPrice?: number;
  weaponType?: string;
  weaponStage?: string;
}

const RARITY_COLORS: Record<string, string> = {
  COMMON:       'text-white border-white/20 bg-white/5',
  UNCOMMON:     'text-green-300 border-green-500/30 bg-green-500/5',
  RARE:         'text-blue-300 border-blue-500/30 bg-blue-500/5',
  EPIC:         'text-purple-300 border-purple-500/30 bg-purple-500/5',
  LEGENDARY:    'text-yellow-300 border-yellow-500/30 bg-yellow-500/5',
  MYTHIC:       'text-pink-300 border-pink-500/30 bg-pink-500/5',
  DIVINE:       'text-sky-300 border-sky-500/30 bg-sky-500/5',
  SPECIAL:      'text-red-300 border-red-500/30 bg-red-500/5',
  VERY_SPECIAL: 'text-red-400 border-red-400/30 bg-red-400/5',
  UNKNOWN:      'text-slate-400 border-slate-600/30 bg-slate-600/5',
};

interface Props {
  items: SerializableItem[];
  layout?: 'grid' | 'list';
  gridCols?: string;
}

export function ClickableItemGrid({ items, layout = 'grid', gridCols = 'grid-cols-2 sm:grid-cols-4' }: Props) {
  const [activeItem, setActiveItem] = useState<ItemModalData | null>(null);

  if (layout === 'list') {
    return (
      <>
        <div className="space-y-2">
          {items.map((item, i) => {
            const isEmpty = !item.id || !item.name;
            const colorClass = isEmpty ? 'border-slate-700 bg-slate-800/40 text-slate-500' : RARITY_COLORS[item.rarity] ?? RARITY_COLORS.UNKNOWN;
            return (
              <button
                key={i}
                onClick={() => !isEmpty && setActiveItem({ ...item, bazaarPrice: item.bazaarPrice ?? null })}
                className={`w-full flex items-center justify-between rounded-lg border px-4 py-2 text-left transition-colors ${colorClass} ${isEmpty ? 'cursor-default' : 'hover:border-white/30 cursor-pointer'}`}
              >
                <div className="flex items-center gap-2">
                  <ItemIcon itemId={item.id} size={24} useModel={false} />
                  <div>
                    <span className="font-medium text-sm">{item.name || item.id}</span>
                    {item.reforge && <span className="text-xs text-slate-400 ml-2">({item.reforge})</span>}
                    {Object.keys(item.enchantments).length > 0 && (
                      <span className="text-xs text-slate-400 ml-2">{Object.keys(item.enchantments).length} enchants</span>
                    )}
                  </div>
                </div>
                {(item.weaponType || item.weaponStage || item.tierLabel) && (
                  <div className="flex items-center gap-2 text-xs shrink-0">
                    {item.weaponType && <span className="text-slate-400">{item.weaponType}</span>}
                    {(item.weaponStage || item.tierLabel) && (
                      <span className={item.tierColor ?? 'text-slate-400'}>{item.weaponStage ?? item.tierLabel}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
        <ItemModal item={activeItem} onClose={() => setActiveItem(null)} />
      </>
    );
  }

  // grid layout
  return (
    <>
      <div className={`grid ${gridCols} gap-3`}>
        {items.map((item, i) => {
          const isEmpty = !item.id || !item.name;
          const colorClass = isEmpty
            ? 'text-slate-500 border-slate-700 bg-slate-800/40 cursor-default'
            : `${RARITY_COLORS[item.rarity] ?? RARITY_COLORS.UNKNOWN} hover:border-white/30 cursor-pointer`;
          return (
            <button
              key={i}
              onClick={() => !isEmpty && setActiveItem({ ...item, bazaarPrice: item.bazaarPrice ?? null })}
              className={`rounded-lg border p-3 text-left w-full transition-colors ${colorClass}`}
            >
              {item.slotLabel && (
                <div className="text-xs text-slate-500 mb-1">{item.slotIcon} {item.slotLabel}</div>
              )}
              {isEmpty ? (
                <div className="text-slate-600 text-sm italic">Empty</div>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1">
                    <ItemIcon itemId={item.id} size={24} />
                    <div className="text-sm font-medium leading-snug">{item.name || item.id}</div>
                  </div>
                  {item.reforge && (
                    <div className="text-xs text-slate-400">Reforge: {item.reforge}</div>
                  )}
                  {Object.keys(item.enchantments).length > 0 && (
                    <div className="text-xs text-slate-400">{Object.keys(item.enchantments).length} enchants</div>
                  )}
                  {item.tierLabel && (
                    <div className={`text-xs mt-1 font-medium ${item.tierColor ?? ''}`}>
                      {item.tierLabel}
                    </div>
                  )}
                </>
              )}
            </button>
          );
        })}
      </div>
      <ItemModal item={activeItem} onClose={() => setActiveItem(null)} />
    </>
  );
}
