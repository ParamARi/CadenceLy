/** Thumbnail entry as returned on YTMusic-style video objects. */
export type SongThumbnail = {
  url: string;
  width: number;
  height: number;
};

/** Channel / artist block on a catalog video item. */
export type SongVideoArtist = {
  name: string;
  artistId: string;
};

/**
 * Single video track shape (e.g. from playlist browse APIs).
 * @example `{ "type": "VIDEO", "videoId": "…", "name": "…", "artist": { … }, "duration": 226, "thumbnails": [ … ] }`
 */
export type Song = {
  type: string;
  videoId: string;
  name: string;
  artist: SongVideoArtist;
  duration: number;
  thumbnails: SongThumbnail[];
};

export type SongArtist = {
  id: string;
  name: string;
  uri: string;
  genres: string[];
  from: string;
  mbid: string;
};

export type SongAlbum = {
  title: string;
  uri: string;
  year: string;
};

export type SongSearchResult = {
  id: string;
  title: string;
  uri: string;
  tempo: string;
  time_sig: string;
  key_of: string;
  open_key: string;
  danceability: number;
  acousticness: number;
  artist: SongArtist;
  album: SongAlbum;
};

export type ArtistAlbum = {
  title: string;
  uri: string;
  year: string;
  songs?: any[];
};

export type ArtistSearchResult = {
  id: string;
  name: string;
  uri: string;
  genres: string[];
  albums: ArtistAlbum[];
};

export type AlbumSearchResult = {
  id: string;
  title: string;
  uri: string;
  year: string;
};

export type PlaylistSearchResult = {
  id?: string;
  playlistId: string;
  name: string;
  title?: string;
  author?: string;
  count?: number;
  songs?: Song[];
};
