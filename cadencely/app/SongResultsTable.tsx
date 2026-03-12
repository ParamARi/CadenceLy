import { useEffect, useRef } from "react";
import type { SongSearchResult } from "@/lib/types";
import { useMemo } from "react";
import { useReactTable, getCoreRowModel, flexRender } from "@tanstack/react-table";


const songColumns = [
  {
    header: "Artist",
    accessorKey: "artist.name",
  },
  {
    header: "Song",
  },
  {
    header: "Genre",
    accessorKey: "artist.genres",
  },
  {
    header: "BPM",
    accessorKey: "tempo",
  }
];

type Props = {
  results: SongSearchResult[];
};

export default function SongResultsTable({ results }: Props) {
  // const gridRef = useRef<HTMLDivElement | null>(null);
  // const gridApiRef = useRef<GridApi | null>(null);
  const tableRef = useRef<HTMLTableElement | null>(null);
  const tableData = useMemo(() => results, [results]);

  const table = useReactTable({
    data: tableData,
    columns: songColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  useEffect(() => {
    
  }, [results]);

  if (!results.length) {console.log("No results"); return null;}

  return (
    <table>
      <thead>
        {table.getHeaderGroups().map((headerGroup) => ( 
          <tr key={headerGroup.id}>
            flexRender(header.column.columnDef.header, header.getContext())
          </tr>
        ))}
      </thead>
      <tbody>
      {table.getRowModel().rows.map((row) => (
          <tr key={row.id}>
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id}>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

