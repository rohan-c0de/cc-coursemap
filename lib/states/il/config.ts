import type { StateConfig } from "../registry";

const ilConfig: StateConfig = {
  slug: "il",
  name: "Illinois",
  systemName: "Illinois Community Colleges",
  systemFullName: "Illinois Community College Board (ICCB)",
  systemUrl: "https://www.iccb.org/",
  collegeCount: 48,

  // TODO: research senior-waiver statute for Illinois.
  // Illinois Public Act 093-0228 waives tuition for seniors 65+ at public CCs,
  // but enrollment is space-available. Verify details before enabling.
  seniorWaiver: null,

  transferSupported: false,
  popularCourses: [],
  defaultZip: "60601",
  defaultZipCity: "Chicago",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://www.iccb.org/",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://www.iccb.org/",

  branding: {
    siteName: "Community College Path Illinois",
    tagline: "Search courses across all 48 Illinois community colleges.",
    footerText: "Community College Path Illinois — Find courses across all 48 Illinois community colleges.",
    disclaimer: "This is an independent project and is not affiliated with, endorsed by, or sponsored by the Illinois Community College Board (ICCB).",
    metaKeywords: [
      "Illinois community college courses",
      "Illinois community college search",
      "ICCB course finder",
    ],
  },
  scrapers: {
    courses: [
      // CCC (City Colleges of Chicago) — 7 colleges, shared JSON API.
      // Single fetch returns all sections; no auth or pagination needed.
      { scripts: ["scripts/il/scrape-ccc.ts"], runner: "http" },
      // IECC (Illinois Eastern) — 4 colleges share one Banner SSB host,
      // split by campusDescription.
      { scripts: ["scripts/il/scrape-iecc.ts"], runner: "http" },
      // manual-only: remaining 18 custom-platform colleges need bespoke scrapers.
    ],
    // manual-only: transfers — Phase 3 (transfer-equiv) not yet wired up.
    // manual-only: prereqs — Phase 4.
    // manual-only: programs — Phase 5+.
  },
};

export default ilConfig;
