/**
 * Player snapshot helpers — cache parsed profiles in PostgreSQL.
 * All functions fall back gracefully if DB is unavailable (no DATABASE_URL
 * or Prisma client failed to initialize).
 */

import { prisma } from './client';
import { PlayerProfile } from '@/lib/types/player';

const SNAPSHOT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Save (upsert) a player profile snapshot to the database.
 * Non-fatal — logs error in dev and continues if DB is unavailable.
 */
export async function saveSnapshot(profile: PlayerProfile): Promise<void> {
  if (!prisma) return;
  try {
    const existing = await prisma.playerSnapshot.findFirst({
      where: { uuid: profile.uuid, profileId: profile.profileId },
      orderBy: { updatedAt: 'desc' },
    });

    // Serialize safely (Set → array for JSON)
    const data = JSON.parse(JSON.stringify(profile, (_key, value) =>
      value instanceof Set ? [...value] : value
    ));

    if (existing) {
      await prisma.playerSnapshot.update({
        where: { id: existing.id },
        data: { data, username: profile.username, profileName: profile.profileName },
      });
    } else {
      await prisma.playerSnapshot.create({
        data: {
          uuid: profile.uuid,
          username: profile.username,
          profileId: profile.profileId,
          profileName: profile.profileName,
          data,
        },
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[snapshots] save failed:', err);
    }
  }
}

/**
 * Load the most recent snapshot for a player+profile.
 * Returns null if not found, DB unavailable, or snapshot is stale (> 5min).
 */
export async function loadSnapshot(
  uuid: string,
  profileId?: string,
): Promise<PlayerProfile | null> {
  if (!prisma) return null;
  try {
    const snapshot = await prisma.playerSnapshot.findFirst({
      where: profileId ? { uuid, profileId } : { uuid },
      orderBy: { updatedAt: 'desc' },
    });

    if (!snapshot) return null;

    const age = Date.now() - snapshot.updatedAt.getTime();
    if (age > SNAPSHOT_TTL_MS) return null;

    const profile = snapshot.data as unknown as PlayerProfile;
    // Restore Set from array (JSON serialization loses Set type)
    if (profile.accessories?.ownedIds && Array.isArray(profile.accessories.ownedIds)) {
      profile.accessories.ownedIds = new Set(profile.accessories.ownedIds as unknown as string[]);
    }
    return profile;
  } catch {
    return null;
  }
}

/**
 * Record a player search in history.
 * Non-fatal — silently fails if DB unavailable.
 */
export async function recordSearch(username: string, uuid?: string): Promise<void> {
  if (!prisma) return;
  try {
    await prisma.searchHistory.create({
      data: { username: username.toLowerCase(), uuid },
    });
  } catch {
    // non-fatal
  }
}

/**
 * Get the most recently searched usernames (for landing page).
 * Returns empty array if DB unavailable.
 */
export async function getRecentSearches(
  limit = 8,
): Promise<Array<{ username: string; uuid: string | null; createdAt: Date }>> {
  if (!prisma) return [];
  try {
    const rows = await prisma.searchHistory.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit * 3,
    });

    const seen = new Set<string>();
    const deduped: typeof rows = [];
    for (const row of rows) {
      if (!seen.has(row.username)) {
        seen.add(row.username);
        deduped.push(row);
        if (deduped.length >= limit) break;
      }
    }
    return deduped;
  } catch {
    return [];
  }
}
