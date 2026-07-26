"use client";

import { FormEvent, useCallback, useState } from "react";
import { Button, TextInput, Alert, Spinner, Label } from "flowbite-react";
import { HiSearch, HiInformationCircle } from "react-icons/hi";
import type { ArtistSearchResult, SongSearchResult } from "@/lib/types";
import SongResultsTable from "@/components/table/SongResultsTable";
import ArtistResultsTable from "@/components/table/ArtistResultsTable";
import PlaylistResultsTable from "@/components/table/PlaylistResultsTable";
import PlaylistCandidateList from "@/components/table/PlaylistCandidateList";
import SearchSettings from "@/components/SearchSettings";
import RunningTempoModal from "@/components/RunningTempoModal";
import UserYoutubeLibraryTable from "@/components/library/UserYoutubeLibraryTable";
import UserSpotifyLibraryTable from "@/components/library/UserSpotifyLibraryTable";
import AppFooter from "@/components/AppFooter";
import UserAuthControls from "@/components/UserAuthControls";
import { BuyMeACoffee } from "@/components/BuyMeACoffee";
import {
  searchSongsApi,
  searchArtistsApi,
  searchPlaylistsApi,
  searchAlbumByQueryApi,
  fetchPlaylistByIdApi,
  type PlaylistCandidate,
} from "@/lib/search";

