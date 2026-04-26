import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type DependencyList,
} from "react";
import { lookupTempoWithParsedTitleFallback } from "@/lib/bpm/lookupTempoWithParsedTitle";
import {
  getTempoLookupFromSessionCache,
  setTempoLookupSessionCache,
  tempoLookupCacheKey,
} from "@/lib/bpm/tempoLookupSessionCache";
import { makeBpmFeedbackKey } from "@/lib/bpm/bpmFeedbackStorage";
import type { BpmFeedbackClientPayload } from "@/lib/bpm/bpmFeedbackApi";
import {
  buildTrackFeedbackApiPayload,
  createTrackFeedbackScope,
  type TrackFeedbackSource,
} from "@/lib/resultsTable/trackFeedbackPayloadFactory";
import {
  getBpmRangeMatch,
  isValidBpmRange,
  type BpmRangeMatch,
} from "@/lib/bpm/bpmRangeMatch";

export type TrackRowTempoMode = "artist" | "playlist" | "album";

type UseTrackRowTempoFeedbackArgs = {
  mode: TrackRowTempoMode;
  rowIndex: number;
  rawTitle: string;
  /** When omitted, tempo lookup uses title-only matching (empty artist string). */
  lookupArtistName?: string;
  minBPM?: number;
  maxBPM?: number;
  includeBpmMultiples?: boolean;
  videoId: string;
  /** Artist table: API `artistName` / scope */
  artistContextName?: string;
  playlistId?: string;
  /** Album expanded tracklist: YTMusic album id for feedback scope (same behavior as playlist). */
  albumId?: string;
  /** Dependency list for the lookup effect (e.g. [song.name, artistName]) */
  lookupEffectDeps: DependencyList;
};

function applyLookupResult(
  mode: TrackRowTempoMode,
  result: Awaited<ReturnType<typeof lookupTempoWithParsedTitleFallback>>,
  setters: {
    setTempo: (v: string | null) => void;
    setUsedParsedFallback: (v: boolean) => void;
    setParsedArtist: (v: string | null) => void;
    setParsedSong: (v: string | null) => void;
    setMatchedSong: (v: string | null) => void;
    setMatchedArtist: (v: string | null) => void;
  }
) {
  const {
    setTempo,
    setUsedParsedFallback,
    setParsedArtist,
    setParsedSong,
    setMatchedSong,
    setMatchedArtist,
  } = setters;

  setTempo(result.tempo ?? "-");
  setUsedParsedFallback(Boolean(result.usedParsedFallback));

  if (result.usedParsedFallback && result.parsedSong) {
    setParsedArtist(result.parsedArtist || "Unknown");
    setParsedSong(result.parsedSong);
    if (mode === "artist") {
      setMatchedSong(result.matchedSong ?? "—");
      setMatchedArtist(result.matchedArtist ?? "—");
    } else {
      setMatchedSong(result.matchedSong || "Unknown");
      setMatchedArtist(result.matchedArtist || "Unknown");
    }
    return;
  }

  setParsedArtist(null);
  setParsedSong(null);
  setMatchedSong(result.matchedSong ?? null);
  setMatchedArtist(result.matchedArtist ?? null);
}

/**
 * Tempo lookup + BPM feedback for artist, album, and playlist track rows
 * (shared `tempoLookupSessionCache` by videoId / title|artist).
 */
