/**
 * Client-side BPM estimation via Essentia.js (AGPL-3.0). Only import from client components.
 * WASM is served from /essentia/essentia-wasm.web.wasm (see scripts/copy-essentia-wasm.cjs).
 */

import { analyzeMonoWithEssentia, type EssentiaBpmResult } from "./analyzeMono";

export type { EssentiaBpmResult };

const DEFAULT_MAX_SECONDS = 90;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let essentiaInitPromise: Promise<any> | null = null;

async function getEssentia() {
  if (!essentiaInitPromise) {
    essentiaInitPromise = (async () => {
      const wasmMod = await import(
        /* webpackMode: "lazy-once" */ "essentia.js/dist/essentia-wasm.web.js"
      );
      const EssentiaWASM = (wasmMod as { default?: unknown }).default ?? wasmMod;
      const wasm = EssentiaWASM as {
        ready: Promise<unknown>;
        locateFile?: (path: string) => string;
      };

      wasm.locateFile = (path: string) => {
        if (path.endsWith(".wasm")) return "/essentia/essentia-wasm.web.wasm";
        return path;
      };

      await wasm.ready;

      const coreMod = await import(
        /* webpackMode: "lazy-once" */ "essentia.js/dist/essentia.js-core.umd.js"
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Essentia = (coreMod as any).default ?? coreMod;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return new Essentia(EssentiaWASM as any);
    })();
  }
  return essentiaInitPromise;
}

/**
 * Decode an audio file and estimate tempo using RhythmExtractor2013 (multifeature).
 */
export async function estimateBpmFromAudioFile(
  file: File,
  options?: { maxSeconds?: number }
): Promise<EssentiaBpmResult> {
  const maxSeconds = options?.maxSeconds ?? DEFAULT_MAX_SECONDS;
  const audioCtx = new AudioContext();
  try {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(arrayBuffer.slice(0));
    const essentia = await getEssentia();
    const mono = essentia.audioBufferToMonoSignal(buffer);
    const sr = buffer.sampleRate;
    return analyzeMonoWithEssentia(essentia, mono, sr, maxSeconds);
  } finally {
    await audioCtx.close().catch(() => undefined);
  }
}
