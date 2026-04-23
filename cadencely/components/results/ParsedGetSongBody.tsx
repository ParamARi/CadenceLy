/**
 * Shared “Parsed (GetSong)” display used by track tables and song search.
 * Always uses the two-line layout so the column stays consistent; missing
 * values render as an em dash.
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
  const pa = parsedArtist?.trim() || "—";
  const ps = parsedSong?.trim() || "—";
  const ma = matchedArtist?.trim() || "—";
  const ms = matchedSong?.trim() || "—";

  return (
    <div className="flex max-w-[180px] flex-col text-[11px] text-gray-600 dark:text-gray-300 sm:max-w-[220px]">
      <span className="truncate font-medium" title={`${pa} / ${ma}`}>
        Parsed Artist: {pa} — Matched Artist: {ma}
      </span>
      <span className="truncate opacity-80" title={`${ps} / ${ms}`}>
        Parsed Song: {ps} — Matched Song: {ms}
      </span>
    </div>
  );
}
