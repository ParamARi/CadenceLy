"use client";

import { Button } from "flowbite-react";
import { LIBRARY_TRACKS_PAGE_SIZE } from "@/lib/library/libraryTrackPagination";

type LibraryTracksLoadMoreProps = {
  loadedCount: number;
  totalCount: number;
  loading?: boolean;
  onLoadMore: () => void;
};

export function LibraryTracksLoadMore({
  loadedCount,
  totalCount,
  loading = false,
  onLoadMore,
}: LibraryTracksLoadMoreProps) {
  const remaining = Math.max(0, totalCount - loadedCount);
  if (remaining <= 0) return null;

  const batch = Math.min(LIBRARY_TRACKS_PAGE_SIZE, remaining);

  return (
    <div className="mt-3 flex justify-center border-t border-gray-200 pt-3 dark:border-gray-600">
      <Button
        type="button"
        size="sm"
        color="light"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          onLoadMore();
        }}
      >
        {loading
          ? "Loading…"
          : `Show ${batch} more (${remaining} remaining)`}
      </Button>
    </div>
  );
}
