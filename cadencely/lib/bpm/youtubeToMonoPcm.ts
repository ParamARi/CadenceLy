/**
 * Stream audio from YouTube via ytdl-core, transcode with ffmpeg (Node only).
 * Used to produce WAV for browser-side decode + Essentia BPM analysis.
 *
 * 403 / rate-limit: try `YOUTUBE_COOKIES_FILE` (EditThisCookie JSON export) and keep `@distube/ytdl-core` updated.
 */
import { EventEmitter } from "node:events";
import { Writable } from "node:stream";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "ffmpeg-static";
import { getYoutubeCookiesAgent } from "@/lib/bpm/youtubeCookies";

/** Prefer explicit path in containers (e.g. Alpine + apk ffmpeg); else ffmpeg-static binary */
const FFMPEG_PATH =
  process.env.FFMPEG_PATH ?? ffmpegInstaller ?? "ffmpeg";

const HIGH_WATER_MARK = 1 << 25;

type PlayerClient = "WEB" | "IOS" | "ANDROID" | "TV" | "WEB_EMBEDDED";

const PLAYER_CLIENT_PRESETS: PlayerClient[][] = [
  ["WEB", "IOS", "ANDROID", "TV", "WEB_EMBEDDED"],
  ["IOS", "ANDROID", "WEB", "TV", "WEB_EMBEDDED"],
  ["ANDROID", "IOS", "WEB", "TV", "WEB_EMBEDDED"],
  ["WEB_EMBEDDED", "IOS", "ANDROID", "TV"],
];
const DOWNLOAD_RETRY_ATTEMPTS = 3;

function clearYtdlCache() {
  (ytdl as { cache?: { clear: () => void } }).cache?.clear?.();
}

type VideoInfo = Awaited<ReturnType<typeof ytdl.getInfo>>;

async function ytdlGetInfoRobust(watchUrl: string): Promise<VideoInfo> {
  const agent = getYoutubeCookiesAgent();
  let lastErr: unknown;

  for (let i = 0; i < PLAYER_CLIENT_PRESETS.length; i++) {
    const playerClients = PLAYER_CLIENT_PRESETS[i]!;
    clearYtdlCache();
    try {
      const info = await ytdl.getInfo(watchUrl, {
        playerClients,
        ...(agent ? { agent } : {}),
      });
      return info;
    } catch (e) {
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(
        `[youtubeToMonoPcm] getInfo attempt ${i + 1}/${PLAYER_CLIENT_PRESETS.length} failed (${msg.slice(0, 120)})`
      );
    }
  }

  if (lastErr instanceof Error) throw lastErr;
  throw new Error(String(lastErr ?? "ytdl getInfo failed"));
}

function pickYoutubeFormat(info: VideoInfo) {
  const formats = info.formats;
  if (!formats?.length) {
    throw new Error("No formats returned for this video.");
  }

  const attempts: Array<{
    filter: "audioonly" | "audio" | "audioandvideo";
    quality: "highestaudio" | "highest";
  }> = [
    { filter: "audioonly", quality: "highestaudio" },
    { filter: "audio", quality: "highestaudio" },
    { filter: "audioandvideo", quality: "highest" },
  ];

  for (const opts of attempts) {
    try {
      return ytdl.chooseFormat(formats, opts);
    } catch {
      /* try next strategy */
    }
  }

  throw new Error(
    "No downloadable audio format for this video (may be live-only or region-blocked)."
  );
}

/**
 * First `maxSeconds` of audio as a WAV (PCM) buffer — suitable for `AudioContext.decodeAudioData` in the browser.
 */
export async function youtubeVideoToWavBuffer(
  videoId: string,
  options?: { maxSeconds?: number; sampleRate?: number }
): Promise<Buffer> {
  const maxSeconds = options?.maxSeconds ?? 90;
  const sampleRate = options?.sampleRate ?? 44100;

  ffmpeg.setFfmpegPath(FFMPEG_PATH);

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  let lastErr: unknown;

  for (let attempt = 1; attempt <= DOWNLOAD_RETRY_ATTEMPTS; attempt++) {
    try {
      clearYtdlCache();
      const info = await ytdlGetInfoRobust(url);
      const format = pickYoutubeFormat(info);

      const agent = getYoutubeCookiesAgent();
      const stream = ytdl.downloadFromInfo(info, {
        format,
        highWaterMark: HIGH_WATER_MARK,
        ...(agent ? { agent } : {}),
      });

      const chunks: Buffer[] = [];
      const writable = new Writable({
        write(chunk: Buffer, _enc, cb) {
          chunks.push(Buffer.from(chunk));
          cb();
        },
      });

      await new Promise<void>((resolve, reject) => {
        let settled = false;
        const fail = (err: Error) => {
          if (settled) return;
          settled = true;
          reject(err);
        };
        const ok = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        stream.once("error", fail);
        writable.once("error", fail);

        const ff = ffmpeg(stream)
          .outputOptions(["-t", String(maxSeconds)])
          .audioChannels(1)
          .audioFrequency(sampleRate)
          .format("wav");
        (ff as EventEmitter).on(
          "error",
          (err: Error, _stdout?: string, stderr?: string) => {
            if (stderr) console.error("[ffmpeg]", stderr);
            fail(err);
          }
        );
        ff.on("end", () => {
          /* ffmpeg finished writing */
        });
        ff.pipe(writable, { end: true });

        writable.once("finish", ok);
      });

      const buf = Buffer.concat(chunks);
      if (buf.length < 100) {
        throw new Error("No audio decoded from YouTube stream.");
      }
      return buf;
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(
        `[youtubeToMonoPcm] download attempt ${attempt}/${DOWNLOAD_RETRY_ATTEMPTS} failed (${msg.slice(0, 140)})`
      );
      // Retry only for typical transient YouTube blocks.
      if (!/403|Status code:\s*403|429/i.test(msg)) break;
    }
  }

  if (lastErr instanceof Error) throw lastErr;
  throw new Error("YouTube audio extraction failed.");
}
