import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Runs Auth.js on YouTube API routes so the JWT callback can refresh the Google
 * access token before handlers read the session cookie.
 */
export default auth(() => NextResponse.next());

export const config = {
  matcher: ["/api/youtube/:path*"],
};
