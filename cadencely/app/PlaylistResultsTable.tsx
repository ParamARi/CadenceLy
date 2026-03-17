import { useState, useEffect } from "react";
import type { PlaylistSearchResult } from "@/lib/types";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Badge, Spinner, Card } from "flowbite-react";

function PlaylistTrackRow({ song, sIdx }: { song: any; sIdx: number }) {
  const [tempo, setTempo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchTempo() {
      setLoading(true);
      try {
        const query = `${song.title || song.name || ""} ${song.artists?.[0]?.name || ""}`.trim();
        const res = await fetch(`/api/songs?songName=${encodeURIComponent(query)}&type=song`);
        if (res.ok) {
          const data = await res.json();
          const match = data.search?.[0];
          if (isMounted) {
            if (match && match.tempo) {
              setTempo(Math.round(parseFloat(match.tempo)).toString());
            } else {
              setTempo("-");
            }
          }
        } else {
          if (isMounted) setTempo("-");
        }
      } catch (err) {
        if (isMounted) setTempo("-");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchTempo();
    return () => {
      isMounted = false;
    };
  }, [song.title, song.name, song.artists]);

  return (
    <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
      <TableCell className="w-10 opacity-50 font-mono text-xs text-right px-2 py-3">
        {sIdx + 1}.
      </TableCell>
      <TableCell className="px-2 py-3">
        <div className="flex flex-col max-w-[200px] sm:max-w-[300px]">
          <span className="font-medium text-gray-900 dark:text-white truncate" title={song.title || song.name}>
            {song.title || song.name}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate" title={song.artists?.map((a: any) => a.name).join(", ")}>
            {song.artists?.map((a: any) => a.name).join(", ")}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-2 py-3 text-right">
        {loading ? (
          <Spinner size="sm" />
        ) : tempo && tempo !== "-" ? (
          <Badge color="indigo" size="sm" className="w-fit inline-flex font-mono">{tempo} BPM</Badge>
        ) : (
          <span className="opacity-50 font-normal">-</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function SinglePlaylistView({ playlist }: { playlist: PlaylistSearchResult }) {
  const songs = playlist.songs || [];

  return (
    <Card className="mt-8 border-gray-200 dark:border-gray-700 shadow-md p-2">
      <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{playlist.name}</h2>
          <p className="opacity-70 mt-1 text-gray-600 dark:text-gray-400">
            {playlist.author} • {playlist.count} Tracks
          </p>
        </div>
        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-gray-500 dark:text-gray-400">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <Table hoverable className="w-full text-sm text-left">
          <TableBody className="divide-y">
            {songs.map((song: any, sIdx: number) => (
              <PlaylistTrackRow key={sIdx} song={song} sIdx={sIdx} />
            ))}
            {songs.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-sm opacity-50 italic text-center py-4 text-gray-900 dark:text-white">
                  No tracks found for this playlist.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

type Props = {
  results: PlaylistSearchResult[];
};

export default function PlaylistResultsTable({ results }: Props) {
  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="w-full">
      {results.map((playlist, idx) => (
        <SinglePlaylistView key={playlist.playlistId || idx} playlist={playlist} />
      ))}
    </div>
  );
}
