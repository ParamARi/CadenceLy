import { describe, expect, it } from "vitest";
import {
  buildParsedYoutubeTitleCandidates,
  buildParsedYoutubeTitleQueries,
} from "./parseYoutubeTitle";

describe("buildParsedYoutubeTitleQueries", () => {
  it("splits artist-song titles by separator", () => {
    const queries = buildParsedYoutubeTitleQueries(
      "Daft Punk - Harder Better Faster Stronger",
      "Daft Punk"
    );
    expect(queries[0]).toBe("Harder Better Faster Stronger");
  });

  it("handles alternate separators like ~ and |", () => {
    const q1 = buildParsedYoutubeTitleQueries("Artist ~ Song Name", "Artist");
    const q2 = buildParsedYoutubeTitleQueries("Artist | Song Name", "Artist");
    expect(q1[0]).toBe("Song Name");
    expect(q2[0]).toBe("Song Name");
  });

  it("removes bracketed chunks", () => {
    const queries = buildParsedYoutubeTitleQueries(
      "Song Name [Artist Name] (Official Video)",
      "Artist Name"
    );
    expect(queries).toContain("Song Name");
  });

  it("deduplicates candidates", () => {
    const queries = buildParsedYoutubeTitleQueries("Artist - Song - Song", "Artist");
    const lowered = queries.map((q) => q.toLowerCase());
    expect(new Set(lowered).size).toBe(lowered.length);
  });

  it("returns parsed artist/song metadata candidates", () => {
    const candidates = buildParsedYoutubeTitleCandidates(
      "Adele - Hello [Official Video]",
      "Adele"
    );
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates[0]?.parsedArtist).toBe("Adele");
    expect(candidates[0]?.parsedSong).toBe("Hello");
  });

  it("strips trailing remaster/mix before splitting for GetSong-style titles", () => {
    const queries = buildParsedYoutubeTitleQueries("Something (2019 Mix)", "The Beatles");
    expect(queries).toContain("Something");
  });

  it("preserves catalog parentheses when only trailing segment is edition metadata", () => {
    const queries = buildParsedYoutubeTitleQueries(
      "I Want You (She's So Heavy) (2019 Mix)",
      "The Beatles"
    );
    // Match catalog title after trailing "(2019 Mix)" is stripped (apostrophe may be ASCII or typographic in API data)
    expect(queries.some((q) => /So Heavy/i.test(q))).toBe(true);
    const candidates = buildParsedYoutubeTitleCandidates(
      "I Want You (She's So Heavy) (2019 Mix)",
      "The Beatles"
    );
    expect(
      candidates.some((c) => /So Heavy/i.test(c.parsedSong) || /So Heavy/i.test(c.query))
    ).toBe(true);
  });

  it("strips deluxe / anniversary parentheticals for query building", () => {
    const queries = buildParsedYoutubeTitleQueries(
      "Warning (25th Anniversary Deluxe Edition)",
      "Green Day"
    );
    expect(queries).toContain("Warning");
  });

  it("does not strip non-metadata trailing parens from query list", () => {
    const queries = buildParsedYoutubeTitleQueries("Rockin' Around (Christmas Tree)", "Brenda Lee");
    expect(queries.some((q) => q.includes("Christmas Tree"))).toBe(true);
  });
});
