import { useMemo, Fragment, useState, useEffect } from "react";
import type { ArtistSearchResult, ArtistAlbum } from "@/lib/types";
import { ParsedGetSongBody } from "@/components/results/ParsedGetSongBody";
import { ParsedGetSongTableCell } from "@/components/results/ParsedGetSongTableCell";
import { TapBpmModalRoot } from "@/components/results/TapBpmModalRoot";
import { useTapBpmSession } from "@/hooks/useTapBpmSession";
import { useTrackRowTempoFeedback } from "@/hooks/useTrackRowTempoFeedback";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  ExpandedState,
} from "@tanstack/react-table";
import { searchAlbumsApi } from "@/lib/search";
import BpmFeedbackButtons from "@/components/BpmFeedbackButtons";
import { Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Badge, Button, Card } from "flowbite-react";
import { cn } from "@/lib/utils";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import type { TapBpmSession } from "@/components/TapBpmModal";

function TrackRow({
  song,
  sIdx,
  artistName,
  minBPM,
  maxBPM,
  onOpenTapBpm,
}: {
  song: any;
  sIdx: number;
  artistName: string;
  minBPM?: number;
  maxBPM?: number;
  onOpenTapBpm: (session: TapBpmSession) => void;
}) {
  const rawTitle = String(song.name ?? song.title ?? "").trim();
  const videoId =
    typeof song.videoId === "string" && song.videoId ? song.videoId : "";

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
    mode: "artist",
    rowIndex: sIdx,
    rawTitle,
    lookupArtistName: artistName,
    minBPM,
    maxBPM,
    videoId,
    artistContextName: artistName,
    lookupEffectDeps: [song.name, song.title, artistName],
  });

  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  const toggleFeedbackForm = () => {
    setShowFeedbackForm(!showFeedbackForm);
  };

  const rowTone = `bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all ${
    isOutOfRange ? "opacity-30 grayscale" : ""
  }`;

  const openTap = () => {
    onOpenTapBpm({
      title: String(song.name ?? song.title ?? "").trim() || "Track",
      artistName,
      videoId: videoId || undefined,
      onUseMeasuredBpm: onMeasuredBpmFromTap,
    });
    setShowFeedbackForm(true);
  };

  return (
    <Fragment>
      <TableRow className={`${rowTone} sm:hidden`}>
        <TableCell colSpan={5} className="p-2 align-top">
          <div className="flex min-w-0 flex-col gap-2 text-xs">
            <div className="flex min-w-0 gap-2">
              <span className="w-5 shrink-0 text-right font-mono text-[10px] text-gray-400">
                {sIdx + 1}.
              </span>
              <div className="min-w-0 flex-1 font-medium text-gray-900 dark:text-white">
                <span className="block truncate" title={song.name ?? song.title}>
                  {song.name ?? song.title ?? "—"}
                </span>
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
                <Button size="xs" color="light" className="touch-manipulation" onClick={openTap}>
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
                <Button
                  size="xs"
                  color="light"
                  className="text-[11px] italic opacity-80"
                  onClick={toggleFeedbackForm}
                >
                  Not Found
                </Button>
              )}
            </div>
            {showFeedbackForm ? (
              <div className="border-t border-gray-100 pt-2 dark:border-gray-600/80">
                <BpmFeedbackButtons
                  storageKey={feedbackKey}
                  visible={showFeedback}
                  variant={showNoMatchFeedback ? "noApiMatch" : "parsedMatch"}
                  prefillSuggestedTempo={prefillSuggestedTempo}
                  apiPayload={feedbackApiPayload}
                />
              </div>
            ) : null}
          </div>
        </TableCell>
      </TableRow>
      <TableRow className={`${rowTone} hidden sm:table-row`}>
        <TableCell className="w-10 px-2 py-3 text-right font-mono text-xs opacity-50">
          {sIdx + 1}.
        </TableCell>
        <TableCell className="max-w-[260px] px-2 py-3 font-medium text-gray-900 dark:text-white">
          <span className="block truncate" title={song.name ?? song.title}>
            {song.name ?? song.title ?? "—"}
          </span>
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
            <Button size="xs" color="light" onClick={openTap}>
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
              <Button className="text-xs italic opacity-50" onClick={toggleFeedbackForm}>
                Not Found
              </Button>
            )}
            {showFeedbackForm ? (
              <BpmFeedbackButtons
                storageKey={feedbackKey}
                visible={showFeedback}
                variant={showNoMatchFeedback ? "noApiMatch" : "parsedMatch"}
                prefillSuggestedTempo={prefillSuggestedTempo}
                apiPayload={feedbackApiPayload}
              />
            ) : null}
          </div>
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

