import { NextResponse } from "next/server";
import YouTube from "youtube-sr";
import { analyzeMonoWithEssentia } from "@/lib/essentia/analyzeMono";
import { getServerEssentia } from "@/lib/essentia/server/initEssentia";
import { youtubeVideoToMonoFloat32 } from "@/lib/bpm/youtubeToMonoPcm";

export const runtime = "nodejs";

/** Allow long-running download + Essentia on serverless hosts that support it */
export const maxDuration = 120;

const YT_ID = /^[\w-]{11}$/;

/**
 * POST JSON body:
 * - `videoId` (optional): 11-char YouTube video id
 * - `title` (optional): used with `artist` to search YouTube when `videoId` omitted
 * - `artist` (optional): combined with `title` for search
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const videoIdRaw = typeof body.videoId === "string" ? body.videoId.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const artist = typeof body.artist === "string" ? body.artist.trim() : "";

    let videoId = videoIdRaw;
    if (videoId && !YT_ID.test(videoId)) {
      return NextResponse.json(
        { error: "Invalid videoId (expected 11-character YouTube id)" },
        { status: 400 }
      );
    }

    if (!videoId) {
      if (!title) {
        return NextResponse.json(
          { error: "Provide videoId or title (and optionally artist) to find a video" },
          { status: 400 }
        );
      }
      const query = [artist, title].filter(Boolean).join(" ");
      const video = await YouTube.searchOne(query, "video");
      if (!video?.id) {
        return NextResponse.json(
          { error: "No matching YouTube video found for this search" },
          { status: 404 }
        );
      }
      videoId = video.id;
    }

    const { samples, sampleRate } = await youtubeVideoToMonoFloat32(videoId, {
      maxSeconds: 90,
      sampleRate: 44100,
    });

    const essentia = await getServerEssentia();
    const result = analyzeMonoWithEssentia(essentia, samples, sampleRate, 90);

    return NextResponse.json({
      bpm: result.bpm,
      confidence: result.confidence,
      videoId,
    });
  } catch (err) {
    console.error("[api/bpm/youtube]", err);
    const message =
      err instanceof Error ? err.message : "BPM analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
