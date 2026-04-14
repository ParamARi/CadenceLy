import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
    };
  }
}

/** Stored in the encrypted JWT cookie — not sent to `useSession()` unless you add it in `session`. */
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    /** Unix seconds when `accessToken` expires (from Google). */
    expiresAt?: number;
  }
}
