import { NextRequest, NextResponse } from 'next/server';
import { resolvePlayer } from '@/lib/hypixel/client';
import { getSkyBlockProfiles } from '@/lib/hypixel/client';
import { PlayerSearchResult } from '@/lib/types/player';
import { recordSearch } from '@/lib/db/snapshots';

export async function GET(req: NextRequest) {
  const username = req.nextUrl.searchParams.get('q');
  if (!username || username.trim().length < 2) {
    return NextResponse.json({ error: 'Username must be at least 2 characters.' }, { status: 400 });
  }

  try {
    const { uuid, username: resolvedName } = await resolvePlayer(username.trim());
    const profilesRes = await getSkyBlockProfiles(uuid);

    if (!profilesRes.success || !profilesRes.profiles?.length) {
      return NextResponse.json({ error: 'No SkyBlock profiles found for this player.' }, { status: 404 });
    }

    const result: PlayerSearchResult = {
      uuid,
      username: resolvedName,
      profiles: profilesRes.profiles.map(p => ({
        id: p.profile_id,
        name: p.cute_name,
        selected: p.selected ?? false,
      })),
    };

    // Record search in history (non-fatal)
    recordSearch(resolvedName, uuid).catch(() => {});

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
