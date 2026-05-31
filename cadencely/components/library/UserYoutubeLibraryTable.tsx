"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  type ExpandedState,
} from "@tanstack/react-table";
import {
  Button,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeadCell,
  TableRow,
} from "flowbite-react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { PlaylistQueueCheckbox } from "@/components/playlist/PlaylistQueueCheckbox";
import { ParsedGetSongBody } from "@/components/results/ParsedGetSongBody";
import { TapBpmModalRoot } from "@/components/results/TapBpmModalRoot";
import type { TapBpmSession } from "@/components/TapBpmModal";
import { TrackRowBpmColumn } from "@/components/results/TrackRowBpmColumn";
import { useTapBpmSession } from "@/hooks/useTapBpmSession";
import { useTrackRowTempoFeedback } from "@/hooks/useTrackRowTempoFeedback";
import { cn } from "@/lib/utils";
import { LibraryTracksLoadMore } from "@/components/library/LibraryTracksLoadMore";
import { LIBRARY_TRACKS_PAGE_SIZE } from "@/lib/library/libraryTrackPagination";

type PlaylistRow = {
  id: string;
  snippet?: {
    title?: string;
    thumbnails?: { default?: { url?: string } };
  };
  contentDetails?: { itemCount?: string };
};

type PlaylistItemRow = {
  id?: string;
  snippet?: {
    title?: string;
    videoOwnerChannelTitle?: string;
    resourceId?: { videoId?: string };
  };
};

type LibraryPlaylistColMeta = {
  headClassName?: string;
  cellClassName?: string;
};

const LIBRARY_DESKTOP_COL_META: LibraryPlaylistColMeta = {
  headClassName: "hidden sm:table-cell",
  cellClassName: "hidden sm:table-cell align-middle",
};

/** Map ytmusic-api playlist track (`getPlaylistVideos`) into the snippet shape the table expects. */
function ytmusicPlaylistVideoToItemRow(v: unknown): PlaylistItemRow {
  const x = v as {
    videoId?: string;
    name?: string;
    artist?: { name?: string };
  };
  const vid = typeof x.videoId === "string" ? x.videoId.trim() : "";
  const title = typeof x.name === "string" ? x.name.trim() : "";
  const artistName =
    x.artist && typeof x.artist.name === "string" ? x.artist.name.trim() : "";
  return {
    id: vid || undefined,
    snippet: {
      title: title || undefined,
      videoOwnerChannelTitle: artistName || undefined,
      resourceId: vid ? { videoId: vid } : undefined,
    },
  };
}

const libraryPlaylistColumnHelper = createColumnHelper<PlaylistRow>();

