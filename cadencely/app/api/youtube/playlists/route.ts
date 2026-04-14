import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAccessTokenFromCookies,
  youtubeDataGet,
} from "@/lib/youtube/youtubeDataClient";

/**
 * Signed-in user's playlists (`playlists.list` with `mine=true`).
 * Requires Google OAuth with `youtube.readonly` (see `auth.ts`).
 */
export async function GET(req: NextRequest) {
  const accessToken = await getGoogleAccessTokenFromCookies(req);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Sign in with Google to load your YouTube playlists." },
      { status: 401 }
    );
  }

  const maxResults = req.nextUrl.searchParams.get("maxResults") ?? "25";

  const result = await youtubeDataGet<unknown>(
    "playlists",
    {
      part: "snippet,contentDetails,status",
      mine: "true",
      maxResults,
    },
    accessToken
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "YouTube Data API request failed",
        status: result.status,
        detail: result.body,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  return NextResponse.json(result.data);
}
