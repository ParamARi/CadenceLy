"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Label, Modal, ModalBody, ModalHeader } from "flowbite-react";
import { HiRefresh } from "react-icons/hi";
import { useTapBpm } from "@/hooks/useTapBpm";
import {
  RUNNING_TEMPO_BPM_MARGIN,
  RUNNING_TEMPO_BPM_MARGIN_OPTIONS,
  bpmFilterRangeFromTarget,
} from "@/lib/bpm/runningTempoFilterRange";

export type RunningTempoModalProps = {
  show: boolean;
  onClose: () => void;
  /** Sets main search tempo min/max and should turn the filter on. */
  onApplyFilterRange: (min: number, max: number) => void;
};

export default function RunningTempoModal({
  show,
  onClose,
  onApplyFilterRange,
}: RunningTempoModalProps) {
  const [marginBpm, setMarginBpm] = useState<number>(RUNNING_TEMPO_BPM_MARGIN);

  const { bpm, tapCount, registerTap, reset } = useTapBpm({
    enabled: show,
  });

  useEffect(() => {
    if (!show) {
      reset();
      return;
    }
    setMarginBpm(RUNNING_TEMPO_BPM_MARGIN);
  }, [show, reset]);

  const range = useMemo(
    () =>
      bpm != null ? bpmFilterRangeFromTarget(bpm, marginBpm) : null,
    [bpm, marginBpm]
  );

  const apply = useCallback(() => {
    if (range == null) return;
    onApplyFilterRange(range.min, range.max);
    onClose();
  }, [range, onApplyFilterRange, onClose]);

  return (
    <Modal
      show={show}
      onClose={onClose}
      size="lg"
      dismissible
      theme={{
        content: {
          inner:
            "relative flex max-h-[90dvh] min-h-0 flex-col rounded-lg border border-gray-200 bg-white shadow dark:border-gray-700 dark:bg-gray-800",
        },
      }}
    >
      <ModalHeader className="shrink-0">
        <span className="block text-base font-semibold sm:text-lg">Running tempo</span>
        <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400 sm:text-sm">
          Tap in rhythm with your steps (cadence). Choose how wide the tempo
          filter should be on each side (±BPM), then apply.
        </span>
      </ModalHeader>
      <ModalBody className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain">
        <button
          type="button"
          onClick={registerTap}
          className="flex min-h-[min(44dvh,17.5rem)] w-full shrink-0 touch-manipulation select-none flex-col items-center justify-center gap-1 rounded-2xl border-[3px] border-emerald-500/80 bg-emerald-50/90 px-5 py-8 text-center text-emerald-950 transition hover:bg-emerald-100/90 active:scale-[0.99] active:bg-emerald-200/80 dark:border-emerald-500 dark:bg-emerald-950/50 dark:text-emerald-50 dark:hover:bg-emerald-900/60 dark:active:bg-emerald-900/80 sm:min-h-[10.5rem] sm:gap-0.5 sm:rounded-xl sm:border-2 sm:px-4 sm:py-6"
        >
          <span className="text-lg font-semibold leading-tight sm:text-xl">
            Tap here with your footfalls
          </span>
          <span className="mt-1 max-w-[20rem] text-sm opacity-80 sm:mt-0.5 sm:text-base">
            Or press Space (when not typing in a field)
          </span>
        </button>
        
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-lg border border-gray-200 bg-gray-50/90 p-3 dark:border-gray-600 dark:bg-gray-900/50">
          <Label
            htmlFor="running-tempo-margin"
            className="text-sm font-medium text-gray-900 dark:text-white"
          >
            Filter width (±BPM)
          </Label>
          <select
            id="running-tempo-margin"
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:ring-emerald-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-emerald-500 dark:focus:ring-emerald-500 sm:max-w-[11rem]"
            value={marginBpm}
            onChange={(e) => setMarginBpm(Number(e.target.value))}
          >
            {RUNNING_TEMPO_BPM_MARGIN_OPTIONS.map((m) => (
              <option key={m} value={m}>
                ±{m} BPM ({m * 2} BPM wide)
              </option>
            ))}
          </select>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-center gap-x-6 gap-y-2">
          <div className="text-center">
            <span className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Cadence (BPM)
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

        {range ? (
          <p className="text-center text-sm text-gray-700 dark:text-gray-300">
            Tempo filter will be{" "}
            <span className="font-mono font-semibold tabular-nums">
              {range.min} – {range.max}
            </span>{" "}
            BPM
          </p>
        ) : (
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Keep tapping — need a few steady beats to estimate cadence.
          </p>
        )}

        <div className="flex shrink-0 flex-col gap-3 border-t border-gray-200 pt-4 dark:border-gray-600 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-4">
          <Button
            color="success"
            onClick={apply}
            disabled={range == null}
            className="w-full sm:w-auto"
          >
            Apply to tempo filter
          </Button>
          <div className="flex w-full flex-wrap items-center justify-center gap-2 sm:w-auto">
            <Button
              color="dark"
              onClick={reset}
              disabled={tapCount === 0}
              aria-label="Reset taps"
              title="Reset taps"
              className="inline-flex !h-11 !w-11 min-h-11 min-w-11 items-center justify-center !p-0"
            >
              <HiRefresh className="h-6 w-6 shrink-0 text-white" aria-hidden />
            </Button>
            <Button color="gray" onClick={onClose} className="min-w-[5rem]">
              Cancel
            </Button>
          </div>
        </div>
      </ModalBody>
    </Modal>
  );
}
