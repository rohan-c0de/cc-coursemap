import type { StateConfig } from "../registry";

const iaConfig: StateConfig = {
  slug: "ia",
  name: "Iowa",
  systemName: "Iowa Community Colleges",
  systemFullName:
    "Iowa Community Colleges (managed by the Iowa Department of Education)",
  systemUrl: "https://educate.iowa.gov/higher-ed/community-colleges",
  collegeCount: 16,

  // Iowa has no statewide senior-waiver statute; tuition-waiver and senior
  // audit policies are set per-college. DMACC, Kirkwood, and Hawkeye each
  // publish their own; surfaced per-institution rather than as a state-wide
  // banner.
  seniorWaiver: null,

  transferSupported: false,
  popularCourses: [],
  defaultZip: "50309",
  defaultZipCity: "Des Moines",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://educate.iowa.gov/higher-ed/community-colleges",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://educate.iowa.gov/higher-ed/community-colleges",

  branding: {
    siteName: "Community College Path Iowa",
    tagline:
      "Search Iowa community college courses across all 16 colleges.",
    footerText:
      "Community College Path Iowa — Find courses across all 16 Iowa community colleges.",
    disclaimer:
      "This is an independent project and is not affiliated with, endorsed by, or sponsored by the Iowa Department of Education.",
    metaKeywords: [
      "Iowa community college courses",
      "Iowa community college class search",
      "Iowa Community Colleges",
    ],
  },
  scrapers: {
    // manual-only: courses — mixed-platform state, 2 colleges scraped via colleague template; per-state cron not yet wired.
    // manual-only: transfers — no articulation portal registered for IA yet.
    // manual-only: prereqs — runs as part of course aggregation.
    // manual-only: programs — Phase 5+.
  },
};

export default iaConfig;
