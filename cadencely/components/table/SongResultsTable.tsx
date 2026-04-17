import { useMemo, useState, useEffect, useCallback } from "react";
import type { SongSearchResult } from "@/lib/types";
import { ParsedGetSongBody } from "@/components/results/ParsedGetSongBody";
import { TapBpmModalRoot } from "@/components/results/TapBpmModalRoot";
import { useTapBpmSession } from "@/hooks/useTapBpmSession";
import { filterByBpmRange } from "@/lib/filters";
import { lookupTempoWithParsedTitleFallback } from "@/lib/bpm/lookupTempoWithParsedTitle";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Badge, Progress, Spinner, Button } from "flowbite-react";
import { cn } from "@/lib/utils";
import { PlaylistQueueCheckbox } from "@/components/playlist/PlaylistQueueCheckbox";

type SongTableColMeta = { headClassName?: string; cellClassName?: string };

const SONG_DESKTOP_COL_META: SongTableColMeta = {
  headClassName: "hidden sm:table-cell",
  cellClassName: "hidden sm:table-cell align-top",
};
function SongParsedGetSongCell({
  title,
  artistName,
}: {
  title: string;
  artistName: string;
}) {
  const [loading, setLoading] = useState(true);
  const [parsedArtist, setParsedArtist] = useState<string | null>(null);
  const [parsedSong, setParsedSong] = useState<string | null>(null);
  const [matchedSong, setMatchedSong] = useState<string | null>(null);
  const [matchedArtist, setMatchedArtist] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function run() {
      setLoading(true);
      try {
        const result = await lookupTempoWithParsedTitleFallback({
          rawTitle: title.trim(),
          artistName,
        });
        if (!isMounted) return;
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
      } catch {
        if (isMounted) {
          setParsedArtist(null);
          setParsedSong(null);
          setMatchedSong(null);
          setMatchedArtist(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void run();
    return () => {
      isMounted = false;
    };
  }, [title, artistName]);

  if (loading) {
    return <Spinner size="sm" />;
  }

  return (
    <ParsedGetSongBody
      parsedArtist={parsedArtist}
      parsedSong={parsedSong}
      matchedArtist={matchedArtist}
      matchedSong={matchedSong}
    />
  );
}

const columnHelper = createColumnHelper<SongSearchResult>();

type Props = {
  results: SongSearchResult[];
  minBPM?: number;
  maxBPM?: number;
};

export default function SongResultsTable({ results, minBPM, maxBPM }: Props) {
  const { session: tapBpmSession, open: openTapBpm, close: closeTapBpm } =
    useTapBpmSession();

  const songColumns = useMemo(
    () => [
      columnHelper.display({
        id: "mobileSummary",
        header: "Track",
        meta: {
          headClassName: "sm:hidden align-top",
          cellClassName: "sm:hidden align-top p-2",
        } satisfies SongTableColMeta,
        cell: (info) => {
          const row = info.row.original;
          const title = row.title;
          const artistName = row.artist.name;
          const songLookupQuery = `${artistName} ${title}`.trim();
          const bpm = parseFloat(row.tempo);
          const score = row.danceability * 100;
          const key = row.key_of || "-";
          return (
            <div className="flex min-w-0 max-w-full flex-col gap-2 text-xs">
              <div className="flex min-w-0 gap-2">
                <div className="min-w-0 flex-1">
                <div className="font-semibold leading-snug text-gray-900 dark:text-white">
                  {title}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                  {row.album.title}
                </div>
                <div className="mt-0.5 truncate text-[11px] text-gray-600 dark:text-gray-300">
                  {artistName}
                </div>
                </div>
                <PlaylistQueueCheckbox
                  uri={row.uri}
                  resolveQuery={songLookupQuery}
                  title={title}
                  subtitle={artistName}
                />
              </div>
              <div className="min-w-0 max-w-full border-t border-gray-100 pt-2 dark:border-gray-600/80 [&_div]:!max-w-none">
                <SongParsedGetSongCell title={title} artistName={artistName} />
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 dark:border-gray-600/80">
                <Button
                  size="xs"
                  color="light"
                  className="touch-manipulation"
                  onClick={() =>
                    openTapBpm({
                      title,
                      artistName,
                      songLookupQuery,
                    })
                  }
                >
                  Tap BPM
                </Button>
                {isNaN(bpm) ? (
                  <span className="text-[11px] italic text-gray-400">No BPM</span>
                ) : (
                  <Badge color="indigo" size="sm" className="w-fit font-mono text-[11px]">
                    {Math.round(bpm)} BPM
                  </Badge>
                )}
                <Badge color="gray" size="sm" className="w-fit font-mono text-[11px]">
                  {key}
                </Badge>
                <span className="font-mono text-[11px] text-gray-500">
                  Vibe {Math.round(Math.max(0, Math.min(100, score)))}%
                </span>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("title", {
        meta: SONG_DESKTOP_COL_META,
        header: "Song",
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-semibold text-base text-gray-900 dark:text-white">
              {info.getValue()}
            </span>
            <span className="mt-0.5 max-w-[200px] truncate text-xs text-gray-500 dark:text-gray-400 sm:max-w-[300px]">
              {info.row.original.album.title}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("artist.name", {
        meta: SONG_DESKTOP_COL_META,
        header: "Artist",
        cell: (info) => (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "parsedGetSong",
        meta: SONG_DESKTOP_COL_META,
        header: "Parsed (GetSong)",
        cell: (info) => (
          <SongParsedGetSongCell
            title={info.row.original.title}
            artistName={info.row.original.artist.name}
          />
        ),
      }),
      columnHelper.display({
        id: "tapBpm",
        meta: SONG_DESKTOP_COL_META,
        header: "Tap BPM",
        cell: (info) => {
          const title = info.row.original.title;
          const artistName = info.row.original.artist.name;
          const songLookupQuery = `${artistName} ${title}`.trim();
          return (
            <div className="whitespace-nowrap">
              <Button
                size="xs"
                color="light"
                onClick={() =>
                  openTapBpm({
                    title,
                    artistName,
                    songLookupQuery,
                  })
                }
              >
                Tap BPM
              </Button>
            </div>
          );
        },
      }),
      columnHelper.accessor("tempo", {
        meta: SONG_DESKTOP_COL_META,
        header: "BPM",
        cell: (info) => {
          const bpm = parseFloat(info.getValue());
          return isNaN(bpm) ? (
            <span className="text-xs italic opacity-50">Not Found</span>
          ) : (
            <Badge color="indigo" size="sm" className="w-fit font-mono">
              {Math.round(bpm)} BPM
            </Badge>
          );
        },
      }),
      columnHelper.accessor("key_of", {
        meta: SONG_DESKTOP_COL_META,
        header: "Key",
        cell: (info) => {
          const key = info.getValue() || "-";
          return (
            <Badge color="gray" size="sm" className="w-fit font-mono">
              {key}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("danceability", {
        meta: SONG_DESKTOP_COL_META,
        header: "Vibe",
        cell: (info) => {
          const score = info.getValue() * 100;
          return (
            <div className="flex min-w-[100px] items-center gap-3">
              <Progress
                progress={Math.max(0, Math.min(100, score))}
                color="purple"
                size="sm"
                className="flex-1"
              />
              <span className="w-8 text-right font-mono text-xs text-gray-500">
                {Math.round(score)}%
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "playlistQueue",
        meta: SONG_DESKTOP_COL_META,
        header: "Queue",
        cell: (info) => {
          const row = info.row.original;
          const title = row.title;
          const artistName = row.artist.name;
          return (
            <PlaylistQueueCheckbox
              uri={row.uri}
              resolveQuery={`${artistName} ${title}`.trim()}
              title={title}
              subtitle={artistName}
            />
          );
        },
      }),
    ],
    [openTapBpm]
  );

  const tableData = useMemo(() => {
    if (minBPM && maxBPM && minBPM > 0) {
      return filterByBpmRange(results, minBPM, maxBPM);
    }
    return results;
  }, [results, minBPM, maxBPM]);

  const table = useReactTable({
    data: tableData,
    columns: songColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!results || results.length === 0) {
    return null;
  }

  const tapBpmModal = (
    <TapBpmModalRoot session={tapBpmSession} onClose={closeTapBpm} />
  );

  return (
    <>
    <div className="my-8 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <Table hoverable className="w-full max-sm:text-xs sm:text-sm">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeadCell
                    key={header.id}
                    className={cn(
                      (header.column.columnDef.meta as SongTableColMeta | undefined)
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
              <TableRow key={row.id} className="bg-white dark:bg-gray-800 dark:border-gray-700">
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(
                      (cell.column.columnDef.meta as SongTableColMeta | undefined)
                        ?.cellClassName
                    )}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
    {tapBpmModal}
    </>
  );
}
