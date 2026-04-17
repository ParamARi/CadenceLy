import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAccessTokenFromCookies,
  youtubeDataGet,
} from "@/lib/youtube/youtubeDataClient";

/**
 * Items in a playlist (`playlistItems.list`).
 */
export async function GET(req: NextRequest) {
  const accessToken = await getGoogleAccessTokenFromCookies(req);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Sign in with Google to load playlist items." },
      { status: 401 }
    );
  }

  const playlistId = req.nextUrl.searchParams.get("playlistId")?.trim();
  if (!playlistId) {
    return NextResponse.json(
      { error: "playlistId is required" },
      { status: 400 }
    );
  }

  const maxResults = req.nextUrl.searchParams.get("maxResults") ?? "50";
  const pageToken = req.nextUrl.searchParams.get("pageToken") ?? undefined;

  const result = await youtubeDataGet<unknown>(
    "playlistItems",
    {
      part: "snippet,contentDetails,status",
      playlistId,
      maxResults,
      pageToken,
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
