"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button, Spinner } from "flowbite-react";
import {
  parseBpmInRange,
  type BpmFeedbackClientPayload,
} from "@/lib/bpm/bpmFeedbackApi";
import { submitBpmFeedback } from "@/lib/bpm/submitBpmFeedback";

type Props = {
  /** When this identity changes (e.g. another track), form fields reset. */
  storageKey: string;
  className?: string;
  /** Base POST body from the row hook; `calculatedBpm` is replaced with the user’s BPM. */
  apiPayload?: BpmFeedbackClientPayload | null;
};

function defaultArtistName(p: BpmFeedbackClientPayload): string {
  const a =
    (p.artistName && p.artistName.trim()) ||
    (p.matchedArtist && p.matchedArtist.trim()) ||
    (p.parsedArtist && p.parsedArtist.trim());
  return a || "";
}

function defaultSongName(p: BpmFeedbackClientPayload): string {
  const s =
    (p.matchedSong && p.matchedSong.trim()) ||
    (p.parsedSong && p.parsedSong.trim()) ||
    (p.rawTitle && p.rawTitle.trim());
  return s || "";
}

/**
 * Simple correction form: artist, song title, BPM (required to submit).
 */
export default function BpmFeedbackButtons({
  storageKey,
  className = "",
  apiPayload = null,
}: Props) {
  const { data: session, status: authStatus } = useSession();
  const [artistName, setArtistName] = useState("");
  const [songName, setSongName] = useState("");
  const [bpmInput, setBpmInput] = useState("");
  const [submitState, setSubmitState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  useEffect(() => {
    if (apiPayload) {
      setArtistName(defaultArtistName(apiPayload));
      setSongName(defaultSongName(apiPayload));
      const rawBpm = (apiPayload.calculatedBpm ?? "").trim();
      const parsed = parseBpmInRange(rawBpm);
      setBpmInput(parsed != null ? String(parsed) : rawBpm);
    } else {
      setArtistName("");
      setSongName("");
      setBpmInput("");
    }
    setSubmitState("idle");
  }, [storageKey, apiPayload]);

  const parsedBpm = parseBpmInRange(bpmInput);
  const canSubmit =
    Boolean(apiPayload && session && parsedBpm != null) &&
    submitState !== "sending";

  const submit = useCallback(async () => {
    if (!apiPayload || !session) return;
    const bpm = parseBpmInRange(bpmInput);
    if (bpm == null) return;
    setSubmitState("sending");
    const result = await submitBpmFeedback({
      ...apiPayload,
      calculatedBpm: String(bpm),
      suggestedTempo: null,
      suggestedArtist: artistName.trim() || null,
      suggestedSong: songName.trim() || null,
    });
    setSubmitState(result.ok ? "sent" : "error");
  }, [apiPayload, session, bpmInput, artistName, songName]);

  if (authStatus === "loading") {
    return (
      <div
        className={`mt-1 flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400 ${className}`}
      >
        <Spinner size="sm" />
        <span>Checking sign-in…</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        className={`mt-1 w-full min-w-[200px] max-w-[260px] rounded border border-amber-200 bg-amber-50 p-2 text-left dark:border-amber-900/50 dark:bg-amber-950/30 ${className}`}
      >
        <p className="mb-2 text-[10px] text-gray-600 dark:text-gray-300">
          Sign in with Google to submit tempo or track corrections.
        </p>
        <Button
          size="xs"
          color="light"
          onClick={() => void signIn("google", { callbackUrl: "/" })}
        >
          Sign in with Google
        </Button>
      </div>
    );
  }

  if (!apiPayload) {
    return (
      <div
        className={`mt-1 w-full min-w-[200px] max-w-[260px] text-right text-[10px] text-gray-500 dark:text-gray-400 ${className}`}
      >
        Feedback isn’t available for this track.
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-end gap-1 mt-1 ${className}`}>
      <div className="w-full min-w-[200px] max-w-[260px] rounded border border-gray-200 dark:border-gray-700 p-2 text-left">
        <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-400">
          Submit Feedback
        </p>
        <input
          type="text"
          value={artistName}
          onChange={(e) => setArtistName(e.target.value)}
          className="mb-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
        />
        <input
          type="text"
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
          className="mb-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
        />
        <input
          type="number"
          inputMode="numeric"
          value={bpmInput}
          onChange={(e) => setBpmInput(e.target.value)}
          placeholder="BPM"
          className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={() => void submit()}
          disabled={!canSubmit}
          className="mt-1 rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-[10px] font-medium disabled:opacity-50"
        >
          {submitState === "sending" ? "Sending…" : "Submit"}
        </button>
        {submitState === "sent" ? (
          <p className="mt-1 text-[10px] text-green-600 dark:text-green-400">
            Sent.
          </p>
        ) : null}
        {submitState === "error" ? (
          <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">
            Could not send. Try again.
          </p>
        ) : null}
      </div>
    </div>
  );
}
