import { useMemo, Fragment } from "react";
import type { SongSearchResult } from "@/lib/types";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeadCell, TableRow, Badge, Progress } from "flowbite-react";

const columnHelper = createColumnHelper<SongSearchResult>();

const songColumns = [
  columnHelper.accessor("title", {
    header: "Song",
    cell: (info) => (
      <div className="flex flex-col">
        <span className="font-semibold text-base text-gray-900 dark:text-white">{info.getValue()}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate max-w-[200px] sm:max-w-[300px]">
          {info.row.original.album.title}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("artist.name", {
    header: "Artist",
    cell: (info) => (
      <span className="font-medium text-gray-700 dark:text-gray-300">{info.getValue()}</span>
    ),
  }),
  columnHelper.accessor("tempo", {
    header: "BPM",
    cell: (info) => {
      const bpm = parseFloat(info.getValue());
      return (
        <Badge color="indigo" size="sm" className="w-fit">
          {isNaN(bpm) ? "-" : Math.round(bpm)} BPM
        </Badge>
      );
    },
  }),
  columnHelper.accessor("key_of", {
    header: "Key",
    cell: (info) => {
      const key = info.getValue() || "-";
      return (
        <Badge color="gray" size="sm" className="w-fit font-mono">
          {key}
        </Badge>
      );
    },
  }),
  columnHelper.accessor("danceability", {
    header: "Vibe",
    cell: (info) => {
      const score = info.getValue() * 100;
      return (
        <div className="flex items-center gap-3 min-w-[100px]">
          <Progress 
            progress={Math.max(0, Math.min(100, score))} 
            color="purple" 
            size="sm" 
            className="flex-1"
          />
          <span className="text-xs font-mono text-gray-500 w-8 text-right">
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
    <div className="mt-8 shadow-md rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="overflow-x-auto">
        <Table hoverable>
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Fragment key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHeadCell key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHeadCell>
                ))}
              </Fragment>
            ))}
          </TableHead>
          <TableBody className="divide-y">
            {table.getRowModel().rows.map((row) => (
              <TableRow key={row.id} className="bg-white dark:bg-gray-800 dark:border-gray-700">
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
