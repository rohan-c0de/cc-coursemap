"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const RADIUS_OPTIONS = [10, 25, 50] as const;

export default function SearchForm() {
  const router = useRouter();
  const [zip, setZip] = useState("");
  const [radius, setRadius] = useState<number>(25);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = zip.trim();
    if (!/^\d{5}$/.test(trimmed)) {
      setError("Please enter a valid 5-digit zip code.");
      return;
    }

    router.push(`/results?zip=${trimmed}&radius=${radius}`);
  }

  return (
    <form
      id="search"
      onSubmit={handleSubmit}
      className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg sm:p-8"
    >
      <h3 className="mb-1 text-center text-xl font-bold text-gray-900">
        Find Colleges Near You
      </h3>
      <p className="mb-6 text-center text-sm text-gray-500">
        Enter your zip code to discover audit-friendly courses nearby.
      </p>

      {/* Zip code input */}
      <div className="mb-5">
        <label
          htmlFor="zip"
          className="mb-1.5 block text-sm font-medium text-gray-700"
        >
          Zip Code
        </label>
        <input
          id="zip"
          type="text"
          inputMode="numeric"
          maxLength={5}
          placeholder="e.g. 22903"
          value={zip}
          onChange={(e) => {
            setZip(e.target.value.replace(/\D/g, "").slice(0, 5));
            if (error) setError(null);
          }}
          className={`w-full rounded-lg border px-4 py-3 text-lg tracking-widest placeholder:tracking-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 ${
            error
              ? "border-red-400 focus:ring-red-300"
              : "border-gray-300 focus:border-teal-500 focus:ring-teal-200"
          }`}
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? "zip-error" : undefined}
        />
        {error && (
          <p id="zip-error" className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Radius selector */}
      <div className="mb-6">
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          Search Radius
        </span>
        <div className="flex gap-2">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRadius(r)}
              className={`flex-1 rounded-lg border py-2.5 text-sm font-medium transition ${
                radius === r
                  ? "border-teal-600 bg-teal-600 text-white shadow-sm"
                  : "border-gray-300 bg-white text-gray-600 hover:border-teal-400 hover:text-teal-700"
              }`}
            >
              {r} miles
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        className="w-full rounded-lg bg-teal-600 px-6 py-3 text-base font-semibold text-white shadow transition hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2"
      >
        Find Colleges
      </button>
    </form>
  );
}
