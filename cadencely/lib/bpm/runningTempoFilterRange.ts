/** Half-width of the tempo filter applied around a tap-measured running cadence (BPM). */
export const RUNNING_TEMPO_BPM_MARGIN = 5;

/** Preset ± values offered in the running-tempo modal (BPM each side of cadence). */
export const RUNNING_TEMPO_BPM_MARGIN_OPTIONS = [
  2, 3, 5, 7, 10, 15, 20,
] as const;

export type RunningTempoBpmMarginOption =
  (typeof RUNNING_TEMPO_BPM_MARGIN_OPTIONS)[number];

/**
 * Builds min/max tempo filter bounds symmetric around a measured cadence BPM.
 * Example: target 175 → min 170, max 180.
 */
export function bpmFilterRangeFromTarget(
  targetBpm: number,
  margin: number = RUNNING_TEMPO_BPM_MARGIN
): { min: number; max: number } {
  const rounded = Math.round(targetBpm);
  return {
    min: rounded - margin,
    max: rounded + margin,
  };
}
