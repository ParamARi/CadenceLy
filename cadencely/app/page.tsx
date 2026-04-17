"use client";

import { FormEvent, useCallback, useState } from "react";
import { Button, TextInput, Alert, Spinner, Label } from "flowbite-react";
import { HiSearch, HiInformationCircle } from "react-icons/hi";
import type { ArtistSearchResult, SongSearchResult } from "@/lib/types";
import SongResultsTable from "@/components/table/SongResultsTable";
import ArtistResultsTable from "@/components/table/ArtistResultsTable";
import PlaylistResultsTable from "@/components/table/PlaylistResultsTable";
import SearchSettings from "./SearchSettings";
import RunningTempoModal from "@/components/RunningTempoModal";
import UserYoutubeLibraryTable from "@/components/library/UserYoutubeLibraryTable";
import AppFooter from "@/components/AppFooter";
import UserAuthControls from "@/components/UserAuthControls";
import { filterByBpmRange } from "@/lib/filters";
import {
  searchSongsApi,
  searchArtistsApi,
  searchPlaylistsApi,
  searchAlbumByQueryApi,
} from "@/lib/search";

export default function Home() {
  const [query, setQuery] = useState("");
  const [songResults, setSongResults] = useState<SongSearchResult[]>([]);
  const [artistResults, setArtistResults] = useState<ArtistSearchResult[]>([]);
  const [playlistResults, setPlaylistResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"song" | "artist" | "album" | "playlist">(
    "song"
  );
  const [minBPM, setMinBPM] = useState<number>(0);
  const [maxBPM, setMaxBPM] = useState<number>(0);

  const [isFilterApplied, setIsFilterApplied] = useState(false);
  /** Playlist mode: last search returned no loadable playlist (vs. initial empty state). */
  const [playlistHadNoMatch, setPlaylistHadNoMatch] = useState(false);
  const [runningTempoOpen, setRunningTempoOpen] = useState(false);
  /** Browse signed-in user’s YouTube playlists (hides search UI). */
  const [libraryMode, setLibraryMode] = useState(false);

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
        } else if (searchType === "artist") {
          const artists = await searchArtistsApi(query.trim());
          setArtistResults(artists);
          setSongResults([]);
          setPlaylistResults([]);
        } else if (searchType === "playlist") {
          const playlists = await searchPlaylistsApi(query.trim());
          setPlaylistResults(playlists);
          setPlaylistHadNoMatch(playlists.length === 0);
          setArtistResults([]);
          setSongResults([]);
        } else if (searchType === "album") {
          const albumsAsArtistRows = await searchAlbumByQueryApi(query.trim());
          setArtistResults(albumsAsArtistRows);
          setSongResults([]);
          setPlaylistResults([]);
        } else {
          setArtistResults([]);
          setSongResults([]);
          setPlaylistResults([]);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Something went wrong while searching. Please try again.");
        setSongResults([]);
        setArtistResults([]);
        setPlaylistResults([]);
        setPlaylistHadNoMatch(false);
      } finally {
        setIsSearching(false);
      }
    },
    [query, searchType]
  );

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1 items-center">
        <main className="w-full justify-center p-10 rounded-lg shadow-md">
        <div className="mb-4 flex justify-end">
          <UserAuthControls />
        </div>
        <h1 className="font-bitcount text-[clamp(2rem,12vw+0.75rem,8rem)] font-extrabold text-center mb-6 sm:mb-10 leading-none tracking-tight">
          DJ-Cadence
        </h1>

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
                onClick={() => setLibraryMode(false)}
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
              onOpenRunningTempo={() => setRunningTempoOpen(true)}
              hideSearchTypeRadios
            />
            <h2 className="mb-3 mt-4 text-center text-xl font-semibold text-gray-900 dark:text-white sm:text-left">
              Your YouTube playlists
            </h2>
            <UserYoutubeLibraryTable
              minBPM={isFilterApplied ? minBPM : undefined}
              maxBPM={isFilterApplied ? maxBPM : undefined}
            />
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
          onOpenRunningTempo={() => setRunningTempoOpen(true)}
          onBrowseMyPlaylists={() => setLibraryMode(true)}
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
                <PlaylistResultsTable 
                  results={playlistResults} 
                  minBPM={isFilterApplied ? minBPM : undefined} 
                  maxBPM={isFilterApplied ? maxBPM : undefined} 
                />
              </div>
            ) : (
              <p className="text-sm text-center text-base-content/70 max-w-lg mx-auto">
                {playlistHadNoMatch
                  ? "No playlist could be loaded for that search. YouTube Music’s first matches are not always fetchable — try different keywords, or paste a full playlist URL (must include list=…)."
                  : "Start by searching for a playlist above."}
              </p>
            )
          ) : songResults.length > 0 ? (
            <div className="w-full">
              <SongResultsTable 
                results={songResults} 
                minBPM={isFilterApplied ? minBPM : undefined} 
                maxBPM={isFilterApplied ? maxBPM : undefined} 
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
