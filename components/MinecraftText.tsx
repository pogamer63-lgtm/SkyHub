'use client';

import { parseMinecraftText } from '@/lib/utils/minecraft-colors';

/** Renders a single Minecraft §-coded lore line as styled React spans. */
export function MinecraftText({ raw }: { raw: string }) {
  const segments = parseMinecraftText(raw);
  if (segments.length === 0) return <span className="text-slate-500">&nbsp;</span>;
  return (
    <>
      {segments.map((seg, i) => {
        let className = '';
        if (seg.bold) className += ' font-bold';
        if (seg.italic) className += ' italic';
        if (seg.strikethrough) className += ' line-through';
        if (seg.underline) className += ' underline';
        return (
          <span
            key={i}
            className={className.trim() || undefined}
            style={seg.color ? { color: seg.color } : undefined}
          >
            {seg.text}
          </span>
        );
      })}
    </>
  );
}
