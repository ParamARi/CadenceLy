import type { PlaylistSearchResult } from "@/lib/types";
import { ParsedGetSongTableCell } from "@/components/results/ParsedGetSongTableCell";
import { TapBpmModalRoot } from "@/components/results/TapBpmModalRoot";
import { useTapBpmSession } from "@/hooks/useTapBpmSession";
import { useTrackRowTempoFeedback } from "@/hooks/useTrackRowTempoFeedback";
import BpmFeedbackButtons from "@/components/BpmFeedbackButtons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
  Badge,
  Spinner,
  Card,
  Button,
} from "flowbite-react";
import type { TapBpmSession } from "@/components/TapBpmModal";

function PlaylistTrackRow({
  song,
  sIdx,
  playlistId,
  minBPM,
  maxBPM,
  onOpenTapBpm,
}: {
  song: any;
  sIdx: number;
  playlistId: string;
  minBPM?: number;
  maxBPM?: number;
  onOpenTapBpm: (session: TapBpmSession) => void;
}) {
  const rawTitle = (song.title || song.name || "").trim();
  const videoId =
    typeof song.videoId === "string" && song.videoId ? song.videoId : "";
  const displayArtist =
    song.artists?.map((a: any) => a.name).join(", ") || "";
  const lookupArtistName = song.artists?.[0]?.name || "";

  const {
    tempo,
    loading,
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
  } = useTrackRowTempoFeedback({
    mode: "playlist",
    rowIndex: sIdx,
    rawTitle,
    lookupArtistName,
    minBPM,
    maxBPM,
    videoId,
    playlistId,
    lookupEffectDeps: [song.title, song.name, song.artists],
  });

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
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={displayArtist}>
            {displayArtist}
          </span>
        </div>
      </TableCell>
      <ParsedGetSongTableCell
        parsedArtist={parsedArtist}
        parsedSong={parsedSong}
        matchedArtist={matchedArtist}
        matchedSong={matchedSong}
        loading={loading}
      />
      <TableCell className="px-2 py-3 whitespace-nowrap">
        {videoId ? (
          <Button
            size="xs"
            color="light"
            onClick={() =>
              onOpenTapBpm({
                title: rawTitle,
                artistName: displayArtist,
                videoId: videoId || undefined,
                onUseMeasuredBpm: onMeasuredBpmFromTap,
              })
            }
          >
            Tap BPM
          </Button>
        ) : (
          <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
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
            variant={showNoMatchFeedback ? "noApiMatch" : "parsedMatch"}
            prefillSuggestedTempo={prefillSuggestedTempo}
            apiPayload={feedbackApiPayload}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}

function SinglePlaylistView({
  playlist,
  minBPM,
  maxBPM,
  onOpenTapBpm,
}: {
  playlist: PlaylistSearchResult;
  minBPM?: number;
  maxBPM?: number;
  onOpenTapBpm: (session: TapBpmSession) => void;
}) {
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
              <TableHeadCell className="px-2 py-2 font-semibold">Tap BPM</TableHeadCell>
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
                onOpenTapBpm={onOpenTapBpm}
              />
            ))}
            {songs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm opacity-50 italic text-center py-4 text-gray-900 dark:text-white">
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
  const { session: tapBpmSession, open: openTapBpm, close: closeTapBpm } =
    useTapBpmSession();

  if (!results || results.length === 0) {
    return null;
  }

  const tapBpmModal = (
    <TapBpmModalRoot session={tapBpmSession} onClose={closeTapBpm} />
  );

  return (
    <>
      <div className="w-full">
        {results.map((playlist, idx) => (
          <SinglePlaylistView
            key={playlist.playlistId || idx}
            playlist={playlist}
            minBPM={minBPM}
            maxBPM={maxBPM}
            onOpenTapBpm={openTapBpm}
          />
        ))}
      </div>
      {tapBpmModal}
    </>
  );
}
