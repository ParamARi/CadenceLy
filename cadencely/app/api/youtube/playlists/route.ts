import { NextRequest, NextResponse } from "next/server";
import {
  getGoogleAccessTokenFromCookies,
  youtubeDataGet,
  youtubeDataPost,
} from "@/lib/youtube/youtubeDataClient";

type PlaylistsInsertResponse = { id?: string };

/**
 * Signed-in user's playlists (`playlists.list` with `mine=true`).
 * Requires Google OAuth with YouTube scope (see `auth.ts`).
 */
export async function GET(req: NextRequest) {
  const accessToken = await getGoogleAccessTokenFromCookies(req);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Sign in with Google to load your YouTube playlists." },
      { status: 401 }
    );
  }

  const maxResults = req.nextUrl.searchParams.get("maxResults") ?? "25";

  const result = await youtubeDataGet<unknown>(
    "playlists",
    {
      part: "snippet,contentDetails,status",
      mine: "true",
      maxResults,
    },
    accessToken
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "YouTube Data API request failed",
        status: result.status,
        detail: result.body,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  return NextResponse.json(result.data);
}

const PRIVACY = new Set(["public", "private", "unlisted"]);

/**
 * Create a playlist (`playlists.insert`).
 * Body: `{ title: string, privacyStatus?: "public" | "private" | "unlisted" }`
 */
export async function POST(req: NextRequest) {
  const accessToken = await getGoogleAccessTokenFromCookies(req);
  if (!accessToken) {
    return NextResponse.json(
      { error: "Sign in with Google to create a playlist." },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const rec = body as Record<string, unknown>;
  const title = typeof rec.title === "string" ? rec.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title is required." }, { status: 400 });
  }

  const rawPrivacy =
    typeof rec.privacyStatus === "string" ? rec.privacyStatus : "private";
  const privacyStatus = PRIVACY.has(rawPrivacy) ? rawPrivacy : "private";

  const result = await youtubeDataPost<PlaylistsInsertResponse>(
    "playlists",
    { part: "snippet,status" },
    accessToken,
    {
      snippet: { title, description: "" },
      status: { privacyStatus },
    }
  );

  if (!result.ok) {
    return NextResponse.json(
      {
        error: "YouTube Data API request failed",
        status: result.status,
        detail: result.body,
      },
      { status: result.status >= 400 && result.status < 600 ? result.status : 502 }
    );
  }

  const id = result.data.id;
  if (typeof id !== "string" || !id) {
    return NextResponse.json(
      { error: "YouTube did not return a playlist id." },
      { status: 502 }
    );
  }

  return NextResponse.json({ id, title, privacyStatus });
}
