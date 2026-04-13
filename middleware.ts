import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

/**
 * Next.js middleware — runs on every matched request.
 *
 * Single purpose: refresh the Supabase auth session cookie.
 * Does NOT block or redirect any routes. Every page stays publicly accessible.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Static assets (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
