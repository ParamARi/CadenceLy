import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        Page not found
      </h1>
      <Link
        href="/"
        className="text-indigo-600 underline decoration-indigo-400 underline-offset-2 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
      >
        Back to home
      </Link>
    </div>
  );
}
