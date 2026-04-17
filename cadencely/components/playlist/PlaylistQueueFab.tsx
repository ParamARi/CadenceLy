"use client";

import { useEffect, useRef, useState } from "react";
import { HiMusicNote } from "react-icons/hi";
import { Popover } from "flowbite-react";

type Props = {
  count: number;
  onOpen: () => void;
};

export function PlaylistQueueFab({ count, onOpen }: Props) {
  /** `null` until first effect sync — avoids double bump when mounting at count 1. */
  const prevCountRef = useRef<number | null>(null);
  const [bumpNonce, setBumpNonce] = useState(0);

  useEffect(() => {
    if (prevCountRef.current === null) {
      prevCountRef.current = count;
      return;
    }
    if (count > prevCountRef.current) {
      setBumpNonce((n) => n + 1);
    }
    prevCountRef.current = count;
  }, [count]);

  if (count <= 0) {
    return null;
  }

  return (
    <Popover
      trigger="hover"
      placement="left"
      content={
        <div className="w-56 px-1 py-0.5">
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            Playlist queue
          </p>
          <p className="mt-1 text-xs leading-snug text-gray-600 dark:text-gray-300">
            Click to open your queue and save these songs to a new or existing
            YouTube playlist.
          </p>
        </div>
      }
    >
      <button
        key={bumpNonce}
        type="button"
        onClick={onOpen}
        className="animate-fab-queue-bump fixed bottom-6 right-4 z-40 flex h-14 w-14 touch-manipulation items-center justify-center rounded-full bg-purple-600 text-white shadow-lg ring-1 ring-black/10 transition-colors hover:bg-purple-700 focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-800 sm:bottom-8 sm:right-8"
        aria-label={`Open playlist queue, ${count} songs selected`}
      >
        <HiMusicNote className="h-7 w-7" aria-hidden />
        <span className="absolute -right-1 -top-1 flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-gray-900 tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      </button>
    </Popover>
  );
}
