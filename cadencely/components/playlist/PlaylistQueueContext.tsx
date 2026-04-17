"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { PlaylistQueueFab } from "./PlaylistQueueFab";
import { PlaylistQueuePreviewModal } from "./PlaylistQueuePreviewModal";

export type PlaylistQueueItem = {
  videoId: string;
  title: string;
  subtitle?: string;
};

type PlaylistQueueContextValue = {
  items: PlaylistQueueItem[];
  addToQueue: (item: PlaylistQueueItem) => void;
  removeFromQueue: (videoId: string) => void;
  clearQueue: () => void;
  isInQueue: (videoId: string) => boolean;
  openPreview: () => void;
  closePreview: () => void;
  previewOpen: boolean;
};

const PlaylistQueueContext = createContext<PlaylistQueueContextValue | null>(
  null
);

export function usePlaylistQueue(): PlaylistQueueContextValue {
  const ctx = useContext(PlaylistQueueContext);
  if (!ctx) {
    throw new Error("usePlaylistQueue must be used within PlaylistQueueProvider");
  }
  return ctx;
}

export function PlaylistQueueProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PlaylistQueueItem[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);

  const addToQueue = useCallback((item: PlaylistQueueItem) => {
    const vid = item.videoId.trim();
    if (!vid) return;
    setItems((prev) => {
      if (prev.some((p) => p.videoId === vid)) {
        return prev;
      }
      return [...prev, { ...item, videoId: vid }];
    });
  }, []);

  const removeFromQueue = useCallback((videoId: string) => {
    setItems((prev) => prev.filter((p) => p.videoId !== videoId));
  }, []);

  const clearQueue = useCallback(() => {
    setItems([]);
  }, []);

  const isInQueue = useCallback(
    (videoId: string) => items.some((p) => p.videoId === videoId),
    [items]
  );

  const openPreview = useCallback(() => setPreviewOpen(true), []);
  const closePreview = useCallback(() => setPreviewOpen(false), []);

  const value = useMemo(
    () => ({
      items,
      addToQueue,
      removeFromQueue,
      clearQueue,
      isInQueue,
      openPreview,
      closePreview,
      previewOpen,
    }),
    [
      items,
      addToQueue,
      removeFromQueue,
      clearQueue,
      isInQueue,
      openPreview,
      closePreview,
      previewOpen,
    ]
  );

  return (
    <PlaylistQueueContext.Provider value={value}>
      {children}
      <PlaylistQueueFab count={items.length} onOpen={openPreview} />
      <PlaylistQueuePreviewModal
        show={previewOpen}
        onClose={closePreview}
        items={items}
        onRemove={removeFromQueue}
        onClear={clearQueue}
      />
    </PlaylistQueueContext.Provider>
  );
}
