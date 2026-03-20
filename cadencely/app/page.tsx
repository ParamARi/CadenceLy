"use client";

import { FormEvent, useMemo, useState, useCallback } from "react";
import { Button, TextInput, Alert, Spinner, Label } from "flowbite-react";
import { HiSearch, HiInformationCircle } from "react-icons/hi";
import type { ArtistSearchResult, SongSearchResult } from "@/lib/types";
import SongResultsTable from "./SongResultsTable";
import ArtistResultsTable from "./ArtistResultsTable";
import PlaylistResultsTable from "./PlaylistResultsTable";
import SearchSettings from "./SearchSettings";
import AppFooter from "@/components/AppFooter";
import { filterByBpmRange } from "@/lib/filters";
import { searchSongsApi, searchArtistsApi, searchPlaylistsApi } from "@/lib/search";

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


  const handleSearch = useMemo(
    () =>
      async (event: FormEvent) => {
        event.preventDefault();

        if (!query.trim()) return;

        try {
          setIsSearching(true);
          setError(null);
          console.log("searchType", searchType);
          if (searchType === "song") {
            const songs = await searchSongsApi(query.trim(), searchType);
            console.log("songs", songs);
            setSongResults(songs);
            setArtistResults([]);
            setPlaylistResults([]);
          } else if (searchType === "artist") {
            const artists = await searchArtistsApi(query.trim(), searchType);
            console.log(artists);
            setArtistResults(artists);
            setSongResults([]);
            setPlaylistResults([]);
          } else if (searchType === "playlist") {
            const playlists = await searchPlaylistsApi(query.trim());
            console.log(playlists);
            setPlaylistResults(playlists);
            setArtistResults([]);
            setSongResults([]);
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
        <h1 className="font-bitcount text-[7rem] sm:text-[8rem] font-extrabold text-center mb-10">
          Cadence.ly
        </h1>
        <SearchSettings 
          searchType={searchType} 
          minBPM={minBPM} 
          maxBPM={maxBPM} 
          onChange={setSearchType} 
          onBpmChange={handleBpmChange}
          onApplyFilter={handleApplyFilter}
          onClearFilter={handleClearFilter}
          isFilterApplied={isFilterApplied}
        />

        <form
          onSubmit={handleSearch}
          className="mt-6 mb-4 px-0 justify-center items-center"
        >
          <div className="flex w-8/9 self-center gap-2 px-4 sm:px-0">
            <TextInput
              id="search"
              type="text"
              icon={HiSearch}
              placeholder="Search songs, artists, albums..."
              required
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              sizing="lg"
            />
            <Button
              type="submit"
              disabled={isSearching}
              size="lg"
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
          {searchType === "artist" ? (
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
                Start by searching for an artist above.
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
              <p className="text-sm text-center text-base-content/70">
                Start by searching for a playlist above.
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
        </main>
      </div>
      <AppFooter />
    </div>
  );
}
