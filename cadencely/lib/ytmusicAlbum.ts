import { unstable_cache } from "next/cache";
import YTMusic from "ytmusic-api";

/**
 * Server-only: caches `getAlbum` per `albumId` across requests (Next.js Data Cache).
 * Used by `/api/ytmusic` when `type=album&albumId=…`.
 */
const getAlbumById = unstable_cache(
  async (albumId: string) => {
    const ytmusic = new YTMusic();
    await ytmusic.initialize();
    return ytmusic.getAlbum(albumId);
  },
  ["ytmusic-get-album"],
  { revalidate: 3600 }
);

export async function getCachedAlbumById(albumId: string) {
  return getAlbumById(albumId);
}
