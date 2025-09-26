import YTMusic from "ytmusic-api"
import { SongDetailed } from "ytmusic-api";

const ytmusic = new YTMusic()
await ytmusic.initialize(/* Optional: Custom cookies */)

class ytmClient {

    async fetchSongDetail(songName: string): Promise<SongDetailed[] | undefined> {
        try {
            const songs = await ytmusic.searchSongs(songName) //"Never gonna give you up"
            return songs;
        } catch (error) {
            console.error('Error fetching songs:', error);
            return undefined;
        }
    }
}

export default new ytmClient();