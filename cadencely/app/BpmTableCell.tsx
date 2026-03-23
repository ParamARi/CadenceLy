"use client";

import { useCallback, useState } from "react";
import type { SongSearchResult } from "@/lib/types";
import { estimateBpmFromFetchedAudio } from "@/lib/essentia/estimateBpm";
import { Badge, Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "flowbite-react";

type Props = {
  song: SongSearchResult;
};

/** Must match server validation in `app/api/bpm/youtube-audio/route.ts` */
const YT_VIDEO_ID = /^[\w-]{11}$/;

function isValidYoutubeVideoId(id: string | undefined | null): id is string {
  return typeof id === "string" && YT_VIDEO_ID.test(id.trim());
}

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

  const ytId = song.videoId?.trim() ?? "";
  const useDirectVideo = isValidYoutubeVideoId(ytId);

  const runYoutubeAnalysis = useCallback(async () => {
    setBusy(true);
    setError(null);
    setConfidence(null);
    setMatchedVideoId(null);
    try {
      let videoId = ytId;
      if (!useDirectVideo) {
        const res = await fetch("/api/bpm/resolve-video", {
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
            typeof data.error === "string"
              ? data.error
              : `Video lookup failed (${res.status})`
          );
        }
        if (typeof data.videoId !== "string" || !YT_VIDEO_ID.test(data.videoId)) {
          throw new Error("Invalid video id from search");
        }
        videoId = data.videoId;
      }

      const audioUrl = `/api/bpm/youtube-audio?videoId=${encodeURIComponent(videoId)}`;
      const { bpm, confidence: conf } = await estimateBpmFromFetchedAudio(
        audioUrl,
        { maxSeconds: 90 }
      );

      setLocalBpm(bpm);
      setConfidence(typeof conf === "number" ? conf : null);
      setMatchedVideoId(videoId);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Analysis failed. Try again later."
      );
    } finally {
      setBusy(false);
    }
  }, [song.title, song.artist?.name, useDirectVideo, ytId]);

  const refreshYoutubeCookies = useCallback(async () => {
    const raw = window.prompt(
      "Paste YouTube cookies JSON (EditThisCookie export array):"
    );
    if (!raw) return;
    try {
      const res = await fetch("/api/bpm/youtube-cookies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cookies: raw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          typeof data.error === "string"
            ? data.error
            : `Failed to update cookies (${res.status})`
        );
      }
      setError("YouTube cookies updated. Retry analysis.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update YouTube cookies."
      );
    }
  }, []);

  if (displayBpm !== null) {
    return (
      <div className="flex flex-col gap-1 items-start">
        <Badge color="indigo" size="sm" className="w-fit font-mono">
          {Math.round(displayBpm)} BPM
        </Badge>
        {localBpm !== null && (
          <span className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[200px]">
            Estimated in your browser (Essentia)
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
                {useDirectVideo ? "Source video" : "Matched video"}
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
            {useDirectVideo ? (
              <>
                Your browser will download a short WAV preview from this app (audio
                is extracted on the server), then run Essentia.js locally to estimate
                BPM. This may take 30–90 seconds. Use only for personal,
                non-infringing purposes.
              </>
            ) : (
              <>
                The server looks up a matching YouTube video; your browser downloads a
                short WAV preview and runs Essentia.js locally for BPM. This may take
                30–90 seconds. Use only for personal, non-infringing purposes.
              </>
            )}
          </p>
          {busy && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Spinner size="sm" />
              Loading audio &amp; analyzing in browser…
            </div>
          )}
          {error && (
            <div className="mt-3 space-y-2">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              {/403|Status code:\s*403/i.test(error) ? (
                <Button
                  size="xs"
                  color="light"
                  className="whitespace-nowrap"
                  onClick={refreshYoutubeCookies}
                  disabled={busy}
                >
                  Refresh YouTube Cookies
                </Button>
              ) : null}
            </div>
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
