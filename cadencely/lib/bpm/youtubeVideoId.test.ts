import { describe, expect, it } from "vitest";
import { parseYoutubeVideoId } from "./youtubeVideoId";

describe("parseYoutubeVideoId", () => {
  it("accepts raw 11-char id", () => {
    expect(parseYoutubeVideoId("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });
  it("parses watch URL", () => {
    expect(
      parseYoutubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    ).toBe("dQw4w9WgXcQ");
  });
  it("parses youtu.be", () => {
    expect(parseYoutubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ"
    );
  });
  it("returns null for garbage", () => {
    expect(parseYoutubeVideoId("not a video")).toBe(null);
  });
});
