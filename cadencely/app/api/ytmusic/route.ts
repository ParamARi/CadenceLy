import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

async function fetchArtist(ytmusic: any, query: string) {
  // 1. Search for the artist
  const searchResults = await ytmusic.searchArtists(query);
  if (!searchResults || searchResults.length === 0) {
    return null;
  }

  const artistId = searchResults[0].artistId;
  
  // 2. Get the artist details (which includes their albums)
  const artist = await ytmusic.getArtist(artistId);
  
  // Combine topAlbums and singles (or whichever album lists are available)
  const allAlbums = [
    ...(artist.topAlbums || []),
    // ...(artist.topSingles || []),
    // ...(artist.albums || []) // if ytmusic-api updates to include this
  ].filter((album: any, index: number, self: any[]) => 
    // Filter out duplicate albums by albumId
    index === self.findIndex((a) => a.albumId === album.albumId)
  );

  return {
    artist: {
      artistId: artist.artistId,
      name: artist.name,
      thumbnails: artist.thumbnails,
    },
    albums: allAlbums.map(album => ({
      ...album,
      songs: [], // We intentionally defer fetching songs until the user expands the album!
    })),
  };
}

async function fetchAlbum(ytmusic: any, query: string, albumId?: string | null) {
  if (albumId) {
    const albumDetail = await ytmusic.getAlbum(albumId);
    return {
      album: albumDetail,
    };
  }

  const searchResults = await ytmusic.searchAlbums(query);
  if (!searchResults || searchResults.length === 0) {
    return null;
  }

  const foundAlbumId = searchResults[0].albumId;
  const albumDetail = await ytmusic.getAlbum(foundAlbumId);
  
  return {
    album: albumDetail,
  };
}

async function fetchPlaylist(ytmusic: any, query: string) {
  let playlistId = "";

  // Check if query is a URL
  try {
    const url = new URL(query);
    const listParam = url.searchParams.get("list");
    if (listParam) {
      playlistId = listParam;
    }
  } catch (e) {
    // Not a valid URL, ignore
  }

  // If not a URL (or no 'list' parameter found), search for the playlist
  if (!playlistId) {
    const searchResults = await ytmusic.searchPlaylists(query);
    if (!searchResults || searchResults.length === 0) {
      return null;
    }
    playlistId = searchResults[0].playlistId;
  }

  try {
    const playlistDetail = await ytmusic.getPlaylist(playlistId);
    
    let videos = [];
    try {
      videos = await ytmusic.getPlaylistVideos(playlistId);
    } catch (err) {
      console.error(`Failed to fetch videos for playlist ${playlistId}:`, err);
    }

    return {
      playlist: {
        ...playlistDetail,
        videos: videos || [],
      },
    };
  } catch (err) {
    console.error(`Failed to get playlist details for ${playlistId}:`, err);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") || searchParams.get("artistName");
  const type = searchParams.get("type") || "artist";
  const albumId = searchParams.get("albumId");

  if (!query && !albumId) {
    return NextResponse.json(
      { error: "query or albumId parameter is required" },
      { status: 400 }
    );
  }

  try {
    const ytmusic = new YTMusic();
    await ytmusic.initialize();

    let data;

    if (type === "artist") {
      data = await fetchArtist(ytmusic, query || "");
    } else if (type === "album") {
      data = await fetchAlbum(ytmusic, query || "", albumId);
    } else if (type === "playlist") {
      data = await fetchPlaylist(ytmusic, query || "");
    } else {
      return NextResponse.json(
        { error: "Invalid type parameter. Supported types: artist, album, playlist" },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "No results found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    console.error("Error fetching from ytmusic-api:", error);
    return NextResponse.json(
      { error: "Failed to fetch data from YouTube Music" },
      { status: 500 }
    );
  }
}
