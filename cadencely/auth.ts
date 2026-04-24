import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { refreshGoogleOAuthToken } from "@/lib/google/refreshGoogleOAuthToken";

const googleScopes = [
  "openid",
  "email",
  "profile",
  /**
   * Full YouTube account scope: list library, create playlists, add videos.
   * If you previously only had `youtube.readonly`, sign out and sign in again
   * so Google re-consents and issues a token with this scope.
   */
  "https://www.googleapis.com/auth/youtube",
].join(" ");

/**
 * Google OAuth (Gmail / Google account). Set in `.env.local`:
 * - `AUTH_SECRET` — `openssl rand -base64 32`
 * - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from Google Cloud Console OAuth client
 * - `AUTH_URL` — full origin, e.g. `https://example.com` or `http://localhost:3000`
 *   (a hostname without `https://` is accepted and normalized for non-local hosts)
 *
 * Redirect URI in Google Console: `{AUTH_URL}/api/auth/callback/google`
 *
 * **Azure Container Apps:** the *secret resource* name can be dashed lowercase
 * (e.g. `auth-secret`). The *container environment variable* you bind it to
 * should still be `AUTH_SECRET` (and likewise for `AUTH_URL`, `AUTH_GOOGLE_*`).
 * Those are two different fields in the API / “add environment variable” flow.
 *
 * YouTube Data API v3: add the same scopes under **OAuth consent screen**
 * and enable **YouTube Data API v3** for the GCP project. Tokens live in the JWT only;
 * call YouTube from **server** routes via `getToken` (see `/api/youtube/*`).
 *
 * **Refresh:** With `access_type: "offline"`, Google may return a `refresh_token` (often only
 * on first consent). The `jwt` callback refreshes the access token before it expires.
 * Middleware on `/api/youtube/*` keeps the session cookie updated (see `middleware.ts`).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID?.trim(),
      clientSecret: process.env.AUTH_GOOGLE_SECRET?.trim(),
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
    async jwt({ token, account }) {
      if (account?.access_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token ?? token.refreshToken;
        token.expiresAt =
          typeof account.expires_at === "number"
            ? account.expires_at
            : Math.floor(Date.now() / 1000) + 3600;
        delete token.error;
        return token;
      }

      if (token.error === "RefreshAccessTokenError") {
        return token;
      }

      const expiresAt = token.expiresAt;
      const refreshToken =
        typeof token.refreshToken === "string" ? token.refreshToken : undefined;

      if (!refreshToken || typeof expiresAt !== "number") {
        return token;
      }

      const now = Math.floor(Date.now() / 1000);
      /** Refresh slightly before expiry to avoid 401s from YouTube. */
      if (now < expiresAt - 120) {
        return token;
      }

      const refreshed = await refreshGoogleOAuthToken(refreshToken);
      if (!refreshed.ok) {
        return {
          ...token,
          error: "RefreshAccessTokenError",
          accessToken: undefined,
        };
      }

      return {
        ...token,
        accessToken: refreshed.access_token,
        expiresAt: now + refreshed.expires_in,
        refreshToken: refreshed.refresh_token ?? refreshToken,
        error: undefined,
      };
    },
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
