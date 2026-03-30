export function formatCoins(coins: number): string {
  if (coins >= 1_000_000_000) return `${(coins / 1_000_000_000).toFixed(2)}B`;
  if (coins >= 1_000_000) return `${(coins / 1_000_000).toFixed(2)}M`;
  if (coins >= 1_000) return `${(coins / 1_000).toFixed(1)}k`;
  return coins.toLocaleString();
}

export function formatXP(xp: number): string {
  if (xp >= 1_000_000) return `${(xp / 1_000_000).toFixed(2)}M XP`;
  if (xp >= 1_000) return `${(xp / 1_000).toFixed(1)}k XP`;
  return `${xp} XP`;
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export function levelColor(level: number, max = 60): string {
  const ratio = level / max;
  if (ratio >= 0.9) return 'text-yellow-400';
  if (ratio >= 0.7) return 'text-purple-400';
  if (ratio >= 0.5) return 'text-blue-400';
  if (ratio >= 0.3) return 'text-green-400';
  return 'text-gray-400';
}

export function priorityColor(priority: string): string {
  switch (priority) {
    case 'critical': return 'text-red-400 border-red-500/50 bg-red-500/10';
    case 'high': return 'text-orange-400 border-orange-500/50 bg-orange-500/10';
    case 'medium': return 'text-yellow-400 border-yellow-500/50 bg-yellow-500/10';
    case 'low': return 'text-gray-400 border-gray-500/50 bg-gray-500/10';
    default: return 'text-gray-400';
  }
}

export function scoreColor(score: number): string {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
}

export function truncate(s: string, max = 80): string {
  return s.length > max ? s.slice(0, max - 3) + '...' : s;
}