export default function Home() {
  const [query, setQuery] = useState("");
  const [songResults, setSongResults] = useState<SongSearchResult[]>([]);
  const [artistResults, setArtistResults] = useState<ArtistSearchResult[]>([]);
  const [playlistResults, setPlaylistResults] = useState<any[]>([]);
  /** Playlist search candidates awaiting user choice (chooser list). */
  const [playlistCandidates, setPlaylistCandidates] = useState<PlaylistCandidate[]>([]);
  /** Candidate currently being fetched after a pick. */
  const [loadingPlaylistId, setLoadingPlaylistId] = useState<string | null>(null);
  /** Per-candidate fetch errors (e.g. private/unavailable playlists). */
  const [candidateErrors, setCandidateErrors] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"song" | "artist" | "album" | "playlist">(
    "song"
  );
  const [minBPM, setMinBPM] = useState<number>(0);
  const [maxBPM, setMaxBPM] = useState<number>(0);

  const [isFilterApplied, setIsFilterApplied] = useState(false);
  const [includeBpmMultiples, setIncludeBpmMultiples] = useState(false);
  /** Playlist mode: last search returned no loadable playlist (vs. initial empty state). */
  const [playlistHadNoMatch, setPlaylistHadNoMatch] = useState(false);
  const [runningTempoOpen, setRunningTempoOpen] = useState(false);
  /** Browse signed-in user’s playlists (hides search UI). */
  const [libraryMode, setLibraryMode] = useState<"youtube" | "spotify" | null>(null);

  const handleApplyFilter = useCallback(() => {
    setIsFilterApplied(true);
  }, []);

  const handleClearFilter = useCallback(() => {
    setIsFilterApplied(false);
    setMinBPM(0);
    setMaxBPM(0);
  }, []);

  const handleBpmChange = useCallback( (minOrMax: string, value: number) => {
    if (minOrMax == "min") {
      setMinBPM(value)
    } else {
      setMaxBPM(value)
    }
    // If user changes the inputs while filter is applied, maybe we un-apply it so they have to hit apply again, 
    // or just leave it applied and let it dynamically update. Let's leave it dynamically updating if applied.
  }, []);

  const handleApplyRunningTempoFilter = useCallback((min: number, max: number) => {
    setMinBPM(min);
    setMaxBPM(max);
    setIsFilterApplied(true);
  }, []);


  /** Fetch a chosen candidate's tracks; on failure show an inline row error. */
  const loadPlaylistById = useCallback(async (candidate: PlaylistCandidate) => {
    setLoadingPlaylistId(candidate.playlistId);
    setCandidateErrors((prev) => {
      if (!(candidate.playlistId in prev)) return prev;
      const next = { ...prev };
      delete next[candidate.playlistId];
      return next;
    });
    try {
      const playlist = await fetchPlaylistByIdApi(candidate.playlistId);
      if (!playlist) {
        throw new Error("Playlist not found");
      }
      setPlaylistResults([playlist]);
    } catch (err) {
      console.error("Error loading playlist:", err);
      setCandidateErrors((prev) => ({
        ...prev,
        [candidate.playlistId]:
          "Couldn’t load this playlist — it may be private or unavailable. Try another result.",
      }));
    } finally {
      setLoadingPlaylistId(null);
    }
  }, []);

  const handleSearch = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!query.trim()) return;

      try {
        setIsSearching(true);
        setError(null);
        setPlaylistHadNoMatch(false);
        if (searchType === "song") {
          const songs = await searchSongsApi(query.trim(), searchType);
          setSongResults(songs);
          setArtistResults([]);
          setPlaylistResults([]);
          setPlaylistCandidates([]);
        } else if (searchType === "artist") {
          const artists = await searchArtistsApi(query.trim());
          setArtistResults(artists);
          setSongResults([]);
          setPlaylistResults([]);
          setPlaylistCandidates([]);
        } else if (searchType === "playlist") {
          const candidates = await searchPlaylistsApi(query.trim());
          setPlaylistCandidates(candidates);
          setCandidateErrors({});
          setPlaylistResults([]);
          setPlaylistHadNoMatch(candidates.length === 0);
          setArtistResults([]);
          setSongResults([]);
          if (candidates.length === 1) {
            // Single match (or pasted URL) — skip the chooser and load tracks.
            await loadPlaylistById(candidates[0]);
          }
        } else if (searchType === "album") {
          const albumsAsArtistRows = await searchAlbumByQueryApi(query.trim());
          setArtistResults(albumsAsArtistRows);
          setSongResults([]);
          setPlaylistResults([]);
          setPlaylistCandidates([]);
        } else {
          setArtistResults([]);
          setSongResults([]);
          setPlaylistResults([]);
          setPlaylistCandidates([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Something went wrong while searching. Please try again.");
        setSongResults([]);
        setArtistResults([]);
        setPlaylistResults([]);
        setPlaylistCandidates([]);
        setPlaylistHadNoMatch(false);
      } finally {
        setIsSearching(false);
      }
    },
    [query, searchType, loadPlaylistById]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 items-center">
        <main className="w-full justify-center p-10 rounded-lg shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <BuyMeACoffee variant="header" />
          <UserAuthControls />
        </div>
        <h1 className="font-bitcount text-[clamp(2rem,12vw+0.75rem,8rem)] font-extrabold text-center mb-6 sm:mb-10 leading-none tracking-tight">
          DJ-Cadence
        </h1>

        <p className="mx-auto mb-6 max-w-xl px-4 text-center text-pretty font-sans text-base font-medium leading-relaxed text-gray-600 dark:text-gray-400 sm:mb-8 sm:max-w-2xl sm:text-lg">
          Sort your music by BPM and find the perfect tracks for your runs and workouts.
        </p>

        <RunningTempoModal
          show={runningTempoOpen}
          onClose={() => setRunningTempoOpen(false)}
          onApplyFilterRange={handleApplyRunningTempoFilter}
        />

        {libraryMode ? (
          <>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <Button
                type="button"
                color="gray"
                size="sm"
                className="touch-manipulation"
                onClick={() => setLibraryMode(null)}
              >
                ← Back to search
              </Button>
            </div>
            <SearchSettings
              searchType={searchType}
              minBPM={minBPM}
              maxBPM={maxBPM}
              onChange={setSearchType}
              onBpmChange={handleBpmChange}
              onApplyFilter={handleApplyFilter}
              onClearFilter={handleClearFilter}
              isFilterApplied={isFilterApplied}
              includeBpmMultiples={includeBpmMultiples}
              onToggleBpmMultiples={setIncludeBpmMultiples}
              onOpenRunningTempo={() => setRunningTempoOpen(true)}
              hideSearchTypeRadios
            />
            <h2 className="mb-3 mt-4 text-center text-xl font-semibold text-gray-900 dark:text-white sm:text-left">
              {libraryMode === "youtube" ? "Your YouTube playlists" : "Your Spotify playlists"}
            </h2>
            {libraryMode === "youtube" ? (
              <UserYoutubeLibraryTable
                minBPM={isFilterApplied ? minBPM : undefined}
                maxBPM={isFilterApplied ? maxBPM : undefined}
                includeBpmMultiples={includeBpmMultiples}
              />
            ) : (
              <UserSpotifyLibraryTable
                minBPM={isFilterApplied ? minBPM : undefined}
                maxBPM={isFilterApplied ? maxBPM : undefined}
                includeBpmMultiples={includeBpmMultiples}
              />
            )}
          </>
        ) : (
          <>
        <SearchSettings 
          searchType={searchType} 
          minBPM={minBPM} 
          maxBPM={maxBPM} 
          onChange={setSearchType} 
          onBpmChange={handleBpmChange}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          isFilterApplied={isFilterApplied}
          includeBpmMultiples={includeBpmMultiples}
          onToggleBpmMultiples={setIncludeBpmMultiples}
          onOpenRunningTempo={() => setRunningTempoOpen(true)}
          onBrowseMyPlaylists={() => setLibraryMode("youtube")}
          onBrowseMySpotifyPlaylists={() => setLibraryMode("spotify")}
        />

        <form
          onSubmit={handleSearch}
          className="mt-6 mb-4 justify-center items-center px-0"
        >
          <div className="flex w-full max-sm:flex-col max-sm:gap-3 self-center gap-2 px-4 sm:px-0">
            <TextInput
              id="search"
              type="text"
              icon={HiSearch}
              placeholder="Search songs, artists, albums..."
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-0 flex-1 max-sm:[&_input]:min-h-11 max-sm:[&_input]:text-base touch-manipulation"
              sizing="lg"
            />
            <Button
              type="submit"
              disabled={isSearching}
              size="lg"
              className="max-sm:min-h-11 max-sm:w-full max-sm:justify-center shrink-0 touch-manipulation"
            >
              {isSearching ? <Spinner size="sm" light={true} className="mr-2" /> : null}
              {isSearching ? "Searching..." : "Search"}
            </Button>
          </div>
        </form>

        {error && (
          <Alert color="failure" icon={HiInformationCircle} className="mt-4 shadow-sm">
            <span>{error}</span>
          </Alert>
        )}

        <section className="mt-4">
          {searchType === "artist" || searchType === "album" ? (
            artistResults.length > 0 ? (
              <div className="w-full">
                <ArtistResultsTable 
                  results={artistResults as ArtistSearchResult[]} 
                  minBPM={isFilterApplied ? minBPM : undefined} 
                  maxBPM={isFilterApplied ? maxBPM : undefined} 
                  includeBpmMultiples={includeBpmMultiples}
                />
              </div>
            ) : (
              <p className="text-sm text-center text-base-content/70">
                {searchType === "album"
                  ? "Start by searching for an album above."
                  : "Start by searching for an artist above."}
              </p>
            )
          ) : searchType === "playlist" ? (
            playlistResults.length > 0 ? (
              <div className="w-full">
                {playlistCandidates.length > 1 ? (
                  <div className="mb-3">
                    <Button
                      type="button"
                      color="gray"
                      size="sm"
                      className="touch-manipulation"
                      onClick={() => setPlaylistResults([])}
                    >
                      ← Back to results
                    </Button>
                  </div>
                ) : null}
                <PlaylistResultsTable 
                  results={playlistResults} 
                  minBPM={isFilterApplied ? minBPM : undefined} 
                  maxBPM={isFilterApplied ? maxBPM : undefined} 
                  includeBpmMultiples={includeBpmMultiples}
                />
              </div>
            ) : playlistCandidates.length > 0 ? (
              <div className="w-full">
                <p className="mb-2 text-center text-sm text-gray-600 dark:text-gray-400 sm:text-left">
                  {playlistCandidates.length === 1
                    ? "1 playlist found — pick it to load its tracks."
                    : `${playlistCandidates.length} playlists found — pick one to load its tracks.`}
                </p>
                <PlaylistCandidateList
                  candidates={playlistCandidates}
                  loadingPlaylistId={loadingPlaylistId}
                  errorsById={candidateErrors}
                  onSelect={loadPlaylistById}
                />
              </div>
            ) : (
              <p className="text-sm text-center text-base-content/70 max-w-lg mx-auto">
                {playlistHadNoMatch
                  ? "No playlists found for that search. Try different keywords, or paste a full playlist URL (must include list=…)."
                  : "Start by searching for a playlist above."}
              </p>
            )
          ) : songResults.length > 0 ? (
            <div className="w-full">
              <SongResultsTable 
                results={songResults} 
                minBPM={isFilterApplied ? minBPM : undefined} 
                maxBPM={isFilterApplied ? maxBPM : undefined} 
                includeBpmMultiples={includeBpmMultiples}
              />
            </div>
          ) : (
            <p className="text-sm text-center text-base-content/70">
              Start by searching for a song above.
            </p>
          )}
        </section>
          </>
        )}
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
