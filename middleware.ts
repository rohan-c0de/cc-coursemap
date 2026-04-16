import { updateSession } from "@/lib/supabase/middleware";
import type { NextRequest } from "next/server";

/**
 * Next.js middleware — refreshes the Supabase auth session cookie.
 *
 * CRITICAL: only runs on auth-dependent routes. Running this on public pages
 * (college, course, subject, transfer, etc.) forces Next.js to emit
 * `cache-control: private, no-cache, no-store` because the middleware
 * reads/writes session cookies, which kills ISR edge caching and forces a
 * full server re-render on every request.
 *
 * Only the 3 server files that import `@/lib/supabase/server` need this:
 *   - app/account/page.tsx
 *   - app/api/account/delete/route.ts
 *   - app/auth/callback/route.ts
 *
 * Client components that need to know the user is logged in should use
 * `createBrowserClient` and fetch the session client-side.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/api/account/:path*",
    "/auth/:path*",
  ],
};
