import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";
import { getCachedAlbumById } from "@/lib/ytmusicAlbum";

async function fetchArtist(ytmusic: any, query: string) {
  // 1. Search for the artist
  const searchResults = await ytmusic.searchArtists(query);
  if (!searchResults || searchResults.length === 0) {
    return null;
  }

  //TODO: Add a way for users to select which artist they want to use if there are multiple results.
  const artistId = searchResults[0].artistId;

  // 2. Get the artist details (which includes their albums)
  const artist = await ytmusic.getArtist(artistId);

  // Combine topAlbums and singles (or whichever album lists are available)
  const allAlbums = [
    ...(artist.topAlbums || []),
    // ...(artist.topSingles || []),
    // ...(artist.albums || []) // if ytmusic-api updates to include this
  ].filter(
    (album: any, index: number, self: any[]) =>
      // Filter out duplicate albums by albumId
      index === self.findIndex((a) => a.albumId === album.albumId)
  );

  return {
    artist: {
      artistId: artist.artistId,
      name: artist.name,
      thumbnails: artist.thumbnails,
    },
    albums: allAlbums.map((album) => ({
      ...album,
      songs: [], // We intentionally defer fetching songs until the user expands the album!
    })),
  };
}

async function fetchAlbum(ytmusic: any, query: string) {
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

async function fetchFirstSongVideo(ytmusic: any, query: string) {
  const results = await ytmusic.searchSongs(query);
  if (!results || results.length === 0) {
    return null;
  }
  const first = results[0];
  return {
    videoId: first.videoId,
    name: first.name,
    artistName: first.artist?.name ?? null,
  };
}

/** Lets `new URL()` parse pasted links that omit `https://`. */
function normalizePlaylistUrlCandidate(raw: string): string {
  const t = raw.trim();
  if (!t) return t;
  if (/^https?:\/\//i.test(t)) return t;
  if (/^(www\.|m\.|music\.)?youtube\.com\//i.test(t)) {
    return `https://${t}`;
  }
  if (/^youtu\.be\//i.test(t)) {
    return `https://${t}`;
  }
  return t;
}

async function fetchPlaylist(ytmusic: any, query: string) {
  const trimmed = query.trim();
  let playlistId = "";

  try {
    const url = new URL(normalizePlaylistUrlCandidate(trimmed));
    const listParam = url.searchParams.get("list");
    if (listParam) {
      playlistId = listParam;
    }
  } catch {
    // Not a URL (or invalid) — fall through to text search
  }

  let idsToTry: string[] = [];
  if (playlistId) {
    idsToTry = [playlistId];
  } else {
    const searchResults = await ytmusic.searchPlaylists(trimmed);
    if (!searchResults || searchResults.length === 0) {
      return null;
    }
    const seen = new Set<string>();
    for (const row of searchResults.slice(0, 15)) {
      const id = row?.playlistId;
      if (typeof id === "string" && id && !seen.has(id)) {
        seen.add(id);
        idsToTry.push(id);
      }
    }
    if (idsToTry.length === 0) {
      return null;
    }
  }

  let lastErr: unknown;
  for (const pid of idsToTry) {
    try {
      const playlistDetail = await ytmusic.getPlaylist(pid);
      let videos: unknown[] = [];
      try {
        videos = await ytmusic.getPlaylistVideos(pid);
      } catch (err) {
        console.error(`Failed to fetch videos for playlist ${pid}:`, err);
      }
      return {
        playlist: {
          ...playlistDetail,
          videos: videos || [],
        },
      };
    } catch (err) {
      lastErr = err;
      console.error(`Failed to get playlist details for ${pid}:`, err);
    }
  }
  if (lastErr) {
    console.error("All playlist id attempts failed for query:", trimmed, lastErr);
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "artist";
  const albumId = searchParams.get("albumId");
  const combinedQuery =
    searchParams.get("query") || searchParams.get("artistName") || "";

  if (type === "songVideo") {
    const q = combinedQuery.trim();
    if (!q) {
      return NextResponse.json(
        { error: "query or artistName is required for songVideo" },
        { status: 400 }
      );
    }
    try {
      const ytmusic = new YTMusic();
      await ytmusic.initialize();
      const found = await fetchFirstSongVideo(ytmusic, q);
      if (!found) {
        return NextResponse.json(
          { error: "No song video found" },
          { status: 404 }
        );
      }
      return NextResponse.json(found, { status: 200 });
    } catch (error) {
      console.error("Error fetching from ytmusic-api:", error);
      return NextResponse.json(
        { error: "Failed to fetch data from YouTube Music" },
        { status: 500 }
      );
    }
  }

  if (type === "album" && albumId) {
    try {
      const albumDetail = await getCachedAlbumById(albumId);
      return NextResponse.json({ album: albumDetail }, { status: 200 });
    } catch (error) {
      console.error("Error fetching from ytmusic-api:", error);
      return NextResponse.json(
        { error: "Failed to fetch data from YouTube Music" },
        { status: 500 }
      );
    }
  }

  if (!combinedQuery.trim() && !albumId) {
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
      data = await fetchArtist(ytmusic, combinedQuery || "");
    } else if (type === "album") {
      data = await fetchAlbum(ytmusic, combinedQuery || "");
    } else if (type === "playlist") {
      data = await fetchPlaylist(ytmusic, combinedQuery || "");
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid type parameter. Supported types: artist, album, playlist, songVideo",
        },
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
