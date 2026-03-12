type Props = {
  value: "song" | "artist" | "album";
  onChange: (value: "song" | "artist" | "album") => void;
};

export default function SearchSettings({ value, onChange }: Props) {
  return (
    <div className="flex justify-center gap-4 text-sm mt-4 flex-wrap">
      <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="searchType"
        value="song"
        checked={value === "song"}
        onChange={() => onChange("song")}
        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      <span className="text-gray-700">Song</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="searchType"
        value="artist"
        checked={value === "artist"}
        onChange={() => onChange("artist")}
        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      <span className="text-gray-700">Artist</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="searchType"
        value="album"
        checked={value === "album"}
        onChange={() => onChange("album")}
        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
      />
      <span className="text-gray-700">Album</span>
      </label>
    </div>
  );
}