function ExpandedAlbumRow({
  albumId,
  artistName,
  minBPM,
  maxBPM,
  onOpenTapBpm,
}: {
  albumId: string;
  artistName: string;
  minBPM?: number;
  maxBPM?: number;
  onOpenTapBpm: (session: TapBpmSession) => void;
}) {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSongs() {
      setLoading(true);
      try {
        const fetchedSongs = await searchAlbumsApi(albumId);
        if (isMounted) setSongs(fetchedSongs);
      } catch (e) {
        console.error("Failed to load album tracklist", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSongs();
    return () => {
      isMounted = false;
    };
  }, [albumId]);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 shadow-inner">
      <div className="px-2 sm:px-4">
        <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70 mb-4 ml-2 flex items-center justify-between text-gray-900 dark:text-white">
          <span>Tracklist</span>
        </h3>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-8">
            <Spinner size="xl" className="mb-3" />
            <span className="text-sm font-medium opacity-70 animate-pulse text-gray-900 dark:text-white">Loading tracks...</span>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
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
                  <TableHeadCell className="px-2 py-2 text-right font-semibold">BPM</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody className="divide-y">
                {songs.map((song: any, sIdx: number) => (
                  <TrackRow
                    key={sIdx}
                    song={song}
                    sIdx={sIdx}
                    artistName={artistName}
                    minBPM={minBPM}
                    maxBPM={maxBPM}
                    onOpenTapBpm={onOpenTapBpm}
                  />
                ))}
                {songs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-sm opacity-50 italic py-4 text-center">No tracks found for this album.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

type AlbumTableColMeta = { headClassName?: string; cellClassName?: string };

const ALBUM_DESKTOP_COL_META: AlbumTableColMeta = {
  headClassName: "hidden sm:table-cell whitespace-nowrap",
  cellClassName: "hidden sm:table-cell align-top whitespace-nowrap",
};

const albumColumnHelper = createColumnHelper<ArtistAlbum & { artistName: string }>();

const albumColumns = [
  albumColumnHelper.display({
    id: "albumMobile",
    header: "Album",
    meta: {
      headClassName: "sm:hidden",
      cellClassName: "sm:hidden align-top p-2",
    } satisfies AlbumTableColMeta,
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      const album = row.original;
      return (
        <div className="flex min-w-0 items-start gap-2">
          <Button
            color="gray"
            size="xs"
            pill
            className="mt-0.5 shrink-0 border-none hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
          >
            {isExpanded ? (
              <HiChevronUp className="h-4 w-4" />
            ) : (
              <HiChevronDown className="h-4 w-4" />
            )}
          </Button>
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="opacity-60 text-gray-500 dark:text-gray-400"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                  {album.title}
                </div>
                <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  {album.artistName}
                </div>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge color="gray" size="sm" className="w-fit font-mono text-[11px]">
                {album.year || "-"}
              </Badge>
              <Button
                size="xs"
                color={isExpanded ? "dark" : "light"}
                onClick={(e) => {
                  e.stopPropagation();
                  row.toggleExpanded();
                }}
              >
                {isExpanded ? "Close" : "View tracklist"}
              </Button>
            </div>
          </div>
        </div>
      );
    },
  }),
  albumColumnHelper.display({
    id: "expander",
    meta: ALBUM_DESKTOP_COL_META,
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          color="gray"
          size="xs"
          pill
          className="border-none hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          {row.getIsExpanded() ? (
            <HiChevronUp className="h-5 w-5" />
          ) : (
            <HiChevronDown className="h-5 w-5" />
          )}
        </Button>
      ) : null;
    },
  }),
  albumColumnHelper.accessor("title", {
    meta: ALBUM_DESKTOP_COL_META,
    header: "Album",
    cell: (info) => (
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded border border-gray-200 bg-gray-100 dark:border-gray-600 dark:bg-gray-700">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-gray-500 dark:text-gray-400"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
        <div className="flex flex-col">
          <span className="text-base font-semibold text-gray-900 dark:text-white">{info.getValue()}</span>
          <span className="mt-0.5 text-xs text-gray-500 opacity-60 dark:text-gray-400">{info.row.original.artistName}</span>
        </div>
      </div>
    ),
  }),
  albumColumnHelper.accessor("year", {
    meta: ALBUM_DESKTOP_COL_META,
    header: "Year",
    cell: (info) => (
      <Badge color="gray" size="sm" className="w-fit font-mono">
        {info.getValue() || "-"}
      </Badge>
    ),
  }),
  albumColumnHelper.display({
    id: "tracks",
    meta: ALBUM_DESKTOP_COL_META,
    header: "Action",
    cell: (info) => {
      const isExpanded = info.row.getIsExpanded();
      return (
        <Button
          color={isExpanded ? "dark" : "light"}
          size="sm"
        >
          {isExpanded ? "Close Tracklist" : "View Tracklist"}
        </Button>
      );
    },
  }),
];

