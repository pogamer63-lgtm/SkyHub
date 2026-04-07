'use client';

import { useState, useEffect, useRef } from 'react';

interface Props {
  itemId: string;
  size?: number;
}

export default function FireSaleItemImage({ itemId, size = 256 }: Props) {
  const filename = itemId.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const [src, setSrc] = useState(`/items/${filename}.png`);
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // The browser may 404 the /items/ URL before React hydrates and attaches onError.
  // Check on mount whether the image already failed (same pattern as ItemIcon.tsx).
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) {
      if (src.startsWith('/items/')) {
        setSrc(`https://sky.coflnet.com/static/icon/${itemId}`);
      } else {
        setFailed(true);
      }
    }
  }, [src, itemId]);

  if (failed) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={src}
      alt={itemId}
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        imageRendering: 'pixelated',
        filter: 'drop-shadow(0 10px 28px rgba(0,0,0,0.75))',
      }}
      onError={() => {
        if (src.startsWith('/items/')) {
          setSrc(`https://sky.coflnet.com/static/icon/${itemId}`);
        } else {
          setFailed(true);
        }
      }}
    />
  );
}