const libraryPlaylistColumns = [
  libraryPlaylistColumnHelper.display({
    id: "playlistMobile",
    header: "Playlist",
    meta: {
      headClassName: "sm:hidden",
      cellClassName: "sm:hidden align-middle p-2",
    } satisfies LibraryPlaylistColMeta,
    cell: ({ row }) => {
      const pl = row.original;
      const title = pl.snippet?.title ?? "(Untitled)";
      const thumb = pl.snippet?.thumbnails?.default?.url;
      const count = pl.contentDetails?.itemCount ?? "—";
      const isExpanded = row.getIsExpanded();
      return (
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <Button
              color="gray"
              size="xs"
              pill
              className="mt-0.5 shrink-0 border-none !p-1"
              onClick={(e) => {
                e.stopPropagation();
                row.toggleExpanded();
              }}
              aria-expanded={isExpanded}
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <HiChevronUp className="h-5 w-5" />
              ) : (
                <HiChevronDown className="h-5 w-5" />
              )}
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                {thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={thumb}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                    <span className="text-xs text-gray-400">♪</span>
                  </div>
                )}
                <span className="min-w-0 font-medium text-gray-900 dark:text-white">
                  {title}
                </span>
              </div>
              <div className="mt-1 tabular-nums text-[11px] text-gray-600 dark:text-gray-300">
                {count} videos
              </div>
            </div>
          </div>
          <Button
            size="xs"
            color={isExpanded ? "dark" : "light"}
            className="w-full touch-manipulation"
            onClick={(e) => {
              e.stopPropagation();
              row.toggleExpanded();
            }}
          >
            {isExpanded ? "Hide tracks" : "View tracks"}
          </Button>
        </div>
      );
    },
  }),
  libraryPlaylistColumnHelper.display({
    id: "expander",
    header: () => null,
    meta: {
      ...LIBRARY_DESKTOP_COL_META,
      headClassName: `${LIBRARY_DESKTOP_COL_META.headClassName} w-10 px-2`,
      cellClassName: `${LIBRARY_DESKTOP_COL_META.cellClassName} px-2 py-2`,
    } satisfies LibraryPlaylistColMeta,
    cell: ({ row }) => (
      <Button
        color="gray"
        size="xs"
        pill
        className="border-none !p-1"
        onClick={(e) => {
          e.stopPropagation();
          row.toggleExpanded();
        }}
        aria-expanded={row.getIsExpanded()}
        aria-label={row.getIsExpanded() ? "Collapse" : "Expand"}
      >
        {row.getIsExpanded() ? (
          <HiChevronUp className="h-5 w-5" />
        ) : (
          <HiChevronDown className="h-5 w-5" />
        )}
      </Button>
    ),
  }),
  libraryPlaylistColumnHelper.display({
    id: "playlistTitle",
    header: "Playlist",
    meta: {
      ...LIBRARY_DESKTOP_COL_META,
      cellClassName: `${LIBRARY_DESKTOP_COL_META.cellClassName} px-2 py-2`,
    } satisfies LibraryPlaylistColMeta,
    cell: ({ row }) => {
      const pl = row.original;
      const title = pl.snippet?.title ?? "(Untitled)";
      const thumb = pl.snippet?.thumbnails?.default?.url;
      return (
        <div className="flex min-w-0 items-center gap-3">
          {thumb ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumb}
              alt=""
              className="h-10 w-10 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
              <span className="text-xs text-gray-400">♪</span>
            </div>
          )}
          <span className="min-w-0 font-medium text-gray-900 dark:text-white">
            {title}
          </span>
        </div>
      );
    },
  }),
  libraryPlaylistColumnHelper.display({
    id: "videoCount",
    header: "Videos",
    meta: {
      ...LIBRARY_DESKTOP_COL_META,
      headClassName: `${LIBRARY_DESKTOP_COL_META.headClassName} w-24 px-2`,
      cellClassName: `${LIBRARY_DESKTOP_COL_META.cellClassName} px-2 py-2 tabular-nums text-gray-600 dark:text-gray-300`,
    } satisfies LibraryPlaylistColMeta,
    cell: ({ row }) => row.original.contentDetails?.itemCount ?? "—",
  }),
  libraryPlaylistColumnHelper.display({
    id: "tracksAction",
    header: "Tracks",
    meta: {
      ...LIBRARY_DESKTOP_COL_META,
      headClassName: `${LIBRARY_DESKTOP_COL_META.headClassName} w-36 px-2 text-right`,
      cellClassName: `${LIBRARY_DESKTOP_COL_META.cellClassName} px-2 py-2 text-right`,
    } satisfies LibraryPlaylistColMeta,
    cell: ({ row }) => {
      const isExpanded = row.getIsExpanded();
      return (
        <Button
          size="xs"
          color={isExpanded ? "dark" : "light"}
          onClick={(e) => {
            e.stopPropagation();
            row.toggleExpanded();
          }}
        >
          {isExpanded ? "Hide tracks" : "View tracks"}
        </Button>
      );
    },
  }),
];

