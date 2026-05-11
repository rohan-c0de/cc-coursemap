import type { StateConfig } from "../registry";

const coConfig: StateConfig = {
  slug: "co",
  name: "Co",
  systemName: "Public 2-year",
  systemFullName: "Co Public 2-year Colleges",
  systemUrl: "",
  collegeCount: 15,

  // TODO: research senior-waiver statute for Co.
  // Set to null if no waiver exists, or fill in per the SeniorWaiverConfig shape.
  seniorWaiver: null,

  transferSupported: false,
  popularCourses: [],
  defaultZip: "",
  defaultZipCity: "",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://www.example.edu/",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://www.example.edu/",

  branding: {
    siteName: "Community College Path Co",
    tagline: "Search Public 2-year courses across all 15 colleges.",
    footerText: "Community College Path Co — Find courses across all 15 Public 2-year colleges.",
    disclaimer: "This is an independent project and is not affiliated with, endorsed by, or sponsored by Co Public 2-year Colleges.",
    metaKeywords: [
      "Co community college courses",
      "Public 2-year course search",
      "Co Public 2-year Colleges",
    ],
  },
  scrapers: {
    // manual-only: courses — Phase 2 (course scraper) not yet wired up.
    // manual-only: transfers — Phase 3 (transfer-equiv) not yet wired up.
    // manual-only: prereqs — Phase 4.
    // manual-only: programs — Phase 5+.
  },
};

export default coConfig;
