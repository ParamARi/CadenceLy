type Props = {
  value: "song" | "artist" | "album";
  onChange: (value: "song" | "artist" | "album") => void;
};

export default function SearchTypeToggle({ value, onChange }: Props) {
  return (
    <div className="flex justify-center gap-6 text-sm mt-2 flex-wrap">
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="searchType"
          value="song"
          checked={value === "song"}
          onChange={() => onChange("song")}
          className="h-4 w-4"
        />
        <span>Song</span>
      </label>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="searchType"
          value="artist"
          checked={value === "artist"}
          onChange={() => onChange("artist")}
          className="h-4 w-4"
        />
        <span>Artist</span>
      </label>
      <label className="inline-flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="searchType"
          value="album"
          checked={value === "album"}
          onChange={() => onChange("album")}
          className="h-4 w-4"
        />
        <span>Album</span>
      </label>
    </div>
  );
}

