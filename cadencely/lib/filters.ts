import type { SongSearchResult } from "./types";
import { getBpmRangeMatch, isValidBpmRange } from "./bpm/bpmRangeMatch";

export function filterByBpmRange(
  data: SongSearchResult[],
  minBPM: number,
  maxBPM: number,
  includeMultiples = false
) {
  if (!isValidBPMs(minBPM, maxBPM)) return data;
  return data.filter((song) =>
    getBpmRangeMatch(song.tempo, minBPM, maxBPM, includeMultiples).inRange
  );
}

export function isValidBPMs(minBPM: number, maxBPM: number): boolean {
  return isValidBpmRange(minBPM, maxBPM);
}

export function findBestSongMatch(results: SongSearchResult[], artistName: string): SongSearchResult | null {
  if (!results || results.length === 0) return null;

  let match = results[0]; // Default to first result

  // Try to find a match where the artist name is included in the returned artist field
  if (artistName) {
    const artistMatch = results.find((item) =>
      item.artist?.name?.toLowerCase().includes(artistName.toLowerCase())
    );
    if (artistMatch) {
      match = artistMatch;
    }
  }

  return match;
}
