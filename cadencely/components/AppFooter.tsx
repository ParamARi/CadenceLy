export default function AppFooter() {
  return (
    <footer className="w-full shrink-0 border-t border-gray-200 py-3 px-4 text-center text-xs text-gray-500 dark:border-gray-700 dark:text-gray-400">
      <p>
        This app uses the{" "}
        <a
          href="https://getsongbpm.com/api"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-gray-400 underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300"
        >
          GetSongBPM API
        </a>{" "}
        for BPM data.
      </p>
    </footer>
  );
}
