/**
 * Hypixel API Client — server-side only.
 * Never import this in client components.
 */

import { HypixelPlayerResponse, HypixelProfilesResponse, MojangProfile, MuseumMember, GardenApiData } from '@/lib/types/hypixel';

const HYPIXEL_BASE = 'https://api.hypixel.net';
const MOJANG_PROFILE_BASE = 'https://api.mojang.com';

// ---------------------------------------------------------------------------
// Cache — stale-while-revalidate
// ---------------------------------------------------------------------------

interface CacheEntry {
  data: unknown;
  expiresAt: number;   // fresh until this timestamp
  staleUntil: number;  // serve stale until this timestamp (2× TTL grace period)
}

const cache = new Map<string, CacheEntry>();

function getFromCache<T>(key: string): { data: T; stale: boolean } | null {
  const entry = cache.get(key);
  if (!entry) return null;
  const now = Date.now();
  if (now > entry.staleUntil) {
    cache.delete(key);
    return null;
  }
  return { data: entry.data as T, stale: now > entry.expiresAt };
}

function setCache(key: string, data: unknown, ttlMs = 5 * 60 * 1000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
    staleUntil: Date.now() + ttlMs * 2,
  });
}

// ---------------------------------------------------------------------------
// In-flight deduplication
// ---------------------------------------------------------------------------

const inflight = new Map<string, Promise<unknown>>();

// ---------------------------------------------------------------------------
// Retry helper — retries on 5xx only, fails immediately on 429/403
// ---------------------------------------------------------------------------

async function fetchWithRetry(url: string, init: RequestInit, retries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.status >= 500 && attempt < retries) {
      await new Promise(r => setTimeout(r, 500 * (attempt + 1)));
      continue;
    }
    return res;
  }
  return fetch(url, init);
}

// ---------------------------------------------------------------------------
// Core fetch — deduplication + SWR + retry
// ---------------------------------------------------------------------------

async function hypixelFetch<T>(path: string, ttlMs?: number): Promise<T> {
  const apiKey = process.env.HYPIXEL_API_KEY;
  if (!apiKey) throw new Error('HYPIXEL_API_KEY is not set');

  const cacheKey = `hypixel:${path}`;
  const cached = getFromCache<T>(cacheKey);

  if (cached) {
    if (!cached.stale) return cached.data;
    // Stale: return immediately, refresh in background
    if (!inflight.has(cacheKey)) {
      const bg = doHypixelFetch<T>(path, cacheKey, apiKey, ttlMs).catch(() => {});
      inflight.set(cacheKey, bg);
      (bg as Promise<unknown>).finally(() => inflight.delete(cacheKey));
    }
    return cached.data;
  }

  // Cache miss — deduplicate concurrent requests
  if (inflight.has(cacheKey)) return inflight.get(cacheKey) as Promise<T>;

  const promise = doHypixelFetch<T>(path, cacheKey, apiKey, ttlMs);
  inflight.set(cacheKey, promise as Promise<unknown>);
  (promise as Promise<unknown>).finally(() => inflight.delete(cacheKey));
  return promise;
}

async function doHypixelFetch<T>(
  path: string,
  cacheKey: string,
  apiKey: string,
  ttlMs?: number,
): Promise<T> {
  const url = `${HYPIXEL_BASE}${path}`;
  const res = await fetchWithRetry(url, {
    headers: { 'API-Key': apiKey },
    cache: 'no-store',
  });

  if (res.status === 429) throw new Error('Hypixel API rate limit exceeded. Please wait and try again.');
  if (res.status === 403) throw new Error('Invalid Hypixel API key.');
  if (!res.ok) throw new Error(`Hypixel API error: ${res.status} ${res.statusText}`);

  const data = await res.json() as T;
  setCache(cacheKey, data, ttlMs);
  return data;
}

// ---------------------------------------------------------------------------
// Mojang helpers
// ---------------------------------------------------------------------------

async function mojangFetch<T>(cacheKey: string, url: string, ttlMs: number): Promise<T> {
  const cached = getFromCache<T>(cacheKey);
  if (cached) {
    if (!cached.stale) return cached.data;
    if (!inflight.has(cacheKey)) {
      const bg = doMojangFetch<T>(cacheKey, url, ttlMs).catch(() => {});
      inflight.set(cacheKey, bg);
      (bg as Promise<unknown>).finally(() => inflight.delete(cacheKey));
    }
    return cached.data;
  }

  if (inflight.has(cacheKey)) return inflight.get(cacheKey) as Promise<T>;

  const promise = doMojangFetch<T>(cacheKey, url, ttlMs);
  inflight.set(cacheKey, promise as Promise<unknown>);
  (promise as Promise<unknown>).finally(() => inflight.delete(cacheKey));
  return promise;
}

