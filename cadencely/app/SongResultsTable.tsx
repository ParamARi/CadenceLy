import { useMemo } from "react";
import type { SongSearchResult } from "@/lib/types";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";

const columnHelper = createColumnHelper<SongSearchResult>();

const songColumns = [
  columnHelper.accessor("title", {
    header: "Song",
    cell: (info) => (
      <div className="flex flex-col">
        <span className="font-semibold text-base">{info.getValue()}</span>
        <span className="text-xs opacity-60 mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
          {info.row.original.album.title}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("artist.name", {
    header: "Artist",
    cell: (info) => (
      <span className="font-medium opacity-90">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("tempo", {
    header: "BPM",
    cell: (info) => {
      const bpm = parseFloat(info.getValue());
      return (
        <div className="inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium bg-black/5 dark:bg-white/5 border border-[var(--border-color,currentColor)]/10">
          <span className="font-bold mr-1 text-indigo-600 dark:text-indigo-400">
            {isNaN(bpm) ? "-" : Math.round(bpm)}
          </span>
          <span className="opacity-60 text-[10px] uppercase tracking-wider">
            BPM
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("key_of", {
    header: "Key",
    cell: (info) => {
      const key = info.getValue() || "-";
      return (
        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-mono font-medium bg-black/5 dark:bg-white/5">
          {key}
        </span>
      );
    },
  }),
  columnHelper.accessor("danceability", {
    header: "Vibe",
    cell: (info) => {
      const score = info.getValue() * 100;
      return (
        <div className="flex items-center gap-2 min-w-[80px]">
          <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
            />
          </div>
          <span className="text-xs font-mono opacity-70 w-8 text-right">
            {Math.round(score)}%
          </span>
        </div>
      );
    },
  }),
];

type Props = {
  results: SongSearchResult[];
};

export default function SongResultsTable({ results }: Props) {
  const tableData = useMemo(() => results, [results]);

  const table = useReactTable({
    data: tableData,
    columns: songColumns,
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
                  <td
                    key={cell.id}
                    className="px-6 py-4 align-middle group-hover:pl-7 transition-all duration-200"
                  >
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
