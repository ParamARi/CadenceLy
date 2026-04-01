import { describe, expect, it } from "vitest";
import { parseBpmFeedbackPostBody } from "./bpmFeedbackApi";

describe("parseBpmFeedbackPostBody", () => {
  it("accepts a minimal valid body", () => {
    const r = parseBpmFeedbackPostBody({
      vote: "up",
      source: "playlist",
      rowIndex: 0,
      rawTitle: "Artist - Song (Official Video)",
      reportedTempo: "120",
      usedParsedFallback: true,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.body.vote).toBe("up");
      expect(r.body.source).toBe("playlist");
      expect(r.body.rowIndex).toBe(0);
    }
  });

  it("accepts vote null (cleared)", () => {
    const r = parseBpmFeedbackPostBody({
      vote: null,
      source: "artist",
      rowIndex: 2,
      rawTitle: "Track",
      reportedTempo: "90",
      usedParsedFallback: false,
      artistName: "Someone",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.body.vote).toBe(null);
  });

  it("accepts optional suggested artist/song", () => {
    const r = parseBpmFeedbackPostBody({
      vote: "down",
      source: "artist",
      rowIndex: 1,
      rawTitle: "Live rip title",
      reportedTempo: "100",
      usedParsedFallback: true,
      suggestedArtist: "Correct Artist",
      suggestedSong: "Correct Song",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.body.suggestedArtist).toBe("Correct Artist");
      expect(r.body.suggestedSong).toBe("Correct Song");
    }
  });

  it("rejects invalid vote", () => {
    const r = parseBpmFeedbackPostBody({
      vote: "maybe",
      source: "playlist",
      rowIndex: 0,
      rawTitle: "x",
      reportedTempo: "1",
      usedParsedFallback: true,
    });
    expect(r.ok).toBe(false);
  });
});