function LibraryPlaylistTrackRow({
  item,
  idx,
  playlistId,
  minBPM,
  maxBPM,
  includeBpmMultiples,
  onOpenTapBpm,
}: {
  item: PlaylistItemRow;
  idx: number;
  playlistId: string;
  minBPM?: number;
  maxBPM?: number;
  includeBpmMultiples?: boolean;
  onOpenTapBpm: (session: TapBpmSession) => void;
}) {
  const rawTitle = (item.snippet?.title ?? "").trim() || "(Untitled)";
  const vid =
    typeof item.snippet?.resourceId?.videoId === "string"
      ? item.snippet.resourceId.videoId.trim()
      : "";
  const channel =
    typeof item.snippet?.videoOwnerChannelTitle === "string"
      ? item.snippet.videoOwnerChannelTitle.trim()
      : "";
  const displayArtist = channel;
  const lookupArtistName = channel;
  const queueResolve =
    vid ? undefined : `${lookupArtistName} ${rawTitle}`.trim() || rawTitle;

  const {
    tempo,
    loading,
    parsedArtist,
    parsedSong,
    matchedSong,
    matchedArtist,
    onMeasuredBpmFromTap,
    isOutOfRange,
    bpmRangeMatch,
    feedbackKey,
    feedbackApiPayload,
  } = useTrackRowTempoFeedback({
    mode: "playlist",
    rowIndex: idx,
    rawTitle,
    lookupArtistName,
    minBPM,
    maxBPM,
    includeBpmMultiples,
    videoId: vid,
    playlistId,
    lookupEffectDeps: [
      item.snippet?.title,
      item.snippet?.videoOwnerChannelTitle,
      item.snippet?.resourceId?.videoId,
    ],
  });

  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(() => {
    setFeedbackOpen(false);
  }, [feedbackKey]);

  const trackStripeLight = idx % 2 === 0;
  const rowTone = `${
    trackStripeLight
      ? "bg-white dark:bg-gray-950/40"
      : "bg-gray-100/80 dark:bg-gray-900/55"
  } ${isOutOfRange ? "opacity-30 grayscale" : ""}`;

  return (
    <Fragment>
      <TableRow className={`${rowTone} sm:hidden`}>
        <TableCell colSpan={7} className="p-2 align-top">
          <div className="flex min-w-0 flex-col gap-2 text-xs">
            <div className="flex min-w-0 gap-2">
              <span className="w-5 shrink-0 text-right font-mono text-[10px] text-gray-400">
                {idx + 1}.
              </span>
              <div className="min-w-0 flex-1">
                <div
                  className="truncate font-medium text-gray-900 dark:text-gray-100"
                  title={rawTitle}
                >
                  {rawTitle}
                </div>
                {displayArtist ? (
                  <div
                    className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400"
                    title={displayArtist}
                  >
                    {displayArtist}
                  </div>
                ) : null}
              </div>
              <PlaylistQueueCheckbox
                videoId={vid}
                resolveQuery={queueResolve}
                title={rawTitle}
                subtitle={displayArtist || undefined}
              />
            </div>
            <div className="min-w-0 border-t border-gray-100 pt-2 dark:border-gray-600/80 [&_div]:!max-w-none">
              <ParsedGetSongBody
                parsedArtist={parsedArtist}
                parsedSong={parsedSong}
                matchedArtist={matchedArtist}
                matchedSong={matchedSong}
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 pt-2 dark:border-gray-600/80">
                <div className="shrink-0">
                  {vid ? (
                    <Button
                      size="xs"
                      color="light"
                      className="touch-manipulation"
                      onClick={() => {
                        setFeedbackOpen(true);
                        onOpenTapBpm({
                          title: rawTitle,
                          artistName: displayArtist,
                          videoId: vid || undefined,
                          onUseMeasuredBpm: onMeasuredBpmFromTap,
                        });
                      }}
                    >
                      Tap BPM
                    </Button>
                  ) : (
                    <span className="text-[11px] text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  {loading ? null : (
                    <TrackRowBpmColumn
                      loading={loading}
                      tempo={tempo}
                      feedbackKey={feedbackKey}
                      feedbackApiPayload={feedbackApiPayload}
                      feedbackOpen={feedbackOpen}
                      setFeedbackOpen={setFeedbackOpen}
                      bpmRangeMatch={bpmRangeMatch}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
      <TableRow className={`${rowTone} hidden sm:table-row`}>
        <TableCell className="py-1.5 text-right tabular-nums text-gray-400">
          {idx + 1}.
        </TableCell>
        <TableCell className="max-w-[min(100vw,20rem)] py-1.5">
          <div className="flex min-w-0 flex-col">
            <span
              className="font-medium text-gray-900 dark:text-gray-100"
              title={rawTitle}
            >
              {rawTitle}
            </span>
            {displayArtist ? (
              <span
                className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                title={displayArtist}
              >
                {displayArtist}
              </span>
            ) : null}
          </div>
        </TableCell>
        <TableCell className="max-w-[180px] px-2 py-1.5 sm:max-w-[220px]">
          <ParsedGetSongBody
            parsedArtist={parsedArtist}
            parsedSong={parsedSong}
            matchedArtist={matchedArtist}
            matchedSong={matchedSong}
          />
        </TableCell>
        <TableCell className="whitespace-nowrap py-1.5">
          {vid ? (
            <Button
              size="xs"
              color="light"
              onClick={() => {
                setFeedbackOpen(true);
                onOpenTapBpm({
                  title: rawTitle,
                  artistName: displayArtist,
                  videoId: vid || undefined,
                  onUseMeasuredBpm: onMeasuredBpmFromTap,
                });
              }}
            >
              Tap BPM
            </Button>
          ) : (
            <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
          )}
        </TableCell>
        <TableCell className="py-1.5 text-right align-top">
          <TrackRowBpmColumn
            loading={loading}
            tempo={tempo}
            feedbackKey={feedbackKey}
            feedbackApiPayload={feedbackApiPayload}
            feedbackOpen={feedbackOpen}
            setFeedbackOpen={setFeedbackOpen}
            bpmRangeMatch={bpmRangeMatch}
          />
        </TableCell>
        <TableCell className="py-1.5 text-center align-middle">
          <PlaylistQueueCheckbox
            videoId={vid}
            resolveQuery={queueResolve}
            title={rawTitle}
            subtitle={displayArtist || undefined}
          />
        </TableCell>
      </TableRow>
    </Fragment>
  );
}

function ExpandedLibraryPlaylistTracks({
  playlistId,
  itemsByPlaylist,
  loadingItemsId,
  minBPM,
  maxBPM,
  includeBpmMultiples,
  onOpenTapBpm,
  stripeExpandedClassName,
}: {
  playlistId: string;
  itemsByPlaylist: Record<string, PlaylistItemRow[]>;
  loadingItemsId: string | null;
  minBPM?: number;
  maxBPM?: number;
  includeBpmMultiples?: boolean;
  onOpenTapBpm: (session: TapBpmSession) => void;
  stripeExpandedClassName: string;
}) {
  const items = itemsByPlaylist[playlistId];
  const loadingItems = loadingItemsId === playlistId;
  const [visibleCount, setVisibleCount] = useState(LIBRARY_TRACKS_PAGE_SIZE);

  useEffect(() => {
    setVisibleCount(LIBRARY_TRACKS_PAGE_SIZE);
  }, [playlistId]);

  const visibleItems = items ? items.slice(0, visibleCount) : [];
  const totalCount = items?.length ?? 0;

  return (
    <TableRow className={stripeExpandedClassName}>
      <TableCell colSpan={5} className="p-0">
        <div className="border-t border-gray-200 px-2 py-3 dark:border-gray-600 sm:px-4">
          {loadingItems ? (
            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
              <Spinner size="sm" />
              Loading tracks…
            </div>
          ) : !items || items.length === 0 ? (
            <p className="py-4 text-center text-sm italic text-gray-500">
              No videos in this playlist.
            </p>
          ) : (
            <>
            <Table className="w-full text-left text-xs sm:text-sm" hoverable>
              <TableHead>
                <TableRow className="bg-gray-100 dark:bg-gray-800 sm:hidden">
                  <TableHeadCell colSpan={7} className="py-1 text-xs font-semibold">
                    Track
                  </TableHeadCell>
                </TableRow>
                <TableRow className="hidden bg-gray-100 dark:bg-gray-800 sm:table-row">
                  <TableHeadCell className="w-10 py-1 text-right">#</TableHeadCell>
                  <TableHeadCell className="py-1">Title</TableHeadCell>
                  <TableHeadCell className="py-1">Parsed (GetSong)</TableHeadCell>
                  <TableHeadCell className="py-1">Tap BPM</TableHeadCell>
                  <TableHeadCell
                    className="py-1 text-right"
                    title="When the title was parsed for GetSong, use 👍/👎 below the BPM"
                  >
                    BPM
                  </TableHeadCell>
                  <TableHeadCell className="w-12 py-1 text-center">Queue</TableHeadCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleItems.map((it, idx) => (
                  <LibraryPlaylistTrackRow
                    key={it.id ?? `${playlistId}-${idx}`}
                    item={it}
                    idx={idx}
                    playlistId={playlistId}
                    minBPM={minBPM}
                    maxBPM={maxBPM}
                    includeBpmMultiples={includeBpmMultiples}
                    onOpenTapBpm={onOpenTapBpm}
                  />
                ))}
              </TableBody>
            </Table>
            <LibraryTracksLoadMore
              loadedCount={visibleItems.length}
              totalCount={totalCount}
              onLoadMore={() =>
                setVisibleCount((n) =>
                  Math.min(n + LIBRARY_TRACKS_PAGE_SIZE, totalCount)
                )
              }
            />
            </>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

type UserYoutubeLibraryTableProps = {
  minBPM?: number;
  maxBPM?: number;
  includeBpmMultiples?: boolean;
};

export default function UserYoutubeLibraryTable({
  minBPM,
  maxBPM,
  includeBpmMultiples,
}: UserYoutubeLibraryTableProps) {
  const { session: tapBpmSession, open: openTapBpm, close: closeTapBpm } =
    useTapBpmSession();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const [itemsByPlaylist, setItemsByPlaylist] = useState<
    Record<string, PlaylistItemRow[]>
  >({});
  const [loadingItemsId, setLoadingItemsId] = useState<string | null>(null);
  const loadedPlaylistIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/youtube/playlists?maxResults=50");
        const data = (await res.json()) as { items?: PlaylistRow[]; error?: string };
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : `HTTP ${res.status}`
          );
        }
        if (!cancelled) setPlaylists(data.items ?? []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load playlists.");
          setPlaylists([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const expandedPlaylistIds =
      typeof expanded === "object" && expanded !== null
        ? Object.entries(expanded)
            .filter(([, isOpen]) => isOpen)
            .map(([id]) => id)
        : [];
    if (expandedPlaylistIds.length === 0) return;

    let cancelled = false;

    async function loadExpandedPlaylists() {
      for (const expandedId of expandedPlaylistIds) {
        if (cancelled) return;
        if (!expandedId || loadedPlaylistIdsRef.current.has(expandedId)) continue;

        setLoadingItemsId(expandedId);
        try {
          const res = await fetch(
            `/api/ytmusic?type=playlist&playlistId=${encodeURIComponent(expandedId)}`
          );
          const data = (await res.json()) as {
            playlist?: { videos?: unknown[] };
            error?: string;
          };
          if (cancelled) return;
          if (!res.ok) {
            throw new Error(
              typeof data.error === "string" ? data.error : `HTTP ${res.status}`
            );
          }
          const items = (data.playlist?.videos ?? []).map(ytmusicPlaylistVideoToItemRow);
          setItemsByPlaylist((prev) => ({
            ...prev,
            [expandedId]: items,
          }));
          loadedPlaylistIdsRef.current.add(expandedId);
        } catch {
          if (!cancelled) {
            setItemsByPlaylist((prev) => ({ ...prev, [expandedId]: [] }));
          }
        } finally {
          if (!cancelled) setLoadingItemsId(null);
        }
      }
    }

    void loadExpandedPlaylists();

    return () => {
      cancelled = true;
    };
  }, [expanded]);

  const table = useReactTable({
    data: playlists,
    columns: libraryPlaylistColumns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getRowId: (row) => row.id,
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-300">
        <Spinner size="xl" />
        <p className="text-sm">Loading your YouTube playlists…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
        role="alert"
      >
        {error}
        <p className="mt-2 text-xs opacity-90">
          If you signed in before YouTube access was added, sign out and sign in again, then
          retry.
        </p>
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No playlists found in your channel.
      </p>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md dark:border-gray-700 sm:my-6">
        <div className="overflow-x-auto">
          <Table hoverable className="w-full text-left text-sm">
            <TableHead>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-gray-50 dark:bg-gray-700/50"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHeadCell
                      key={header.id}
                      className={cn(
                        "px-2 py-2 font-semibold",
                        (header.column.columnDef.meta as LibraryPlaylistColMeta | undefined)
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
              {table.getRowModel().rows.map((row) => {
                const rowIdx = row.index;
                const stripeMain =
                  rowIdx % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50/95 dark:bg-gray-800/90";
                const stripeExpanded =
                  rowIdx % 2 === 0
                    ? "bg-gray-50/90 dark:bg-gray-900/35"
                    : "bg-gray-100/85 dark:bg-gray-900/50";

                return (
                  <Fragment key={row.id}>
                    <TableRow
                      className={cn(
                        stripeMain,
                        "cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/40",
                        row.getIsExpanded() && "bg-gray-50 dark:bg-gray-700/50"
                      )}
                      onClick={row.getToggleExpandedHandler()}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            (cell.column.columnDef.meta as LibraryPlaylistColMeta | undefined)
                              ?.cellClassName
                          )}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() ? (
                      <ExpandedLibraryPlaylistTracks
                        playlistId={row.original.id}
                        itemsByPlaylist={itemsByPlaylist}
                        loadingItemsId={loadingItemsId}
                        minBPM={minBPM}
                        maxBPM={maxBPM}
                        includeBpmMultiples={includeBpmMultiples}
                        onOpenTapBpm={openTapBpm}
                        stripeExpandedClassName={stripeExpanded}
                      />
                    ) : null}
                  </Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
      <TapBpmModalRoot session={tapBpmSession} onClose={closeTapBpm} />
    </>
  );
}
