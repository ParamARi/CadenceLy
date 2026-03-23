/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { GET } from "./route";

const TEST_VIDEO_ID = "VwcKwGS7OSQ";

const runLiveYoutube =
  process.env.SKIP_YOUTUBE_BPM_E2E !== "1" && process.env.CI !== "true";

describe("GET /api/bpm/youtube-audio", () => {
  it("returns 400 for invalid videoId", async () => {
    const req = new Request(
      `http://localhost/api/bpm/youtube-audio?videoId=bad`
    );
    const res = await GET(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Invalid or missing videoId/);
  });

  it("returns 400 when videoId is missing", async () => {
    const req = new Request("http://localhost/api/bpm/youtube-audio");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it.skipIf(!runLiveYoutube)(
    "returns WAV bytes (not a JSON error) for a real videoId",
    async () => {
      const req = new Request(
        `http://localhost/api/bpm/youtube-audio?videoId=${TEST_VIDEO_ID}`
      );
      const res = await GET(req);
      expect(res.status).toBe(200);
      expect(res.headers.get("Content-Type")).toContain("audio/wav");
      const buf = new Uint8Array(await res.arrayBuffer());
      expect(buf.length).toBeGreaterThan(1000);
      // RIFF….WAVE
      expect(String.fromCharCode(...buf.slice(0, 4))).toBe("RIFF");
      expect(String.fromCharCode(...buf.slice(8, 12))).toBe("WAVE");
    },
    180_000
  );
});
