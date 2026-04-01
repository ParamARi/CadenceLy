import { findBestSongMatch } from "@/lib/filters";
import {
  buildParsedYoutubeTitleCandidates,
  type ParsedYoutubeTitleCandidate,
} from "@/lib/bpm/parseYoutubeTitle";
import type { SongSearchResult } from "@/lib/types";

function toTempoDisplay(value: string): string | null {
  const n = parseFloat(value);
  return Number.isFinite(n) ? Math.round(n).toString() : null;
}

async function fetchSongsByTitle(query: string): Promise<SongSearchResult[]> {
  const res = await fetch(`/api/songs?songName=${encodeURIComponent(query)}&type=song`);
  if (!res.ok) return [];
  const data = await res.json().catch(() => ({}));
  return Array.isArray(data.search) ? (data.search as SongSearchResult[]) : [];
}

export async function lookupTempoWithParsedTitleFallback(input: {
  rawTitle: string;
  artistName: string;
}): Promise<{
  tempo: string | null;
  usedParsedFallback: boolean;
  parsedArtist: string | null;
  parsedSong: string | null;
  matchedSong: string | null;
  matchedArtist: string | null;
}> {
  const baseQuery = input.rawTitle.trim();
  if (!baseQuery) {
    return {
      tempo: null,
      usedParsedFallback: false,
      parsedArtist: null,
      parsedSong: null,
      matchedSong: null,
      matchedArtist: null,
    };
  }

  const firstResults = await fetchSongsByTitle(baseQuery);
  const firstMatch = findBestSongMatch(firstResults, input.artistName);
  if (firstMatch?.tempo) {
    const display = toTempoDisplay(firstMatch.tempo);
    if (display) {
      return {
        tempo: display,
        usedParsedFallback: false,
        parsedArtist: null,
        parsedSong: null,
        matchedSong: firstMatch.title,
        matchedArtist: firstMatch.artist.name,
      };
    }
  }

  const fallbacks = buildParsedYoutubeTitleCandidates(baseQuery, input.artistName).filter(
    (c) => c.query.toLowerCase() !== baseQuery.toLowerCase()
  );

  let titleTierMatch: SongSearchResult | null = null;
  let titleTierCandidate: ParsedYoutubeTitleCandidate | null = null;
  let noTempoArtist: {
    match: SongSearchResult;
    candidate: ParsedYoutubeTitleCandidate;
  } | null = null;
  let noTempoTitle: {
    match: SongSearchResult;
    candidate: ParsedYoutubeTitleCandidate;
  } | null = null;
  /** Any catalog match for a parsed query, when BPM is missing (alignment may be loose). */
  let noTempoLoose: {
    match: SongSearchResult;
    candidate: ParsedYoutubeTitleCandidate;
  } | null = null;

  for (const candidate of fallbacks) {
    const results = await fetchSongsByTitle(candidate.query);
    const match = findBestSongMatch(results, input.artistName);
    if (!match) continue;

    const display = match.tempo ? toTempoDisplay(match.tempo) : null;

    if (display) {
      if (match.artist.name === candidate.parsedArtist) {
        return {
          tempo: display,
          usedParsedFallback: true,
          parsedArtist: candidate.parsedArtist,
          parsedSong: candidate.parsedSong,
          matchedSong: match.title,
          matchedArtist: match.artist.name,
        };
      }
      if (match.title === candidate.parsedSong) {
        titleTierMatch = match;
        titleTierCandidate = candidate;
      }
    } else {
      if (match.artist.name === candidate.parsedArtist) {
        if (!noTempoArtist) noTempoArtist = { match, candidate };
      } else if (match.title === candidate.parsedSong && !noTempoTitle) {
        noTempoTitle = { match, candidate };
      } else if (!noTempoLoose) {
        noTempoLoose = { match, candidate };
      }
    }
  }

  if (titleTierMatch && titleTierCandidate) {
    const display = toTempoDisplay(titleTierMatch.tempo!);
    return {
      tempo: display,
      usedParsedFallback: true,
      parsedArtist: titleTierCandidate.parsedArtist,
      parsedSong: titleTierCandidate.parsedSong,
      matchedSong: titleTierMatch.title,
      matchedArtist: titleTierMatch.artist.name,
    };
  }

  if (noTempoArtist) {
    return {
      tempo: null,
      usedParsedFallback: true,
      parsedArtist: noTempoArtist.candidate.parsedArtist,
      parsedSong: noTempoArtist.candidate.parsedSong,
      matchedSong: noTempoArtist.match.title,
      matchedArtist: noTempoArtist.match.artist.name,
    };
  }

  if (noTempoTitle) {
    return {
      tempo: null,
      usedParsedFallback: true,
      parsedArtist: noTempoTitle.candidate.parsedArtist,
      parsedSong: noTempoTitle.candidate.parsedSong,
      matchedSong: noTempoTitle.match.title,
      matchedArtist: noTempoTitle.match.artist.name,
    };
  }

  if (noTempoLoose) {
    return {
      tempo: null,
      usedParsedFallback: true,
      parsedArtist: noTempoLoose.candidate.parsedArtist,
      parsedSong: noTempoLoose.candidate.parsedSong,
      matchedSong: noTempoLoose.match.title,
      matchedArtist: noTempoLoose.match.artist.name,
    };
  }

  return {
    tempo: null,
    usedParsedFallback: false,
    parsedArtist: null,
    parsedSong: null,
    matchedSong: null,
    matchedArtist: null,
  };
}
