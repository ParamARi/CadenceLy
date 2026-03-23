/**
 * @vitest-environment node
 */
import { describe, it, expect } from "vitest";
import { POST } from "./route";

describe("POST /api/bpm/resolve-video", () => {
  it("returns 400 when title is missing", async () => {
    const req = new Request("http://localhost/api/bpm/resolve-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ artist: "Someone" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/title is required/i);
  });
});
