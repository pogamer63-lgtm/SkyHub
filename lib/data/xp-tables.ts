/**
 * XP tables and helpers for skill/dungeon level calculations.
 * These match the values used in lib/hypixel/parser.ts.
 */

export const SKILL_XP_TABLE: number[] = [
  0, 50, 175, 375, 675, 1175, 1925, 2925, 4425, 6425, 9925, 14925, 22425,
  32425, 47425, 67425, 97425, 147425, 222425, 322425, 522425, 822425, 1222425,
  1722425, 2322425, 3022425, 3822425, 4722425, 5722425, 6822425, 8022425,
  9322425, 10722425, 12222425, 13822425, 15522425, 17322425, 19222425,
  21222425, 23322425, 25522425, 27822425, 30222425, 32722425, 35322425,
  38072425, 40972425, 44072425, 47472425, 51172425, 55172425, 59472425,
  64072425, 68972425, 74172425, 79672425, 85472425, 91572425, 97972425,
  104672425,
];

export const DUNGEON_XP_TABLE: number[] = [
  0, 50, 125, 235, 395, 625, 955, 1425, 2095, 3045, 4385, 6275, 8940, 12700,
  17960, 25340, 35640, 50040, 70040, 97640, 135640, 188140, 259640, 356640,
  488640, 668640, 911640, 1239640, 1684640, 2284640, 3084640, 4149640,
  5559640, 7459640, 9959640, 13259640, 17559640, 23159640, 30359640, 39559640,
  51559640, 66559640, 85559640, 109559640, 139559640, 174559640, 216559640,
  265559640, 323559640, 390559640,
];

/**
 * Returns XP needed to go from current level to next level.
 * Returns null if at max level.
 */
export function xpToNextLevel(currentXP: number, table: number[]): number | null {
  for (let i = 0; i < table.length - 1; i++) {
    if (currentXP < table[i + 1]) {
      return table[i + 1] - currentXP;
    }
  }
  return null; // max level
}

/**
 * Returns progress [0–1] through the current level band.
 */
export function levelProgress(currentXP: number, table: number[]): number {
  for (let i = 0; i < table.length - 1; i++) {
    if (currentXP < table[i + 1]) {
      const bandStart = table[i];
      const bandEnd = table[i + 1];
      return (currentXP - bandStart) / (bandEnd - bandStart);
    }
  }
  return 1; // at max
}

/**
 * How much total XP is needed to reach a given level.
 */
export function xpForLevel(level: number, table: number[]): number {
  return table[Math.min(level, table.length - 1)] ?? table[table.length - 1];
}
