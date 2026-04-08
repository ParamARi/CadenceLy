import type { ArtistSearchResult, SongSearchResult, AlbumSearchResult, PlaylistSearchResult } from "./types";

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

export async function searchPlaylistsApi(
  query: string
): Promise<PlaylistSearchResult[]> {
  const response = await fetch(
    `/api/ytmusic?query=${encodeURIComponent(query)}&type=playlist`
  );
  if (response.status === 404) {
    return [];
  }
  if (!response.ok) {
    console.error("Failed to fetch playlist details", response);
    throw new Error("Failed to fetch playlist details");
  }
  const data = await response.json();
  if (data.playlist) {
    const pl = data.playlist as {
      playlistId?: string;
      name?: string;
      title?: string;
      videoCount?: number;
      videos?: unknown[];
      artist?: { name?: string };
      author?: { name?: string };
    };
    return [
      {
        playlistId: pl.playlistId || "",
        name: pl.name || pl.title || "Unknown Playlist",
        author:
          pl.artist?.name ||
          pl.author?.name ||
          "Unknown Author",
        count: pl.videoCount ?? pl.videos?.length ?? 0,
        songs: pl.videos || [],
      },
    ];
  }
  return [];
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
  albumId: string
): Promise<any[]> {
  const response = await fetch(
    `/api/ytmusic?type=album&albumId=${encodeURIComponent(albumId)}`
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
