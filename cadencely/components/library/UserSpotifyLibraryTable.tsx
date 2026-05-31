"use client";

import { Fragment, useEffect, useState } from "react";
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
import { TrackRowBpmColumn } from "@/components/results/TrackRowBpmColumn";
import { useTrackRowTempoFeedback } from "@/hooks/useTrackRowTempoFeedback";
import { LibraryTracksLoadMore } from "@/components/library/LibraryTracksLoadMore";
import { LIBRARY_TRACKS_PAGE_SIZE } from "@/lib/library/libraryTrackPagination";

type SpotifyPlaylist = {
  id: string;
  name?: string;
  images?: Array<{ url?: string }>;
  tracks?: { total?: number };
};

type SpotifyTrack = {
  id?: string;
  name?: string;
  artists?: Array<{ name?: string }>;
};

type SpotifyTrackItem = {
  item?: SpotifyTrack | null;
  track?: SpotifyTrack | null;
};

/** Synthetic playlist row id for Spotify saved/liked tracks (`GET /v1/me/tracks`). */
export const SPOTIFY_LIKED_SONGS_ID = "__liked_songs__";

type UserSpotifyLibraryTableProps = {
  minBPM?: number;
  maxBPM?: number;
  includeBpmMultiples?: boolean;
};

function buildLikedSongsRow(total: number): SpotifyPlaylist {
  return {
    id: SPOTIFY_LIKED_SONGS_ID,
    name: "Liked Songs",
    tracks: { total },
  };
}

