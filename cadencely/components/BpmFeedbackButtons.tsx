"use client";

import { useCallback, useEffect, useState } from "react";
import { LuThumbsUp, LuThumbsDown } from "react-icons/lu";
import type { BpmFeedbackPostBody } from "@/lib/bpm/bpmFeedbackApi";
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
  /** When set, each vote change is POSTed to `/api/feedback/bpm` (fire-and-forget). */
  apiPayload?: Omit<BpmFeedbackPostBody, "vote"> | null;
};

/**
 * Thumbs up/down for “this BPM / parsed match looks right or wrong”.
 */
export default function BpmFeedbackButtons({
  storageKey,
  visible,
  className = "",
  apiPayload = null,
}: Props) {
  const [vote, setVote] = useState<BpmFeedbackVote | null>(null);
  const [suggestedArtist, setSuggestedArtist] = useState("");
  const [suggestedSong, setSuggestedSong] = useState("");
  const [suggestedTempo, setSuggestedTempo] = useState("");
  const [suggestionSubmitState, setSuggestionSubmitState] = useState<
    "idle" | "sending" | "sent" | "error"
  >("idle");

  useEffect(() => {
    setVote(getBpmFeedback(storageKey));
    setSuggestedArtist("");
    setSuggestedSong("");
    setSuggestedTempo("");
    setSuggestionSubmitState("idle");
  }, [storageKey]);

  const toggle = useCallback(
    (next: BpmFeedbackVote) => {
      const resolved = vote === next ? null : next;
      setVote(resolved);
      setBpmFeedback(storageKey, resolved);
      if (apiPayload) {
        void submitBpmFeedback({
          ...apiPayload,
          vote: resolved,
          suggestedArtist: suggestedArtist.trim() || null,
          suggestedSong: suggestedSong.trim() || null,
        });
      }
    },
    [apiPayload, storageKey, suggestedArtist, suggestedSong, vote]
  );

  const submitSuggestion = useCallback(async () => {
    if (!apiPayload) return;
    if (!suggestedArtist.trim() && !suggestedSong.trim()) return;
    setSuggestionSubmitState("sending");
    const result = await submitBpmFeedback({
      ...apiPayload,
      vote,
      suggestedArtist: suggestedArtist.trim() || null,
      suggestedSong: suggestedSong.trim() || null,
    });
    setSuggestionSubmitState(result.ok ? "sent" : "error");
  }, [apiPayload, suggestedArtist, suggestedSong, vote]);

  if (!visible) return null;

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
            type="text"
            value={suggestedTempo}
            onChange={(e) => setSuggestedTempo(e.target.value)}
            placeholder="Correct tempo"
            className="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={() => void submitSuggestion()}
            disabled={
              !apiPayload ||
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
