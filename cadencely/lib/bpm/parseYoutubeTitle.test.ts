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
});
