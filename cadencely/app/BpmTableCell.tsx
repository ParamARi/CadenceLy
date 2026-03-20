"use client";

import { useCallback, useState } from "react";
import type { SongSearchResult } from "@/lib/types";
import { estimateBpmFromAudioFile } from "@/lib/essentia/estimateBpm";
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "flowbite-react";

type Props = {
  song: SongSearchResult;
};

export default function BpmTableCell({ song }: Props) {
  const [localBpm, setLocalBpm] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);

  const apiBpm = parseFloat(song.tempo);
  const hasApiBpm = !Number.isNaN(apiBpm);
  const displayBpm = localBpm ?? (hasApiBpm ? apiBpm : null);

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file) return;

      setBusy(true);
      setError(null);
      setConfidence(null);
      try {
        const result = await estimateBpmFromAudioFile(file);
        setLocalBpm(result.bpm);
        setConfidence(result.confidence);
        setModalOpen(false);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error ? err.message : "Analysis failed. Try another file."
        );
      } finally {
        setBusy(false);
      }
    },
    []
  );

  if (displayBpm !== null) {
    return (
      <div className="flex flex-col gap-1 items-start">
        <Badge color="indigo" size="sm" className="w-fit font-mono">
          {Math.round(displayBpm)} BPM
        </Badge>
        {localBpm !== null && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400">
            Estimated (Essentia)
            {confidence != null && confidence > 0 ? (
              <span className="ml-1 opacity-80">
                · conf. {confidence.toFixed(2)}
              </span>
            ) : null}
          </span>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1 items-start min-w-[7rem]">
        <span className="opacity-50 text-xs italic">Not Found</span>
        <Button
          size="xs"
          color="light"
          className="whitespace-nowrap"
          onClick={() => {
            setError(null);
            setModalOpen(true);
          }}
        >
          Measure from file…
        </Button>
      </div>

      <Modal show={modalOpen} onClose={() => !busy && setModalOpen(false)} size="md">
        <ModalHeader>Estimate BPM · {song.title}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            Choose a local audio file of this track. Analysis runs in your browser
            (first ~90s). Use a file you have the right to use.
          </p>
          <label className="flex flex-col gap-2">
            <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
              Audio file
            </span>
            <input
              type="file"
              accept="audio/*"
              disabled={busy}
              onChange={onFile}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-gray-100 dark:file:bg-gray-700"
            />
          </label>
          {busy && (
            <div className="flex items-center gap-2 mt-4 text-sm text-gray-600 dark:text-gray-300">
              <Spinner size="sm" />
              Analyzing… (first load may take a moment)
            </div>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="gray" onClick={() => setModalOpen(false)} disabled={busy}>
            Cancel
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
