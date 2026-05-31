import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    /** OAuth provider id from sign-in (e.g. `google`, `spotify`). */
    provider?: string;
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

/** Stored in the encrypted JWT cookie — not sent to `useSession()` unless you add it in `session`. */
declare module "next-auth/jwt" {
  interface JWT {
    /** Last sign-in provider id (e.g. `google`, `spotify`). */
    provider?: string;

    /** Legacy generic token fields retained for backward compatibility. */
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    error?: "RefreshAccessTokenError";

    /** Google OAuth tokens (used by YouTube routes). */
    googleAccessToken?: string;
    googleRefreshToken?: string;
    googleExpiresAt?: number;
    googleError?: "RefreshAccessTokenError";

    /** Spotify OAuth tokens (used by upcoming Spotify routes). */
    spotifyAccessToken?: string;
    spotifyRefreshToken?: string;
    spotifyExpiresAt?: number;
    spotifyError?: "RefreshAccessTokenError";
  }
}
