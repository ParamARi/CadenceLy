"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Badge,
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
import BpmFeedbackButtons from "@/components/BpmFeedbackButtons";
import { useTapBpmSession } from "@/hooks/useTapBpmSession";
import { useTrackRowTempoFeedback } from "@/hooks/useTrackRowTempoFeedback";

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
    /** Present on many playlist items; helps GetSong / tempo lookup. */
    videoOwnerChannelTitle?: string;
    resourceId?: { videoId?: string };
  };
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

function LibraryPlaylistTrackRow({
  item,
  idx,
  playlistId,
  minBPM,
  maxBPM,
  onOpenTapBpm,
}: {
  item: PlaylistItemRow;
  idx: number;
  playlistId: string;
  minBPM?: number;
  maxBPM?: number;
  onOpenTapBpm: (session: TapBpmSession) => void;
}) {
  const [notFoundFeedbackOpen, setNotFoundFeedbackOpen] = useState(false);

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
    prefillSuggestedTempo,
    onMeasuredBpmFromTap,
    isOutOfRange,
    feedbackKey,
    showFeedback,
    showNoMatchFeedback,
    feedbackApiPayload,
  } = useTrackRowTempoFeedback({
    mode: "playlist",
    rowIndex: idx,
    rawTitle,
    lookupArtistName,
    minBPM,
    maxBPM,
    videoId: vid,
    playlistId,
    lookupEffectDeps: [
      item.snippet?.title,
      item.snippet?.videoOwnerChannelTitle,
      item.snippet?.resourceId?.videoId,
    ],
  });

  const showNotFound = !loading && (!tempo || tempo === "-");

  useEffect(() => {
    setNotFoundFeedbackOpen(false);
  }, [
    item.snippet?.title,
    item.snippet?.videoOwnerChannelTitle,
    item.snippet?.resourceId?.videoId,
    feedbackKey,
  ]);

  useEffect(() => {
    if (!showNotFound) setNotFoundFeedbackOpen(false);
  }, [showNotFound]);

  /** Phase-shift inner zebra so it lines up with the expanded `stripeExpanded` row (outer `odd:`/`even:` is covered by these cells). */
  const trackStripeLight =
    idx % 2 === 0;
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
              {vid ? (
                <Button
                  size="xs"
                  color="light"
                  className="touch-manipulation"
                  onClick={() =>
                    onOpenTapBpm({
                      title: rawTitle,
                      artistName: displayArtist,
                      videoId: vid || undefined,
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
                <Button
                  type="button"
                  size="xs"
                  color="light"
                  className="text-[11px] italic opacity-80 touch-manipulation"
                  onClick={() => setNotFoundFeedbackOpen(!notFoundFeedbackOpen)}
                >
                  Not Found
                </Button>
              )}
            </div>
            {notFoundFeedbackOpen ? (
              <div className="border-t border-gray-100 pt-2 dark:border-gray-600/80">
                <BpmFeedbackButtons
                  storageKey={feedbackKey}
                  visible
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
        </TableCell>
        <TableCell className="whitespace-nowrap py-1.5">
          {vid ? (
            <Button
              size="xs"
              color="light"
              onClick={() =>
                onOpenTapBpm({
                  title: rawTitle,
                  artistName: displayArtist,
                  videoId: vid || undefined,
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
        <TableCell className="py-1.5 text-right align-top">
          <div className="flex flex-col items-end gap-0">
            {loading ? (
              <Spinner size="sm" />
            ) : tempo && tempo !== "-" ? (
              <Badge color="indigo" size="sm" className="inline-flex w-fit font-mono text-xs">
                {tempo} BPM
              </Badge>
            ) : (
              <Button
                type="button"
                size="xs"
                color="light"
                className="text-xs italic opacity-80"
                onClick={() => setNotFoundFeedbackOpen(!notFoundFeedbackOpen)}
              >
                Not Found
              </Button>
            )}
            {notFoundFeedbackOpen ? (
              <BpmFeedbackButtons
                storageKey={feedbackKey}
                visible
                variant={showNoMatchFeedback ? "noApiMatch" : "parsedMatch"}
                prefillSuggestedTempo={prefillSuggestedTempo}
                apiPayload={feedbackApiPayload}
              />
            ) : null}
          </div>
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

type UserYoutubeLibraryTableProps = {
  minBPM?: number;
  maxBPM?: number;
};

export default function UserYoutubeLibraryTable({
  minBPM,
  maxBPM,
}: UserYoutubeLibraryTableProps) {
  const { session: tapBpmSession, open: openTapBpm, close: closeTapBpm } =
    useTapBpmSession();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  // Load playlist items when playlist is expanded
  useEffect(() => {
    if (!expandedId) return;
    if (loadedPlaylistIdsRef.current.has(expandedId)) return;

    let cancelled = false;
    (async () => {
      setLoadingItemsId(expandedId);
      try {
        const res = await fetch(
          `/api/ytmusic?type=playlist&playlistId=${encodeURIComponent(expandedId)}`
        );
        console.log("ytmusicPlaylist Response", res);
        const data = (await res.json()) as {
          playlist?: { videos?: unknown[] };
          error?: string;
        };
        console.log("ytmusicPlaylist Data", data);
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : `HTTP ${res.status}`
          );
        }
        const items = (data.playlist?.videos ?? []).map(
          ytmusicPlaylistVideoToItemRow
        );
        if (!cancelled) {
          setItemsByPlaylist((prev) => ({
            ...prev,
            [expandedId]: items,
          }));
          loadedPlaylistIdsRef.current.add(expandedId);
        }
      } catch {
        if (!cancelled) {
          setItemsByPlaylist((prev) => ({ ...prev, [expandedId]: [] }));
        }
      } finally {
        if (!cancelled) setLoadingItemsId(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [expandedId]);

  const toggleExpand = useCallback((playlistId: string) => {
    setExpandedId((prev) => (prev === playlistId ? null : playlistId));
  }, []);

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
          If you signed in before YouTube access was added, sign out and sign in
          again, then retry.
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
    <div className="my-6 overflow-hidden rounded-lg border border-gray-200 shadow-md dark:border-gray-700">
      <div className="overflow-x-auto">
        <Table hoverable className="w-full text-left text-sm">
          <TableHead>
            <TableRow className="bg-gray-50 dark:bg-gray-700/50">
              <TableHeadCell className="w-10 px-2 py-2" />
              <TableHeadCell className="px-2 py-2 font-semibold">Playlist</TableHeadCell>
              <TableHeadCell className="w-24 px-2 py-2 font-semibold">Videos</TableHeadCell>
              <TableHeadCell className="w-36 px-2 py-2 text-right font-semibold">
                Tracks
              </TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {playlists.map((pl, rowIdx) => {
              const id = pl.id;
              const title = pl.snippet?.title ?? "(Untitled)";
              const thumb = pl.snippet?.thumbnails?.default?.url;
              const count = pl.contentDetails?.itemCount ?? "—";
              const open = expandedId === id;
              const items = itemsByPlaylist[id];
              const loadingItems = loadingItemsId === id;
              const stripeMain =
                rowIdx % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50/95 dark:bg-gray-800/90";
              const stripeExpanded =
                rowIdx % 2 === 0
                  ? "bg-gray-50/90 dark:bg-gray-900/35"
                  : "bg-gray-100/85 dark:bg-gray-900/50";

              return (
                <Fragment key={id}>
                  <TableRow className={stripeMain}>
                    <TableCell className="px-2 py-2 align-middle">
                      <Button
                        color="gray"
                        size="xs"
                        pill
                        className="border-none !p-1"
                        onClick={() => toggleExpand(id)}
                        aria-expanded={open}
                        aria-label={open ? "Collapse" : "Expand"}
                      >
                        {open ? (
                          <HiChevronUp className="h-5 w-5" />
                        ) : (
                          <HiChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="px-2 py-2 align-middle">
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
                    </TableCell>
                    <TableCell className="px-2 py-2 align-middle tabular-nums text-gray-600 dark:text-gray-300">
                      {count}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right align-middle">
                      <Button
                        size="xs"
                        color={open ? "dark" : "light"}
                        onClick={() => toggleExpand(id)}
                      >
                        {open ? "Hide tracks" : "View tracks"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {open ? (
                    <TableRow className={stripeExpanded}>
                      <TableCell colSpan={4} className="p-0">
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
                            <Table className="w-full text-left text-xs sm:text-sm" hoverable>
                              <TableHead>
                                <TableRow className="bg-gray-100 dark:bg-gray-800 sm:hidden">
                                  <TableHeadCell
                                    colSpan={7}
                                    className="py-1 text-xs font-semibold"
                                  >
                                    Track
                                  </TableHeadCell>
                                </TableRow>
                                <TableRow className="hidden bg-gray-100 dark:bg-gray-800 sm:table-row">
                                  <TableHeadCell className="w-10 py-1 text-right">
                                    #
                                  </TableHeadCell>
                                  <TableHeadCell className="py-1">Title</TableHeadCell>
                                  <TableHeadCell className="py-1">
                                    Parsed (GetSong)
                                  </TableHeadCell>
                                  <TableHeadCell className="py-1">Tap BPM</TableHeadCell>
                                  <TableHeadCell
                                    className="py-1 text-right"
                                    title="When the title was parsed for GetSong, use 👍/👎 below the BPM"
                                  >
                                    BPM
                                  </TableHeadCell>
                                  <TableHeadCell className="w-12 py-1 text-center">
                                    Queue
                                  </TableHeadCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {items.map((it, idx) => (
                                  <LibraryPlaylistTrackRow
                                    key={it.id ?? `${id}-${idx}`}
                                    item={it}
                                    idx={idx}
                                    playlistId={id}
                                    minBPM={minBPM}
                                    maxBPM={maxBPM}
                                    onOpenTapBpm={openTapBpm}
                                  />
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
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
