/**
 * colleague-terms.ts — per-college term discovery for Ellucian Colleague
 * Self-Service deployments. Each scraper calls `resolveCollegeTerms(baseUrl)`
 * before scraping a college, asking *that* college which of the current,
 * next, and next-next calendar terms have live sections, and gets back the
 * site's own term codes.
 *
 * Issue #172: replaces the previous shared-sample model in resolve-terms.ts
 * (which probed one URL per state and assumed every Colleague install in the
 * state used the same term codes). That assumption broke for NJ — Bergen
 * returns "2026SU" while Passaic returns "26/SU1" — and we got a Passaic
 * crash through #171. Same risk exists for NC's 37 colleges, SC's 16, MD's
 * 10+, VT's 4. Per-college discovery removes the assumption entirely.
 *
 * Banner SSB scrapers already do this pattern (`getTerms` per college +
 * `pickRecentSsbTerms` filter); this brings Colleague to parity.
 */

import { currentCalendarTerm, nextTerm, type TermInfo } from "./resolve-terms";

interface ColleagueActivePlanTerm {
  Code: string;         // "2026SP", custom like "V26SP", or quirky like "26/SU1"
  Description: string;  // "Spring 2026", "CCV Spring 2026", "Summer 1 26/SU1", etc.
}

interface ColleagueSession {
  cookie: string;
  verificationToken: string;
}

/** Build the JSON payload Colleague's Knockout.js search form sends. */
function colleagueSearchPayload(termCodes: string[] = []): Record<string, unknown> {
  return {
    subjects: [], synonyms: [], academicLevels: [], courseLevels: [],
    courseTypes: [], topicCodes: [], terms: termCodes, days: [],
    locations: [], faculty: [], startDate: null, endDate: null,
    startTime: null, endTime: null, startsAtTime: null, endsByTime: null,
    keyword: null, requirement: null, subrequirement: null, group: null,
    courseIds: null, sectionIds: null, requirementText: null,
    subRequirementText: null, onlineCategories: null,
    pageNumber: 1, quantityPerPage: 1,
    openSections: null, openAndWaitlistedSections: null,
    keywordComponents: [],
    searchResultsView: "CatalogListing",
    sortOn: "None", sortDirection: "Ascending",
  };
}

/**
 * Colleague Self-Service's PostSearchCriteria endpoint requires an antiforgery
 * token (both as a cookie and as an `__RequestVerificationToken` header).
 * Prime a session by GETting the Search page, capturing Set-Cookie headers,
 * and extracting the hidden token from the HTML.
 */
async function openColleagueSession(baseUrl: string): Promise<ColleagueSession | null> {
  try {
    const res = await fetch(`${baseUrl}/Student/Courses/Search`, {
      headers: { "User-Agent": "CommunityCollegePath/1.0" },
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();

    const tokenMatch = html.match(
      /name="__RequestVerificationToken"[^>]*value="([^"]+)"/
    );
    if (!tokenMatch) return null;

    const setCookieHeaders =
      typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function"
        ? (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie()
        : res.headers.get("set-cookie")?.split(/,(?=[^;]+=[^;]+)/g) ?? [];

    const cookiePairs: string[] = [];
    for (const raw of setCookieHeaders) {
      const [pair] = raw.split(";");
      if (pair && pair.includes("=")) cookiePairs.push(pair.trim());
    }

    return { cookie: cookiePairs.join("; "), verificationToken: tokenMatch[1] };
  } catch {
    return null;
  }
}

async function colleaguePostSearch(
  baseUrl: string,
  session: ColleagueSession,
  termCodes: string[] = []
): Promise<{ TotalItems?: number; ActivePlanTerms?: ColleagueActivePlanTerm[] } | null> {
  try {
    const res = await fetch(`${baseUrl}/Student/Courses/PostSearchCriteria`, {
      method: "POST",
      headers: {
        "User-Agent": "CommunityCollegePath/1.0",
        "Content-Type": "application/json; charset=UTF-8",
        Accept: "application/json",
        "X-Requested-With": "XMLHttpRequest",
        "__RequestVerificationToken": session.verificationToken,
        Cookie: session.cookie,
      },
      body: JSON.stringify(colleagueSearchPayload(termCodes)),
      signal: AbortSignal.timeout(15_000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Match each candidate calendar term against the college's ActivePlanTerms.
 * Two strategies because Colleague deployments are inconsistent:
 *   (a) Description contains the calendar name ("Spring 2026"). Catches
 *       standard sites and multi-college sites like VSC where codes are
 *       custom (V26SP, S26SP) but descriptions still say "Spring 2026".
 *   (b) Code starts with the candidate's standard code ("2026SP"). Catches
 *       sites with weird description formats (e.g. FDTC says "Spring 25-26
 *       15-WK Term") but preserves the standard code convention, including
 *       mini-session variants like 2026SP2 / 2026SP3.
 */
function matchCandidates(
  active: ColleagueActivePlanTerm[],
  candidates: TermInfo[]
): { candidate: TermInfo; active: ColleagueActivePlanTerm }[] {
  const out: { candidate: TermInfo; active: ColleagueActivePlanTerm }[] = [];
  const seen = new Set<string>();
  for (const cand of candidates) {
    const nameLc = cand.name.toLowerCase();
    const codeLc = cand.code.toLowerCase();
    for (const t of active) {
      if (seen.has(t.Code)) continue;
      if (
        t.Description.toLowerCase().includes(nameLc) ||
        t.Code.toLowerCase().startsWith(codeLc)
      ) {
        seen.add(t.Code);
        out.push({ candidate: cand, active: t });
      }
    }
  }
  return out;
}

export interface CollegeTerm {
  /** Human-readable calendar name we use to identify the term in code paths
   *  that still take a `termName` (e.g. existing scrapeCollege signatures). */
  name: string;
  /** The site's native term code, used as-is for scrape requests + filenames. */
  code: string;
  /** The exact description string the site returned, useful for logs. */
  description: string;
  season: string;
  year: number;
}

/**
 * Discover which of the current, next, and next-next calendar terms have
 * live sections at this specific college, and return the site's native
 * codes for each. ~1 HTTP roundtrip + 1 verification POST per matched term.
 *
 * Returns an empty array if the college is offline, gates Self-Service
 * behind auth, or has no sections posted for any of the candidate terms.
 */
export async function resolveCollegeTerms(baseUrl: string): Promise<CollegeTerm[]> {
  const session = await openColleagueSession(baseUrl);
  if (!session) return [];

  const discovery = await colleaguePostSearch(baseUrl, session);
  if (!discovery?.ActivePlanTerms || discovery.ActivePlanTerms.length === 0) {
    return [];
  }

  const cur = currentCalendarTerm();
  const nxt = nextTerm(cur);
  const nxtNxt = nextTerm(nxt);
  const candidates = [cur, nxt, nxtNxt];

  const matches = matchCandidates(discovery.ActivePlanTerms, candidates);

  // Verify each candidate has sections posted before returning. Colleague
  // ActivePlanTerms often includes terms far into the future where the
  // catalog has been built but no sections exist yet.
  const found: CollegeTerm[] = [];
  for (const m of matches) {
    const verify = await colleaguePostSearch(baseUrl, session, [m.active.Code]);
    if ((verify?.TotalItems ?? 0) > 0) {
      found.push({
        name: m.candidate.name,
        code: m.active.Code,
        description: m.active.Description,
        season: m.candidate.season,
        year: m.candidate.year,
      });
    }
  }

  return found;
}
