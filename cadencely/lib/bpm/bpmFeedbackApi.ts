/**
 * BPM feedback — client JSON (camelCase) → validation → upstream body (snake_case).
 */

/** JSON body the browser POSTs to `/api/feedback/bpm`. */
export type BpmFeedbackClientPayload = {
  rawTitle: string;
  /** Required for persistence (YouTube / track id). */
  videoId: string;
  /**
   * Displayed or user-entered BPM text. Parsed to `calculated_bpm` (exclusive 0, up to 400 inclusive).
   * May be empty when `suggestedTempo` holds the measured value (no-API match flow).
   */
  calculatedBpm: string;
  /** If non-empty and parses in range, sent as optional `reference_bpm`. */
  referenceBpm?: string;
  /** Fallback numeric source when `calculatedBpm` is empty or not parseable. */
  suggestedTempo?: string | null;
  parsedSong?: string | null;
  parsedArtist?: string | null;
  matchedSong?: string | null;
  matchedArtist?: string | null;
  suggestedSong?: string | null;
  suggestedArtist?: string | null;
  artistName?: string | null;
  clientSentAt?: string;
};

/** Normalized row after `parseBpmFeedbackPostBody`. */
export type BpmFeedbackPostBody = {
  rawTitle: string;
  videoId: string;
  calculatedBpm: string;
  referenceBpm: number | null;
  parsedSong: string | null;
  parsedArtist: string | null;
  matchedSong: string | null;
  matchedArtist: string | null;
  suggestedSong: string | null;
  suggestedArtist: string | null;
  artistName: string | null;
  clientSentAt?: string;
};

/** Body forwarded to Express / Postgres (snake_case). */
export type BpmFeedbackUpstreamJson = {
  userId: string;
  rawTitle: string;
  videoId: string;
  reportedTempo: string;
  parsedSong: string | null;
  suggestedSong: string | null;
  parsedArtist: string | null;
  suggestedArtist: string | null;
  artistName: string | null;
  referencedBpm?: number;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function asString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function nullIfEmpty(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t === "" ? null : t;
}

/** BPM must be greater than 0 and at most 400. */
export function parseBpmInRange(v: unknown): number | null {
  if (v == null) return null;
  const raw = typeof v === "string" ? v.trim() : String(v);
  if (raw === "" || /^not\s*found$/i.test(raw)) return null;
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  if (n <= 0 || n > 400) return null;
  return n;
}

export function buildBpmFeedbackUpstreamJson(
  body: BpmFeedbackPostBody,
  userId: string
): BpmFeedbackUpstreamJson {
  const out: BpmFeedbackUpstreamJson = {
    userId: userId,
    rawTitle: body.rawTitle,
    videoId: body.videoId,
    reportedTempo: body.calculatedBpm,
    parsedSong: nullIfEmpty(body.matchedSong ?? body.parsedSong ?? undefined),
    suggestedSong: nullIfEmpty(body.suggestedSong ?? undefined),
    parsedArtist: nullIfEmpty(body.matchedArtist ?? body.parsedArtist ?? undefined),
    suggestedArtist: nullIfEmpty(body.suggestedArtist ?? undefined),
    artistName: nullIfEmpty(body.artistName ?? undefined),
  };
  if (
    body.referenceBpm != null &&
    body.referenceBpm !== body.calculatedBpm
  ) {
    out.referencedBpm = body.referenceBpm;
  }
  return out;
}

export function parseBpmFeedbackPostBody(
  input: unknown
): { ok: true; body: BpmFeedbackPostBody } | { ok: false; message: string } {
  if (!isRecord(input)) {
    return { ok: false, message: "Body must be a JSON object" };
  }

  const rawTitle = asString(input.rawTitle)?.trim() ?? "";
  if (!rawTitle) {
    return { ok: false, message: "rawTitle is required" };
  }

  const videoId = asString(input.videoId)?.trim() ?? "";
  if (!videoId) {
    return { ok: false, message: "videoId is required" };
  }

  const fromCalc = parseBpmInRange(input.calculatedBpm);
  const fromSuggested = parseBpmInRange(input.suggestedTempo);
  const calculatedBpm = fromCalc ?? fromSuggested;
  if (calculatedBpm == null) {
    return {
      ok: false,
      message:
        "calculatedBpm (or suggestedTempo) must be a number with 0 < BPM ≤ 400",
    };
  }

  let referenceBpm: number | null = null;
  const refRaw = input.referenceBpm;
  if (refRaw !== null && refRaw !== undefined && refRaw !== "") {
    const ref = parseBpmInRange(refRaw);
    if (ref == null) {
      return {
        ok: false,
        message: "referenceBpm must be a number with 0 < BPM ≤ 400 when set",
      };
    }
    referenceBpm = ref;
  }

  const body: BpmFeedbackPostBody = {
    rawTitle,
    videoId,
    calculatedBpm,
    referenceBpm,
    parsedSong: input.parsedSong === null ? null : nullIfEmpty(asString(input.parsedSong)),
    parsedArtist:
      input.parsedArtist === null ? null : nullIfEmpty(asString(input.parsedArtist)),
    matchedSong:
      input.matchedSong === null ? null : nullIfEmpty(asString(input.matchedSong)),
    matchedArtist:
      input.matchedArtist === null ? null : nullIfEmpty(asString(input.matchedArtist)),
    suggestedSong:
      input.suggestedSong === null ? null : nullIfEmpty(asString(input.suggestedSong)),
    suggestedArtist:
      input.suggestedArtist === null
        ? null
        : nullIfEmpty(asString(input.suggestedArtist)),
    artistName:
      input.artistName === null ? null : nullIfEmpty(asString(input.artistName)),
    clientSentAt: asString(input.clientSentAt),
  };

  return { ok: true, body };
}
