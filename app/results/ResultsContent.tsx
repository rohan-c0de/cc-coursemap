"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import CollegeCard from "@/components/CollegeCard";
import MapViewWrapper from "@/components/MapViewWrapper";
import type { Institution, SearchResult } from "@/lib/types";

export default function ResultsContent() {
  const searchParams = useSearchParams();
  const zip = searchParams.get("zip") || "";
  const radius = parseInt(searchParams.get("radius") || "25", 10);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [cityName, setCityName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!zip) {
      setError("No zip code provided.");
      setLoading(false);
      return;
    }

    async function fetchResults() {
      try {
        const res = await fetch(
          `/api/search?zip=${encodeURIComponent(zip)}&radius=${radius}`
        );
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || "Search failed.");
          setLoading(false);
          return;
        }
        const data = await res.json();
        setResults(data.results);
        setCenter(data.center);
        setCityName(data.city || "");
        setLoading(false);
      } catch {
        setError("Failed to load results. Please try again.");
        setLoading(false);
      }
    }

    fetchResults();
  }, [zip, radius]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Search Error
        </h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link
          href="/"
          className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
        >
          Try Again
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-teal-600 hover:text-teal-700 mb-2 inline-block"
        >
          &larr; New search
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          {results.length} College{results.length !== 1 ? "s" : ""} Near{" "}
          {cityName ? `${cityName} (${zip})` : zip}
        </h1>
        <p className="text-gray-600 mt-1">
          Within {radius} miles &middot; Showing colleges with course listings
          this term
        </p>
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-gray-600 mb-4">
            No colleges found within {radius} miles of {zip}.
          </p>
          <p className="text-gray-500 mb-6">
            Try increasing the search radius or checking a different zip code.
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Search Again
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Left panel — college list */}
          <div className="lg:col-span-3 space-y-4">
            {results.map((result) => (
              <CollegeCard
                key={result.institution.id}
                institution={result.institution}
                distance={result.distance}
                courseCount={result.courseCount}
              />
            ))}
          </div>

          {/* Right panel — map */}
          <div className="lg:col-span-2">
            <div className="sticky top-24 h-[500px] lg:h-[calc(100vh-8rem)]">
              {center && (
                <MapViewWrapper
                  institutions={results.map((r) => ({
                    institution: r.institution,
                    distance: r.distance,
                  }))}
                  center={center}
                  zoom={radius <= 10 ? 11 : radius <= 25 ? 9 : 8}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
