"use client";

import { FormEvent, useMemo, useState } from "react";
import type { ArtistSearchResult, SongSearchResult } from "@/lib/types";
import SongResultsTable from "./SongResultsTable";
import ArtistResultsTable from "./ArtistResultsTable";
import SearchSettings from "./SearchSettings";

export default function Home() {
  const [query, setQuery] = useState("");
  const [songResults, setSongResults] = useState<SongSearchResult[]>([]);
  const [artistResults, setArtistResults] = useState<ArtistSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchType, setSearchType] = useState<"song" | "artist" | "album">(
    "song"
  );

  const handleSearch = useMemo(
    () =>
      async (event: FormEvent) => {
        event.preventDefault();

        if (!query.trim()) return;

        try {
          setIsSearching(true);
          setError(null);

          const response = await fetch(
            `/api/songs?songName=${encodeURIComponent(
              query.trim()
            )}&type=${searchType}`
          );

          if (!response.ok) {
            throw new Error("Failed to fetch song details");
          }

          const data = await response.json();
          if (searchType === "artist") {
            const artists: ArtistSearchResult[] = data.search ?? [];
            console.log(artists);
            setArtistResults(artists);
            setSongResults([]);
          } else {
            const songs: SongSearchResult[] = data.search ?? [];
            console.log(songs);
            setSongResults(songs);
            setArtistResults([]);
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
    <div className="bg-gray-50 min-h-screen flex items-center justify-center px-8 py-16">
      <main className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-10">
          Cadence.ly
        </h1>
        <SearchSettings value={searchType} onChange={setSearchType} />

        <form
          onSubmit={handleSearch}
          className="flex gap-2 items-center mt-4"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by song, artist, or album..."
            className="flex-1 h-11 rounded-full border border-gray-300 bg-gray-100 px-4 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="h-11 px-5 rounded-full bg-blue-600 text-white text-sm sm:text-base font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}

        <section className="mt-4">
          {searchType === "artist" ? (
            artistResults.length > 0 ? (
              <ArtistResultsTable results={artistResults} />
            ) : (
              <p className="text-sm text-center text-gray-500">
                Start by searching for an artist above.
              </p>
            )
          ) : songResults.length > 0 ? (
            <SongResultsTable results={songResults} />
          ) : (
            <p className="text-sm text-center text-gray-500">
              Start by searching for a song above.
              {songResults.length}
            </p>
          )}
        </section>
      </main>
    </div>
  );
}
