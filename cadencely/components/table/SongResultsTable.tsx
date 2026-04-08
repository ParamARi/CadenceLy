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
      columnHelper.accessor("title", {
        header: "Song",
        cell: (info) => (
          <div className="flex flex-col">
            <span className="font-semibold text-base text-gray-900 dark:text-white">
              {info.getValue()}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
              {info.row.original.album.title}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("artist.name", {
        header: "Artist",
        cell: (info) => (
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.display({
        id: "parsedGetSong",
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
        header: "BPM",
        cell: (info) => {
          const bpm = parseFloat(info.getValue());
          return isNaN(bpm) ? (
            <span className="opacity-50 text-xs italic">Not Found</span>
          ) : (
            <Badge color="indigo" size="sm" className="w-fit font-mono">
              {Math.round(bpm)} BPM
            </Badge>
          );
        },
      }),
      columnHelper.accessor("key_of", {
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
        header: "Vibe",
        cell: (info) => {
          const score = info.getValue() * 100;
          return (
            <div className="flex items-center gap-3 min-w-[100px]">
              <Progress
                progress={Math.max(0, Math.min(100, score))}
                color="purple"
                size="sm"
                className="flex-1"
              />
              <span className="text-xs font-mono text-gray-500 w-8 text-right">
                {Math.round(score)}%
              </span>
            </div>
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
        <Table hoverable>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeadCell key={header.id}>
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
                  <TableCell key={cell.id}>
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
