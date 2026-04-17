import { NextRequest, NextResponse } from "next/server";
import { getGoogleAccessTokenFromCookies } from "@/lib/youtube/youtubeDataClient";

/**
 * Returns whether the session has a Google OAuth access token (YouTube scopes
 * are requested at sign-in; re-auth may be needed after adding scopes).
 */
export async function GET(req: NextRequest) {
  const token = await getGoogleAccessTokenFromCookies(req);
  return NextResponse.json({ connected: Boolean(token) });
}
