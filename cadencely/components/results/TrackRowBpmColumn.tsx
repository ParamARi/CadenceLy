"use client";

import type { ReactNode } from "react";
import { Badge, Spinner } from "flowbite-react";
import BpmFeedbackButtons from "@/components/BpmFeedbackButtons";
import type { BpmFeedbackClientPayload } from "@/lib/bpm/bpmFeedbackApi";

const wrongTempoLinkClassName =
  "cursor-pointer text-[11px] text-gray-400 underline decoration-gray-400/80 underline-offset-2 hover:text-gray-600 dark:text-gray-500 dark:decoration-gray-500/80 dark:hover:text-gray-300";

export type TrackRowBpmColumnProps = {
  loading: boolean;
  tempo: string | null;
  feedbackKey: string;
  feedbackApiPayload: BpmFeedbackClientPayload | null;
  feedbackOpen: boolean;
  setFeedbackOpen: (open: boolean) => void;
};

function hasBpm(tempo: string | null): boolean {
  return Boolean(tempo && tempo !== "-");
}

/** BPM status plus feedback block (stacked). */
export function TrackRowBpmColumn({
  loading,
  tempo,
  feedbackKey,
  feedbackApiPayload,
  feedbackOpen,
  setFeedbackOpen,
}: TrackRowBpmColumnProps) {

  return (
    <>
    {loading ? (
      <Spinner size="sm" />
    ) : (
      <div className="flex min-w-0 flex-col gap-2 text-xs">
        { hasBpm(tempo) ? (
          <div className="min-w-0">
            <Badge color="indigo" size="sm" className="inline-flex w-fit font-mono text-xs">
              {tempo} BPM
            </Badge>
            <p
              className={wrongTempoLinkClassName}
              onClick={() => setFeedbackOpen(!feedbackOpen)}
              title="Click to submit a correction"
            >
              wrong tempo?
            </p>
          </div>
        ) : (
          <div className="min-w-0">
            <p>
              Not Found
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 underline decoration-gray-400/80 underline-offset-2 hover:text-gray-600 dark:decoration-gray-500/80 dark:hover:text-gray-300"
            onClick={() => setFeedbackOpen(!feedbackOpen)}
            title="Click to submit a correction">
              Submit BPM?
            </p>
          </div>
        )}
        {feedbackOpen ? (
          <div className="border-t border-gray-100 pt-2 dark:border-gray-600/80">
            <BpmFeedbackButtons
              storageKey={feedbackKey}
              apiPayload={feedbackApiPayload}
            />
          </div>
        ) : null}
      </div>
    )}
    </>
  );
}
