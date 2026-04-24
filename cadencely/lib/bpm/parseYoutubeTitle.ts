import { normalizeCatalogTitleForLookup } from "@/lib/bpm/catalogTitleForLookup";

const SEP_REGEX = /\s*(?:\||~|—|–|-)\s*/g;

function cleanToken(value: string): string {
  return value
    .replace(/["'`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Build fallback GetSong queries from YouTube-style video titles.
 * Used only when the first lookup by raw title fails.
 */
export function buildParsedYoutubeTitleQueries(
  rawTitle: string,
  artistName: string
): string[] {
  const title = normalizeCatalogTitleForLookup(rawTitle);
  if (!title) return [];

  const artist = cleanToken(artistName).toLowerCase();
  const withoutBrackets = title;
  const parts = withoutBrackets
    .split(SEP_REGEX)
    .map(cleanToken)
    .filter(Boolean);

  const candidates: string[] = [];

  // Prefer non-artist side when title is "Artist - Song" like patterns.
  if (parts.length >= 2 && artist) {
    const artistParts = parts.filter((p) => p.toLowerCase().includes(artist));
    const nonArtistParts = parts.filter((p) => !p.toLowerCase().includes(artist));
    candidates.push(...nonArtistParts, ...artistParts);
  } else {
    candidates.push(...parts);
  }

  candidates.push(withoutBrackets);

  const seen = new Set<string>();
  const unique = candidates.filter((c) => {
    const key = c.toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return unique;
}

export type ParsedYoutubeTitleCandidate = {
  query: string;
  parsedArtist: string;
  parsedSong: string;
};

export function buildParsedYoutubeTitleCandidates(
  rawTitle: string,
  artistName: string
): ParsedYoutubeTitleCandidate[] {
  const title = normalizeCatalogTitleForLookup(rawTitle);
  if (!title) return [];

  const knownArtist = cleanToken(artistName);
  const knownArtistLower = knownArtist.toLowerCase();
  const withoutBrackets = title;
  const parts = withoutBrackets
    .split(SEP_REGEX)
    .map(cleanToken)
    .filter(Boolean);

  const result: ParsedYoutubeTitleCandidate[] = [];
  const pushCandidate = (query: string, parsedArtist: string, parsedSong: string) => {
    const q = cleanToken(query);
    const a = cleanToken(parsedArtist);
    const s = cleanToken(parsedSong);
    if (!q || !s) return;
    result.push({ query: q, parsedArtist: a, parsedSong: s });
  };

  if (parts.length >= 2) {
    const first = parts[0] ?? "";
    const second = parts[1] ?? "";

    if (knownArtist) {
      const firstHasArtist = first.toLowerCase().includes(knownArtistLower);
      const secondHasArtist = second.toLowerCase().includes(knownArtistLower);
      if (firstHasArtist && !secondHasArtist) {
        pushCandidate(second, knownArtist, second);
      } else if (!firstHasArtist && secondHasArtist) {
        pushCandidate(first, knownArtist, first);
      } else {
        // If ambiguous, still provide both sides with known artist.
        pushCandidate(first, knownArtist, first);
        pushCandidate(second, knownArtist, second);
      }
    } else {
      // No known artist: infer common "Artist - Song" ordering.
      pushCandidate(second, first, second);
      pushCandidate(first, second, first);
    }
  }

  // Fallback from the original query list to avoid missing edge cases.
  const fallbackQueries = buildParsedYoutubeTitleQueries(rawTitle, artistName);
  for (const q of fallbackQueries) {
    pushCandidate(q, knownArtist || "Unknown", q);
  }

  const seen = new Set<string>();
  return result.filter((item) => {
    const key = `${item.query.toLowerCase()}|${item.parsedArtist.toLowerCase()}|${item.parsedSong.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
