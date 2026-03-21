/**
 * Shared Essentia rhythm analysis for mono PCM (browser or Node).
 * AGPL-3.0 applies via essentia.js.
 */

export type EssentiaBpmResult = {
  bpm: number;
  confidence: number | null;
};

const DEFAULT_MAX_SECONDS = 90;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function analyzeMonoWithEssentia(
  essentia: any,
  mono: Float32Array,
  sampleRate: number,
  maxSeconds: number = DEFAULT_MAX_SECONDS
): EssentiaBpmResult {
  const maxSamples = Math.floor(maxSeconds * sampleRate);
  const samples =
    mono.length > maxSamples ? mono.slice(0, maxSamples) : mono;

  const vector = essentia.arrayToVector(samples);
  const result = essentia.RhythmExtractor2013(
    vector,
    208,
    "multifeature",
    40
  );

  const rawBpm = result.bpm as number;
  const bpm = Number.isFinite(rawBpm) ? Math.round(rawBpm * 10) / 10 : NaN;
  const conf = result.confidence;
  const confidence =
    typeof conf === "number" && Number.isFinite(conf) ? conf : null;

  if (!Number.isFinite(bpm)) {
    throw new Error("Could not estimate BPM from this audio.");
  }

  return { bpm, confidence };
}
