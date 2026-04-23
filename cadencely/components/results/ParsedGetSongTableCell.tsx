import { TableCell } from "flowbite-react";
import { ParsedGetSongBody } from "@/components/results/ParsedGetSongBody";

type Props = {
  parsedArtist: string | null;
  parsedSong: string | null;
  matchedArtist: string | null;
  matchedSong: string | null;
};

/**
 * Table cell wrapper for Parsed (GetSong) column in artist/playlist track tables.
 */
export function ParsedGetSongTableCell({
  parsedArtist,
  parsedSong,
  matchedArtist,
  matchedSong,
}: Props) {
  return (
    <TableCell className="px-2 py-3 max-w-[180px] sm:max-w-[220px]">
      <ParsedGetSongBody
        parsedArtist={parsedArtist}
        parsedSong={parsedSong}
        matchedArtist={matchedArtist}
        matchedSong={matchedSong}
      />
    </TableCell>
  );
}
