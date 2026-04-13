import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24 bg-white dark:bg-slate-900 min-h-screen">
      <h1 className="text-6xl font-bold text-gray-200 dark:text-slate-700">404</h1>
      <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-slate-100">
        Page not found
      </h2>
      <p className="mt-2 text-gray-600 dark:text-slate-400 text-center max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or may have been
        moved.
      </p>
      <div className="mt-6 flex gap-3">
        <Link
          href="/"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
        >
          Go Home
        </Link>
        <Link
          href="/colleges"
          className="rounded-lg border border-gray-300 dark:border-slate-600 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition"
        >
          Browse Colleges
        </Link>
      </div>
    </div>
  );
}
