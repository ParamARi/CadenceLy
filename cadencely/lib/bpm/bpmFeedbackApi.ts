/**
 * BPM thumbs feedback — shared types + server-side JSON validation.
 * POST handler will later persist to Postgres; for now only validates and acknowledges.
 */

export type BpmFeedbackSource = "playlist" | "artist";

export type BpmFeedbackPostBody = {
  /** User cleared the vote, or explicit thumbs */
  vote: "up" | "down" | null;
  source: BpmFeedbackSource;
  /** 0-based index in the current table */
  rowIndex: number;
  rawTitle: string;
  /** BPM string as shown in the UI, e.g. "128" */
  reportedTempo: string;
  usedParsedFallback: boolean;
  videoId?: string | null;
  parsedSong?: string | null;
  parsedArtist?: string | null;
  matchedSong?: string | null;
  matchedArtist?: string | null;
  suggestedSong?: string | null;
  suggestedArtist?: string | null;
  suggestedTempo?: string | null;
  playlistId?: string | null;
  artistName?: string | null;
  /** Optional ISO timestamp from the client for future dedup / ordering */
  clientSentAt?: string;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function asBool(v: unknown): boolean | undefined {
  return typeof v === "boolean" ? v : undefined;
}

function asInt(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isInteger(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isInteger(Number(v)))
    return Number(v);
  return undefined;
}

export function parseBpmFeedbackPostBody(
  input: unknown
): { ok: true; body: BpmFeedbackPostBody } | { ok: false; message: string } {
  if (!isRecord(input)) {
    return { ok: false, message: "Body must be a JSON object" };
  }

  const voteRaw = input.vote;
  const vote =
    voteRaw === null || voteRaw === "up" || voteRaw === "down"
      ? voteRaw
      : undefined;
  if (vote === undefined) {
    return { ok: false, message: "vote must be \"up\", \"down\", or null" };
  }

  const source = input.source;
  if (source !== "playlist" && source !== "artist") {
    return { ok: false, message: "source must be \"playlist\" or \"artist\"" };
  }

  const rawTitle = asString(input.rawTitle)?.trim() ?? "";
  if (!rawTitle) {
    return { ok: false, message: "rawTitle is required" };
  }

  const reportedTempo = asString(input.reportedTempo)?.trim() ?? "";
  if (!reportedTempo) {
    return { ok: false, message: "reportedTempo is required" };
  }

  const usedParsedFallback = asBool(input.usedParsedFallback);
  if (usedParsedFallback === undefined) {
    return { ok: false, message: "usedParsedFallback must be a boolean" };
  }

  const rowIndex = asInt(input.rowIndex);
  if (rowIndex === undefined || rowIndex < 0) {
    return { ok: false, message: "rowIndex must be a non-negative integer" };
  }

  const body: BpmFeedbackPostBody = {
    vote,
    source,
    rowIndex,
    rawTitle,
    reportedTempo,
    usedParsedFallback,
    videoId: input.videoId === null ? null : asString(input.videoId),
    parsedSong: input.parsedSong === null ? null : asString(input.parsedSong),
    parsedArtist:
      input.parsedArtist === null ? null : asString(input.parsedArtist),
    matchedSong:
      input.matchedSong === null ? null : asString(input.matchedSong),
    matchedArtist:
      input.matchedArtist === null ? null : asString(input.matchedArtist),
    suggestedSong:
      input.suggestedSong === null ? null : asString(input.suggestedSong),
    suggestedArtist:
      input.suggestedArtist === null ? null : asString(input.suggestedArtist),
    suggestedTempo:
      input.suggestedTempo === null ? null : asString(input.suggestedTempo),
    playlistId:
      input.playlistId === null ? null : asString(input.playlistId),
    artistName:
      input.artistName === null ? null : asString(input.artistName),
    clientSentAt: asString(input.clientSentAt),
  };

  return { ok: true, body };
}
