import { NextRequest, NextResponse } from "next/server";
import {
  getSpotifyAccessTokenFromCookies,
  spotifyGet,
} from "@/lib/spotify/spotifyClient";

/** Spotify Web API: Get User's Saved Tracks — https://developer.spotify.com/documentation/web-api/reference/get-users-saved-tracks */
export async function GET(req: NextRequest) {
  const accessToken = await getSpotifyAccessTokenFromCookies(req);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Sign in with Spotify to load your liked songs." },
      { status: 401 }
    );
  }

  const limit = req.nextUrl.searchParams.get("limit") ?? "50";
  const offset = req.nextUrl.searchParams.get("offset") ?? "0";

  const result = await spotifyGet<unknown>(
    "me/tracks",
    { limit, offset },
    accessToken
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "Spotify Web API request failed",
        status: result.status,
        detail: result.body,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  return NextResponse.json(result.data);
}
