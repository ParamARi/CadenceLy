import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { searchSongsApi, searchArtistsApi } from "./search";

describe("search module", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    // Mock the global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    // Restore the original fetch
    global.fetch = originalFetch;
    vi.clearAllMocks();
  });

  describe("searchSongsApi", () => {
    it("should fetch song details successfully", async () => {
      const mockResponse = {
        search: [
          { id: "1", title: "Song 1" },
          { id: "2", title: "Song 2" },
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const query = "Test Song";
      const searchType = "song";

      const result = await searchSongsApi(query, searchType);

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/songs?songName=Test%20Song&type=song`
      );
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockResponse.search);
    });

    it("should return an empty array if search data is missing", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({}),
      });

      const result = await searchSongsApi("Test", "song");

      expect(result).toEqual([]);
    });

    it("should throw an error when response is not ok", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(searchSongsApi("Test", "song")).rejects.toThrow(
        "Failed to fetch song details"
      );
    });
  });

  describe("searchArtistsApi", () => {
    it("should fetch and transform artist details successfully when YTMusic data is present", async () => {
      const mockResponse = {
        artist: {
          artistId: "artist123",
          name: "Test Artist",
          thumbnails: [],
        },
        albums: [
          {
            name: "Test Album",
            albumId: "album123",
            playlistId: "playlist123",
            year: 2023,
          },
          {
            name: "Test Album 2",
            albumId: "album456",
            year: null,
          }
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchArtistsApi("Test Artist", "artist");

      expect(global.fetch).toHaveBeenCalledWith(
        `/api/ytmusic?artistName=Test%20Artist&type=artist`
      );
      expect(result).toHaveLength(1);
      
      const expectedArtist = {
        id: "artist123",
        name: "Test Artist",
        uri: "",
        genres: [],
        albums: [
          {
            title: "Test Album",
            uri: "album123",
            year: "2023",
            songs: [],
          },
          {
            title: "Test Album 2",
            uri: "album456",
            year: "",
            songs: [],
          }
        ],
      };
      
      expect(result[0]).toEqual(expectedArtist);
    });

    it("should fallback to search array if artist structure is missing", async () => {
      const mockResponse = {
        search: [
          { id: "alt-1", name: "Alt Artist" }
        ],
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await searchArtistsApi("Alt Artist", "artist");

      expect(result).toEqual(mockResponse.search);
    });

    it("should throw an error when response is not ok", async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
      });

      await expect(searchArtistsApi("Error Artist", "artist")).rejects.toThrow(
        "Failed to fetch artist details"
      );
    });
  });
});
