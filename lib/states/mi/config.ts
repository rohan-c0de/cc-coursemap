import type { StateConfig } from "../registry";

const miConfig: StateConfig = {
  slug: "mi",
  name: "Michigan",
  systemName: "MCCA",
  systemFullName: "Michigan Community College Association",
  systemUrl: "https://www.mcca.org/",
  collegeCount: 31,

  // Michigan has no statewide senior-waiver statute; senior audit policies
  // are set per-college. Notable examples: WCCCD Senior Pass, Henry Ford
  // Senior Citizen tuition assistance. Surfaced per-institution rather than
  // as a state-wide banner.
  seniorWaiver: null,

  transferSupported: false,
  popularCourses: [],
  defaultZip: "48933",
  defaultZipCity: "Lansing",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://www.mcca.org/",

  collegeCoursesUrl: (_collegeSlug: string) => "https://www.mcca.org/",

  branding: {
    siteName: "Community College Path Michigan",
    tagline:
      "Search Michigan community college courses across all 31 colleges.",
    footerText:
      "Community College Path Michigan — Find courses across all 31 Michigan community colleges.",
    disclaimer:
      "This is an independent project and is not affiliated with, endorsed by, or sponsored by the Michigan Community College Association.",
    metaKeywords: [
      "Michigan community college courses",
      "Michigan community college class search",
      "Michigan Community College Association",
    ],
  },
  scrapers: {
    // manual-only: courses — mixed-platform state, 15 colleges scraped via banner-ssb-9 / colleague templates per-college; per-state cron not yet wired.
    // manual-only: transfers — no articulation portal registered for MI yet.
    // manual-only: prereqs — runs as part of course aggregation.
    // manual-only: programs — Phase 5+.
  },
};

export default miConfig;
