/**
 * Where Next forwards validated BPM feedback (`POST /api/feedback/bpm`).
 *
 * - `FEEDBACK_API_URL` overrides everything when set (any environment).
 * - In **development**, if unset, defaults to Express at
 *   `http://localhost:3005/api/feedback/bpm`.
 * - In **production**, if unset, Next uses the local stub only (201 + log).
 */
const DEV_DEFAULT_UPSTREAM = process.env.FEEDBACK_API_URL?.trim() || null;

export function getBpmFeedbackUpstreamUrl(): string | null {
  const fromEnv = process.env.FEEDBACK_API_URL?.trim();
  if (fromEnv) return fromEnv;

  if (process.env.NODE_ENV === "development") {
    return DEV_DEFAULT_UPSTREAM;
  }

  return null;
}
