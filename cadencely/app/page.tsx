"use client";

import { FormEvent, useMemo, useState, useCallback } from "react";
import { Button, TextInput, Alert, Spinner } from "flowbite-react";
import { HiSearch, HiInformationCircle } from "react-icons/hi";
import type { ArtistSearchResult, SongSearchResult } from "@/lib/types";
import SongResultsTable from "./SongResultsTable";
import ArtistResultsTable from "./ArtistResultsTable";
import SearchSettings from "./SearchSettings";
import { filterByBpmRange } from "@/lib/filters";
import { searchSongsApi, searchArtistsApi } from "@/lib/search";

export default function Home() {
  const [query, setQuery] = useState("");
  const [songResults, setSongResults] = useState<SongSearchResult[]>([]);
  const [artistResults, setArtistResults] = useState<ArtistSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"song" | "artist" | "album">(
    "song"
  );
  const [minBPM, setMinBPM] = useState<number>(0);
  const [maxBPM, setMaxBPM] = useState<number>(0);

  const handleBpmChange = useCallback( (minOrMax: string, value: number) => {
    if (minOrMax == "min") {
      setMinBPM(value)
    } else {
      setMaxBPM(value)
    }
    console.log(`BPM Set: ${minOrMax}, ${value} `);
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
            if (minBPM > 0) {
              const filteredSongs = filterByBpmRange(songs, minBPM, maxBPM);
              console.log("minBPM", minBPM);
              console.log("filteredSongs", filteredSongs);
              setSongResults(filteredSongs);
            } else {
              console.log("songs", songs);
              setSongResults(songs);
            }
            setArtistResults([]);
          } else if (searchType === "artist") {
            const artists = await searchArtistsApi(query.trim(), searchType);
            console.log(artists);
            setArtistResults(artists);
            setSongResults([]);
          } else {
            setArtistResults([]);
            setSongResults([]);
          }
        } catch (err) {
          console.error("Error fetching songs:", err);
          setError("Something went wrong while searching. Please try again.");
          setSongResults([]);
          setArtistResults([]);
        } finally {
          setIsSearching(false);
        }
      },
    [query, searchType]
  );

  return (
    <div className="min-h-screen flex items-center">
      <main className="w-full max-w-2xl p-6 rounded-lg shadow-md">
        <h1 className="font-bitcount text-[7rem] sm:text-[8rem] font-extrabold text-center mb-10">
          Cadence.ly
        </h1>
        <SearchSettings searchType={searchType} minBPM={0} maxBPM={0} onChange={setSearchType} onBpmChange={handleBpmChange}/>

        <form
          onSubmit={handleSearch}
          className="mt-6 mb-4 px-0"
        >
          <div className="flex w-full gap-2 px-4 sm:px-0">
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
                <ArtistResultsTable results={artistResults as ArtistSearchResult[]} />
              </div>
            ) : (
              <p className="text-sm text-center text-base-content/70">
                Start by searching for an artist above.
              </p>
            )
          ) : songResults.length > 0 ? (
            <div className="w-full">
              <SongResultsTable results={songResults} />
            </div>
          ) : (
            <p className="text-sm text-center text-base-content/70">
              Start by searching for a song above.
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
