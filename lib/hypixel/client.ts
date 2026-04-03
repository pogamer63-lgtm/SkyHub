/**
 * Hypixel API Client — server-side only.
 * Never import this in client components.
 */

import { HypixelPlayerResponse, HypixelProfilesResponse, MojangProfile } from '@/lib/types/hypixel';

const HYPIXEL_BASE = 'https://api.hypixel.net';
const MOJANG_BASE = 'https://api.minecraftservices.com';
const MOJANG_PROFILE_BASE = 'https://api.mojang.com';

// Simple in-memory cache to avoid hammering Hypixel API
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getFromCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlMs = 5 * 60 * 1000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function hypixelFetch<T>(path: string, ttlMs?: number): Promise<T> {
  const apiKey = process.env.HYPIXEL_API_KEY;
  if (!apiKey) throw new Error('HYPIXEL_API_KEY is not set');

  const cacheKey = `hypixel:${path}`;
  const cached = getFromCache<T>(cacheKey);
  if (cached) return cached;

  const url = `${HYPIXEL_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'API-Key': apiKey },
    next: { revalidate: 300 },
  });

  if (res.status === 429) throw new Error('Hypixel API rate limit exceeded. Please wait and try again.');
  if (res.status === 403) throw new Error('Invalid Hypixel API key.');
  if (!res.ok) throw new Error(`Hypixel API error: ${res.status} ${res.statusText}`);

  const data = await res.json() as T;
  setCache(cacheKey, data, ttlMs);
  return data;
}

export async function getUUIDFromUsername(username: string): Promise<string> {
  const cacheKey = `mojang:uuid:${username.toLowerCase()}`;
  const cached = getFromCache<string>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${MOJANG_PROFILE_BASE}/users/profiles/minecraft/${username}`);
  if (res.status === 404) throw new Error(`Player "${username}" not found.`);
  if (!res.ok) throw new Error(`Mojang API error: ${res.status}`);

  const data = await res.json() as MojangProfile;
  setCache(cacheKey, data.id, 60 * 60 * 1000); // cache UUID for 1hr
  return data.id;
}

export async function getUsernameFromUUID(uuid: string): Promise<string> {
  const cacheKey = `mojang:name:${uuid}`;
  const cached = getFromCache<string>(cacheKey);
  if (cached) return cached;

  // Mojang session server is the correct endpoint for UUID → name
  const res = await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`);
  if (!res.ok) throw new Error(`Mojang profile error: ${res.status}`);
  const data = await res.json() as MojangProfile;
  setCache(cacheKey, data.name, 60 * 60 * 1000);
  return data.name;
}

export async function getHypixelPlayer(uuid: string): Promise<HypixelPlayerResponse> {
  return hypixelFetch<HypixelPlayerResponse>(`/v2/player?uuid=${uuid}`);
}

export async function getSkyBlockProfiles(uuid: string): Promise<HypixelProfilesResponse> {
  return hypixelFetch<HypixelProfilesResponse>(`/v2/skyblock/profiles?uuid=${uuid}`, 3 * 60 * 1000);
}

export async function getSkyBlockProfile(profileId: string): Promise<{ success: boolean; profile: unknown }> {
  return hypixelFetch(`/v2/skyblock/profile?profile=${profileId}`, 3 * 60 * 1000);
}

export async function getSkyBlockMuseum(profileId: string): Promise<{
  success: boolean;
  members?: Record<string, {
    items?: Record<string, { donated_time?: number; borrowing?: boolean; [key: string]: unknown }>;
    special?: unknown[];
    value?: number;
    appraisal?: boolean;
  }>;
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
