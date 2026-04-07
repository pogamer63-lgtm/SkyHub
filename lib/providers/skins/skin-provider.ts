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

// mc-heads.net is the primary avatar provider (crafatar.com is currently offline — HTTP 521)
const MC_HEADS_BASE = 'https://mc-heads.net';
const CRAFATAR_BASE = 'https://crafatar.com';

export function getSkinUrls(uuid: string, username: string): SkinUrls {
  const cleanUUID = uuid.replace(/-/g, '');
  return {
    avatar: `${MC_HEADS_BASE}/avatar/${cleanUUID}/128`,
    head3d: `${CRAFATAR_BASE}/renders/head/${cleanUUID}?scale=6&overlay=true`,
    body: `${MC_HEADS_BASE}/body/${cleanUUID}/128`,
    nameMCUrl: `https://namemc.com/profile/${username}`,
  };
}

export function getAvatarUrl(uuid: string, size = 64): string {
  return `${MC_HEADS_BASE}/avatar/${uuid.replace(/-/g, '')}/${size}`;
}

export function getHeadUrl(uuid: string, scale = 4): string {
  // mc-heads doesn't have a head render; fall back to crafatar for 3D heads
  return `${CRAFATAR_BASE}/renders/head/${uuid.replace(/-/g, '')}?scale=${scale}&overlay=true`;
}
