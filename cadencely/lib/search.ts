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
  searchType: string
): Promise<ArtistSearchResult[]> {
  const response = await fetch(
    `/api/ytmusic?artistName=${encodeURIComponent(query)}&type=${searchType}`
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
  if (!response.ok) {
    throw new Error("Failed to fetch playlist details");
  }
  const data = await response.json();
  if (data.playlist) {
    return [
      {
        playlistId: data.playlist.playlistId || "",
        name: data.playlist.name || data.playlist.title || "Unknown Playlist",
        author: data.playlist.author?.name || "Unknown Author",
        count: data.playlist.videoCount || data.playlist.videos?.length || 0,
        songs: data.playlist.videos || [],
      }
    ];
  }
  return [];
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
