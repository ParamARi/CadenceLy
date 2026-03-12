import { useEffect, useRef } from "react";
import type { ArtistSearchResult } from "@/lib/types";
import type { ColDef, GridApi, GridOptions } from "ag-grid-community";
import { createGrid } from "ag-grid-community";

type Props = {
  results: ArtistSearchResult[];
};

export default function ArtistResultsTable({ results }: Props) {
  const gridRef = useRef<HTMLDivElement | null>(null);
  const gridApiRef = useRef<GridApi | null>(null);

  useEffect(() => {
    if (!gridRef.current || gridApiRef.current) return;

    const columnDefs: ColDef[] = [
      {
        headerName: "Artist",
        field: "name",
        valueGetter: (params) => params.data?.name ?? "Unknown",
      },
      {
        headerName: "Genre",
        field: "genres",
        valueGetter: (params) =>
          params.data?.genres?.length ? params.data.genres.join(", ") : "—",
      },
      {
        headerName: "Albums",
        field: "albums",
        valueGetter: (params) =>
          params.data?.albums?.length
            ? params.data.albums.map((album: { title: string }) => album.title).join(", ")
            : "—",
      },
    ];

    const gridOptions: GridOptions = {
      columnDefs,
      rowData: results,
      defaultColDef: {
        sortable: true,
        filter: true,
        resizable: true,
        flex: 1,
        minWidth: 140,
      },
      domLayout: "autoHeight",
    };

    const api = createGrid(gridRef.current, gridOptions);
    gridApiRef.current = api;

    return () => {
      gridApiRef.current?.destroy();
      gridApiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (gridApiRef.current) {
      gridApiRef.current.setRowData(results);
    }
  }, [results]);

  if (!results.length) return null;

  return (
    <div className="mt-4 ag-theme-quartz" ref={gridRef} />
  );
}

