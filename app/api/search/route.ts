import { NextRequest, NextResponse } from "next/server";
import { getZipCoordinates, findNearbyInstitutions } from "@/lib/geo";
import { getCourseCount } from "@/lib/courses";
import type { Institution } from "@/lib/types";
import institutionsData from "@/data/institutions.json";

const institutions = institutionsData as Institution[];

// Current term — update each semester
const CURRENT_TERM = "2026SP";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get("zip");
  const radius = parseInt(searchParams.get("radius") || "25", 10);

  if (!zip || !/^\d{5}$/.test(zip)) {
    return NextResponse.json(
      { error: "Please provide a valid 5-digit Virginia zip code." },
      { status: 400 }
    );
  }

  const coords = getZipCoordinates(zip);
  if (!coords) {
    return NextResponse.json(
      {
        error: `Zip code ${zip} not found in our Virginia database. Please try a different zip code.`,
      },
      { status: 404 }
    );
  }

  const results = findNearbyInstitutions(zip, radius, institutions);

  // Populate course counts
  const resultsWithCounts = results.map((result) => ({
    ...result,
    courseCount: getCourseCount(result.institution.vccs_slug, CURRENT_TERM),
  }));

  return NextResponse.json({
    results: resultsWithCounts,
    center: { lat: coords.lat, lng: coords.lng },
    city: coords.city,
    zip,
    radius,
    term: CURRENT_TERM,
  });
}
