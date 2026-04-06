/** Minecraft color code → CSS hex color */
export const MC_COLORS: Record<string, string> = {
  '0': '#000000', // black
  '1': '#0000AA', // dark_blue
  '2': '#00AA00', // dark_green
  '3': '#00AAAA', // dark_aqua
  '4': '#AA0000', // dark_red
  '5': '#AA00AA', // dark_purple
  '6': '#FFAA00', // gold
  '7': '#AAAAAA', // gray
  '8': '#555555', // dark_gray
  '9': '#5555FF', // blue
  'a': '#55FF55', // green
  'b': '#55FFFF', // aqua
  'c': '#FF5555', // red
  'd': '#FF55FF', // light_purple
  'e': '#FFFF55', // yellow
  'f': '#FFFFFF', // white
};

export interface TextSegment {
  text: string;
  color: string | null;   // CSS hex color, null = inherit
  bold: boolean;
  italic: boolean;
  strikethrough: boolean;
  underline: boolean;
}

/**
 * Parse a Minecraft §-coded string into styled text segments.
 * Color codes reset formatting; §r resets everything.
 */
export function parseMinecraftText(raw: string): TextSegment[] {
  const segments: TextSegment[] = [];
  const parts = raw.split(/(§[0-9a-fk-orA-FK-OR])/);

  let color: string | null = null;
  let bold = false, italic = false, strikethrough = false, underline = false;

  for (const part of parts) {
    if (part.startsWith('§') && part.length === 2) {
      const code = part[1].toLowerCase();
      if (MC_COLORS[code]) {
        color = MC_COLORS[code];
        bold = italic = strikethrough = underline = false; // color resets formatting
      } else {
        switch (code) {
          case 'l': bold = true; break;
          case 'o': italic = true; break;
          case 'm': strikethrough = true; break;
          case 'n': underline = true; break;
          case 'r':
            color = null;
            bold = italic = strikethrough = underline = false;
            break;
          // 'k' (obfuscated) ignored
        }
      }
    } else if (part) {
      segments.push({ text: part, color, bold, italic, strikethrough, underline });
    }
  }

  return segments;
}

/** Strip all §-codes from a string */
export function stripMinecraftCodes(s: string): string {
  return s.replace(/§[0-9a-fk-orA-FK-OR]/g, '');
}
