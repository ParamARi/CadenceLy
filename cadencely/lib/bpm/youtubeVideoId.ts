/**
 * Extracts an 11-character YouTube video id from common URL shapes or returns the string if it already looks like an id.
 */
export function parseYoutubeVideoId(input: string): string | null {
  const raw = input.trim();
  if (!raw) {
    return null;
  }
  if (/^[a-zA-Z0-9_-]{11}$/.test(raw)) {
    return raw;
  }
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const seg = u.pathname.split("/").filter(Boolean)[0];
      if (seg && /^[a-zA-Z0-9_-]{11}$/.test(seg)) {
        return seg;
      }
    }
    if (host.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v && /^[a-zA-Z0-9_-]{11}$/.test(v)) {
        return v;
      }
      const m = u.pathname.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
      if (m) {
        return m[1];
      }
      const s = u.pathname.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
      if (s) {
        return s[1];
      }
    }
  } catch {
    // not a URL
  }
  return null;
}
