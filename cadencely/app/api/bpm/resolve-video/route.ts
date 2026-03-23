import { NextResponse } from "next/server";
import YouTube from "youtube-sr";

export const runtime = "nodejs";

const YT_ID = /^[\w-]{11}$/;

/**
 * POST JSON { title, artist? } → { videoId } using YouTube search (server-side only).
 * Client uses `videoId` with GET /api/bpm/youtube-audio for browser BPM analysis.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const artist = typeof body.artist === "string" ? body.artist.trim() : "";

    if (!title) {
      return NextResponse.json(
        { error: "title is required to search for a video" },
        { status: 400 }
      );
    }

    const query = [artist, title].filter(Boolean).join(" ");
    const video = await YouTube.searchOne(query, "video");
    if (!video?.id || !YT_ID.test(video.id)) {
      return NextResponse.json(
        { error: "No matching YouTube video found for this search" },
        { status: 404 }
      );
    }

    return NextResponse.json({ videoId: video.id });
  } catch (err) {
    console.error("[api/bpm/resolve-video]", err);
    const message =
      err instanceof Error ? err.message : "Video lookup failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
