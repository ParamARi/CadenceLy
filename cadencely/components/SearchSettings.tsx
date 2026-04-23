"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Radio, Label, TextInput, Button } from "flowbite-react";

export type SearchSettingsProps = {
  searchType: "song" | "artist" | "album" | "playlist";
  minBPM: number;
  maxBPM: number;
  onChange: (value: "song" | "artist" | "album" | "playlist") => void;
  onBpmChange: (minOrMax: "min" | "max", tempo: number) => void;
  onApplyFilter: () => void;
  onClearFilter: () => void;
  isFilterApplied: boolean;
  /** Opens the running-cadence helper (tap tempo → tempo filter ±5 BPM). */
  onOpenRunningTempo?: () => void;
  /** Browse signed-in user’s YouTube playlists (requires OAuth token with YouTube scope). */
  onBrowseMyPlaylists?: () => void;
  /**
   * When true, hide Song/Artist/Album/Playlist radios (e.g. YouTube library view — BPM filter only).
   */
  hideSearchTypeRadios?: boolean;
};

export default function SearchSettings({
  searchType,
  minBPM,
  maxBPM,
  onChange,
  onBpmChange,
  onApplyFilter,
  onClearFilter,
  isFilterApplied,
  onOpenRunningTempo,
  onBrowseMyPlaylists,
  hideSearchTypeRadios = false,
}: SearchSettingsProps) {
  const { data: session, status } = useSession();
  const [youtubeAccess, setYoutubeAccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) {
      setYoutubeAccess(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/youtube/access");
        const data = (await res.json()) as { connected?: boolean };
        if (!cancelled) setYoutubeAccess(Boolean(data.connected));
      } catch {
        if (!cancelled) setYoutubeAccess(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, session?.user]);

  const showMyPlaylists =
    onBrowseMyPlaylists &&
    status === "authenticated" &&
    session?.user &&
    youtubeAccess === true;

  return (
    <div className="flex flex-col gap-4 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 mt-4">
      {showMyPlaylists ? (
        <div className="flex flex-wrap justify-center sm:justify-end">
          <Button
            type="button"
            color="light"
            size="sm"
            className="touch-manipulation"
            onClick={() => onBrowseMyPlaylists()}
          >
            My YouTube playlists
          </Button>
        </div>
      ) : null}
      <div
        className={`flex min-w-0 w-full flex-col items-center justify-center gap-6 ${
          hideSearchTypeRadios ? "" : "sm:flex-row"
        }`}
      >
        {!hideSearchTypeRadios ? (
          <div className="flex gap-6 max-sm:min-w-0 max-sm:w-full max-sm:max-w-full max-sm:flex-wrap max-sm:justify-center max-sm:gap-x-5 max-sm:gap-y-3">
            <div className="flex items-center gap-2">
              <Radio
                id="type-song"
                name="searchType"
                value="song"
                checked={searchType === "song"}
                onChange={() => onChange("song")}
              />
              <Label htmlFor="type-song" className="font-medium">
                Song
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Radio
                id="type-artist"
                name="searchType"
                value="artist"
                checked={searchType === "artist"}
                onChange={() => onChange("artist")}
              />
              <Label htmlFor="type-artist" className="font-medium">
                Artist
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Radio
                id="type-album"
                name="searchType"
                value="album"
                checked={searchType === "album"}
                onChange={() => onChange("album")}
              />
              <Label htmlFor="type-album" className="font-medium">
                Album
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <Radio
                id="type-playlist"
                name="searchType"
                value="playlist"
                checked={searchType === "playlist"}
                onChange={() => onChange("playlist")}
              />
              <Label htmlFor="type-playlist" className="font-medium">
                Playlist
              </Label>
            </div>
          </div>
        ) : null}

        {/* Tempo range */}
        <div
          className={`flex flex-wrap items-center gap-3 border-gray-200 dark:border-gray-700 w-full justify-center ${
            hideSearchTypeRadios
              ? "sm:justify-center pt-0 border-t-0 mt-0"
              : "sm:pl-6 sm:border-l sm:w-auto sm:justify-start pt-4 sm:pt-0 border-t sm:border-t-0 mt-2 sm:mt-0"
          }`}
        >
          <Label className="opacity-70">Going for a run?</Label>
          {onOpenRunningTempo ? (
            <Button
              size="xs"
              color="light"
              className="whitespace-nowrap"
              onClick={onOpenRunningTempo}
            >
              Calculate tempo…
            </Button>
          ) : null}
          <div className="flex items-center gap-2">
            <TextInput
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Min"
              sizing="sm"
              value={minBPM || ""}
              onChange={(e) => onBpmChange("min", parseInt(e.target.value) || 0)}
              className="w-20"
            />
            <span className="text-gray-500">–</span>
            <TextInput
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="Max"
              sizing="sm"
              value={maxBPM || ""}
              onChange={(e) => onBpmChange("max", parseInt(e.target.value) || 0)}
              className="w-20"
            />
          </div>

          <div className="flex items-center gap-2 ml-2">
            {!isFilterApplied ? (
              <Button size="sm" color="gray" onClick={onApplyFilter} disabled={!minBPM && !maxBPM}>
                Apply Filter
              </Button>
            ) : (
              <Button size="sm" color="failure" onClick={onClearFilter}>
                Clear Filter
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
