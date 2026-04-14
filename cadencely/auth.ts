import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const googleScopes = [
  "openid",
  "email",
  "profile",
  /** Read private playlists, “Liked videos” (LL), subscriptions list, etc. */
  "https://www.googleapis.com/auth/youtube.readonly",
].join(" ");

/**
 * Google OAuth (Gmail / Google account). Set in `.env.local`:
 * - `AUTH_SECRET` — `openssl rand -base64 32`
 * - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from Google Cloud Console OAuth client
 * - `AUTH_URL` — e.g. `http://localhost:3000` (production: your site origin)
 *
 * Redirect URI in Google Console: `{AUTH_URL}/api/auth/callback/google`
 *
 * YouTube Data API v3 (user library): add the same scopes under **OAuth consent screen**
 * and enable **YouTube Data API v3** for the GCP project. Tokens live in the JWT only;
 * call YouTube from **server** routes via `getToken` (see `/api/youtube/*`).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      authorization: {
        params: {
          scope: googleScopes,
          access_type: "offline",
        },
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token ?? token.refreshToken;
        if (typeof account.expires_at === "number") {
          token.expiresAt = account.expires_at;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
