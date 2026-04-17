"use client";

import { useCallback, useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { Button, Spinner } from "flowbite-react";
import { LuThumbsUp, LuThumbsDown } from "react-icons/lu";
import {
  parseBpmInRange,
  type BpmFeedbackClientPayload,
} from "@/lib/bpm/bpmFeedbackApi";
import type { BpmFeedbackVote } from "@/lib/bpm/bpmFeedbackStorage";
import {
  getBpmFeedback,
  setBpmFeedback,
} from "@/lib/bpm/bpmFeedbackStorage";
import { submitBpmFeedback } from "@/lib/bpm/submitBpmFeedback";

type Props = {
  storageKey: string;
  /** When false, nothing is rendered */
  visible: boolean;
  className?: string;
  /**
   * `parsedMatch` — thumbs + optional corrections when GetSong returned a BPM.
   * `noApiMatch` — no API BPM; submit measured tempo only (vote stays null).
   */
  variant?: "parsedMatch" | "noApiMatch";
  /** Optional external BPM value to prefill the suggested tempo input. */
  prefillSuggestedTempo?: string | null;
  /** When set, each vote change is POSTed to `/api/feedback/bpm` (fire-and-forget). */
  apiPayload?: BpmFeedbackClientPayload | null;
};

/**
 * Thumbs up/down for “this BPM / parsed match looks right or wrong”.
 */
export default function BpmFeedbackButtons({
  storageKey,
  visible,
  className = "",
  variant = "parsedMatch",
  prefillSuggestedTempo = null,
  apiPayload = null,
}: Props) {
  const { data: session, status: authStatus } = useSession();
  const [vote, setVote] = useState<BpmFeedbackVote | null>(null);
  const [suggestedArtist, setSuggestedArtist] = useState("");
  const [suggestedSong, setSuggestedSong] = useState("");
  const [suggestedTempo, setSuggestedTempo] = useState<number | null>(null);
  const [suggestionSubmitState, setSuggestionSubmitState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");
  const parseTempoInput = useCallback((value: string): number | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }, []);
  const suggestedTempoText =
    suggestedTempo == null ? "" : String(suggestedTempo);
  const hasValidSuggestedTempo =
    suggestedTempo != null && parseBpmInRange(suggestedTempo) != null;

  useEffect(() => {
    setVote(getBpmFeedback(storageKey));
    setSuggestedArtist("");
    setSuggestedSong("");
    setSuggestedTempo(null);
    setSuggestionSubmitState("idle");
  }, [storageKey]);

  useEffect(() => {
    const next = prefillSuggestedTempo?.trim();
    if (!next) return;
    setSuggestedTempo(parseTempoInput(next));
    setSuggestionSubmitState("idle");
  }, [prefillSuggestedTempo, parseTempoInput]);

  const toggle = useCallback(
    (next: BpmFeedbackVote) => {
      const resolved = vote === next ? null : next;
      setVote(resolved);
      setBpmFeedback(storageKey, resolved);
      if (apiPayload && session) {
        void submitBpmFeedback({
          ...apiPayload,
          suggestedArtist: suggestedArtist.trim() || null,
          suggestedSong: suggestedSong.trim() || null,
          suggestedTempo: hasValidSuggestedTempo ? suggestedTempo : null,
        });
      }
    },
    [
      apiPayload,
      session,
      storageKey,
      suggestedArtist,
      suggestedSong,
      suggestedTempo,
      vote,
      hasValidSuggestedTempo,
    ]
  );

  const submitSuggestion = useCallback(async () => {
    if (!apiPayload || !session) return;
    if (!hasValidSuggestedTempo || suggestedTempo == null) return;
    const hasArtistOrSong =
      Boolean(suggestedArtist.trim()) || Boolean(suggestedSong.trim());
    if (variant === "parsedMatch" && !hasArtistOrSong) return;
    const tempoStr = String(suggestedTempo);
    setSuggestionSubmitState("sending");
    const result = await submitBpmFeedback({
      ...apiPayload,
      ...(variant === "noApiMatch"
        ? {
            calculatedBpm: tempoStr,
            suggestedTempo: null,
          }
        : {
            suggestedTempo: suggestedTempo,
          }),
      suggestedArtist: suggestedArtist.trim() || null,
      suggestedSong: suggestedSong.trim() || null,
    });
    setSuggestionSubmitState(result.ok ? "sent" : "error");
  }, [
    apiPayload,
    suggestedArtist,
    suggestedSong,
    suggestedTempo,
    variant,
    session,
  ]);

  if (!visible) return null;

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
          Sign in with Google to send BPM feedback, suggestions, or measured
          tempos.
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

  if (variant === "noApiMatch") {
    return (
      <div className={`flex flex-col items-end gap-1 mt-1 ${className}`}>
        <div className="w-full min-w-[200px] max-w-[260px] rounded border border-gray-200 dark:border-gray-700 p-2 text-left">
          <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-400">
            No BPM from lookup — submit your measured tempo (e.g. from Tap BPM).
          </p>
          <input
            type="number"
            inputMode="numeric"
            value={suggestedTempoText}
            onChange={(e) => setSuggestedTempo(parseTempoInput(e.target.value))}
            placeholder="Measured BPM"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => void submitSuggestion()}
            disabled={
              !apiPayload ||
              !hasValidSuggestedTempo ||
              suggestionSubmitState === "sending"
            }
            className="mt-1 rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-[10px] font-medium disabled:opacity-50"
          >
            {suggestionSubmitState === "sending" ? "Sending…" : "Submit measured BPM"}
          </button>
          {suggestionSubmitState === "sent" ? (
            <p className="mt-1 text-[10px] text-green-600 dark:text-green-400">
              Sent.
            </p>
          ) : null}
          {suggestionSubmitState === "error" ? (
            <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">
              Could not send. Try again.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-end gap-1 mt-1 ${className}`}>
      <div
        className="flex items-center justify-end gap-0.5"
        role="group"
        aria-label="Is this BPM correct for this track?"
      >
        <button
          type="button"
          title="BPM looks correct"
          aria-pressed={vote === "up"}
          onClick={() => toggle("up")}
          className={`rounded px-1 py-0.5 text-base leading-none hover:bg-gray-100 dark:hover:bg-gray-700 ${
            vote === "up" ? "ring-1 ring-green-500/60 bg-green-50 dark:bg-green-900/20" : ""
          }`}
        >
          <LuThumbsUp className="w-4 h-4" />
        </button>
        <button
          type="button"
          title="BPM looks wrong"
          aria-pressed={vote === "down"}
          onClick={() => toggle("down")}
          className={`rounded px-1 py-0.5 text-base leading-none hover:bg-gray-100 dark:hover:bg-gray-700 ${
            vote === "down" ? "ring-1 ring-red-500/60 bg-red-50 dark:bg-red-900/20" : ""
          }`}
        >
          <LuThumbsDown className="w-4 h-4" />
        </button>
      </div>
      {vote === "down" ? (
        <div className="w-full min-w-[200px] max-w-[260px] rounded border border-gray-200 dark:border-gray-700 p-2 text-left">
          <p className="mb-1 text-[10px] text-gray-500 dark:text-gray-400">
            Suggest correct Artist / Song
          </p>
          <input
            type="text"
            value={suggestedArtist}
            onChange={(e) => setSuggestedArtist(e.target.value)}
            placeholder="Correct artist"
            className="mb-1 w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
          />
          <input
            type="text"
            value={suggestedSong}
            onChange={(e) => setSuggestedSong(e.target.value)}
            placeholder="Correct song"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
          />
          <input
            type="number"
            inputMode="numeric"
            value={suggestedTempoText}
            onChange={(e) => setSuggestedTempo(parseTempoInput(e.target.value))}
            placeholder="Correct tempo"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => void submitSuggestion()}
            disabled={
              !apiPayload ||
              !hasValidSuggestedTempo ||
              (!suggestedArtist.trim() && !suggestedSong.trim()) ||
              suggestionSubmitState === "sending"
            }
            className="mt-1 rounded bg-gray-100 dark:bg-gray-700 px-2 py-1 text-[10px] font-medium disabled:opacity-50"
          >
            {suggestionSubmitState === "sending" ? "Sending…" : "Send suggestion"}
          </button>
          {suggestionSubmitState === "sent" ? (
            <p className="mt-1 text-[10px] text-green-600 dark:text-green-400">
              Suggestion sent.
            </p>
          ) : null}
          {suggestionSubmitState === "error" ? (
            <p className="mt-1 text-[10px] text-red-600 dark:text-red-400">
              Could not send. Try again.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
