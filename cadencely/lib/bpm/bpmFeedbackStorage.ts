/**
 * Stable keys for BPM feedback UI (e.g. per-row form reset in `BpmFeedbackButtons`).
 */

const LS_PREFIX = "cadencely.bpmFeedback.v1.";

export function makeBpmFeedbackKey(input: {
  /** e.g. playlist id, artist scope, album scope */
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
