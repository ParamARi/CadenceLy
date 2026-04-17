/**
 * Upper bound on unique video IDs accepted per `POST /api/youtube/playlist-add-items`.
 *
 * YouTube's `playlistItems.insert` is one HTTP call per video. Large batches mean many
 * sequential requests, which can hit **daily quota**, **rate limits**, or **timeouts**.
 * The cap keeps a single "Save" operation predictable for users and the server.
 */
export const PLAYLIST_ADD_ITEMS_MAX_VIDEOS = 100;
