import { NextResponse } from "next/server";
import { youtubeVideoToWavBuffer } from "@/lib/bpm/youtubeToMonoPcm";

export const runtime = "nodejs";

/** ytdl + ffmpeg can be slow */
export const maxDuration = 120;

const YT_ID = /^[\w-]{11}$/;

/**
 * GET ?videoId= — returns `audio/wav` (first ~90s mono) for browser decode + Essentia.
 * BPM analysis runs in the client; this route only extracts audio on the server.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoIdRaw = searchParams.get("videoId")?.trim() ?? "";
    if (!videoIdRaw || !YT_ID.test(videoIdRaw)) {
      return NextResponse.json(
        { error: "Invalid or missing videoId (expected 11-character YouTube id)" },
        { status: 400 }
      );
    }

    const wav = await youtubeVideoToWavBuffer(videoIdRaw, {
      maxSeconds: 90,
      sampleRate: 44100,
    });

    return new NextResponse(new Uint8Array(wav), {
      status: 200,
      headers: {
        "Content-Type": "audio/wav",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[api/bpm/youtube-audio]", err);
    const message =
      err instanceof Error ? err.message : "Audio extraction failed";
    const hint =
      /403|Status code:\s*403/i.test(message)
        ? " YouTube often blocks server IPs: refresh cookies via /api/bpm/youtube-cookies (or set YOUTUBE_COOKIES_FILE in .env), then retry."
        : "";
    return NextResponse.json({ error: message + hint }, { status: 500 });
  }
}
