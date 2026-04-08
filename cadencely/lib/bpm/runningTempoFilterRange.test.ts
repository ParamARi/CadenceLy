import { describe, expect, it } from "vitest";
import {
  RUNNING_TEMPO_BPM_MARGIN,
  RUNNING_TEMPO_BPM_MARGIN_OPTIONS,
  bpmFilterRangeFromTarget,
} from "./runningTempoFilterRange";

describe("bpmFilterRangeFromTarget", () => {
  it("uses default ±5 around integer target", () => {
    expect(bpmFilterRangeFromTarget(175)).toEqual({ min: 170, max: 180 });
  });

  it("rounds fractional targets before applying margin", () => {
    expect(bpmFilterRangeFromTarget(174.4)).toEqual({ min: 169, max: 179 });
    expect(bpmFilterRangeFromTarget(174.6)).toEqual({ min: 170, max: 180 });
  });

  it("accepts custom margin", () => {
    expect(bpmFilterRangeFromTarget(120, 10)).toEqual({ min: 110, max: 130 });
  });

  it("exports default margin constant", () => {
    expect(RUNNING_TEMPO_BPM_MARGIN).toBe(5);
  });

  it("preset options include the default margin", () => {
    expect(RUNNING_TEMPO_BPM_MARGIN_OPTIONS).toContain(RUNNING_TEMPO_BPM_MARGIN);
  });
});
