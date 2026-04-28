import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const SPOTIFY_API = "https://api.spotify.com/v1";

function useSecureAuthCookie(req: NextRequest): boolean {
  const authUrl = process.env.AUTH_URL;
  if (authUrl?.startsWith("https://")) return true;
  if (authUrl?.startsWith("http://")) return false;
  if (process.env.NODE_ENV === "production") return true;
  return req.nextUrl.protocol === "https:";
}

export async function getSpotifyAccessTokenFromCookies(
  req: NextRequest
): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const secureCookie = useSecureAuthCookie(req);
  let token: Awaited<ReturnType<typeof getToken>>;
  try {
    token = await getToken({ req, secret, secureCookie });
  } catch (e) {
    console.warn("[spotify] getToken failed", e);
    return null;
  }
  if (token?.spotifyError === "RefreshAccessTokenError") {
    return null;
  }
  const access = token?.spotifyAccessToken;
  return typeof access === "string" && access.length > 0 ? access : null;
}

export async function spotifyGet<T>(
  endpoint: string,
  params: Record<string, string | undefined>,
  accessToken: string
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const url = new URL(`${SPOTIFY_API}/${endpoint.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body: text.slice(0, 2000) };
  try {
    return { ok: true, data: JSON.parse(text) as T };
  } catch {
    return { ok: false, status: 502, body: "Invalid JSON from Spotify Web API" };
  }
}
