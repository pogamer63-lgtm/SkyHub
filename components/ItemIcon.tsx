'use client';

/**
 * ItemIcon — renders a SkyBlock item icon from the FurfSky Reborn texture pack.
 *
 * Handles three cases:
 *  1. Helmet/armor with a *_model.png  — shows the pre-rendered 3D preview
 *  2. Animated items (245 items with .mcmeta) — JS-driven sprite-sheet animation
 *  3. Everything else — static <img> with pixelated rendering
 *
 * Minecraft animation timing: 1 tick = 50 ms (20 ticks/s)
 */

import { useRef, useEffect, CSSProperties } from 'react';
import { ANIMATED_ITEMS } from '@/lib/data/animated-items';

/** IDs that have a _model.png pre-rendered 3D preview */
const MODEL_SUFFIX_IDS = new Set([
  'ABYSSAL_HELMET',
  'ARACHNE_HELMET',
  'AURORA_HELMET',
  'BERSERKER_HELMET',
  'BIOHAZARD_HELMET',
  'BURNING_AURORA_HELMET',
  'BURNING_CRIMSON_HELMET',
  'BURNING_FERVOR_HELMET',
  'BURNING_TERROR_HELMET',
  'CANOPY_MASK',
  'CRIMSON_HELMET',
  'CROPIE_HELMET',
  'CROWN_OF_AVARICE',
  'DIVAN_HELMET',
  'DIVER_MASK_HELMET',
  'ENDER_HELMET',
  'FERMENTO_HELMET',
  'FERVOR_HELMET',
  'FIERY_AURORA_HELMET',
  'FIERY_CRIMSON_HELMET',
  'FIERY_FERVOR_HELMET',
  'FIERY_TERROR_HELMET',
  'FIG_CAP',
  'FINAL_DESTINATION_HELMET',
  'GLOSSY_MINERAL_HELMET',
  'GOLDOR_HELMET_DUNGEON',
  'GOLDOR_HELMET',
  'HOT_AURORA_HELMET',
  'HOT_CRIMSON_HELMET',
  'HOT_FERVOR_HELMET',
  'HOT_TERROR_HELMET',
  'INFERNAL_AURORA_HELMET',
  'INFERNAL_CRIMSON_HELMET',
  'INFERNAL_FERVOR_HELMET',
  'INFERNAL_TERROR_HELMET',
  'MAGMA_LORD_HELMET',
  'MOLTEN_AURORA_HELMET',
  'MOLTEN_CRIMSON_HELMET',
  'MOLTEN_FERVOR_HELMET',
  'MOLTEN_TERROR_HELMET',
  'NECRON_HELMET',
  'NECRON_HELMET_DUNGEONS',
  'ROGUE_HELMET_NEW',
  'SADAN_HELMET',
  'SCARECROW_HAT',
  'SHADOW_HELMET',
  'SQUASH_HELMET',
  'STARRED_GOLDOR_HELMET',
  'STARRED_NECRON_HELMET',
  'STARRED_SADAN_HELMET',
  'STARRED_STORM_HELMET',
  'STORM_HELMET',
  'TERROR_HELMET',
  'TAURUS_HELMET',
  'WITHER_HELMET',
  'WITHER_HELMET_NEW',
  'ZOMBIE_SOLDIER_HELMET',
]);

interface ItemIconProps {
  /** SkyBlock item ID (e.g. "HYPERION", "NECRON_HELMET") */
  itemId: string;
  /** Display size in px (default 20) */
  size?: number;
  className?: string;
  /** Prefer the 3D model PNG for helmets (default true) */
  useModel?: boolean;
}

// ── Animated sprite sub-component ────────────────────────────────────────────

function AnimatedSprite({
  src,
  frames,
  frametime,
  size,
  alt,
  className,
}: {
  src: string;
  frames: number;
  frametime: number;
  size: number;
  alt: string;
  className: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const intervalMs = frametime * 50; // 1 tick = 50 ms
    const id = setInterval(() => {
      frameRef.current = (frameRef.current + 1) % frames;
      if (ref.current) {
        ref.current.style.backgroundPosition = `0 -${frameRef.current * size}px`;
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [frames, frametime, size]);

  const style: CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    backgroundImage: `url('${src}')`,
    backgroundSize: `${size}px ${frames * size}px`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: '0 0',
    imageRendering: 'pixelated',
    flexShrink: 0,
  };

  return (
    <span
      ref={ref}
      role="img"
      aria-label={alt}
      className={className}
      style={style}
    />
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ItemIcon({ itemId, size = 20, className = '', useModel = true }: ItemIconProps) {
  const filename = itemId.toLowerCase().replace(/[^a-z0-9_]/g, '_');

  // 1. Helmet / armor model PNG
  if (useModel && MODEL_SUFFIX_IDS.has(itemId)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/items/${filename}_model.png`}
        alt={itemId}
        width={size}
        height={size}
        className={`pixelated object-contain shrink-0 ${className}`}
        style={{ width: size, height: size }}
        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
      />
    );
  }

  // 2. Animated sprite sheet
  const anim = ANIMATED_ITEMS[filename];
  if (anim && anim.frames > 1) {
    return (
      <AnimatedSprite
        src={`/items/${filename}.png`}
        frames={anim.frames}
        frametime={anim.frametime}
        size={size}
        alt={itemId}
        className={`shrink-0 ${className}`}
      />
    );
  }

  // 3. Static icon
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/items/${filename}.png`}
      alt={itemId}
      width={size}
      height={size}
      className={`pixelated shrink-0 ${className}`}
      style={{ width: size, height: size }}
      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
    />
  );
}
