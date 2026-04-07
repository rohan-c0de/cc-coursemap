"use client";

import dynamic from "next/dynamic";
import type { Institution } from "@/lib/types";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse bg-gray-100 rounded-lg" />
  ),
});

interface Props {
  institution: Institution;
}

export default function CollegeMap({ institution }: Props) {
  if (!institution.campuses || institution.campuses.length === 0) return null;

  // Center on the first campus
  const center = {
    lat: institution.campuses[0].lat,
    lng: institution.campuses[0].lng,
  };

  return (
    <MapView
      institutions={[{ institution, distance: 0 }]}
      center={center}
      zoom={institution.campuses.length > 1 ? 10 : 13}
    />
  );
}
