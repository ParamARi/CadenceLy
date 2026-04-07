import type { BpmFeedbackPostBody } from "@/lib/bpm/bpmFeedbackApi";

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
 */
export function buildTrackFeedbackApiPayload(
  input: BuildPayloadInput
): Omit<BpmFeedbackPostBody, "vote"> | null {
  if (!input.showFeedback) return null;

  const videoId = input.videoId || undefined;

  if (input.showParsedFeedback) {
    const reportedTempo =
      input.tempo && input.tempo !== "-" ? input.tempo : "";
    if (input.source === "artist") {
      return {
        source: "artist",
        rowIndex: input.rowIndex,
        rawTitle: input.rawTitle,
        reportedTempo,
        usedParsedFallback: input.usedParsedFallback,
        videoId,
        parsedSong: input.parsedSong,
        parsedArtist: input.parsedArtist,
        matchedSong: input.matchedSong,
        matchedArtist: input.matchedArtist,
        artistName: input.artistContextName,
      };
    }
    return {
      source: "playlist",
      rowIndex: input.rowIndex,
      rawTitle: input.rawTitle,
      reportedTempo,
      usedParsedFallback: input.usedParsedFallback,
      videoId,
      parsedSong: input.parsedSong,
      parsedArtist: input.parsedArtist,
      matchedSong: input.matchedSong,
      matchedArtist: input.matchedArtist,
      playlistId: input.playlistId || undefined,
    };
  }

  if (input.source === "artist") {
    return {
      source: "artist",
      rowIndex: input.rowIndex,
      rawTitle: input.rawTitle,
      reportedTempo: "not found",
      usedParsedFallback: false,
      videoId,
      parsedSong: null,
      parsedArtist: null,
      matchedSong: null,
      matchedArtist: null,
      artistName: input.artistContextName,
    };
  }

  return {
    source: "playlist",
    rowIndex: input.rowIndex,
    rawTitle: input.rawTitle,
    reportedTempo: "not found",
    usedParsedFallback: false,
    videoId,
    parsedSong: null,
    parsedArtist: null,
    matchedSong: null,
    matchedArtist: null,
    playlistId: input.playlistId || undefined,
  };
}
