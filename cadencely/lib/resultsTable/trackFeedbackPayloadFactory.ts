import type { BpmFeedbackClientPayload } from "@/lib/bpm/bpmFeedbackApi";

export type TrackFeedbackSource = "artist" | "playlist";

/**
 * Builds a stable localStorage/API scope for a track row.
 */
export function createTrackFeedbackScope(
  source: TrackFeedbackSource,
  input: {
    rowIndex: number;
    rawTitle: string;
    videoId: string;
    /** Artist / album context (artist table) */
    artistContextName?: string;
    playlistId?: string;
  }
): string {
  const vid = input.videoId || `row:${input.rowIndex}`;
  if (source === "artist") {
    const artist = input.artistContextName ?? "";
    return `ar:${artist}:${vid}:${input.rawTitle}`;
  }
  const pl = input.playlistId ?? "";
  return `pl:${pl}:${vid}:${input.rawTitle}`;
}

type BuildPayloadInput = {
  source: TrackFeedbackSource;
  showFeedback: boolean;
  showParsedFeedback: boolean;
  rowIndex: number;
  rawTitle: string;
  tempo: string | null;
  usedParsedFallback: boolean;
  videoId: string;
  parsedSong: string | null;
  parsedArtist: string | null;
  matchedSong: string | null;
  matchedArtist: string | null;
  playlistId?: string;
  /** Artist table: row artist / album context */
  artistContextName?: string;
};

/**
 * Factory for API bodies shared by artist-album and playlist track rows.
 * Returns null when there is no `videoId` (required by the feedback API).
 */
export function buildTrackFeedbackApiPayload(
  input: BuildPayloadInput
): BpmFeedbackClientPayload | null {
  if (!input.showFeedback) return null;

  const videoId = (input.videoId ?? "").trim();
  if (!videoId) return null;

  const rawTitle =
    (input.rawTitle ?? "").trim() || `video:${videoId}`;

  if (input.showParsedFeedback) {
    const calculatedBpm =
      input.tempo && input.tempo !== "-" ? input.tempo.trim() : "";
    const referenceBpm = calculatedBpm;
    if (input.source === "artist") {
      return {
        rawTitle,
        videoId,
        calculatedBpm,
        referenceBpm,
        parsedSong: input.parsedSong,
        parsedArtist: input.parsedArtist,
        matchedSong: input.matchedSong,
        matchedArtist: input.matchedArtist,
        artistName: input.artistContextName,
      };
    }
    return {
      rawTitle,
      videoId,
      calculatedBpm,
      referenceBpm,
      parsedSong: input.parsedSong,
      parsedArtist: input.parsedArtist,
      matchedSong: input.matchedSong,
      matchedArtist: input.matchedArtist,
    };
  }

  if (input.source === "artist") {
    return {
      rawTitle,
      videoId,
      calculatedBpm: "",
      referenceBpm: "",
      parsedSong: null,
      parsedArtist: null,
      matchedSong: null,
      matchedArtist: null,
      artistName: input.artistContextName,
    };
  }

  return {
    rawTitle,
    videoId,
    calculatedBpm: "",
    referenceBpm: "",
    parsedSong: null,
    parsedArtist: null,
    matchedSong: null,
    matchedArtist: null,
  };
}