export function useTrackRowTempoFeedback({
  mode,
  rowIndex,
  rawTitle,
  lookupArtistName,
  minBPM,
  maxBPM,
  includeBpmMultiples = false,
  videoId,
  artistContextName,
  playlistId,
  albumId,
  lookupEffectDeps,
}: UseTrackRowTempoFeedbackArgs) {
  const lookupArtist = lookupArtistName ?? "";

  const [tempo, setTempo] = useState<string | null>(null);
  const [usedParsedFallback, setUsedParsedFallback] = useState(false);
  const [parsedArtist, setParsedArtist] = useState<string | null>(null);
  const [parsedSong, setParsedSong] = useState<string | null>(null);
  const [matchedSong, setMatchedSong] = useState<string | null>(null);
  const [matchedArtist, setMatchedArtist] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cacheKey = tempoLookupCacheKey({
      videoId,
      rawTitle: rawTitle.trim(),
      artistName: lookupArtist,
    });
    const cached = getTempoLookupFromSessionCache(cacheKey);
    if (cached) {
      applyLookupResult(mode, cached, {
        setTempo,
        setUsedParsedFallback,
        setParsedArtist,
        setParsedSong,
        setMatchedSong,
        setMatchedArtist,
      });
      setLoading(false);
      return;
    }

    let isMounted = true;
    async function fetchTempo() {
      setLoading(true);
      try {
        const result = await lookupTempoWithParsedTitleFallback({
          rawTitle: rawTitle.trim(),
          artistName: lookupArtist,
        });
        setTempoLookupSessionCache(cacheKey, result);
        if (isMounted) {
          applyLookupResult(mode, result, {
            setTempo,
            setUsedParsedFallback,
            setParsedArtist,
            setParsedSong,
            setMatchedSong,
            setMatchedArtist,
          });
        }
      } catch (err) {
        if (isMounted) {
          setTempo("-");
          setUsedParsedFallback(false);
          setParsedArtist(null);
          setParsedSong(null);
          setMatchedSong(null);
          setMatchedArtist(null);
        }
        if (mode === "artist") {
          console.error("Error fetching tempo", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void fetchTempo();
    return () => {
      isMounted = false;
    };
  }, [mode, rawTitle, lookupArtist, videoId, ...lookupEffectDeps]);

  /**
   * Session cache only stores lookup results — it must not make rows look
   * "out of range" while tempo is still loading or unknown ("-", null).
   */
  const bpmRangeMatch = useMemo((): BpmRangeMatch | undefined => {
    if (!isValidBpmRange(minBPM, maxBPM)) return undefined;
    if (loading || tempo == null || tempo === "" || tempo === "-") {
      return undefined;
    }
    return getBpmRangeMatch(tempo, minBPM, maxBPM, includeBpmMultiples);
  }, [tempo, minBPM, maxBPM, includeBpmMultiples, loading]);

  const isOutOfRange = useMemo(() => {
    if (!isValidBpmRange(minBPM, maxBPM)) return false;
    if (loading || tempo == null || tempo === "" || tempo === "-") {
      return false;
    }
    return !getBpmRangeMatch(tempo, minBPM, maxBPM, includeBpmMultiples).inRange;
  }, [tempo, minBPM, maxBPM, includeBpmMultiples, loading]);

  const source: TrackFeedbackSource =
    mode === "artist"
      ? "artist"
      : mode === "playlist"
        ? "playlist"
        : "album";

  const feedbackScope = useMemo(
    () =>
      createTrackFeedbackScope(source, {
        rowIndex,
        rawTitle,
        videoId,
        artistContextName,
        playlistId,
        albumId,
      }),
    [
      source,
      rowIndex,
      rawTitle,
      videoId,
      artistContextName,
      playlistId,
      albumId,
    ]
  );

  const feedbackKey = useMemo(
    () =>
      makeBpmFeedbackKey({
        scope: feedbackScope,
        rawTitle,
        reportedTempo: parseInt(tempo || "0", 10),
        usedParsedFallback,
        parsedSong,
        parsedArtist,
      }),
    [feedbackScope, rawTitle, tempo, usedParsedFallback, parsedSong, parsedArtist]
  );

  const feedbackApiPayload = useMemo(():
    | BpmFeedbackClientPayload
    | null => {
    return buildTrackFeedbackApiPayload({
      source,
      rawTitle,
      tempo,
      videoId,
      parsedSong,
      parsedArtist,
      matchedSong,
      matchedArtist,
      artistContextName,
    });
  }, [
    source,
    rawTitle,
    tempo,
    videoId,
    parsedSong,
    parsedArtist,
    matchedSong,
    matchedArtist,
    artistContextName,
  ]);

  const onMeasuredBpmFromTap = useCallback((_nextBpm: number) => {}, []);

  return {
    tempo,
    loading,
    usedParsedFallback,
    parsedArtist,
    parsedSong,
    matchedSong,
    matchedArtist,
    onMeasuredBpmFromTap,
    isOutOfRange,
    bpmRangeMatch,
    feedbackKey,
    feedbackApiPayload,
  };
}