function SingleAlbumTracklist({
  album,
  artistName,
  minBPM,
  maxBPM,
  onOpenTapBpm,
}: {
  album: ArtistAlbum;
  artistName: string;
  minBPM?: number;
  maxBPM?: number;
  onOpenTapBpm: (session: TapBpmSession) => void;
}) {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSongs() {
      setLoading(true);
      try {
        const fetchedSongs = await searchAlbumsApi(album.uri);
        if (isMounted) setSongs(fetchedSongs);
      } catch (e) {
        console.error("Failed to load album tracklist", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSongs();
    return () => {
      isMounted = false;
    };
  }, [album.uri]);

  return (
    <Card className="my-8 border-gray-200 dark:border-gray-700 shadow-md p-2">
      <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{album.title}</h2>
          <p className="opacity-70 mt-1 text-gray-600 dark:text-gray-400">{artistName} • {album.year} {loading ? "• Loading Tracks..." : `• ${songs.length} Tracks`}</p>
        </div>
        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-gray-500 dark:text-gray-400"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center py-6">
          <Spinner size="xl" className="mb-3" />
          <span className="text-sm font-medium opacity-70 animate-pulse text-gray-900 dark:text-white">Loading tracks...</span>
        </div>
      ) : (
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
              <TableHeadCell className="px-2 py-2 text-right font-semibold">BPM</TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {songs.map((song: any, sIdx: number) => (
              <TrackRow
                key={sIdx}
                song={song}
                sIdx={sIdx}
                artistName={artistName}
                minBPM={minBPM}
                maxBPM={maxBPM}
                onOpenTapBpm={onOpenTapBpm}
              />
            ))}
            {songs.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-sm opacity-50 italic text-center py-4 text-gray-900 dark:text-white">No tracks found for this album.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

type Props = {
  results: ArtistSearchResult[];
  minBPM?: number;
  maxBPM?: number;
};

export default function ArtistResultsTable({ results, minBPM, maxBPM }: Props) {
  const { session: tapBpmSession, open: openTapBpm, close: closeTapBpm } =
    useTapBpmSession();

  // Flatten all albums from all artists returned
  const allAlbumsWithArtist = useMemo(() => {
    return results.flatMap((artist) =>
      (artist.albums || []).map((album) => ({
        ...album,
        artistName: artist.name,
      }))
    );
  }, [results]);

  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data: allAlbumsWithArtist,
    columns: albumColumns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (!results || results.length === 0 || allAlbumsWithArtist.length === 0) {
    return null;
  }

  const tapBpmModal = (
    <TapBpmModalRoot session={tapBpmSession} onClose={closeTapBpm} />
  );

  // If there is only exactly one album, show all songs directly
  if (allAlbumsWithArtist.length === 1) {
    return (
      <>
        <SingleAlbumTracklist
          album={allAlbumsWithArtist[0]}
          artistName={allAlbumsWithArtist[0].artistName}
          minBPM={minBPM}
          maxBPM={maxBPM}
          onOpenTapBpm={openTapBpm}
        />
        {tapBpmModal}
      </>
    );
  }

  // Otherwise show the list of albums
  return (
    <>
    <div className="my-8 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="overflow-x-auto">
        <Table hoverable className="w-full text-left max-sm:text-xs sm:text-sm">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeadCell
                    key={header.id}
                    className={cn(
                      (header.column.columnDef.meta as AlbumTableColMeta | undefined)
                        ?.headClassName
                    )}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHeadCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow 
                  className={`bg-white dark:border-gray-700 dark:bg-gray-800 cursor-pointer ${
                    row.getIsExpanded() ? "bg-gray-50 dark:bg-gray-700/50" : ""
                  }`}
                  onClick={row.getToggleExpandedHandler()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        (cell.column.columnDef.meta as AlbumTableColMeta | undefined)
                          ?.cellClassName
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b border-gray-200 dark:border-gray-700">
                      <ExpandedAlbumRow
                        albumId={row.original.uri}
                        artistName={row.original.artistName}
                        minBPM={minBPM}
                        maxBPM={maxBPM}
                        onOpenTapBpm={openTapBpm}
                      />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    {tapBpmModal}
    </>
  );
}
