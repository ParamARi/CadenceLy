import { Fragment } from "react";
import type { PlaylistSearchResult } from "@/lib/types";
import { ParsedGetSongBody } from "@/components/results/ParsedGetSongBody";
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

  const rowTone = `bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all ${
    isOutOfRange ? "opacity-30 grayscale" : ""
  }`;

  return (
    <Fragment>
      <TableRow className={`${rowTone} sm:hidden`}>
        <TableCell colSpan={5} className="p-2 align-top">
          <div className="flex min-w-0 flex-col gap-2 text-xs">
            <div className="flex min-w-0 gap-2">
              <span className="w-5 shrink-0 text-right font-mono text-[10px] text-gray-400">
                {sIdx + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate font-medium text-gray-900 dark:text-white"
                  title={song.title || song.name}
                >
                  {song.title || song.name}
                </div>
                <div
                  className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400"
                  title={displayArtist}
                >
                  {displayArtist}
                </div>
              </div>
            </div>
            <div className="min-w-0 border-t border-gray-100 pt-2 dark:border-gray-600/80 [&_div]:!max-w-none">
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <ParsedGetSongBody
                  parsedArtist={parsedArtist}
                  parsedSong={parsedSong}
                  matchedArtist={matchedArtist}
                  matchedSong={matchedSong}
                />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 dark:border-gray-600/80">
              {videoId ? (
                <Button
                  size="xs"
                  color="light"
                  className="touch-manipulation"
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
                <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
              )}
              {loading ? null : tempo && tempo !== "-" ? (
                <Badge
                  color="indigo"
                  size="sm"
                  className="inline-flex w-fit font-mono text-[11px]"
                >
                  {tempo} BPM
                </Badge>
              ) : (
                <span className="text-[11px] italic text-gray-400">Not Found</span>
              )}
            </div>
            <div className="border-t border-gray-100 pt-2 dark:border-gray-600/80">
              <BpmFeedbackButtons
                storageKey={feedbackKey}
                visible={showFeedback}
                variant={showNoMatchFeedback ? "noApiMatch" : "parsedMatch"}
                prefillSuggestedTempo={prefillSuggestedTempo}
                apiPayload={feedbackApiPayload}
              />
            </div>
          </div>
        </TableCell>
      </TableRow>
      <TableRow className={`${rowTone} hidden sm:table-row`}>
        <TableCell className="w-10 px-2 py-3 text-right font-mono text-xs opacity-50">
          {sIdx + 1}.
        </TableCell>
        <TableCell className="px-2 py-3">
          <div className="flex max-w-[200px] flex-col sm:max-w-[300px]">
            <span
              className="truncate font-medium text-gray-900 dark:text-white"
              title={song.title || song.name}
            >
              {song.title || song.name}
            </span>
            <span
              className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
              title={displayArtist}
            >
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
        <TableCell className="whitespace-nowrap px-2 py-3">
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
              <Badge color="indigo" size="sm" className="inline-flex w-fit font-mono">
                {tempo} BPM
              </Badge>
            ) : (
              <span className="text-xs italic opacity-50">Not Found</span>
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
    </Fragment>
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
        <Table hoverable className="w-full text-left max-sm:text-xs sm:text-sm">
          <TableHead>
            <TableRow className="bg-gray-50 dark:bg-gray-700/50 sm:hidden">
              <TableHeadCell colSpan={5} className="px-2 py-2 text-xs font-semibold">
                Track
              </TableHeadCell>
            </TableRow>
            <TableRow className="hidden bg-gray-50 dark:bg-gray-700/50 sm:table-row">
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