async function doMojangFetch<T>(cacheKey: string, url: string, ttlMs: number): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Mojang API error: ${res.status}`);
  const data = await res.json() as T;
  setCache(cacheKey, data, ttlMs);
  return data;
}

export async function getUUIDFromUsername(username: string): Promise<string> {
  const cacheKey = `mojang:uuid:${username.toLowerCase()}`;
  const cached = getFromCache<string>(cacheKey);
  if (cached && !cached.stale) return cached.data;

  // For UUID lookup, stale is fine — username→UUID rarely changes
  if (cached?.stale) {
    if (!inflight.has(cacheKey)) {
      const bg = fetchUUIDFromMojang(username, cacheKey).catch(() => {});
      inflight.set(cacheKey, bg);
      (bg as Promise<unknown>).finally(() => inflight.delete(cacheKey));
    }
    return cached.data;
  }

  if (inflight.has(cacheKey)) return inflight.get(cacheKey) as Promise<string>;

  const promise = fetchUUIDFromMojang(username, cacheKey);
  inflight.set(cacheKey, promise as Promise<unknown>);
  (promise as Promise<unknown>).finally(() => inflight.delete(cacheKey));
  return promise;
}

async function fetchUUIDFromMojang(username: string, cacheKey: string): Promise<string> {
  const res = await fetch(`${MOJANG_PROFILE_BASE}/users/profiles/minecraft/${username}`, { cache: 'no-store' });
  if (res.status === 404) throw new Error(`Player "${username}" not found.`);
  if (!res.ok) throw new Error(`Mojang API error: ${res.status}`);
  const data = await res.json() as MojangProfile;
  setCache(cacheKey, data.id, 60 * 60 * 1000);
  return data.id;
}

export async function getUsernameFromUUID(uuid: string): Promise<string> {
  const cacheKey = `mojang:name:${uuid}`;
  const profile = await mojangFetch<MojangProfile>(
    cacheKey,
    `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`,
    60 * 60 * 1000,
  );
  return profile.name;
}

// ---------------------------------------------------------------------------
// Public API functions
// ---------------------------------------------------------------------------

export async function getHypixelPlayer(uuid: string): Promise<HypixelPlayerResponse> {
  return hypixelFetch<HypixelPlayerResponse>(`/v2/player?uuid=${uuid}`);
}

export async function getSkyBlockProfiles(uuid: string): Promise<HypixelProfilesResponse> {
  return hypixelFetch<HypixelProfilesResponse>(`/v2/skyblock/profiles?uuid=${uuid}`, 3 * 60 * 1000);
}

export async function getSkyBlockProfile(profileId: string): Promise<{ success: boolean; profile: unknown }> {
  return hypixelFetch(`/v2/skyblock/profile?profile=${profileId}`, 3 * 60 * 1000);
}

export async function getSkyBlockGarden(profileId: string): Promise<{
  success: boolean;
  garden?: GardenApiData;
}> {
  return hypixelFetch(`/v2/skyblock/garden?profile=${profileId}`, 3 * 60 * 1000);
}

export async function getSkyBlockMuseum(profileId: string): Promise<{
  success: boolean;
  members?: Record<string, MuseumMember>;
}> {
  return hypixelFetch(`/v2/skyblock/museum?profile=${profileId}`, 10 * 60 * 1000);
}

/** Resolve username or UUID → UUID */
export async function resolvePlayer(usernameOrUUID: string): Promise<{ uuid: string; username: string }> {
  const isUUID = /^[0-9a-f]{32}$|^[0-9a-f-]{36}$/.test(usernameOrUUID);
  if (isUUID) {
    const cleanUUID = usernameOrUUID.replace(/-/g, '');
    const username = await getUsernameFromUUID(cleanUUID);
    return { uuid: cleanUUID, username };
  }
  const uuid = await getUUIDFromUsername(usernameOrUUID);
  return { uuid, username: usernameOrUUID };
}
