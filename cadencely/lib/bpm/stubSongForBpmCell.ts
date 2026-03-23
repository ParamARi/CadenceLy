import type { SongSearchResult } from "@/lib/types";

/**
 * Build a {@link SongSearchResult} shape for {@link BpmTableCell} when the row
 * data comes from YTMusic album/playlist tracks instead of GetSong search.
 */
export function stubSongForBpmCell(input: {
  title: string;
  artistName: string;
  /** YouTube id from YTMusic so BPM analysis can skip YouTube search */
  videoId?: string;
  /** Raw tempo from GetSong match; omit or empty if not found */
  apiTempo?: string | null;
}): SongSearchResult {
  const t = input.apiTempo?.trim();
  const tempo =
    t && t !== "-" && Number.isFinite(parseFloat(t)) ? t : "";
  return {
    id: "",
    title: input.title,
    uri: "",
    videoId: (input.videoId ?? "").trim(),
    tempo,
    time_sig: "",
    key_of: "",
    open_key: "",
    danceability: 0,
    acousticness: 0,
    artist: {
      id: "",
      name: input.artistName,
      uri: "",
      genres: [],
      from: "",
      mbid: "",
    },
    album: { title: "", uri: "", year: "" },
  };
}
