"use client";

import { useCallback, useEffect, useId, useState } from "react";
import { Checkbox, Spinner } from "flowbite-react";
import { usePlaylistQueue } from "./PlaylistQueueContext";
import { fetchSongVideoForTap } from "@/lib/search";
import { parseYoutubeVideoId } from "@/lib/bpm/youtubeVideoId";

function normalizeVideoId(raw: string | null | undefined): string {
  const t = (raw ?? "").trim();
  if (!t) return "";
  return parseYoutubeVideoId(t) ?? (/^[a-zA-Z0-9_-]{11}$/.test(t) ? t : "");
}

type Props = {
  /** Spotify/GetSong-style URI or YouTube URL (optional). */
  uri?: string | null;
  /** Direct YouTube video id or URL. */
  videoId?: string | null;
  /** When no id is known, lookup via YTMusic when the user checks the box. */
  resolveQuery?: string | null;
  title: string;
  subtitle?: string;
};

export function PlaylistQueueCheckbox({
  uri,
  videoId: videoIdProp,
  resolveQuery,
  title,
  subtitle,
}: Props) {
  const id = useId();
  const { isInQueue, addToQueue, removeFromQueue } = usePlaylistQueue();

  const parsedFromUri = uri ? normalizeVideoId(uri) : "";
  const fromProp = normalizeVideoId(videoIdProp ?? undefined);
  const initialVid = fromProp || parsedFromUri;
  const [resolvedVid, setResolvedVid] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  const effectiveVideoId = initialVid || resolvedVid;
  const q = (resolveQuery ?? "").trim();
  const canResolve = !initialVid && q.length > 0;

  useEffect(() => {
    setResolvedVid("");
    setResolveError(null);
  }, [uri, videoIdProp, resolveQuery, title]);

  const checked = effectiveVideoId ? isInQueue(effectiveVideoId) : false;

  const onToggle = useCallback(
    async (next: boolean) => {
      setResolveError(null);
      if (!next) {
        const vid = initialVid || resolvedVid;
        if (vid) removeFromQueue(vid);
        return;
      }

      const vidReady = initialVid || resolvedVid;
      if (vidReady) {
        if (!isInQueue(vidReady)) {
          addToQueue({ videoId: vidReady, title, subtitle });
        }
        return;
      }

      if (!canResolve) return;

      setResolving(true);
      try {
        const r = await fetchSongVideoForTap(q);
        if (!r?.videoId) {
          setResolveError("No YouTube video found.");
          return;
        }
        setResolvedVid(r.videoId);
        addToQueue({
          videoId: r.videoId,
          title: r.name || title,
          subtitle: r.artistName ?? subtitle,
        });
      } catch {
        setResolveError("Lookup failed.");
      } finally {
        setResolving(false);
      }
    },
    [
      initialVid,
      resolvedVid,
      canResolve,
      q,
      isInQueue,
      addToQueue,
      removeFromQueue,
      title,
      subtitle,
    ]
  );

  if (!initialVid && !canResolve) {
    return null;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      {resolving ? (
        <Spinner size="sm" aria-label="Looking up video" />
      ) : (
        <Checkbox
          id={id}
          checked={checked}
          onChange={(e) => void onToggle(e.target.checked)}
          aria-label="Add to playlist queue"
        />
      )}
      {resolveError ? (
        <span className="max-w-[100px] text-center text-[10px] leading-tight text-red-600 dark:text-red-400">
          {resolveError}
        </span>
      ) : null}
    </div>
  );
}
