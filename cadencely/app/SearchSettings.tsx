
export type SearchSettingsProps = {
  searchType: "song" | "artist" | "album";
  minBPM: number;
  maxBPM: number;
  onChange: (value: "song" | "artist" | "album") => void;
  onBpmChange: (minOrMax: "min" | "max", tempo: number) => void;
};

export default function SearchSettings({
  searchType,
  onChange,
  onBpmChange,
}: SearchSettingsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 px-6 md:grid-cols-2 md:gap-10 md:items-center">
      {/* Search type radios */}
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="searchType"
            value="song"
            checked={searchType === "song"}
            onChange={() => onChange("song")}
            className="h-5 w-5 border rounded-full focus:ring-2 [border-color:var(--border-color)]"
          />
          <span className="[color:var(--text-primary)]">Song</span>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="searchType"
            value="artist"
            checked={searchType === "artist"}
            onChange={() => onChange("artist")}
            className="h-5 w-5 border rounded-full focus:ring-2 [border-color:var(--border-color)]"
          />
          <span className="[color:var(--text-primary)]">Artist</span>
        </label>
        <div className="inline-flex items-center gap-2 cursor-pointer pr-4">
          <input
            type="radio"
            name="searchType"
            value="album"
            checked={searchType === "album"}
            onChange={() => onChange("album")}
            className="h-5 w-5 border rounded-full focus:ring-2 [border-color:var(--border-color)]"
          />
          <span className="[color:var(--text-primary)]">Album</span>
        </div>
        {/* Tempo range */}
        <div className="inline-flex items-center gap-2 cursor-pointer pl-4">
          <span className="[color:var(--text-primary)] pl-4">Tempo Range</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Min"
            onChange={(e) => onBpmChange("min", parseInt(e.target.value))}
            className="w-16 rounded border px-4 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 bg-inherit text-inherit"
          />
          <span className="[color:var(--text-secondary)]">–</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="Max"
            onChange={(e) => onBpmChange("max", parseInt(e.target.value))}
            className="w-16 rounded border px-2 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 bg-inherit text-inherit"
          />
        </div>
      </div>

      
    </div>
  );
}

