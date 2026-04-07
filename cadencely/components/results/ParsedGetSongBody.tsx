/**
 * Shared “Parsed (GetSong)” display used by track tables and song search.
 */
export function ParsedGetSongBody({
  parsedArtist,
  parsedSong,
  matchedArtist,
  matchedSong,
}: {
  parsedArtist: string | null;
  parsedSong: string | null;
  matchedArtist: string | null;
  matchedSong: string | null;
}) {
  if (parsedArtist && parsedSong) {
    return (
      <div className="flex flex-col text-[11px] text-gray-600 dark:text-gray-300 max-w-[180px] sm:max-w-[220px]">
        <span className="font-medium truncate" title={parsedArtist}>
          Parsed Artist: {parsedArtist} -- Matched Artist: {matchedArtist}
        </span>
        <span className="truncate opacity-80" title={parsedSong}>
          Parsed Song: {parsedSong} -- Matched Song: {matchedSong}
        </span>
      </div>
    );
  }

  return (
    <span className="text-xs text-gray-400 dark:text-gray-500 italic">—</span>
  );
}
