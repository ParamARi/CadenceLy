/**
 * Exchange a Google OAuth refresh_token for a new access_token.
 * Uses the same Web client credentials as NextAuth (`AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`).
 */

export type GoogleRefreshOk = {
  ok: true;
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

export type GoogleRefreshErr = { ok: false; error: string };

export async function refreshGoogleOAuthToken(
  refreshToken: string
): Promise<GoogleRefreshOk | GoogleRefreshErr> {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) {
    return { ok: false, error: "Missing AUTH_GOOGLE_ID or AUTH_GOOGLE_SECRET" };
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof json.error === "string"
        ? json.error
        : typeof json.error_description === "string"
          ? json.error_description
          : `HTTP ${res.status}`;
    return { ok: false, error: msg };
  }

  const access_token = json.access_token;
  if (typeof access_token !== "string" || !access_token) {
    return { ok: false, error: "No access_token in refresh response" };
  }

  const expires_in =
    typeof json.expires_in === "number" && Number.isFinite(json.expires_in)
      ? json.expires_in
      : 3600;

  const newRefresh =
    typeof json.refresh_token === "string" ? json.refresh_token : undefined;

  return {
    ok: true,
    access_token,
    expires_in,
    refresh_token: newRefresh,
  };
}
