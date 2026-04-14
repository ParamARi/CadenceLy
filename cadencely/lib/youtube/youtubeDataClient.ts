import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const YOUTUBE_DATA_API = "https://www.googleapis.com/youtube/v3";

export async function getGoogleAccessTokenFromCookies(
  req: NextRequest
): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const token = await getToken({ req, secret });
  const access = token?.accessToken;
  return typeof access === "string" && access.length > 0 ? access : null;
}

export async function youtubeDataGet<T>(
  endpoint: string,
  params: Record<string, string | undefined>,
  accessToken: string
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const url = new URL(`${YOUTUBE_DATA_API}/${endpoint.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: text.slice(0, 2000) };
  }
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 502, body: "Invalid JSON from YouTube Data API" };
  }
}
