"use client";

import { FormEvent, useMemo, useState, useCallback } from "react";
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
          className="mt-6 mb-4 px-4 md:px-10"
        >
          <div className="mx-auto flex w-[85%] max-w-xl py-6 md:py-10 items-center gap-4">
            <div className="flex-1 rounded-full border shadow-sm transition-shadow hover:shadow-md focus-within:shadow-md focus-within:ring-2 focus-within:ring-[var(--border-color)] [background-color:var(--input-bg)] [border-color:var(--input-border)]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by song, artist, or album..."
                className="w-full bg-transparent px-5 py-10 text-md md:text-base focus:outline-none text-inherit"
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="shrink-0 rounded-full border px-5 py-3 text-sm sm:text-base font-medium shadow-sm disabled:opacity-60 disabled:cursor-not-allowed transition [background-color:var(--bg-secondary)] [color:var(--text-primary)] [border-color:var(--border-color)] hover:brightness-95 active:brightness-90"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}

        <section className="mt-4">
          {searchType === "artist" ? (
            artistResults.length > 0 ? (
              <ArtistResultsTable results={artistResults as ArtistSearchResult[]} />
            ) : (
              <p className="text-sm text-center [color:var(--text-secondary)]">
                Start by searching for an artist above.
              </p>
            )
          ) : songResults.length > 0 ? (
            <SongResultsTable results={songResults} />
          ) : (
            <p className="text-sm text-center [color:var(--text-secondary)]">
              Start by searching for a song above.
              {songResults.length}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
