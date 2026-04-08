import { describe, expect, it } from "vitest";
import {
  buildBpmFeedbackUpstreamJson,
  parseBpmFeedbackPostBody,
  parseBpmInRange,
} from "./bpmFeedbackApi";

describe("parseBpmInRange", () => {
  it("accepts (0, 400]", () => {
    expect(parseBpmInRange("120")).toBe(120);
    expect(parseBpmInRange(400)).toBe(400);
    expect(parseBpmInRange("128.5")).toBe(128.5);
  });
  it("rejects outside range and non-numeric", () => {
    expect(parseBpmInRange("0")).toBeNull();
    expect(parseBpmInRange(0)).toBeNull();
    expect(parseBpmInRange(401)).toBeNull();
    expect(parseBpmInRange("not found")).toBeNull();
    expect(parseBpmInRange("")).toBeNull();
  });
});

describe("buildBpmFeedbackUpstreamJson", () => {
  it("coalesces parsed song/artist and omits reference when equal to calculated", () => {
    const upstream = buildBpmFeedbackUpstreamJson(
      {
        rawTitle: "t",
        videoId: "vid",
        calculatedBpm: 100,
        referenceBpm: 100,
        parsedSong: "p",
        parsedArtist: "pa",
        matchedSong: "m",
        matchedArtist: "ma",
        suggestedSong: "s",
        suggestedArtist: "sa",
        artistName: "an",
      },
      "user-1"
    );
    expect(upstream).toEqual({
      user_id: "user-1",
      raw_title: "t",
      video_id: "vid",
      calculated_bpm: 100,
      parsed_song: "m",
      usr_provided_song: "s",
      parsed_artist: "ma",
      usr_provided_artist: "sa",
      artist_name: "an",
    });
    expect(upstream.reference_bpm).toBeUndefined();
  });
});

describe("parseBpmFeedbackPostBody", () => {
  it("accepts minimal valid body", () => {
    const r = parseBpmFeedbackPostBody({
      rawTitle: "Artist - Song",
      videoId: "abc123",
      calculatedBpm: "120",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.body.calculatedBpm).toBe(120);
      expect(r.body.referenceBpm).toBeNull();
    }
  });

  it("uses suggestedTempo when calculatedBpm empty", () => {
    const r = parseBpmFeedbackPostBody({
      rawTitle: "x",
      videoId: "v",
      calculatedBpm: "",
      suggestedTempo: "99",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.body.calculatedBpm).toBe(99);
  });

  it("requires videoId", () => {
    const r = parseBpmFeedbackPostBody({
      rawTitle: "x",
      calculatedBpm: "100",
    });
    expect(r.ok).toBe(false);
  });

  it("defaults referenceBpm when omitted", () => {
    const r = parseBpmFeedbackPostBody({
      rawTitle: "x",
      videoId: "v",
      calculatedBpm: "88",
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.body.referenceBpm).toBeNull();
  });

  it("rejects invalid referenceBpm when set", () => {
    const r = parseBpmFeedbackPostBody({
      rawTitle: "x",
      videoId: "v",
      calculatedBpm: "88",
      referenceBpm: "500",
    });
    expect(r.ok).toBe(false);
  });
});
