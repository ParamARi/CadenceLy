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

export function findBestSongMatch(results: SongSearchResult[], artistName: string): SongSearchResult | null {
    if (!results || results.length === 0) return null;
    
    let match = results[0]; // Default to first result
    
    // Try to find a match where the artist name is included in the returned artist field
    if (artistName) {
        const artistMatch = results.find((item) => 
            item.artist?.name?.toLowerCase().includes(artistName.toLowerCase())
        );
        if (artistMatch) {
            match = artistMatch;
        }
    }
    
    return match;
}

