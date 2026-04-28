import { NextRequest, NextResponse } from "next/server";
import { getSpotifyAccessTokenFromCookies } from "@/lib/spotify/spotifyClient";

export async function GET(req: NextRequest) {
  const token = await getSpotifyAccessTokenFromCookies(req);
  return NextResponse.json({ connected: Boolean(token) });
}
