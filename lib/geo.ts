import type { Institution, SearchResult } from "./types";

// Static zip code data loaded once at module level
let zipData: Record<string, { lat: number; lng: number; city: string }> | null =
  null;

function loadZipData(): Record<
  string,
  { lat: number; lng: number; city: string }
> {
  if (!zipData) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      zipData = require("@/data/virginia-zipcodes.json");
    } catch {
      zipData = {};
    }
  }
  return zipData!;
}

/**
 * Look up coordinates and city name for a Virginia ZIP code.
 * Returns null if the ZIP code is not found in the static dataset.
 */
export function getZipCoordinates(
  zip: string
): { lat: number; lng: number; city: string } | null {
  const data = loadZipData();
  const entry = data[zip];
  return entry ?? null;
}

/**
 * Find zip codes matching a city name (case-insensitive).
 * Returns the first match's zip code, or null if not found.
 */
export function findZipByCity(
  cityQuery: string
): { zip: string; lat: number; lng: number; city: string } | null {
  const data = loadZipData();
  const query = cityQuery.trim().toLowerCase();
  if (!query) return null;

  // Exact match first
  for (const [zip, entry] of Object.entries(data)) {
    if (entry.city.toLowerCase() === query) {
      return { zip, ...entry };
    }
  }

  // Prefix match as fallback
  for (const [zip, entry] of Object.entries(data)) {
    if (entry.city.toLowerCase().startsWith(query)) {
      return { zip, ...entry };
    }
  }

  return null;
}

/**
 * Resolve a user query (zip code or city name) to coordinates.
 * Returns zip, coordinates, and city name, or null if not found.
 */
export function resolveLocation(
  query: string
): { zip: string; lat: number; lng: number; city: string } | null {
  const trimmed = query.trim();

  // If it looks like a zip code, try that first
  if (/^\d{5}$/.test(trimmed)) {
    const coords = getZipCoordinates(trimmed);
    if (coords) return { zip: trimmed, ...coords };
  }

  // Otherwise try city name lookup
  return findZipByCity(trimmed);
}

/**
 * Calculate the great-circle distance between two points using the Haversine
 * formula.
 * @returns distance in miles
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const EARTH_RADIUS_MILES = 3958.8;

  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_MILES * c;
}

/**
 * Find institutions within a given radius of coordinates, sorted by distance
 * to the nearest campus.
 */
export function findNearbyInstitutions(
  lat: number,
  lng: number,
  radiusMiles: number,
  institutions: Institution[]
): SearchResult[] {
  const results: SearchResult[] = [];

  for (const institution of institutions) {
    // Find the distance to the nearest campus
    let minDistance = Infinity;

    for (const campus of institution.campuses) {
      const dist = calculateDistance(
        lat,
        lng,
        campus.lat,
        campus.lng
      );
      if (dist < minDistance) {
        minDistance = dist;
      }
    }

    if (minDistance <= radiusMiles) {
      results.push({
        institution,
        distance: Math.round(minDistance * 10) / 10, // round to 1 decimal
        courseCount: 0, // caller should populate with actual course count
      });
    }
  }

  // Sort by distance ascending
  results.sort((a, b) => a.distance - b.distance);

  return results;
}
