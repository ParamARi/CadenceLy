/**
 * Stream audio from YouTube via ytdl-core, decode first N seconds to mono f32 @ sampleRate using ffmpeg.
 * YouTube's Terms of Service may restrict downloading; use at your own legal risk.
 */
import { EventEmitter } from "node:events";
import { Writable } from "node:stream";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import ffmpegInstaller from "ffmpeg-static";

/** Prefer explicit path in containers (e.g. Alpine + apk ffmpeg); else ffmpeg-static binary */
const FFMPEG_PATH =
  process.env.FFMPEG_PATH ?? ffmpegInstaller ?? "ffmpeg";

export async function youtubeVideoToMonoFloat32(
  videoId: string,
  options?: { maxSeconds?: number; sampleRate?: number }
): Promise<{ samples: Float32Array; sampleRate: number }> {
  const maxSeconds = options?.maxSeconds ?? 90;
  const sampleRate = options?.sampleRate ?? 44100;

  ffmpeg.setFfmpegPath(FFMPEG_PATH);

  const url = `https://www.youtube.com/watch?v=${videoId}`;
  const stream = ytdl(url, {
    filter: "audioonly",
    quality: "highestaudio",
    highWaterMark: 1 << 25,
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
      .format("f32le");
    // fluent-ffmpeg typings omit "error" on some overloads
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
  const byteLength = buf.byteLength - (buf.byteLength % 4);
  if (byteLength < 4) {
    throw new Error("No audio decoded from YouTube stream.");
  }
  const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + byteLength);
  const samples = new Float32Array(ab);
  return { samples, sampleRate };
}
