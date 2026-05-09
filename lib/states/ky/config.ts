import type { StateConfig } from "../registry";

const kyConfig: StateConfig = {
  slug: "ky",
  name: "Kentucky",
  systemName: "KCTCS",
  systemFullName: "Kentucky Community and Technical College System",
  systemUrl: "https://kctcs.edu/",
  collegeCount: 16,

  // TODO: research senior-waiver statute for KY (KRS 164.284 — Senior
  // Citizens' Higher Education Program is the likely citation; verify
  // the current text and waiver scope before populating).
  seniorWaiver: null,

  transferSupported: false,
  popularCourses: [],
  defaultZip: "40202",
  defaultZipCity: "Louisville",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://students.kctcs.edu/",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://students.kctcs.edu/",

  branding: {
    siteName: "Community College Path Kentucky",
    tagline: "Search KCTCS courses across all 16 Kentucky community and technical colleges.",
    footerText: "Community College Path Kentucky — Find courses across all 16 KCTCS colleges.",
    disclaimer: "This is an independent project and is not affiliated with, endorsed by, or sponsored by the Kentucky Community and Technical College System (KCTCS).",
    metaKeywords: [
      "Kentucky community college courses",
      "KCTCS course search",
      "Kentucky Community and Technical College System",
    ],
  },
  scrapers: {
    // manual-only: courses — KCTCS uses PeopleSoft Campus Solutions (auth-gated).
    //   No template available yet; per-college scrapers needed once a public
    //   guest endpoint or system-wide scraper is built. See PR description.
    // manual-only: transfers — no entry in data/articulation-portals.json for KY.
    //   Fallback options: KYTransfer.org (transfer.ky.gov) state portal, or
    //   CollegeTransfer.Net per-college lookup.
    // manual-only: prereqs — depends on courses (Phase 2) landing first.
    // manual-only: programs — Phase 5+.
  },
};

export default kyConfig;
