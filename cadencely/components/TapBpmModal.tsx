"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Button,
  Label,
  Modal,
  ModalBody,
  ModalHeader,
  Spinner,
  TextInput,
} from "flowbite-react";
import { signIn, useSession } from "next-auth/react";
import { HiRefresh } from "react-icons/hi";
import { useTapBpm } from "@/hooks/useTapBpm";
import { fetchSongVideoForTap } from "@/lib/search";
import { parseYoutubeVideoId } from "@/lib/bpm/youtubeVideoId";

/** Payload to open the modal from a table row (single shared modal per table). */
export type TapBpmSession = {
  title: string;
  artistName: string;
  videoId?: string | null;
  songLookupQuery?: string | null;
  onUseMeasuredBpm?: (bpm: number) => void;
};

export type TapBpmModalProps = {
  show: boolean;
  onClose: () => void;
  title: string;
  artistName: string;
  /** When set, embed loads immediately (e.g. YouTube Music rows). */
  videoId?: string | null;
  /**
   * When `videoId` is absent, this string is sent to YouTube Music search
   * (`type=songVideo`) to pick the first matching video.
   */
  songLookupQuery?: string | null;
  onUseMeasuredBpm?: (bpm: number) => void;
};

export default function TapBpmModal({
  show,
  onClose,
  title,
  artistName,
  videoId: videoIdProp = null,
  songLookupQuery = null,
  onUseMeasuredBpm,
}: TapBpmModalProps) {
  const { data: session, status: authStatus } = useSession();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveMessage, setResolveMessage] = useState<string | null>(null);
  const [matchedLabel, setMatchedLabel] = useState<string | null>(null);
  const [pasteUrl, setPasteUrl] = useState("");
  const [retryNonce, setRetryNonce] = useState(0);
  const [transferMessage, setTransferMessage] = useState<string | null>(null);

  const { bpm, tapCount, registerTap, reset } = useTapBpm({
    enabled: show && Boolean(activeVideoId),
  });

  useEffect(() => {
    if (!show) {
      setActiveVideoId(null);
      setResolving(false);
      setResolveMessage(null);
      setMatchedLabel(null);
      setPasteUrl("");
      setTransferMessage(null);
      reset();
      return;
    }
    reset();
    setTransferMessage(null);
  }, [show, reset]);

  useEffect(() => {
    if (!show) {
      return;
    }

    const fromProp = videoIdProp?.trim() || "";
    if (fromProp) {
      setActiveVideoId(fromProp);
      setResolveMessage(null);
      setMatchedLabel(null);
      setResolving(false);
      return;
    }

    const q = songLookupQuery?.trim() || "";
    if (!q) {
      setActiveVideoId(null);
      setResolving(false);
      setResolveMessage(
        "No video id on this row. Paste a YouTube link or ID below."
      );
      setMatchedLabel(null);
      return;
    }

    let cancelled = false;
    setResolving(true);
    setResolveMessage(null);
    setActiveVideoId(null);
    setMatchedLabel(null);

    void fetchSongVideoForTap(q)
      .then((r) => {
        if (cancelled) return;
        if (r?.videoId) {
          setActiveVideoId(r.videoId);
          const who =
            r.artistName && r.name
              ? `${r.artistName} — ${r.name}`
              : r.name || r.videoId;
          setMatchedLabel(who);
          setResolveMessage(null);
        } else {
          setResolveMessage(
            "No match on YouTube Music. Paste a YouTube URL or video ID below."
          );
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResolveMessage(
            "Lookup failed. Paste a YouTube URL or video ID below."
          );
        }
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, [show, videoIdProp, songLookupQuery, retryNonce]);

  const applyPaste = useCallback(() => {
    const id = parseYoutubeVideoId(pasteUrl);
    if (id) {
      setActiveVideoId(id);
      setResolveMessage(null);
      setMatchedLabel("Pasted link");
    } else {
      setResolveMessage("Could not read a video ID from that text.");
    }
  }, [pasteUrl]);

  const sendBpmToFeedback = useCallback(() => {
    if (bpm == null || !onUseMeasuredBpm) return;
    onUseMeasuredBpm(bpm);
    setTransferMessage(`Added ${bpm} BPM to suggested tempo.`);
  }, [bpm, onUseMeasuredBpm]);

  const headline = [artistName, title].filter(Boolean).join(" — ") || title;

  return (
    <Modal
      show={show}
      onClose={onClose}
      size="3xl"
      dismissible
      theme={{
        content: {
          inner:
            "relative flex max-h-[90dvh] min-h-0 flex-col rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800",
        },
      }}
    >
      <ModalHeader className="shrink-0">
        <span className="block font-semibold">Tap to measure BPM</span>
        <span className="mt-1 block text-sm font-normal text-gray-500 dark:text-gray-400">
          {headline}
        </span>
      </ModalHeader>
      <ModalBody className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain">
        {resolving ? (
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Spinner size="sm" />
            Finding a YouTube video…
          </div>
        ) : null}

        {resolveMessage ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">
            {resolveMessage}
          </p>
        ) : null}

        {matchedLabel && activeVideoId ? (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Now playing: {matchedLabel}
          </p>
        ) : null}

        {!videoIdProp?.trim() && (
          <div className="space-y-2">
            <Label htmlFor="tap-bpm-paste" className="font-medium">
              YouTube URL or video ID
            </Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <TextInput
                id="tap-bpm-paste"
                className="flex-1"
                placeholder="https://www.youtube.com/watch?v=…"
                value={pasteUrl}
                onChange={(e) => setPasteUrl(e.target.value)}
              />
              <Button color="light" onClick={applyPaste}>
                Use video
              </Button>
              <Button
                color="gray"
                onClick={() => setRetryNonce((n) => n + 1)}
                disabled={!songLookupQuery?.trim() || Boolean(videoIdProp?.trim())}
              >
                Retry search
              </Button>
            </div>
          </div>
        )}

        {activeVideoId ? (
          <div className="mx-auto w-full max-w-xs shrink-0 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-600 bg-black/5 dark:bg-black/40 sm:max-w-sm">
            <div className="relative aspect-video w-full">
              <iframe
                title={`YouTube: ${headline}`}
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?rel=0`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
        ) : !resolving ? (
          <div className="mx-auto flex min-h-[100px] max-w-xs shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500 sm:max-w-sm">
            Add a video to start listening
          </div>
        ) : null}

        <button
          type="button"
          onClick={registerTap}
          disabled={!activeVideoId}
          className="flex min-h-[80px] w-full shrink-0 touch-manipulation select-none flex-col items-center justify-center rounded-xl border-2 border-indigo-400/80 bg-indigo-50/90 px-3 py-3 text-center text-indigo-950 transition hover:bg-indigo-100/90 disabled:cursor-not-allowed disabled:opacity-40 dark:border-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-50 dark:hover:bg-indigo-900/60 sm:min-h-[88px] sm:py-4"
        >
          <span className="text-base font-semibold sm:text-lg">
            Tap here to the beat
          </span>
          <span className="mt-0.5 text-xs opacity-80 sm:text-sm">
            Or press Space (when not typing in a field)
          </span>
        </button>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <div className="text-center">
            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              BPM
            </span>
            <p className="font-mono text-2xl font-bold tabular-nums text-gray-900 dark:text-white sm:text-3xl">
              {bpm != null ? bpm : "—"}
            </p>
          </div>
          <div className="text-center">
            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Taps
            </span>
            <p className="font-mono text-lg tabular-nums text-gray-800 dark:text-gray-200 sm:text-xl">
              {tapCount}
            </p>
          </div>
        </div>

        {onUseMeasuredBpm ? (
          <div className="flex shrink-0 flex-col items-center gap-2">
            {authStatus === "loading" ? (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Checking sign-in…
              </p>
            ) : !session ? (
              <>
                <p className="max-w-sm text-center text-xs text-gray-600 dark:text-gray-300">
                  Sign in with Google to copy your measured BPM into the
                  feedback form.
                </p>
                <Button
                  color="light"
                  size="sm"
                  onClick={() => void signIn("google", { callbackUrl: "/" })}
                >
                  Sign in with Google
                </Button>
              </>
            ) : (
              <>
                <Button
                  color="light"
                  onClick={sendBpmToFeedback}
                  disabled={bpm == null}
                  className="text-sm"
                >
                  Use measured BPM in feedback form
                </Button>
                {transferMessage ? (
                  <p className="text-xs text-green-700 dark:text-green-300">
                    {transferMessage}
                  </p>
                ) : null}
              </>
            )}
          </div>
        ) : null}

        <div className="mt-4 shrink-0 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-gray-200 py-5 dark:border-gray-600 sm:gap-x-8 sm:py-6">
          <Button
            color="dark"
            onClick={reset}
            disabled={tapCount === 0}
            aria-label="Reset taps"
            title="Reset taps"
            className="inline-flex !h-12 !w-12 min-h-12 min-w-12 items-center justify-center !p-0 sm:!h-11 sm:!w-11 sm:min-h-11 sm:min-w-11"
          >
            <HiRefresh className="h-7 w-7 shrink-0 text-white" aria-hidden />
          </Button>
          <Button
            onClick={onClose}
            size="lg"
            color="failure"
            className="min-h-11 justify-center px-4 py-2.5 text-base font-semibold text-white shadow-md ring-2 ring-red-400/50 dark:ring-red-500/40 sm:min-w-[7rem]"
          >
            Close
          </Button>
        </div>
      </ModalBody>
    </Modal>
  );
}
