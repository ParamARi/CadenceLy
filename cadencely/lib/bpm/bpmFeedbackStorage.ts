/**
 * Persist BPM / parsed-match feedback in localStorage (per browser).
 */

export type BpmFeedbackVote = "up" | "down";

const LS_PREFIX = "cadencely.bpmFeedback.v1.";

export function makeBpmFeedbackKey(input: {
  /** e.g. playlist id, or "artist" */
  scope: string;
  rawTitle: string;
  reportedTempo: number;
  usedParsedFallback: boolean;
  parsedSong?: string | null;
  parsedArtist?: string | null;
}): string {
  const parts = [
    input.scope,
    input.rawTitle,
    input.reportedTempo,
    input.usedParsedFallback ? "1" : "0",
    input.parsedSong ?? "",
    input.parsedArtist ?? "",
  ];
  return `${LS_PREFIX}${parts.join("¦")}`;
}

export function getBpmFeedback(key: string): BpmFeedbackVote | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(key);
    if (v === "up" || v === "down") return v;
    return null;
  } catch {
    return null;
  }
}

export function setBpmFeedback(key: string, vote: BpmFeedbackVote | null): void {
  if (typeof window === "undefined") return;
  try {
    if (vote === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, vote);
  } catch {
    /* quota / private mode */
  }
}
