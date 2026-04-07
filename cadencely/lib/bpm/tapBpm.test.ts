import { describe, expect, it } from "vitest";
import {
  bpmFromIntervalsMs,
  clampBpm,
  computeTapBpm,
  intervalsFromTimestampsMs,
  median,
  TAP_BPM_MAX,
  TAP_BPM_MIN,
  trimTimestampsAfterPause,
} from "./tapBpm";

describe("median", () => {
  it("returns middle for odd length", () => {
    expect(median([3, 1, 2])).toBe(2);
  });
  it("returns average of middles for even length", () => {
    expect(median([10, 20, 30, 40])).toBe(25);
  });
});

describe("intervalsFromTimestampsMs", () => {
  it("returns empty for fewer than 2 stamps", () => {
    expect(intervalsFromTimestampsMs([])).toEqual([]);
    expect(intervalsFromTimestampsMs([1])).toEqual([]);
  });
  it("returns pairwise deltas", () => {
    expect(intervalsFromTimestampsMs([0, 500, 1000])).toEqual([500, 500]);
  });
});

describe("trimTimestampsAfterPause", () => {
  it("keeps one stamp after a long gap", () => {
    const ts = [0, 500, 1000, 4000, 4500];
    expect(trimTimestampsAfterPause(ts, 2000)).toEqual([4000, 4500]);
  });
  it("preserves continuous run", () => {
    const ts = [0, 500, 1000, 1500];
    expect(trimTimestampsAfterPause(ts, 2000)).toEqual(ts);
  });
});

describe("bpmFromIntervalsMs", () => {
  it("returns null for empty", () => {
    expect(bpmFromIntervalsMs([])).toBe(null);
  });
  it("maps 500ms to 120 BPM", () => {
    expect(bpmFromIntervalsMs([500])).toBe(120);
  });
  it("uses median of three intervals", () => {
    const bpm = bpmFromIntervalsMs([400, 500, 600]);
    expect(bpm).toBe(120);
  });
});

describe("clampBpm", () => {
  it("clamps low", () => {
    expect(clampBpm(10)).toBe(TAP_BPM_MIN);
  });
  it("clamps high", () => {
    expect(clampBpm(400)).toBe(TAP_BPM_MAX);
  });
});

describe("computeTapBpm", () => {
  it("no BPM until two taps in same run", () => {
    const t0 = 1000;
    const r = computeTapBpm([t0]);
    expect(r.bpm).toBe(null);
    expect(r.tapCount).toBe(1);
  });
  it("120 BPM from two taps 500ms apart", () => {
    const r = computeTapBpm([0, 500]);
    expect(r.bpm).toBe(120);
    expect(r.tapCount).toBe(2);
  });
  it("ignores taps before pause when computing", () => {
    const r = computeTapBpm([0, 500, 1000, 3500, 4000], { pauseMs: 2000 });
    expect(r.tapCount).toBe(2);
    expect(r.bpm).toBe(120);
  });
  it("slices to last maxIntervals+1 timestamps", () => {
    const stamps: number[] = [];
    let t = 0;
    for (let i = 0; i < 25; i++) {
      stamps.push(t);
      t += 500;
    }
    const r = computeTapBpm(stamps, { maxIntervals: 3 });
    expect(r.effectiveTimestamps.length).toBe(4);
    expect(r.bpm).toBe(120);
  });
});
