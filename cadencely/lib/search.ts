import type {
  ArtistSearchResult,
  Song,
  SongSearchResult,
  AlbumSearchResult,
  PlaylistSearchResult,
} from "./types";

export async function searchSongsApi(
  query: string,
  searchType: string
): Promise<SongSearchResult[]> {
  const response = await fetch(
    `/api/songs?songName=${encodeURIComponent(query)}&type=${searchType}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch song details");
  }

  const data = await response.json();
  return data.search ?? [];
}

export async function searchArtistsApi(
  query: string,
  _searchType: string = "artist"
): Promise<ArtistSearchResult[]> {
  const response = await fetch(
    `/api/ytmusic?artistName=${encodeURIComponent(query)}&type=artist`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch artist details");
  }

  const data = await response.json();
  
  if (data.artist && data.albums) {
    // Format the ytmusic API response to fit ArtistSearchResult
    return [
      {
        id: data.artist.artistId || "",
        name: data.artist.name,
        uri: "",
        genres: [], // YTMusic doesn't easily provide genres at this endpoint
        albums: data.albums.map((a: any) => ({
          title: a.name,
          uri: a.albumId || a.playlistId,
          year: a.year?.toString() || "",
          songs: a.songs || [],
        })),
      },
    ];
  }
  
  return data.search ?? [];
}

export type PlaylistCandidate = {
  playlistId: string;
  name: string;
  author: string;
  count: number | null;
  thumbnailUrl: string | null;
  /** Query was a pasted URL with `list=` — only the id is known until fetched. */
  fromUrl?: boolean;
};

/**
 * Search-only lookup: returns candidate playlists (metadata, no tracks) so the
 * user can choose which one to load. Use `fetchPlaylistByIdApi` after a pick.
 */
export async function searchPlaylistsApi(
  query: string
): Promise<PlaylistCandidate[]> {
  const response = await fetch(
    `/api/ytmusic?query=${encodeURIComponent(query)}&type=playlist-search`
  );
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    console.error("Failed to search playlists", response);
    throw new Error("Failed to search playlists");
  }
  const data = await response.json();
  const rows = Array.isArray(data.candidates) ? data.candidates : [];
  return rows
    .map((c: any): PlaylistCandidate => ({
      playlistId: typeof c.playlistId === "string" ? c.playlistId : "",
      name:
        c.name || (c.fromUrl ? "Playlist from pasted link" : "Unknown Playlist"),
      author: c.author || "Unknown Author",
      count: typeof c.videoCount === "number" ? c.videoCount : null,
      thumbnailUrl: typeof c.thumbnailUrl === "string" ? c.thumbnailUrl : null,
      fromUrl: Boolean(c.fromUrl),
    }))
    .filter((c: PlaylistCandidate) => c.playlistId);
}

/** Fetch one playlist with its tracks (after the user picked a candidate). */
export async function fetchPlaylistByIdApi(
  playlistId: string
): Promise<PlaylistSearchResult | null> {
  const response = await fetch(
    `/api/ytmusic?type=playlist&playlistId=${encodeURIComponent(playlistId)}`
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    console.error("Failed to fetch playlist details", response);
    throw new Error("Failed to fetch playlist details");
  }
  const data = await response.json();
  if (!data.playlist) {
    return null;
  }
  const pl = data.playlist as {
    playlistId?: string;
    name?: string;
    title?: string;
    videoCount?: number;
    videos?: unknown[];
    artist?: { name?: string };
    author?: { name?: string };
  };
  return {
    playlistId: pl.playlistId || playlistId,
    name: pl.name || pl.title || "Unknown Playlist",
    author: pl.artist?.name || pl.author?.name || "Unknown Author",
    count: pl.videoCount ?? pl.videos?.length ?? 0,
    songs: (pl.videos ?? []) as Song[],
  };
}

/**
 * Search by album name; maps the first matching album into the same shape as an artist
 * with one album so it can be rendered with `@/components/table/ArtistResultsTable`.
 */
export async function searchAlbumByQueryApi(
  query: string
): Promise<ArtistSearchResult[]> {
  const response = await fetch(
    `/api/ytmusic?query=${encodeURIComponent(query)}&type=album`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch album details");
  }
  const data = await response.json();
  if (!data.album) {
    return [];
  }
  const a = data.album as {
    albumId: string;
    name: string;
    year?: number | null;
    artist?: { artistId?: string | null; name: string };
    songs?: unknown[];
  };
  const artistName = a.artist?.name || "Unknown Artist";
  return [
    {
      id: a.artist?.artistId || a.albumId || "",
      name: artistName,
      uri: "",
      genres: [],
      albums: [
        {
          title: a.name || "Unknown Album",
          uri: a.albumId,
          year: a.year != null ? String(a.year) : "",
          songs: Array.isArray(a.songs) ? a.songs : [],
        },
      ],
    },
  ];
}

export type SongVideoLookupResult = {
  videoId: string;
  name: string;
  artistName: string | null;
};

export async function fetchSongVideoForTap(
  query: string
): Promise<SongVideoLookupResult | null> {
  const response = await fetch(
    `/api/ytmusic?type=songVideo&query=${encodeURIComponent(query)}`
  );
  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error("Failed to look up song video");
  }
  return response.json() as Promise<SongVideoLookupResult>;
}

export async function searchAlbumsApi(
  albumId: string,
  /** Album title + artist; used server-side to resolve `OLAK…` playlist ids. */
  albumQuery?: string
): Promise<any[]> {
  const queryPart = albumQuery
    ? `&query=${encodeURIComponent(albumQuery)}`
    : "";
  const response = await fetch(
    `/api/ytmusic?type=album&albumId=${encodeURIComponent(albumId)}${queryPart}`
  );
  if (!response.ok) {
    throw new Error("Failed to fetch album details");
  }
  const data = await response.json();
  if (data.album && data.album.songs) {
    return data.album.songs;
  }
  return [];
}
