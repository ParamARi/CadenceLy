import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

const YOUTUBE_DATA_API = "https://www.googleapis.com/youtube/v3";

/**
 * Auth.js uses `__Secure-*` session cookies on HTTPS. `getToken` must set
 * `secureCookie: true` to read them; in dev, NODE_ENV is still "development"
 * so the default would look for the wrong cookie (e.g. local HTTPS + next dev).
 */
function useSecureAuthCookie(req: NextRequest): boolean {
  const authUrl = process.env.AUTH_URL;
  if (authUrl?.startsWith("https://")) return true;
  if (authUrl?.startsWith("http://")) return false;
  if (process.env.NODE_ENV === "production") return true;
  return req.nextUrl.protocol === "https:";
}

export async function getGoogleAccessTokenFromCookies(
  req: NextRequest
): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) return null;
  const secureCookie = useSecureAuthCookie(req);
  let token: Awaited<ReturnType<typeof getToken>>;
  try {
    token = await getToken({ req, secret, secureCookie });
  } catch (e) {
    console.warn("[youtube] getToken failed", e);
    return null;
  }
  if (token?.error === "RefreshAccessTokenError") {
    return null;
  }
  if (token?.googleError === "RefreshAccessTokenError") {
    return null;
  }
  const access = token?.googleAccessToken ?? token?.accessToken;
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

export async function youtubeDataPost<T>(
  endpoint: string,
  params: Record<string, string | undefined>,
  accessToken: string,
  body: unknown
): Promise<{ ok: true; data: T } | { ok: false; status: number; body: string }> {
  const url = new URL(`${YOUTUBE_DATA_API}/${endpoint.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v != null && v !== "") url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
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