function SpotifyTrackRow({
  playlistId,
  item,
  idx,
  minBPM,
  maxBPM,
  includeBpmMultiples,
}: {
  playlistId: string;
  item: SpotifyTrackItem;
  idx: number;
  minBPM?: number;
  maxBPM?: number;
  includeBpmMultiples?: boolean;
}) {
  const track = item.item ?? item.track;
  const rawTitle = (track?.name ?? "").trim() || "(Untitled)";
  const artistNames = (track?.artists ?? [])
    .map((a) => (a.name ?? "").trim())
    .filter(Boolean)
    .join(", ");
  const lookupArtistName = artistNames;
  const queueResolve = `${lookupArtistName} ${rawTitle}`.trim() || rawTitle;
  const syntheticVideoId = (track?.id ?? `${playlistId}-${idx}`).trim();
  const {
    tempo,
    loading,
    parsedArtist,
    parsedSong,
    matchedSong,
    matchedArtist,
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
    videoId: syntheticVideoId,
    playlistId,
    lookupEffectDeps: [track?.id, track?.name, artistNames],
  });

  return (
    <TableRow className={isOutOfRange ? "opacity-30 grayscale" : ""}>
      <TableCell className="w-8 py-1 text-right tabular-nums text-gray-400">{idx + 1}.</TableCell>
      <TableCell className="max-w-[min(100vw,20rem)] py-1.5">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-gray-900 dark:text-gray-100" title={rawTitle}>
            {rawTitle}
          </span>
          {artistNames ? (
            <span className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400" title={artistNames}>
              {artistNames}
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
      <TableCell className="py-1.5 text-right align-top">
        <TrackRowBpmColumn
          loading={loading}
          tempo={tempo}
          feedbackKey={feedbackKey}
          feedbackApiPayload={feedbackApiPayload}
          feedbackOpen={false}
          setFeedbackOpen={() => {}}
          bpmRangeMatch={bpmRangeMatch}
        />
      </TableCell>
      <TableCell className="py-1.5 text-center align-middle">
        <PlaylistQueueCheckbox
          resolveQuery={queueResolve}
          title={rawTitle}
          subtitle={artistNames || undefined}
        />
      </TableCell>
    </TableRow>
  );
}

export default function UserSpotifyLibraryTable({
  minBPM,
  maxBPM,
  includeBpmMultiples,
}: UserSpotifyLibraryTableProps) {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tracksByPlaylist, setTracksByPlaylist] = useState<Record<string, SpotifyTrackItem[]>>({});
  const [tracksTotalByPlaylist, setTracksTotalByPlaylist] = useState<Record<string, number>>({});
  const [trackErrorsByPlaylist, setTrackErrorsByPlaylist] = useState<Record<string, string>>({});
  const [loadingTracksId, setLoadingTracksId] = useState<string | null>(null);
  const [loadingMoreTracksId, setLoadingMoreTracksId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [playlistsRes, likedRes] = await Promise.all([
          fetch("/api/spotify/playlists?limit=50"),
          fetch("/api/spotify/liked-tracks?limit=1"),
        ]);
        const playlistsData = (await playlistsRes.json()) as {
          items?: SpotifyPlaylist[];
          error?: string;
        };
        const likedData = (await likedRes.json()) as { total?: number; error?: string };

        if (!playlistsRes.ok) {
          throw new Error(
            typeof playlistsData.error === "string"
              ? playlistsData.error
              : `HTTP ${playlistsRes.status}`
          );
        }

        const likedTotal =
          likedRes.ok && typeof likedData.total === "number" ? likedData.total : 0;
        const userPlaylists = playlistsData.items ?? [];

        if (!cancelled) {
          setPlaylists([buildLikedSongsRow(likedTotal), ...userPlaylists]);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Could not load Spotify playlists.");
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

  const fetchSpotifyTracksPage = async (
    playlistId: string,
    offset: number,
    append: boolean
  ) => {
    const params = new URLSearchParams({
      limit: String(LIBRARY_TRACKS_PAGE_SIZE),
      offset: String(offset),
    });
    const tracksUrl =
      playlistId === SPOTIFY_LIKED_SONGS_ID
        ? `/api/spotify/liked-tracks?${params}`
        : `/api/spotify/playlist-tracks?${params}&playlistId=${encodeURIComponent(playlistId)}`;

    const res = await fetch(tracksUrl);
    const data = (await res.json()) as {
      items?: SpotifyTrackItem[];
      total?: number;
      error?: string;
    };
    if (!res.ok) {
      throw new Error(typeof data.error === "string" ? data.error : `HTTP ${res.status}`);
    }

    const pageItems = data.items ?? [];
    const total =
      typeof data.total === "number"
        ? data.total
        : offset + pageItems.length;

    setTracksByPlaylist((prev) => ({
      ...prev,
      [playlistId]: append ? [...(prev[playlistId] ?? []), ...pageItems] : pageItems,
    }));
    setTracksTotalByPlaylist((prev) => ({ ...prev, [playlistId]: total }));
    setTrackErrorsByPlaylist((prev) => {
      if (!(playlistId in prev)) return prev;
      const next = { ...prev };
      delete next[playlistId];
      return next;
    });
  };

  useEffect(() => {
    if (!expandedId || expandedId in tracksByPlaylist) return;
    const playlistId = expandedId;
    let cancelled = false;
    async function loadTracks() {
      setLoadingTracksId(playlistId);
      try {
        if (!cancelled) await fetchSpotifyTracksPage(playlistId, 0, false);
      } catch (e) {
        if (!cancelled) {
          setTracksByPlaylist((prev) => ({ ...prev, [playlistId]: [] }));
          setTracksTotalByPlaylist((prev) => ({ ...prev, [playlistId]: 0 }));
          setTrackErrorsByPlaylist((prev) => ({
            ...prev,
            [playlistId]:
              e instanceof Error ? e.message : "Could not load tracks for this playlist.",
          }));
        }
      } finally {
        if (!cancelled) setLoadingTracksId(null);
      }
    }
    void loadTracks();
    return () => {
      cancelled = true;
    };
  }, [expandedId, tracksByPlaylist]);

  const loadMoreTracks = async (playlistId: string) => {
    const offset = tracksByPlaylist[playlistId]?.length ?? 0;
    setLoadingMoreTracksId(playlistId);
    try {
      await fetchSpotifyTracksPage(playlistId, offset, true);
    } catch (e) {
      setTrackErrorsByPlaylist((prev) => ({
        ...prev,
        [playlistId]:
          e instanceof Error ? e.message : "Could not load more tracks for this playlist.",
      }));
    } finally {
      setLoadingMoreTracksId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-600 dark:text-gray-300">
        <Spinner size="xl" />
        <p className="text-sm">Loading your Spotify library…</p>
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
      </div>
    );
  }

  if (playlists.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
        No Spotify library items found.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md dark:border-gray-700 sm:my-6">
      <div className="overflow-x-auto">
        <Table hoverable className="w-full text-left text-sm">
          <TableHead>
            <TableRow className="bg-gray-50 dark:bg-gray-700/50">
              <TableHeadCell className="w-10 px-2 py-2" />
              <TableHeadCell className="px-2 py-2 font-semibold">Playlist</TableHeadCell>
              <TableHeadCell className="w-24 px-2 py-2 font-semibold">Tracks</TableHeadCell>
              <TableHeadCell className="w-36 px-2 py-2 text-right font-semibold">
                Action
              </TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {playlists.map((pl, rowIdx) => {
              const isExpanded = expandedId === pl.id;
              const items = tracksByPlaylist[pl.id] ?? [];
              const trackTotal = tracksTotalByPlaylist[pl.id] ?? items.length;
              const trackError = trackErrorsByPlaylist[pl.id];
              const loadingMore = loadingMoreTracksId === pl.id;
              const isLikedSongs = pl.id === SPOTIFY_LIKED_SONGS_ID;
              const thumb = pl.images?.[0]?.url;
              return (
                <Fragment key={pl.id}>
                  <TableRow
                    className={`${
                      rowIdx % 2 === 0
                        ? "bg-white dark:bg-gray-800"
                        : "bg-gray-50/95 dark:bg-gray-800/90"
                    } cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/40`}
                    onClick={() => setExpandedId((prev) => (prev === pl.id ? null : pl.id))}
                  >
                    <TableCell className="px-2 py-2">
                      <Button color="gray" size="xs" pill className="border-none !p-1">
                        {isExpanded ? (
                          <HiChevronUp className="h-5 w-5" />
                        ) : (
                          <HiChevronDown className="h-5 w-5" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="px-2 py-2">
                      <div className="flex min-w-0 items-center gap-3">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-10 w-10 shrink-0 rounded object-cover" />
                        ) : (
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded ${
                              isLikedSongs
                                ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                                : "bg-gray-100 dark:bg-gray-700"
                            }`}
                          >
                            <span
                              className={`text-xs ${isLikedSongs ? "text-white" : "text-gray-400"}`}
                              aria-hidden
                            >
                              {isLikedSongs ? "♥" : "♪"}
                            </span>
                          </div>
                        )}
                        <span className="min-w-0 font-medium text-gray-900 dark:text-white">
                          {pl.name ?? "(Untitled)"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-2 py-2 tabular-nums text-gray-600 dark:text-gray-300">
                      {pl.tracks?.total ?? "—"}
                    </TableCell>
                    <TableCell className="px-2 py-2 text-right">
                      <Button size="xs" color={isExpanded ? "dark" : "light"}>
                        {isExpanded ? "Hide tracks" : "View tracks"}
                      </Button>
                    </TableCell>
                  </TableRow>
                  {isExpanded ? (
                    <TableRow className="bg-gray-50/90 dark:bg-gray-900/35">
                      <TableCell colSpan={5} className="p-0">
                        <div className="border-t border-gray-200 px-2 py-3 dark:border-gray-600 sm:px-4">
                          {loadingTracksId === pl.id ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                              <Spinner size="sm" />
                              Loading tracks…
                            </div>
                          ) : trackError ? (
                            <div
                              className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100"
                              role="alert"
                            >
                              {trackError}
                              <p className="mt-1 text-xs opacity-90">
                                If this is a Spotify permissions error, sign out and sign in again
                                with Spotify.
                              </p>
                            </div>
                          ) : items.length === 0 ? (
                            <p className="py-4 text-center text-sm italic text-gray-500">
                              No tracks in this playlist.
                            </p>
                          ) : (
                            <>
                            <Table className="w-full text-left text-xs sm:text-sm" hoverable>
                              <TableHead>
                                <TableRow className="bg-gray-100 dark:bg-gray-800">
                                  <TableHeadCell className="w-10 py-1 text-right">#</TableHeadCell>
                                  <TableHeadCell className="py-1">Title</TableHeadCell>
                                  <TableHeadCell className="py-1">Parsed (GetSong)</TableHeadCell>
                                  <TableHeadCell className="py-1 text-right">BPM</TableHeadCell>
                                  <TableHeadCell className="w-12 py-1 text-center">Queue</TableHeadCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {items
                                  .filter((it) => (it.item ?? it.track) != null)
                                  .map((it, idx) => (
                                  <SpotifyTrackRow
                                    key={
                                      (it.item ?? it.track)?.id ?? `${pl.id}-${idx}`
                                    }
                                    playlistId={pl.id}
                                    item={it}
                                    idx={idx}
                                    minBPM={minBPM}
                                    maxBPM={maxBPM}
                                    includeBpmMultiples={includeBpmMultiples}
                                  />
                                ))}
                              </TableBody>
                            </Table>
                            <LibraryTracksLoadMore
                              loadedCount={items.length}
                              totalCount={trackTotal}
                              loading={loadingMore}
                              onLoadMore={() => void loadMoreTracks(pl.id)}
                            />
                            </>
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
  );
}
