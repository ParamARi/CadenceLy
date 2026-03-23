/**
 * @vitest-environment node
 */
import { describe, expect, it } from "vitest";
import { DELETE, GET, POST } from "./route";

describe("youtube cookies route", () => {
  it("returns status from GET", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(typeof json.source).toBe("string");
  });

  it("rejects invalid payload on POST", async () => {
    const req = new Request("http://localhost/api/bpm/youtube-cookies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cookies: { nope: true } }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("supports DELETE clear", async () => {
    const res = await DELETE();
    expect(res.status).toBe(200);
    const json = (await res.json()) as Record<string, unknown>;
    expect(json.ok).toBe(true);
  });
});
