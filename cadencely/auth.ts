import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Spotify from "next-auth/providers/spotify";
import { refreshGoogleOAuthToken } from "@/lib/google/refreshGoogleOAuthToken";
import { refreshSpotifyOAuthToken } from "@/lib/spotify/refreshSpotifyOAuthToken";

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

const spotifyScopes = [
  "user-read-email",
  "playlist-read-private",
  "playlist-modify-private",
  "playlist-modify-public",
  "user-library-read",
].join(" ");


/**
 * Google OAuth (Gmail / Google account). Set in `.env.local`:
 * - `AUTH_SECRET` — `openssl rand -base64 32`
 * - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from Google Cloud Console OAuth client
 * - `AUTH_SPOTIFY_ID` / `AUTH_SPOTIFY_SECRET` — from Spotify Developer Dashboard app
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
    Spotify({
      clientId: process.env.AUTH_SPOTIFY_ID?.trim(),
      clientSecret: process.env.AUTH_SPOTIFY_SECRET?.trim(),
      authorization: {
        url: "https://accounts.spotify.com/authorize",
        params: { scope: spotifyScopes },
      },
    }),
  ],
  trustHost: true,
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "google" && account.access_token) {
        token.googleAccessToken = account.access_token;
        token.googleRefreshToken =
          account.refresh_token ?? token.googleRefreshToken;
        token.googleExpiresAt =
          typeof account.expires_at === "number"
            ? account.expires_at
            : Math.floor(Date.now() / 1000) + 3600;
        delete token.googleError;

        // Backward compatibility for any legacy consumers.
        token.accessToken = token.googleAccessToken;
        token.refreshToken = token.googleRefreshToken;
        token.expiresAt = token.googleExpiresAt;
        delete token.error;
        return token;
      }

      if (account?.provider === "spotify" && account.access_token) {
        token.spotifyAccessToken = account.access_token;
        token.spotifyRefreshToken =
          account.refresh_token ?? token.spotifyRefreshToken;
        token.spotifyExpiresAt =
          typeof account.expires_at === "number"
            ? account.expires_at
            : Math.floor(Date.now() / 1000) + 3600;
        delete token.spotifyError;
        return token;
      }

      const now = Math.floor(Date.now() / 1000);

      // Refresh Google token when needed.
      const googleExpiresAt = token.googleExpiresAt;
      const googleRefreshToken =
        typeof token.googleRefreshToken === "string"
          ? token.googleRefreshToken
          : undefined;
      if (
        googleRefreshToken &&
        typeof googleExpiresAt === "number" &&
        now >= googleExpiresAt - 120
      ) {
        const refreshedGoogle = await refreshGoogleOAuthToken(googleRefreshToken);
        if (!refreshedGoogle.ok) {
          token.googleError = "RefreshAccessTokenError";
          token.googleAccessToken = undefined;
          token.error = "RefreshAccessTokenError";
          token.accessToken = undefined;
        } else {
          token.googleAccessToken = refreshedGoogle.access_token;
          token.googleExpiresAt = now + refreshedGoogle.expires_in;
          token.googleRefreshToken =
            refreshedGoogle.refresh_token ?? googleRefreshToken;
          token.googleError = undefined;

          // Keep legacy fields aligned with Google for existing routes.
          token.accessToken = token.googleAccessToken;
          token.refreshToken = token.googleRefreshToken;
          token.expiresAt = token.googleExpiresAt;
          token.error = undefined;
        }
      }

      // Refresh Spotify token when needed.
      const spotifyExpiresAt = token.spotifyExpiresAt;
      const spotifyRefreshToken =
        typeof token.spotifyRefreshToken === "string"
          ? token.spotifyRefreshToken
          : undefined;
      if (
        spotifyRefreshToken &&
        typeof spotifyExpiresAt === "number" &&
        now >= spotifyExpiresAt - 120
      ) {
        const refreshedSpotify = await refreshSpotifyOAuthToken(spotifyRefreshToken);
        if (!refreshedSpotify.ok) {
          token.spotifyError = "RefreshAccessTokenError";
          token.spotifyAccessToken = undefined;
        } else {
          token.spotifyAccessToken = refreshedSpotify.access_token;
          token.spotifyExpiresAt = now + refreshedSpotify.expires_in;
          token.spotifyRefreshToken =
            refreshedSpotify.refresh_token ?? spotifyRefreshToken;
          token.spotifyError = undefined;
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
