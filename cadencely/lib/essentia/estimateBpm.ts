/**
 * Client-side BPM estimation via Essentia.js (AGPL-3.0). Only import from client components.
 * WASM is served from /essentia/essentia-wasm.web.wasm (see scripts/copy-essentia-wasm.cjs).
 */

export type EssentiaBpmResult = {
  bpm: number;
  /** RhythmExtractor2013 confidence; may be 0 for "degara" method */
  confidence: number | null;
};

const DEFAULT_MAX_SECONDS = 90;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let essentiaInitPromise: Promise<any> | null = null;

async function getEssentia() {
  if (!essentiaInitPromise) {
    essentiaInitPromise = (async () => {
      const wasmMod = await import(
        /* webpackMode: "lazy-once" */ "essentia.js/dist/essentia-wasm.web.js"
      );
      // CJS interop — runtime shape from Emscripten module
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
    let mono = essentia.audioBufferToMonoSignal(buffer);
    const sr = buffer.sampleRate;
    const maxSamples = Math.floor(maxSeconds * sr);
    if (mono.length > maxSamples) {
      mono = mono.slice(0, maxSamples);
    }

    const vector = essentia.arrayToVector(mono);
    // multifeature: slower, with confidence; degara is faster but confidence is always 0
    const result = essentia.RhythmExtractor2013(vector, 208, "multifeature", 40);

    const rawBpm = result.bpm as number;
    const bpm = Number.isFinite(rawBpm) ? Math.round(rawBpm * 10) / 10 : NaN;
    const conf = result.confidence;
    const confidence =
      typeof conf === "number" && Number.isFinite(conf) ? conf : null;

    if (!Number.isFinite(bpm)) {
      throw new Error("Could not estimate BPM from this audio.");
    }

    return { bpm, confidence };
  } finally {
    await audioCtx.close().catch(() => undefined);
  }
}
