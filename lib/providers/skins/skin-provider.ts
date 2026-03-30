/**
 * SkinProvider — abstraction layer for player skin/avatar rendering.
 * Primary source: Crafatar (uses Mojang data, no TOS issues)
 * Reference: NameMC for profile linking
 */

export interface SkinUrls {
  avatar: string;       // 2D head
  head3d: string;       // 3D head render
  body: string;         // full body render
  cape?: string;
  nameMCUrl: string;    // link to NameMC profile
}

// Crafatar is the safe, reliable, open-source option for skin rendering
// It proxies Mojang skin data and is widely used in the community
const CRAFATAR_BASE = 'https://crafatar.com';

export function getSkinUrls(uuid: string, username: string): SkinUrls {
  const cleanUUID = uuid.replace(/-/g, '');
  return {
    avatar: `${CRAFATAR_BASE}/avatars/${cleanUUID}?size=128&overlay=true`,
    head3d: `${CRAFATAR_BASE}/renders/head/${cleanUUID}?scale=6&overlay=true`,
    body: `${CRAFATAR_BASE}/renders/body/${cleanUUID}?scale=6&overlay=true`,
    nameMCUrl: `https://namemc.com/profile/${username}`,
  };
}

export function getAvatarUrl(uuid: string, size = 64): string {
  return `${CRAFATAR_BASE}/avatars/${uuid.replace(/-/g, '')}?size=${size}&overlay=true`;
}

export function getHeadUrl(uuid: string, scale = 4): string {
  return `${CRAFATAR_BASE}/renders/head/${uuid.replace(/-/g, '')}?scale=${scale}&overlay=true`;
}
