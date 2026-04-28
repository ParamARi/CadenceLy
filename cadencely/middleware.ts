import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Runs Auth.js on provider API routes so the JWT callback can refresh OAuth
 * access tokens before handlers read from the encrypted session cookie.
 */
export default auth(() => NextResponse.next());

export const config = {
  matcher: ["/api/youtube/:path*", "/api/spotify/:path*"],
};
