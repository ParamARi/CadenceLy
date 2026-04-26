import { describe, expect, it } from "vitest";
import { getBpmRangeMatch, isValidBpmRange } from "./bpmRangeMatch";

describe("isValidBpmRange", () => {
  it("accepts positive min/max where min <= max", () => {
    expect(isValidBpmRange(120, 130)).toBe(true);
  });

  it("rejects invalid ranges", () => {
    expect(isValidBpmRange(130, 120)).toBe(false);
    expect(isValidBpmRange(0, 120)).toBe(false);
  });
});

describe("getBpmRangeMatch", () => {
  it("returns not-in-range when no BPM range is active", () => {
    expect(getBpmRangeMatch("126", undefined, undefined, false).inRange).toBe(false);
    expect(getBpmRangeMatch(null, 120, 130, false).inRange).toBe(false);
  });

  it("matches direct bpm in range", () => {
    const match = getBpmRangeMatch("126", 120, 130, false);
    expect(match.inRange).toBe(true);
    expect(match.factor).toBe(1);
    expect(match.matchLabel).toBeNull();
  });

  it("matches by double-time when multiples enabled", () => {
    const match = getBpmRangeMatch("88", 170, 178, true);
    expect(match.inRange).toBe(true);
    expect(match.factor).toBe(2);
    expect(match.matchedBpm).toBe(176);
  });

  it("matches by half-time when multiples enabled", () => {
    const match = getBpmRangeMatch("176", 86, 90, true);
    expect(match.inRange).toBe(true);
    expect(match.factor).toBe(0.5);
    expect(match.matchedBpm).toBe(88);
  });
});
