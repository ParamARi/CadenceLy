"use client";

import { useTheme } from "@/lib/ThemeContext";

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setTheme("light")}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          theme === "light"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Light
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          theme === "dark"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        Dark
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          theme === "system"
            ? "bg-blue-600 text-white"
            : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-600"
        }`}
      >
        System
      </button>
    </div>
  );
}
