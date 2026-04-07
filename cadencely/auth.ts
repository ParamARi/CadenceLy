import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Google OAuth (Gmail / Google account). Set in `.env.local`:
 * - `AUTH_SECRET` — `openssl rand -base64 32`
 * - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — from Google Cloud Console OAuth client
 * - `AUTH_URL` — e.g. `http://localhost:3000` (production: your site origin)
 *
 * Redirect URI in Google Console: `{AUTH_URL}/api/auth/callback/google`
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});
