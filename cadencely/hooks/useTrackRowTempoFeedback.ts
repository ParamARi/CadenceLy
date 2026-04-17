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

export type TrackRowTempoMode = "artist" | "playlist" | "album";

type UseTrackRowTempoFeedbackArgs = {
  mode: TrackRowTempoMode;
  rowIndex: number;
  rawTitle: string;
  /** When omitted, tempo lookup uses title-only matching (empty artist string). */
  lookupArtistName?: string;
  minBPM?: number;
  maxBPM?: number;
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
  if (mode === "artist") {
    setMatchedSong(result.matchedSong);
    setMatchedArtist(result.matchedArtist);
  } else {
    setMatchedSong(null);
    setMatchedArtist(null);
  }
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
  const [prefillSuggestedTempo, setPrefillSuggestedTempo] = useState<string | null>(
    null
  );

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

  const isOutOfRange = useMemo(() => {
    if (!tempo || tempo === "-") return false;
    if (minBPM && maxBPM && minBPM > 0 && maxBPM >= minBPM) {
      const bpm = parseInt(tempo, 10);
      return bpm < minBPM || bpm > maxBPM;
    }
    return false;
  }, [tempo, minBPM, maxBPM]);

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

  const hasApiTempo = Boolean(tempo && tempo !== "-");
  const showParsedFeedback = Boolean(!loading && hasApiTempo && usedParsedFallback);
  const showNoMatchFeedback = Boolean(!loading && !hasApiTempo);
  const showFeedback = showParsedFeedback || showNoMatchFeedback;

  const feedbackApiPayload = useMemo(():
    | BpmFeedbackClientPayload
    | null => {
    return buildTrackFeedbackApiPayload({
      source,
      showFeedback,
      showParsedFeedback,
      rowIndex,
      rawTitle,
      tempo,
      usedParsedFallback,
      videoId,
      parsedSong,
      parsedArtist,
      matchedSong,
      matchedArtist,
      playlistId,
      artistContextName,
    });
  }, [
    source,
    showFeedback,
    showParsedFeedback,
    rowIndex,
    rawTitle,
    tempo,
    usedParsedFallback,
    videoId,
    parsedSong,
    parsedArtist,
    matchedSong,
    matchedArtist,
    playlistId,
    artistContextName,
  ]);

  const onMeasuredBpmFromTap = useCallback((nextBpm: number) => {
    setPrefillSuggestedTempo(String(nextBpm));
  }, []);

  return {
    tempo,
    loading,
    usedParsedFallback,
    parsedArtist,
    parsedSong,
    matchedSong,
    matchedArtist,
    prefillSuggestedTempo,
    onMeasuredBpmFromTap,
    isOutOfRange,
    feedbackKey,
    showFeedback,
    showNoMatchFeedback,
    feedbackApiPayload,
  };
}
