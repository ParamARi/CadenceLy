"use client";

import { useCallback, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  TextInput,
  Label,
  Select,
  Alert,
  Spinner,
  Tooltip,
} from "flowbite-react";
import { HiInformationCircle } from "react-icons/hi";
import type { PlaylistQueueItem } from "./PlaylistQueueContext";
import { PLAYLIST_ADD_ITEMS_MAX_VIDEOS } from "@/lib/youtube/playlistAddItemsLimits";

type PlaylistListItem = {
  id: string;
  snippet?: { title?: string };
};

type Props = {
  show: boolean;
  onClose: () => void;
  items: PlaylistQueueItem[];
  onRemove: (videoId: string) => void;
  onClear: () => void;
};

export function PlaylistQueuePreviewModal({
  show,
  onClose,
  items,
  onRemove,
  onClear,
}: Props) {
  const { data: session, status: sessionStatus } = useSession();
  const signedIn = sessionStatus === "authenticated" && !!session;

  const [targetMode, setTargetMode] = useState<"new" | "existing">("new");
  const [newTitle, setNewTitle] = useState("Cadence.ly playlist");
  const [privacyStatus, setPrivacyStatus] = useState<
    "private" | "unlisted" | "public"
  >("private");
  const [existingId, setExistingId] = useState("");
  const [playlists, setPlaylists] = useState<PlaylistListItem[]>([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!show || !signedIn || targetMode !== "existing") return;
    let cancelled = false;
    (async () => {
      setLoadingLists(true);
      setError(null);
      try {
        const res = await fetch("/api/youtube/playlists?maxResults=50");
        const data = (await res.json()) as {
          items?: PlaylistListItem[];
          error?: string;
        };
        if (!res.ok) {
          throw new Error(
            typeof data.error === "string" ? data.error : `HTTP ${res.status}`
          );
        }
        if (!cancelled) {
          setPlaylists(data.items ?? []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Could not load your playlists."
          );
        }
      } finally {
        if (!cancelled) setLoadingLists(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [show, signedIn, targetMode]);

  useEffect(() => {
    if (!show) {
      setError(null);
      setSuccess(null);
      setSubmitting(false);
    }
  }, [show]);

  const commit = useCallback(async () => {
    if (items.length === 0 || !signedIn) return;
    if (items.length > PLAYLIST_ADD_ITEMS_MAX_VIDEOS) {
      setError(
        `This queue has ${items.length} videos; only ${PLAYLIST_ADD_ITEMS_MAX_VIDEOS} can be saved at once. Remove extras or save in multiple batches.`
      );
      return;
    }
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      let playlistId = existingId.trim();
      if (targetMode === "new") {
        const title = newTitle.trim();
        if (!title) {
          setError("Enter a playlist title.");
          setSubmitting(false);
          return;
        }
        const createRes = await fetch("/api/youtube/playlists", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, privacyStatus }),
        });
        const created = (await createRes.json()) as { id?: string; error?: string };
        if (!createRes.ok) {
          throw new Error(
            typeof created.error === "string"
              ? created.error
              : `Create failed (${createRes.status})`
          );
        }
        if (!created.id) {
          throw new Error("No playlist id returned.");
        }
        playlistId = created.id;
      } else if (!playlistId) {
        setError("Choose a playlist.");
        setSubmitting(false);
        return;
      }

      const addRes = await fetch("/api/youtube/playlist-add-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          videoIds: items.map((i) => i.videoId),
        }),
      });
      const addData = (await addRes.json()) as {
        added?: string[];
        addedCount?: number;
        failures?: { videoId: string; detail: string }[];
        error?: string;
        reason?: string;
      };
      if (!addRes.ok) {
        const base =
          typeof addData.error === "string"
            ? addData.error
            : `Add to playlist failed (${addRes.status})`;
        const reason =
          typeof addData.reason === "string" && addData.reason.trim()
            ? addData.reason.trim()
            : "";
        throw new Error(reason ? `${base} ${reason}` : base);
      }

      const addedIds = Array.isArray(addData.added) ? addData.added : [];
      const failures = addData.failures ?? [];
      if (failures.length > 0) {
        addedIds.forEach((id) => onRemove(id));
        setError(
          `Added ${addedIds.length} of ${items.length}. Some videos could not be added (e.g. private, region, or duplicate).`
        );
      } else {
        setSuccess(
          `Added ${addData.addedCount ?? addedIds.length} video(s) to your YouTube playlist.`
        );
        onClear();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }, [
    items,
    signedIn,
    targetMode,
    newTitle,
    privacyStatus,
    existingId,
    onClear,
    onRemove,
  ]);

  return (
    <Modal show={show} onClose={onClose} size="xl">
      <ModalHeader>Playlist queue</ModalHeader>
      <ModalBody>
        <p className="mb-3 text-sm text-gray-600 dark:text-gray-300">
          Review songs below, then create a new playlist or add them to one you
          already have.
        </p>
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-600 dark:text-gray-300">
            Up to {PLAYLIST_ADD_ITEMS_MAX_VIDEOS} videos per save.
          </span>
          <Tooltip
            content="YouTube adds each video with a separate Data API call; limiting batch size keeps daily quota use lower and avoids long-running requests."
            placement="top"
            style="auto"
          >
            <button
              type="button"
              className="inline-flex shrink-0 rounded text-gray-400 outline-none ring-offset-2 hover:text-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500 dark:text-gray-500 dark:hover:text-gray-300 dark:focus-visible:ring-purple-400"
              aria-label="Why there is a limit per save"
            >
              <HiInformationCircle className="h-4 w-4" aria-hidden />
            </button>
          </Tooltip>
        </div>

        {items.length > PLAYLIST_ADD_ITEMS_MAX_VIDEOS ? (
          <Alert color="warning" className="mb-3">
            Queue has {items.length} videos (max {PLAYLIST_ADD_ITEMS_MAX_VIDEOS}{" "}
            per save). Remove {items.length - PLAYLIST_ADD_ITEMS_MAX_VIDEOS} or
            split into multiple saves.
          </Alert>
        ) : null}

        {!signedIn ? (
          <Alert color="warning">
            Sign in with Google to save this queue to YouTube.
          </Alert>
        ) : null}

        {error ? (
          <Alert color="failure" className="mb-3">
            {error}
          </Alert>
        ) : null}
        {success ? (
          <Alert color="success" className="mb-3">
            {success}
          </Alert>
        ) : null}

        <div className="mb-4 max-h-52 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-600">
          {items.length === 0 ? (
            <p className="p-4 text-center text-sm text-gray-500">
              No songs in the queue. Select tracks from search or your library.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {items.map((it) => (
                <li
                  key={it.videoId}
                  className="flex items-start gap-2 px-3 py-2 text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {it.title}
                    </div>
                    {it.subtitle ? (
                      <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {it.subtitle}
                      </div>
                    ) : null}
                    <div className="mt-0.5 font-mono text-[10px] text-gray-400">
                      {it.videoId}
                    </div>
                  </div>
                  <Button
                    size="xs"
                    color="light"
                    className="shrink-0"
                    onClick={() => onRemove(it.videoId)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-medium text-gray-900 dark:text-white">
            Save to
          </legend>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="plTarget"
                checked={targetMode === "new"}
                onChange={() => setTargetMode("new")}
                className="text-purple-600"
              />
              New playlist
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="plTarget"
                checked={targetMode === "existing"}
                onChange={() => setTargetMode("existing")}
                className="text-purple-600"
              />
              Existing playlist
            </label>
          </div>
        </fieldset>

        {targetMode === "new" ? (
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="pq-title" className="mb-1 block">
                Title
              </Label>
              <TextInput
                id="pq-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pq-privacy" className="mb-1 block">
                Visibility
              </Label>
              <Select
                id="pq-privacy"
                value={privacyStatus}
                onChange={(e) =>
                  setPrivacyStatus(
                    e.target.value as "private" | "unlisted" | "public"
                  )
                }
                className="mt-1"
              >
                <option value="private">Private</option>
                <option value="unlisted">Unlisted</option>
                <option value="public">Public</option>
              </Select>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <Label htmlFor="pq-existing" className="mb-1 block">
              Your playlist
            </Label>
            {loadingLists ? (
              <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                <Spinner size="sm" />
                Loading…
              </div>
            ) : (
              <Select
                id="pq-existing"
                value={existingId}
                onChange={(e) => setExistingId(e.target.value)}
                className="mt-1"
              >
                <option value="">Select…</option>
                {playlists.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.snippet?.title ?? p.id}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button color="gray" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => void commit()}
          disabled={
            submitting ||
            items.length === 0 ||
            sessionStatus !== "authenticated" ||
            items.length > PLAYLIST_ADD_ITEMS_MAX_VIDEOS
          }
        >
          {submitting ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Saving…
            </>
          ) : (
            "Save to YouTube"
          )}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
