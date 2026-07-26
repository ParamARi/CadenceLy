import { NextResponse } from "next/server";
import YTMusic from "ytmusic-api";

async function fetchArtist(ytmusic: YTMusic, query: string) {
  // 1. Search for the artist
  const searchResults = await ytmusic.searchArtists(query);
  if (!searchResults || searchResults.length === 0) {
    return null;
  }

  //TODO: Add a way for users to select which artist they want to use if there are multiple results.
  const artist = searchResults[0];

  // 2. Full discography via getArtistAlbums (getArtist().topAlbums only covers
  // a subset). ytmusic-api 5.3.1 bug: getArtistAlbums returns the artist's
  // channel id as `albumId` on every row, so real `MPREb…` album ids are
  // backfilled from topAlbums and an album search, keyed by the unique album
  // playlistId. Albums left without a real id fall back to their playlistId as
  // the client `uri`; the album tracklist route resolves those on expand.
  const [albums, artistFull, albumSearch] = await Promise.all([
    ytmusic.getArtistAlbums(artist.artistId),
    ytmusic.getArtist(artist.artistId).catch(() => null),
    ytmusic.searchAlbums(artist.name).catch(() => []),
  ]);

  const realAlbumIdByPlaylistId = new Map<string, string>();
  for (const a of [...(artistFull?.topAlbums ?? []), ...(albumSearch ?? [])]) {
    if (a.playlistId && a.albumId?.startsWith("MPREb")) {
      realAlbumIdByPlaylistId.set(a.playlistId, a.albumId);
    }
  }

  const sourceAlbums =
    albums && albums.length > 0 ? albums : artistFull?.topAlbums ?? [];

  const seen = new Set<string>();
  const allAlbums: Array<Record<string, unknown>> = [];
  for (const album of sourceAlbums) {
    const dedupeKey = album.playlistId || album.albumId;
    if (!dedupeKey || seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const realAlbumId = album.albumId?.startsWith("MPREb")
      ? album.albumId
      : realAlbumIdByPlaylistId.get(album.playlistId) ?? null;
    allAlbums.push({
      ...album,
      albumId: realAlbumId,
      songs: [], // We intentionally defer fetching songs until the user expands the album!
    });
  }

  return {
    artist: {
      artistId: artist.artistId,
      name: artist.name,
      thumbnails: artist.thumbnails,
    },
    albums: allAlbums,
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

type PlaylistCandidate = {
  playlistId: string;
  name: string | null;
  author: string | null;
  thumbnailUrl: string | null;
  videoCount: number | null;
  /** Query was a pasted URL with `list=` — no search metadata available. */
  fromUrl?: boolean;
};

/**
 * Search-only playlist lookup: returns candidate metadata so the user can pick
 * which playlist to load. No `getPlaylist`/`getPlaylistVideos` calls here.
 */
async function searchPlaylistCandidates(
  ytmusic: YTMusic,
  query: string
): Promise<{ candidates: PlaylistCandidate[] } | null> {
  const trimmed = query.trim();

  // Pasted URL with list= → single candidate, skip search entirely.
  try {
    const url = new URL(normalizePlaylistUrlCandidate(trimmed));
    const listParam = url.searchParams.get("list");
    if (listParam) {
      return {
        candidates: [
          {
            playlistId: listParam,
            name: null,
            author: null,
            thumbnailUrl: null,
            videoCount: null,
            fromUrl: true,
          },
        ],
      };
    }
  } catch {
    // Not a URL (or invalid) — fall through to text search
  }

  const searchResults = await ytmusic.searchPlaylists(trimmed);
  if (!searchResults || searchResults.length === 0) {
    return null;
  }

  const seen = new Set<string>();
  const candidates: PlaylistCandidate[] = [];
  for (const row of searchResults.slice(0, 15)) {
    const r = row as {
      playlistId?: string;
      name?: string;
      artist?: { name?: string };
      thumbnails?: Array<{ url?: string }>;
      videoCount?: number;
    };
    const id = r?.playlistId;
    if (typeof id !== "string" || !id || seen.has(id)) continue;
    seen.add(id);
    const thumbs = Array.isArray(r.thumbnails) ? r.thumbnails : [];
    candidates.push({
      playlistId: id,
      name: typeof r.name === "string" && r.name ? r.name : null,
      author:
        typeof r.artist?.name === "string" && r.artist.name
          ? r.artist.name
          : null,
      thumbnailUrl: thumbs[thumbs.length - 1]?.url ?? null,
      videoCount: typeof r.videoCount === "number" ? r.videoCount : null,
    });
  }

  return candidates.length > 0 ? { candidates } : null;
}

async function fetchPlaylist(
  ytmusic: any,
  query: string,
  explicitPlaylistId?: string
) {
  const trimmed = query.trim();
  const fromParam = explicitPlaylistId?.trim() ?? "";

  let idsToTry: string[] = [];
  if (fromParam) {
    idsToTry = [fromParam];
  } else {
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
  const playlistIdParam = searchParams.get("playlistId")?.trim() ?? "";
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
      const ytmusic = new YTMusic();
      await ytmusic.initialize();

      let resolvedAlbumId = albumId.trim();

      // Album rows from the artist discography can carry only an `OLAK…` album
      // playlist id (see fetchArtist). Resolve it to a real `MPREb…` album id
      // by searching with the album title and matching on playlistId.
      if (!resolvedAlbumId.startsWith("MPREb")) {
        const fallbackQuery = combinedQuery.trim();
        if (!fallbackQuery) {
          return NextResponse.json(
            { error: "Album id could not be resolved (missing query)" },
            { status: 404 }
          );
        }
        const matches = await ytmusic.searchAlbums(fallbackQuery);
        const match = (matches ?? []).find(
          (a) => a.playlistId === resolvedAlbumId
        );
        if (!match?.albumId?.startsWith("MPREb")) {
          return NextResponse.json(
            { error: "Album could not be resolved from YouTube Music" },
            { status: 404 }
          );
        }
        resolvedAlbumId = match.albumId;
      }

      const albumDetail = await ytmusic.getAlbum(resolvedAlbumId);
      return NextResponse.json({ album: albumDetail }, { status: 200 });
    } catch (error) {
      console.error("Error fetching from ytmusic-api:", error);
      return NextResponse.json(
        { error: "Failed to fetch data from YouTube Music" },
        { status: 500 }
      );
    }
  }

  if (!combinedQuery.trim() && !albumId && !playlistIdParam) {
    return NextResponse.json(
      { error: "query or albumId or playlistId parameter is required" },
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
      data = await fetchPlaylist(
        ytmusic,
        combinedQuery || "",
        playlistIdParam || undefined
      );
    } else if (type === "playlist-search") {
      data = await searchPlaylistCandidates(ytmusic, combinedQuery || "");
    } else {
      return NextResponse.json(
        {
          error:
            "Invalid type parameter. Supported types: artist, album, playlist, playlist-search, songVideo",
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
