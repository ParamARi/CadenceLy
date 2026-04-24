import type { lookupTempoWithParsedTitleFallback } from "@/lib/bpm/lookupTempoWithParsedTitle";
import { normalizeCatalogTitleForLookup } from "@/lib/bpm/catalogTitleForLookup";

export type TempoLookupCachedResult = Awaited<
  ReturnType<typeof lookupTempoWithParsedTitleFallback>
>;

const store = new Map<string, TempoLookupCachedResult>();

function normalizeKeyPart(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Stable key for session BPM lookup cache. Prefer `videoId` when present so
 * the same YouTube video shares one entry even if title/channel text differs.
 */
export function tempoLookupCacheKey(input: {
  videoId: string;
  rawTitle: string;
  artistName: string;
}): string {
  const vid = input.videoId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(vid)) {
    return `v:${vid}`;
  }
  const titleForKey = normalizeCatalogTitleForLookup(input.rawTitle);
  return `t:${normalizeKeyPart(titleForKey)}|${normalizeKeyPart(input.artistName)}`;
}

export function getTempoLookupFromSessionCache(
  key: string
): TempoLookupCachedResult | undefined {
  return store.get(key);
}

export function setTempoLookupSessionCache(
  key: string,
  value: TempoLookupCachedResult
): void {
  store.set(key, value);
}

/** For tests or “refresh all BPM” if you add that later. */
export function clearTempoLookupSessionCache(): void {
  store.clear();
}
