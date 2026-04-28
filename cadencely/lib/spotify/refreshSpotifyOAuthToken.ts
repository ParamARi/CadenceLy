/**
 * Exchange a Spotify OAuth refresh_token for a new access_token.
 * Uses `AUTH_SPOTIFY_ID` / `AUTH_SPOTIFY_SECRET` from environment variables.
 */

export type SpotifyRefreshOk = {
  ok: true;
  access_token: string;
  expires_in: number;
  refresh_token?: string;
};

export type SpotifyRefreshErr = { ok: false; error: string };

export async function refreshSpotifyOAuthToken(
  refreshToken: string
): Promise<SpotifyRefreshOk | SpotifyRefreshErr> {
  const clientId = process.env.AUTH_SPOTIFY_ID?.trim();
  const clientSecret = process.env.AUTH_SPOTIFY_SECRET?.trim();
  if (!clientId || !clientSecret) {
    return { ok: false, error: "Missing AUTH_SPOTIFY_ID or AUTH_SPOTIFY_SECRET" };
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`, "utf8").toString("base64");
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    const msg =
      typeof json.error_description === "string"
        ? json.error_description
        : typeof json.error === "string"
          ? json.error
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
