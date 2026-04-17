import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAccessTokenFromCookies,
  youtubeDataPost,
} from "@/lib/youtube/youtubeDataClient";
import { PLAYLIST_ADD_ITEMS_MAX_VIDEOS } from "@/lib/youtube/playlistAddItemsLimits";

type PlaylistItemInsertResponse = { id?: string };

/**
 * Append videos to a playlist owned by the signed-in user (`playlistItems.insert`).
 * Body: `{ playlistId: string, videoIds: string[] }`
 */
export async function POST(req: NextRequest) {
  const accessToken = await getGoogleAccessTokenFromCookies(req);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Sign in with Google to update a playlist." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  const playlistId =
    typeof rec.playlistId === "string" ? rec.playlistId.trim() : "";
  if (!playlistId) {
    return NextResponse.json({ error: "playlistId is required." }, { status: 400 });
  }

  const rawIds = rec.videoIds;
  if (!Array.isArray(rawIds) || rawIds.length === 0) {
    return NextResponse.json(
      { error: "videoIds must be a non-empty array." },
      { status: 400 }
    );
  }

  const videoIds = rawIds
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());

  const unique = [...new Set(videoIds)];
  if (unique.length > PLAYLIST_ADD_ITEMS_MAX_VIDEOS) {
    return NextResponse.json(
      {
        error: `You can add at most ${PLAYLIST_ADD_ITEMS_MAX_VIDEOS} unique videos per save.`,
        maxVideos: PLAYLIST_ADD_ITEMS_MAX_VIDEOS,
        reason:
          "YouTube adds each video with a separate Data API call. Smaller batches reduce quota use, rate limits, and long-running requests.",
      },
      { status: 400 }
    );
  }

  const added: string[] = [];
  const failures: { videoId: string; status: number; detail: string }[] = [];

  for (const videoId of unique) {
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      failures.push({
        videoId,
        status: 400,
        detail: "Invalid video id",
      });
      continue;
    }

    const result = await youtubeDataPost<PlaylistItemInsertResponse>(
      "playlistItems",
      { part: "snippet" },
      accessToken,
      {
        snippet: {
          playlistId,
          resourceId: { kind: "youtube#video", videoId },
        },
      }
    );

    if (!result.ok) {
      failures.push({
        videoId,
        status: result.status,
        detail: result.body.slice(0, 500),
      });
      continue;
    }

    added.push(videoId);
  }

  return NextResponse.json({ added, addedCount: added.length, failures });
}
