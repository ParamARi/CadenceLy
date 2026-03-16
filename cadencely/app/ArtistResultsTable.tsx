import { useMemo } from "react";
import type { ArtistSearchResult } from "@/lib/types";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

const columnHelper = createColumnHelper<ArtistSearchResult>();

const artistColumns = [
  columnHelper.accessor("name", {
    header: "Artist",
    cell: (info) => (
      <div className="flex items-center gap-3">
        {/* Placeholder avatar for a nice look */}
        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-[var(--border-color,currentColor)]/10 flex items-center justify-center">
          <span className="text-lg font-bold opacity-70 uppercase">
            {info.getValue()?.charAt(0) || "?"}
          </span>
        </div>
        <span className="font-semibold text-base">{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("genres", {
    header: "Genres",
    cell: (info) => {
      const genres = info.getValue() || [];
      if (genres.length === 0) return <span className="opacity-40 italic">Unknown</span>;
      return (
        <div className="flex flex-wrap gap-1.5">
          {genres.slice(0, 3).map((genre, i) => (
            <span
              key={i}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/5 dark:bg-white/10 border border-[var(--border-color,currentColor)]/10 shadow-sm"
            >
              {genre}
            </span>
          ))}
          {genres.length > 3 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-black/5 dark:bg-white/10 border border-[var(--border-color,currentColor)]/10 shadow-sm opacity-70">
              +{genres.length - 3}
            </span>
          )}
        </div>
      );
    },
  }),
  columnHelper.accessor("albums", {
    header: "Releases",
    cell: (info) => {
      const count = info.getValue()?.length || 0;
      return (
        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-black/5 dark:bg-white/5">
          <span className="font-bold mr-1">{count}</span>
          <span className="opacity-70 text-xs uppercase tracking-wider">{count === 1 ? "Album" : "Albums"}</span>
        </span>
      );
    },
  }),
];

type Props = {
  results: ArtistSearchResult[];
};

export default function ArtistResultsTable({ results }: Props) {
  const tableData = useMemo(() => results, [results]);

  const table = useReactTable({
    data: tableData,
    columns: artistColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (!results || results.length === 0) {
    return null;
  }

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-[var(--border-color,currentColor)]/20 shadow-md mt-8 bg-[var(--bg-secondary,transparent)] backdrop-blur-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-[var(--border-color,currentColor)]/20 bg-black/5 dark:bg-white/5 text-xs uppercase tracking-wider font-semibold opacity-80">
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
          <tbody className="divide-y divide-[var(--border-color,currentColor)]/10">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200 group"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 align-middle group-hover:pl-7 transition-all duration-200">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
