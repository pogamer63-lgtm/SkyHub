/**
 * Hypixel SkyBlock Election / Mayor API.
 * No API key required. Cached for 1 hour.
 */

const ELECTION_URL = 'https://api.hypixel.net/v2/resources/skyblock/election';

export interface MayorPerk {
  name: string;
  description: string;
  minister?: boolean;
}

export interface MayorCandidate {
  key: string;
  name: string;
  perks: MayorPerk[];
}

export interface ElectionData {
  currentMayor: MayorCandidate;
  /** Candidates running in the current election (may be empty outside election season) */
  candidates: MayorCandidate[];
  updatedAt: number;
}

const _cache: { data: ElectionData | null; expiresAt: number } = { data: null, expiresAt: 0 };

interface RawPerk { name: string; description: string; minister?: boolean }
interface RawMayor { key: string; name: string; perks?: RawPerk[]; minister?: { name: string; perk?: RawPerk } }
interface RawCandidate { key: string; name: string; perks?: RawPerk[] }
interface RawElection { success: boolean; mayor?: RawMayor; current?: { candidates?: RawCandidate[] } }

function mapPerks(perks?: RawPerk[]): MayorPerk[] {
  return (perks ?? []).map(p => ({ name: p.name, description: p.description, minister: p.minister }));
}

export async function getElectionData(): Promise<ElectionData | null> {
  if (_cache.data && Date.now() < _cache.expiresAt) return _cache.data;

  try {
    const res = await fetch(ELECTION_URL, { cache: 'no-store' });
    if (!res.ok) return _cache.data ?? null;

    const json = await res.json() as RawElection;
    if (!json.success || !json.mayor) return _cache.data ?? null;

    const currentMayor: MayorCandidate = {
      key: json.mayor.key,
      name: json.mayor.name,
      perks: mapPerks(json.mayor.perks),
    };

    // Include minister's perk in the perks list if present
    if (json.mayor.minister?.perk) {
      currentMayor.perks.push({
        name: json.mayor.minister.perk.name,
        description: json.mayor.minister.perk.description,
        minister: true,
      });
    }

    const candidates: MayorCandidate[] = (json.current?.candidates ?? []).map(c => ({
      key: c.key,
      name: c.name,
      perks: mapPerks(c.perks),
    }));

    const data: ElectionData = { currentMayor, candidates, updatedAt: Date.now() };
    _cache.data = data;
    _cache.expiresAt = Date.now() + 60 * 60 * 1000;
    return data;
  } catch {
    return _cache.data ?? null;
  }
}
