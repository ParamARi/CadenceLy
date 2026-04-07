export const TAP_BPM_PAUSE_MS = 2000;
export const TAP_BPM_MIN = 40;
export const TAP_BPM_MAX = 300;
/** Number of recent intervals to use (from the last `maxIntervals + 1` taps). */
export const TAP_BPM_MAX_INTERVALS = 15;

export function median(nums: number[]): number {
  if (nums.length === 0) {
    return NaN;
  }
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function intervalsFromTimestampsMs(timestampsMs: number[]): number[] {
  if (timestampsMs.length < 2) {
    return [];
  }
  const out: number[] = [];
  for (let i = 1; i < timestampsMs.length; i++) {
    out.push(timestampsMs[i] - timestampsMs[i - 1]);
  }
  return out;
}

/**
 * Drops older taps when a gap longer than `pauseMs` occurs; the tap after the gap starts a new run.
 */
export function trimTimestampsAfterPause(
  timestampsMs: number[],
  pauseMs: number
): number[] {
  if (timestampsMs.length === 0) {
    return [];
  }
  const run: number[] = [timestampsMs[0]];
  for (let i = 1; i < timestampsMs.length; i++) {
    const gap = timestampsMs[i] - timestampsMs[i - 1];
    if (gap > pauseMs) {
      run.length = 0;
      run.push(timestampsMs[i]);
    } else {
      run.push(timestampsMs[i]);
    }
  }
  return run;
}

export function clampBpm(bpm: number): number {
  return Math.round(
    Math.max(TAP_BPM_MIN, Math.min(TAP_BPM_MAX, bpm))
  );
}

export function bpmFromIntervalsMs(intervalsMs: number[]): number | null {
  if (intervalsMs.length === 0) {
    return null;
  }
  const medMs = median(intervalsMs);
  if (!Number.isFinite(medMs) || medMs <= 0) {
    return null;
  }
  const bpm = 60000 / medMs;
  return clampBpm(bpm);
}

export type TapBpmComputeResult = {
  bpm: number | null;
  tapCount: number;
  effectiveTimestamps: number[];
};

export function computeTapBpm(
  timestampsMs: number[],
  opts?: { pauseMs?: number; maxIntervals?: number }
): TapBpmComputeResult {
  const pauseMs = opts?.pauseMs ?? TAP_BPM_PAUSE_MS;
  const maxIntervals = opts?.maxIntervals ?? TAP_BPM_MAX_INTERVALS;
  let ts = trimTimestampsAfterPause(timestampsMs, pauseMs);
  const maxTaps = maxIntervals + 1;
  if (ts.length > maxTaps) {
    ts = ts.slice(-maxTaps);
  }
  const intervals = intervalsFromTimestampsMs(ts);
  const bpm = bpmFromIntervalsMs(intervals);
  return { bpm, tapCount: ts.length, effectiveTimestamps: ts };
}
