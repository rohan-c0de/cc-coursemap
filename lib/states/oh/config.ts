import type { StateConfig } from "../registry";

const ohConfig: StateConfig = {
  slug: "oh",
  name: "Ohio",
  systemName: "OACC",
  systemFullName: "Ohio Association of Community Colleges",
  systemUrl: "https://www.ohiocommunitycolleges.org/",
  collegeCount: 22,

  seniorWaiver: {
    ageThreshold: 60,
    legalCitation: "Ohio Revised Code § 3345.27 (Program 60)",
    description:
      "Ohio residents 60 and older may audit courses at state-supported colleges tuition-free on a space-available basis. Regular fees may still apply and audited courses do not count for degree credit.",
    bannerTitle: "Ohio Program 60",
    bannerSummary:
      "Over 60 in Ohio? You can audit classes at state-supported colleges tuition-free.",
    bannerDetail:
      "Ohio Revised Code § 3345.27 (Program 60) lets Ohio residents 60+ audit courses at state-assisted institutions tuition-free on a space-available basis. Confirm with each college's registrar.",
  },

  transferSupported: false,
  popularCourses: [],
  defaultZip: "43215",
  defaultZipCity: "Columbus",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://www.ohiocommunitycolleges.org/",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://www.ohiocommunitycolleges.org/",

  branding: {
    siteName: "Community College Path Ohio",
    tagline: "Search Ohio community college courses across all 22 colleges.",
    footerText:
      "Community College Path Ohio — Find courses across all 22 Ohio community colleges.",
    disclaimer:
      "This is an independent project and is not affiliated with, endorsed by, or sponsored by the Ohio Association of Community Colleges.",
    metaKeywords: [
      "Ohio community college courses",
      "Ohio community college class search",
      "Ohio Association of Community Colleges",
      "Ohio Program 60",
    ],
  },
  scrapers: {
    // manual-only: courses — mixed-platform state, 8 colleges scraped via banner-ssb-9 / colleague / banner-8 templates per-college; per-state cron not yet wired.
    // manual-only: transfers — no articulation portal registered for OH yet.
    // manual-only: prereqs — runs as part of course aggregation.
    // manual-only: programs — Phase 5+.
  },
};

export default ohConfig;
