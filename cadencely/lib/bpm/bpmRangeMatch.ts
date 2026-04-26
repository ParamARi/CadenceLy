export type BpmRangeMatch = {
  inRange: boolean;
  /** Multiplier applied to stored BPM to evaluate range match. */
  factor: 0.5 | 1 | 2;
  matchedBpm: number | null;
  /** Human-readable explanation when a multiplied BPM matched. */
  matchLabel: string | null;
};

function isFinitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function isValidBpmRange(minBPM?: number, maxBPM?: number): boolean {
  if (!minBPM || !maxBPM) return false;
  if (!isFinitePositive(minBPM) || !isFinitePositive(maxBPM)) return false;
  return minBPM <= maxBPM;
}

/**
 * Check if a stored tempo is inside the selected range.
 * Optional multiples mode treats half/double tempos as equivalent.
 *
 * When no valid range is set, returns `inRange: false` so UI callers can treat
 * that as “no sweet-spot highlight” (not “out of range”).
 */
export function getBpmRangeMatch(
  tempo: string | number | null | undefined,
  minBPM?: number,
  maxBPM?: number,
  includeMultiples = false
): BpmRangeMatch {
  if (!isValidBpmRange(minBPM, maxBPM)) {
    return { inRange: false, factor: 1, matchedBpm: null, matchLabel: null };
  }

  const raw =
    typeof tempo === "number" ? tempo : typeof tempo === "string" ? parseInt(tempo, 10) : NaN;
  if (!Number.isFinite(raw) || raw <= 0) {
    return { inRange: false, factor: 1, matchedBpm: null, matchLabel: null };
  }

  const min = minBPM as number;
  const max = maxBPM as number;

  const candidates: Array<{ factor: 0.5 | 1 | 2; value: number; label: string | null }> = [
    { factor: 1, value: raw, label: null },
  ];
  if (includeMultiples) {
    candidates.push(
      {
        factor: 0.5,
        value: Math.round(raw * 0.5),
        label: `stored ${raw} matches ${Math.round(raw * 0.5)} at half-time (\u00f72)`,
      },
      {
        factor: 2,
        value: raw * 2,
        label: `stored ${raw} matches ${raw * 2} at double-time (\u00d72)`,
      }
    );
  }

  for (const candidate of candidates) {
    if (candidate.value >= min && candidate.value <= max) {
      return {
        inRange: true,
        factor: candidate.factor,
        matchedBpm: candidate.value,
        matchLabel: candidate.label,
      };
    }
  }

  return {
    inRange: false,
    factor: 1,
    matchedBpm: raw,
    matchLabel: null,
  };
}
