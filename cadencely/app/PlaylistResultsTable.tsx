import { useState, useEffect, useMemo } from "react";
import type { PlaylistSearchResult } from "@/lib/types";
import { lookupTempoWithParsedTitleFallback } from "@/lib/bpm/lookupTempoWithParsedTitle";
import type { BpmFeedbackPostBody } from "@/lib/bpm/bpmFeedbackApi";
import { makeBpmFeedbackKey } from "@/lib/bpm/bpmFeedbackStorage";
import BpmFeedbackButtons from "@/components/BpmFeedbackButtons";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Badge, Spinner, Card } from "flowbite-react";

function PlaylistTrackRow({
  song,
  sIdx,
  playlistId,
  minBPM,
  maxBPM,
}: {
  song: any;
  sIdx: number;
  playlistId: string;
  minBPM?: number;
  maxBPM?: number;
}) {
  const [tempo, setTempo] = useState<string | null>(null);
  const [usedParsedFallback, setUsedParsedFallback] = useState(false);
  const [parsedArtist, setParsedArtist] = useState<string | null>(null);
  const [parsedSong, setParsedSong] = useState<string | null>(null);
  const [matchedSong, setMatchedSong] = useState<string | null>(null);
  const [matchedArtist, setMatchedArtist] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOutOfRange = useMemo(() => {
    if (!tempo || tempo === "-") return false;
    if (minBPM && maxBPM && minBPM > 0 && maxBPM >= minBPM) {
      const bpm = parseInt(tempo);
      return bpm < minBPM || bpm > maxBPM;
    }
    return false;
  }, [tempo, minBPM, maxBPM]);

  useEffect(() => {
    let isMounted = true;
    async function fetchTempo() {
      setLoading(true);
      try {
        const query = (song.title || song.name || "").trim();
        const artistName = song.artists?.[0]?.name || "";
        const result = await lookupTempoWithParsedTitleFallback({
          rawTitle: query,
          artistName,
        });
        if (isMounted) {
          setTempo(result.tempo ?? "-");
          setUsedParsedFallback(Boolean(result.usedParsedFallback));
          if (result.usedParsedFallback && result.parsedSong) {
            setParsedArtist(result.parsedArtist || "Unknown");
            setParsedSong(result.parsedSong);
            setMatchedSong(result.matchedSong || "Unknown");
            setMatchedArtist(result.matchedArtist || "Unknown");
          } else {
            setParsedArtist(null);
            setParsedSong(null);
            setMatchedSong(null);
            setMatchedArtist(null);
          }
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
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTempo();
    return () => {
      isMounted = false;
    };
  }, [song.title, song.name, song.artists]);

  const rawTitle = (song.title || song.name || "").trim();
  const videoId =
    typeof song.videoId === "string" && song.videoId ? song.videoId : "";
  const feedbackScope = `pl:${playlistId}:${videoId || `row:${sIdx}`}:${rawTitle}`;

  const feedbackKey = useMemo(
    () =>
      makeBpmFeedbackKey({
        scope: feedbackScope,
        rawTitle,
        reportedTempo: tempo && tempo !== "-" ? tempo : "",
        usedParsedFallback,
        parsedSong,
        parsedArtist,
      }),
    [
      feedbackScope,
      rawTitle,
      tempo,
      usedParsedFallback,
      parsedSong,
      parsedArtist,
    ]
  );

  const showFeedback =
    Boolean(tempo && tempo !== "-" && !loading && usedParsedFallback);

  const feedbackApiPayload = useMemo(():
    | Omit<BpmFeedbackPostBody, "vote">
    | null => {
    if (!showFeedback) return null;
    return {
      source: "playlist",
      rowIndex: sIdx,
      rawTitle,
      reportedTempo: tempo && tempo !== "-" ? tempo : "",
      usedParsedFallback,
      videoId: videoId || undefined,
      parsedSong,
      parsedArtist,
      matchedSong,
      matchedArtist,
      playlistId: playlistId || undefined,
    };
  }, [
    showFeedback,
    sIdx,
    rawTitle,
    tempo,
    usedParsedFallback,
    videoId,
    parsedSong,
    parsedArtist,
    matchedSong,
    matchedArtist,
    playlistId,
  ]);

  return (
    <TableRow className={`bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all ${isOutOfRange ? 'opacity-30 grayscale' : ''}`}>
      <TableCell className="w-10 opacity-50 font-mono text-xs text-right px-2 py-3">
        {sIdx + 1}.
      </TableCell>
      <TableCell className="px-2 py-3">
        <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
          <span className="font-medium text-gray-900 dark:text-white truncate" title={song.title || song.name}>
            {song.title || song.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={song.artists?.map((a: any) => a.name).join(", ")}>
            {song.artists?.map((a: any) => a.name).join(", ")}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-2 py-3 max-w-[180px] sm:max-w-[220px]">
        {parsedArtist && parsedSong ? (
          <div className="flex flex-col text-[11px] text-gray-600 dark:text-gray-300">
            <span className="font-medium truncate" title={parsedArtist}>
              Parsed Artist: {parsedArtist} -- Matched Artist: {matchedArtist}
            </span>
            <span className="truncate opacity-80" title={parsedSong}>
              Parsed Song: {parsedSong} -- Matched Song: {matchedSong}
            </span>
          </div>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500 italic">—</span>
        )}
      </TableCell>
      <TableCell className="px-2 py-3 text-right align-top">
        <div className="flex flex-col items-end gap-0">
          {loading ? (
            <Spinner size="sm" />
          ) : tempo && tempo !== "-" ? (
            <Badge color="indigo" size="sm" className="w-fit inline-flex font-mono">
              {tempo} BPM
            </Badge>
          ) : (
            <span className="opacity-50 text-xs italic">Not Found</span>
          )}
          <BpmFeedbackButtons
            storageKey={feedbackKey}
            visible={showFeedback}
            apiPayload={feedbackApiPayload}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function SinglePlaylistView({ playlist, minBPM, maxBPM }: { playlist: PlaylistSearchResult; minBPM?: number; maxBPM?: number }) {
  const songs = playlist.songs || [];
  const playlistId = playlist.playlistId || "";

  return (
    <Card className="my-8 border-gray-200 dark:border-gray-700 shadow-md p-2">
      <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{playlist.name}</h2>
          <p className="opacity-70 mt-1 text-gray-600 dark:text-gray-400">
            {playlist.author} • {playlist.count} Tracks
          </p>
        </div>
        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-gray-500 dark:text-gray-400">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table hoverable className="w-full text-sm text-left">
          <TableHead>
            <TableRow className="bg-gray-50 dark:bg-gray-700/50">
              <TableHeadCell className="w-10 px-2 py-2 text-right font-semibold">#</TableHeadCell>
              <TableHeadCell className="px-2 py-2 font-semibold">Track</TableHeadCell>
              <TableHeadCell className="px-2 py-2 font-semibold">Parsed (GetSong)</TableHeadCell>
              <TableHeadCell className="px-2 py-2 text-right font-semibold" title="When the title was parsed for GetSong, use 👍/👎 below the BPM">
                BPM
              </TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {songs.map((song: any, sIdx: number) => (
              <PlaylistTrackRow
                key={sIdx}
                song={song}
                sIdx={sIdx}
                playlistId={playlistId}
                minBPM={minBPM}
                maxBPM={maxBPM}
              />
            ))}
            {songs.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-sm opacity-50 italic text-center py-4 text-gray-900 dark:text-white">
                  No tracks found for this playlist.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

type Props = {
  results: PlaylistSearchResult[];
  minBPM?: number;
  maxBPM?: number;
};

export default function PlaylistResultsTable({ results, minBPM, maxBPM }: Props) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {results.map((playlist, idx) => (
        <SinglePlaylistView key={playlist.playlistId || idx} playlist={playlist} minBPM={minBPM} maxBPM={maxBPM} />
      ))}
    </div>
  );
}
