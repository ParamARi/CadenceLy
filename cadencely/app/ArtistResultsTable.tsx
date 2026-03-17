import { useMemo, Fragment, useState, useEffect } from "react";
import type { ArtistSearchResult, ArtistAlbum } from "@/lib/types";
import {
  useReactTable,
  getCoreRowModel,
  getExpandedRowModel,
  flexRender,
  createColumnHelper,
  ExpandedState,
} from "@tanstack/react-table";
import { searchAlbumsApi } from "@/lib/search";
import { findBestSongMatch } from "@/lib/filters";
import { Spinner, Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Badge, Button, Card } from "flowbite-react";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";

function TrackRow({ song, sIdx, artistName }: { song: any; sIdx: number; artistName: string }) {
  const [tempo, setTempo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchTempo() {
      setLoading(true);
      try {
        const query = song.name.trim();
        const res = await fetch(`/api/songs?songName=${encodeURIComponent(query)}&type=song`);
        if (res.ok) {
          const data = await res.json();
          const match = findBestSongMatch(data.search || [], artistName);

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
  }, [song.name, artistName]);

  return (
    <TableRow className="bg-white dark:border-gray-700 dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
      <TableCell className="w-10 opacity-50 font-mono text-xs text-right px-2 py-3">
        {sIdx + 1}.
      </TableCell>
      <TableCell className="font-medium text-gray-900 dark:text-white px-2 py-3 truncate max-w-[200px]" title={song.name}>
        {song.name}
      </TableCell>
      <TableCell className="px-2 py-3 text-right">
        {loading ? (
          <Spinner size="sm" />
        ) : tempo && tempo !== "-" ? (
          <Badge color="indigo" size="sm" className="w-fit inline-flex font-mono">{tempo} BPM</Badge>
        ) : (
          <span className="opacity-50 text-xs italic">Not Found</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function ExpandedAlbumRow({ albumId, artistName }: { albumId: string; artistName: string }) {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSongs() {
      setLoading(true);
      try {
        const fetchedSongs = await searchAlbumsApi(albumId);
        if (isMounted) setSongs(fetchedSongs);
      } catch (e) {
        console.error("Failed to load album tracklist", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSongs();
    return () => {
      isMounted = false;
    };
  }, [albumId]);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 shadow-inner">
      <div className="px-2 sm:px-4">
        <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70 mb-4 ml-2 flex items-center justify-between text-gray-900 dark:text-white">
          <span>Tracklist</span>
        </h3>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-8">
            <Spinner size="xl" className="mb-3" />
            <span className="text-sm font-medium opacity-70 animate-pulse text-gray-900 dark:text-white">Loading tracks...</span>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            <Table hoverable className="w-full text-sm text-left">
              <TableBody className="divide-y">
                {songs.map((song: any, sIdx: number) => (
                  <TrackRow
                    key={sIdx}
                    song={song}
                    sIdx={sIdx}
                    artistName={artistName}
                  />
                ))}
                {songs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm opacity-50 italic py-4 text-center">No tracks found for this album.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}

const albumColumnHelper = createColumnHelper<ArtistAlbum & { artistName: string }>();

const albumColumns = [
  albumColumnHelper.display({
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          color="gray"
          size="xs"
          pill
          className="border-none hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={row.getToggleExpandedHandler()}
        >
          {row.getIsExpanded() ? (
            <HiChevronUp className="h-5 w-5" />
          ) : (
            <HiChevronDown className="h-5 w-5" />
          )}
        </Button>
      ) : null;
    },
  }),
  albumColumnHelper.accessor("title", {
    header: "Album",
    cell: (info) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-gray-500 dark:text-gray-400"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-base text-gray-900 dark:text-white">{info.getValue()}</span>
          <span className="text-xs opacity-60 mt-0.5 text-gray-500 dark:text-gray-400">{info.row.original.artistName}</span>
        </div>
      </div>
    ),
  }),
  albumColumnHelper.accessor("year", {
    header: "Year",
    cell: (info) => (
      <Badge color="gray" size="sm" className="w-fit font-mono">
        {info.getValue() || "-"}
      </Badge>
    ),
  }),
  albumColumnHelper.display({
    id: "tracks",
    header: "Action",
    cell: (info) => {
      const isExpanded = info.row.getIsExpanded();
      return (
        <Button
          color={isExpanded ? "dark" : "light"}
          size="sm"
          onClick={info.row.getToggleExpandedHandler()}
        >
          {isExpanded ? "Close Tracklist" : "View Tracklist"}
        </Button>
      );
    },
  }),
];

function SingleAlbumTracklist({ album, artistName }: { album: ArtistAlbum; artistName: string }) {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadSongs() {
      setLoading(true);
      try {
        const fetchedSongs = await searchAlbumsApi(album.uri);
        if (isMounted) setSongs(fetchedSongs);
      } catch (e) {
        console.error("Failed to load album tracklist", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadSongs();
    return () => {
      isMounted = false;
    };
  }, [album.uri]);

  return (
    <Card className="my-8 border-gray-200 dark:border-gray-700 shadow-md p-2">
      <div className="flex items-start justify-between border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{album.title}</h2>
          <p className="opacity-70 mt-1 text-gray-600 dark:text-gray-400">{artistName} • {album.year} {loading ? "• Loading Tracks..." : `• ${songs.length} Tracks`}</p>
        </div>
        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-gray-500 dark:text-gray-400"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center py-6">
          <Spinner size="xl" className="mb-3" />
          <span className="text-sm font-medium opacity-70 animate-pulse text-gray-900 dark:text-white">Loading tracks...</span>
        </div>
      ) : (
        <Table hoverable className="w-full text-sm text-left">
          <TableBody className="divide-y">
            {songs.map((song: any, sIdx: number) => (
              <TrackRow key={sIdx} song={song} sIdx={sIdx} artistName={artistName} />
            ))}
            {songs.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-sm opacity-50 italic text-center py-4 text-gray-900 dark:text-white">No tracks found for this album.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}

type Props = {
  results: ArtistSearchResult[];
};

export default function ArtistResultsTable({ results }: Props) {
  // Flatten all albums from all artists returned
  const allAlbumsWithArtist = useMemo(() => {
    return results.flatMap((artist) =>
      (artist.albums || []).map((album) => ({
        ...album,
        artistName: artist.name,
      }))
    );
  }, [results]);

  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data: allAlbumsWithArtist,
    columns: albumColumns,
    state: {
      expanded,
    },
    onExpandedChange: setExpanded,
    getRowCanExpand: (row) => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
  });

  if (!results || results.length === 0 || allAlbumsWithArtist.length === 0) {
    return null;
  }

  // If there is only exactly one album, show all songs directly
  if (allAlbumsWithArtist.length === 1) {
    return <SingleAlbumTracklist album={allAlbumsWithArtist[0]} artistName={allAlbumsWithArtist[0].artistName} />;
  }

  // Otherwise show the list of albums
  return (
    <div className="my-8 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="overflow-x-auto">
        <Table hoverable className="w-full text-sm text-left">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeadCell key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHeadCell>
                ))}
              </TableRow>
            ))}
          </TableHead>
          <TableBody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow 
                  className={`bg-white dark:border-gray-700 dark:bg-gray-800 cursor-pointer ${
                    row.getIsExpanded() ? "bg-gray-50 dark:bg-gray-700/50" : ""
                  }`}
                  onClick={row.getToggleExpandedHandler()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow className="bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <TableCell colSpan={row.getVisibleCells().length} className="p-0 border-b border-gray-200 dark:border-gray-700">
                      <ExpandedAlbumRow albumId={row.original.uri} artistName={row.original.artistName} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
