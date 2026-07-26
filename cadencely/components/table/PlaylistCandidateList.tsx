"use client";

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
import type { PlaylistCandidate } from "@/lib/search";

type PlaylistCandidateListProps = {
  candidates: PlaylistCandidate[];
  /** Candidate currently being fetched (disables buttons, shows spinner). */
  loadingPlaylistId: string | null;
  /** Per-candidate fetch errors (private / unavailable playlists). */
  errorsById: Record<string, string>;
  onSelect: (candidate: PlaylistCandidate) => void;
};

/**
 * Disambiguation list for playlist search: shows candidate metadata only.
 * No BPM columns here — BPM lookups must not run until a playlist is chosen.
 */
export default function PlaylistCandidateList({
  candidates,
  loadingPlaylistId,
  errorsById,
  onSelect,
}: PlaylistCandidateListProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-md dark:border-gray-700 sm:my-6">
      <div className="overflow-x-auto">
        <Table hoverable className="w-full text-left text-sm">
          <TableHead>
            <TableRow className="bg-gray-50 dark:bg-gray-700/50">
              <TableHeadCell className="px-2 py-2 font-semibold">
                Playlist
              </TableHeadCell>
              <TableHeadCell className="hidden w-24 px-2 py-2 font-semibold sm:table-cell">
                Tracks
              </TableHeadCell>
              <TableHeadCell className="w-36 px-2 py-2 text-right font-semibold">
                Action
              </TableHeadCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y">
            {candidates.map((c, rowIdx) => {
              const isLoading = loadingPlaylistId === c.playlistId;
              const rowError = errorsById[c.playlistId];
              return (
                <TableRow
                  key={c.playlistId}
                  className={`${
                    rowIdx % 2 === 0
                      ? "bg-white dark:bg-gray-800"
                      : "bg-gray-50/95 dark:bg-gray-800/90"
                  } cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/40`}
                  onClick={() => {
                    if (!loadingPlaylistId) onSelect(c);
                  }}
                >
                  <TableCell className="px-2 py-2">
                    <div className="flex min-w-0 items-center gap-3">
                      {c.thumbnailUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.thumbnailUrl}
                          alt=""
                          className="h-10 w-10 shrink-0 rounded object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gray-100 dark:bg-gray-700">
                          <span className="text-xs text-gray-400" aria-hidden>
                            ♪
                          </span>
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          className="truncate font-medium text-gray-900 dark:text-white"
                          title={c.name}
                        >
                          {c.name}
                        </div>
                        <div
                          className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                          title={c.author}
                        >
                          {c.author}
                          {c.count != null ? (
                            <span className="sm:hidden"> · {c.count} tracks</span>
                          ) : null}
                        </div>
                        {rowError ? (
                          <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                            {rowError}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden px-2 py-2 tabular-nums text-gray-600 dark:text-gray-300 sm:table-cell">
                    {c.count ?? "—"}
                  </TableCell>
                  <TableCell className="px-2 py-2 text-right">
                    <Button
                      size="xs"
                      color="light"
                      disabled={Boolean(loadingPlaylistId)}
                      className="touch-manipulation"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelect(c);
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Loading…
                        </>
                      ) : (
                        "View tracks"
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
