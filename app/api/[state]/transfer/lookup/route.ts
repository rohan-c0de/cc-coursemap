import { NextResponse } from "next/server";
import { buildTransferLookup, getUniversities } from "@/lib/transfer";

// Cache the response since transfer data changes infrequently
let cachedResponse: string | null = null;

export async function GET() {
  if (!cachedResponse) {
    const lookup = buildTransferLookup();
    const universities = getUniversities();
    cachedResponse = JSON.stringify({ lookup, universities });
  }

  return new NextResponse(cachedResponse, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=86400", // 24h cache
    },
  });
}
