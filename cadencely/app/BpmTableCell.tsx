"use client";

import { useCallback, useState } from "react";
import type { SongSearchResult } from "@/lib/types";
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
  const [matchedVideoId, setMatchedVideoId] = useState<string | null>(null);

  const apiBpm = parseFloat(song.tempo);
  const hasApiBpm = !Number.isNaN(apiBpm);
  const displayBpm = localBpm ?? (hasApiBpm ? apiBpm : null);

  const runYoutubeAnalysis = useCallback(async () => {
    setBusy(true);
    setError(null);
    setConfidence(null);
    setMatchedVideoId(null);
    try {
      const res = await fetch("/api/bpm/youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: song.title,
          artist: song.artist?.name ?? "",
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Request failed"
        );
      }
      if (typeof data.bpm !== "number" || !Number.isFinite(data.bpm)) {
        throw new Error("Invalid BPM response from server");
      }
      setLocalBpm(data.bpm);
      setConfidence(
        typeof data.confidence === "number" ? data.confidence : null
      );
      if (typeof data.videoId === "string") {
        setMatchedVideoId(data.videoId);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Analysis failed. Try again later."
      );
    } finally {
      setBusy(false);
    }
  }, [song.title, song.artist?.name]);

  if (displayBpm !== null) {
    return (
      <div className="flex flex-col gap-1 items-start">
        <Badge color="indigo" size="sm" className="w-fit font-mono">
          {Math.round(displayBpm)} BPM
        </Badge>
        {localBpm !== null && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[200px]">
            Estimated (Essentia, YouTube)
            {confidence != null && confidence > 0 ? (
              <span className="ml-1 opacity-80">
                · conf. {confidence.toFixed(2)}
              </span>
            ) : null}
            {matchedVideoId ? (
              <a
                href={`https://www.youtube.com/watch?v=${matchedVideoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-0.5 underline text-indigo-600 dark:text-indigo-400"
              >
                Matched video
              </a>
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
          Analyze via YouTube…
        </Button>
      </div>

      <Modal show={modalOpen} onClose={() => !busy && setModalOpen(false)} size="md">
        <ModalHeader>Estimate BPM · {song.title}</ModalHeader>
        <ModalBody>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            The server will search YouTube for this track, stream a short portion of
            the top match, and estimate BPM with Essentia. This may take 30–90
            seconds. YouTube&apos;s terms may restrict downloading; use only for
            personal/non-infringing purposes.
          </p>
          {busy && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Spinner size="sm" />
              Downloading &amp; analyzing audio…
            </div>
          )}
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </ModalBody>
        <ModalFooter className="justify-between gap-2 flex-wrap">
          <Button color="gray" onClick={() => setModalOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={runYoutubeAnalysis} disabled={busy}>
            {busy ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Working…
              </>
            ) : (
              "Start analysis"
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
}
