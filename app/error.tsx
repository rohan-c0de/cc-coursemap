"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <h1 className="text-4xl font-bold text-gray-200">Something went wrong</h1>
      <p className="mt-4 text-gray-600 text-center max-w-md">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 transition"
      >
        Try again
      </button>
    </div>
  );
}
