import { NextRequest, NextResponse } from 'next/server';
import { resolvePlayer, getSkyBlockProfiles } from '@/lib/hypixel/client';
import { selectBestProfile, parseProfile } from '@/lib/hypixel/parser';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const profileId = req.nextUrl.searchParams.get('profile');

  try {
    const { uuid, username: resolvedName } = await resolvePlayer(username);
    const profilesRes = await getSkyBlockProfiles(uuid);

    if (!profilesRes.success || !profilesRes.profiles?.length) {
      return NextResponse.json({ error: 'No SkyBlock profiles found.' }, { status: 404 });
    }

    let profile;
    if (profileId) {
      const found = profilesRes.profiles.find(p => p.profile_id === profileId || p.cute_name.toLowerCase() === profileId.toLowerCase());
      profile = found ? parseProfile(found, uuid, resolvedName) : null;
    }

    if (!profile) {
      profile = selectBestProfile(profilesRes.profiles, uuid, resolvedName);
    }

    const allProfiles = profilesRes.profiles.map(p => ({
      id: p.profile_id,
      name: p.cute_name,
      selected: p.selected ?? false,
      gameMode: p.game_mode,
    }));

    return NextResponse.json({ profile, allProfiles });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
