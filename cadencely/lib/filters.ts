import { SongSearchResult } from "./types"

export function filterByBpmRange(data: SongSearchResult[], minBPM: number, maxBPM: number) {
    const filteredSongs: SongSearchResult[] = [];
    if(isValidBPMs(minBPM, maxBPM)) {
        data.forEach((song) => {
            // Implementation for filtering songs by BPM range
            if(parseInt(song.tempo) >= minBPM && parseInt(song.tempo) <= maxBPM) {
                // Include the song in the filtered results
                filteredSongs.push(song);
            }
        });
    }
    return filteredSongs;
}


export function isValidBPMs(minBPM: number, maxBPM: number): boolean {
    if(minBPM && maxBPM) {
        if((typeof(minBPM) == "number" && typeof(maxBPM) == "number")) {
            return minBPM <= maxBPM;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

