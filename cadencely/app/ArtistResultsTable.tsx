import { useMemo, Fragment, useState, useEffect, useCallback } from "react";
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

function TrackRow({ song, sIdx, artistName }: { song: any; sIdx: number; artistName: string }) {
  const [tempo, setTempo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchTempo() {
      setLoading(true);
      try {
        const query = `${song.name} ${artistName || ""}`.trim();
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
  }, [song.name, artistName]);

  return (
    <li className="flex gap-3 justify-between items-center py-2 border-b border-[var(--border-color,currentColor)]/5 last:border-0 hover:bg-[var(--bg-secondary)] px-2 rounded-md transition-colors">
      <div className="flex gap-3 items-center min-w-0">
        <span className="opacity-50 w-5 text-right flex-shrink-0 text-xs font-mono">{sIdx + 1}.</span>
        <span className="truncate text-sm font-medium" title={song.name}>
          {song.name}
        </span>
      </div>
      <div className="flex-shrink-0 text-xs font-mono bg-[var(--bg-primary)] px-2 py-1 rounded-md text-[var(--text-primary)] font-bold min-w-[60px] text-center border border-[var(--border-color)]">
        {loading ? (
          <span className="animate-pulse">...</span>
        ) : tempo && tempo !== "-" ? (
          `${tempo} BPM`
        ) : (
          <span className="opacity-50 font-normal">-</span>
        )}
      </div>
    </li>
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
    <div className="p-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)] shadow-inner">
      <div className="px-4">
        <h3 className="text-xs uppercase tracking-wider font-semibold opacity-70 mb-4 ml-2 flex items-center justify-between text-[var(--text-primary)]">
          <span>Tracklist</span>
        </h3>
        
        {loading ? (
          <div className="flex flex-col justify-center items-center py-8">
            <svg className="animate-spin h-6 w-6 text-[var(--text-primary)] mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-medium opacity-70 animate-pulse text-[var(--text-primary)]">Loading tracks...</span>
          </div>
        ) : (
          <ul className="flex flex-col gap-1 max-h-[400px] overflow-y-auto pr-4 custom-scrollbar">
            {songs.map((song: any, sIdx: number) => (
              <TrackRow
                key={sIdx}
                song={song}
                sIdx={sIdx}
                artistName={artistName}
              />
            ))}
            {songs.length === 0 && (
              <li className="text-sm opacity-50 italic py-4 ml-2 text-center">No tracks found for this album.</li>
            )}
          </ul>
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
        <button
          {...{
            onClick: row.getToggleExpandedHandler(),
            className:
              "p-1.5 rounded-md bg-[var(--bg-secondary)] hover:brightness-95 transition-colors text-[var(--text-primary)] border border-[var(--border-color)]",
          }}
        >
          {row.getIsExpanded() ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)]"><polyline points="6 9 12 15 18 9"></polyline></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-primary)]"><polyline points="9 18 15 12 9 6"></polyline></svg>
          )}
        </button>
      ) : null;
    },
  }),
  albumColumnHelper.accessor("title", {
    header: "Album",
    cell: (info) => (
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 flex-shrink-0 rounded bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-[var(--text-primary)]"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-base text-[var(--text-primary)]">{info.getValue()}</span>
          <span className="text-xs opacity-60 mt-0.5 text-[var(--text-primary)]">{info.row.original.artistName}</span>
        </div>
      </div>
    ),
  }),
  albumColumnHelper.accessor("year", {
    header: "Year",
    cell: (info) => (
      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-primary)]">
        {info.getValue() || "-"}
      </span>
    ),
  }),
  albumColumnHelper.display({
    id: "tracks",
    header: "Action",
    cell: (info) => {
      const isExpanded = info.row.getIsExpanded();
      return (
        <span 
          onClick={info.row.getToggleExpandedHandler()}
          className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors border border-[var(--border-color)] ${
            isExpanded 
              ? "bg-[var(--text-primary)] text-[var(--bg-primary)] opacity-90" 
              : "bg-[var(--bg-secondary)] text-[var(--text-primary)] hover:brightness-95"
          }`}
        >
          {isExpanded ? "Close Tracklist" : "View Tracklist"}
        </span>
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
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-color)] shadow-md mt-8 bg-[var(--bg-primary)] p-6">
      <div className="flex items-end justify-between mb-6 border-b border-[var(--border-color)] pb-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)]">{album.title}</h2>
          <p className="opacity-70 mt-1 text-[var(--text-primary)]">{artistName} • {album.year} {loading ? "• Loading Tracks..." : `• ${songs.length} Tracks`}</p>
        </div>
        <div className="h-16 w-16 flex-shrink-0 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 text-[var(--text-primary)]"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="3"></circle></svg>
        </div>
      </div>
      
      {loading ? (
        <div className="flex flex-col justify-center items-center py-6">
          <svg className="animate-spin h-6 w-6 text-[var(--text-primary)] mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-sm font-medium opacity-70 animate-pulse text-[var(--text-primary)]">Loading tracks...</span>
        </div>
      ) : (
        <ul className="space-y-1">
          {songs.map((song: any, sIdx: number) => (
            <TrackRow key={sIdx} song={song} sIdx={sIdx} artistName={artistName} />
          ))}
          {songs.length === 0 && (
            <li className="text-sm opacity-50 italic text-center py-4 text-[var(--text-primary)]">No tracks found for this album.</li>
          )}
        </ul>
      )}
    </div>
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
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-color)] shadow-md mt-8 bg-[var(--bg-primary)]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)] text-xs uppercase tracking-wider font-semibold opacity-80 text-[var(--text-primary)]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    scope="col"
                    className="px-6 py-5 whitespace-nowrap"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <tr
                  className={`hover:bg-[var(--bg-secondary)] transition-all duration-200 group cursor-pointer ${
                    row.getIsExpanded() ? "bg-[var(--bg-secondary)]" : ""
                  }`}
                  onClick={row.getToggleExpandedHandler()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 align-middle group-hover:pl-7 transition-all duration-200"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
                {row.getIsExpanded() && (
                  <tr>
                    <td colSpan={row.getVisibleCells().length} className="p-0 border-t-0">
                      <ExpandedAlbumRow albumId={row.original.uri} artistName={row.original.artistName} />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {/* <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(150, 150, 150, 0.3);
          border-radius: 6px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(150, 150, 150, 0.5);
        }
      `}} /> */}
    </div>
  );
}
