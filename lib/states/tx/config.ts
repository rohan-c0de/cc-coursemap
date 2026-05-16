import type { StateConfig } from "../registry";

const txConfig: StateConfig = {
  slug: "tx",
  name: "Tx",
  systemName: "Public 2-year",
  systemFullName: "Tx Public 2-year Colleges",
  systemUrl: "",
  collegeCount: 59,

  // TODO: research senior-waiver statute for Tx.
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
    siteName: "Community College Path Tx",
    tagline: "Search Public 2-year courses across all 59 colleges.",
    footerText: "Community College Path Tx — Find courses across all 59 Public 2-year colleges.",
    disclaimer: "This is an independent project and is not affiliated with, endorsed by, or sponsored by Tx Public 2-year Colleges.",
    metaKeywords: [
      "Tx community college courses",
      "Public 2-year course search",
      "Tx Public 2-year Colleges",
    ],
  },
  scrapers: {
    courses: [
      // Houston Community College runs PeopleSoft Fluid with an ICAJAX
      // class search behind a guest session. Driven by Playwright — sweeps
      // the keyword search to enumerate courses, then drills each course's
      // SSR_CS_WRAP_FL detail page to capture section rows (CRN, dates,
      // days/times, location, instructor, seats). Writes both the
      // section file (data/tx/courses/houston-community-college/{TERM}.json)
      // and a catalog dump (data/tx/coursedog-catalog/houston-community-college.json)
      // for prereq aggregation.
      {
        scripts: ["scripts/tx/scrape-hccs.ts"],
        runner: "playwright",
      },
    ],
    // manual-only: transfers — Phase 3 (transfer-equiv) not yet wired up.
    // manual-only: prereqs — Phase 4.
    // manual-only: programs — Phase 5+.
  },
};

export default txConfig;
