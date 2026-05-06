import type { StateConfig } from "../registry";

const meConfig: StateConfig = {
  slug: "me",
  name: "Maine",
  systemName: "MCCS",
  systemFullName: "Maine Community College System",
  systemUrl: "https://www.mccs.me.edu",
  collegeCount: 7,

  seniorWaiver: {
    ageThreshold: 65,
    legalCitation: "MRSA Title 20-A, \u00A712701",
    description:
      "Maine residents aged 65 and older may audit courses at any MCCS community college tuition-free on a space-available basis.",
    bannerTitle: "Maine Senior Audit Program",
    bannerSummary:
      "Over 65 in Maine? You may be eligible to audit MCCS courses tuition-free.",
    bannerDetail:
      "Maine law allows residents aged 65+ to audit credit courses at Maine Community College System institutions tuition-free on a space-available basis.",
  },

  // CollegeTransfer.Net is the wrong source for ME: across the 4 MCCS
  // colleges that fit under the free-tier API quota (CMCC/EMCC/KVCC/NMCC),
  // 1,649 raw equivalencies target zero in-state institutions. The
  // authoritative in-state source is UMaine's MaineStreet Transfer
  // Equivalency Guest portal at
  // https://mainestreetcs.maine.edu/psp/CSPRDG/EMPLOYEE/SA/c/UM_SA.UM_TRNSFER_GUEST.GBL
  // — PeopleSoft, no login required, ~49 (MCCS-sender × UMS-receiver)
  // pairs. Building that scraper is tracked separately. Until then, the
  // me-transfers cron job is removed from `scrapers` below (2026-05) so
  // empty output stops being flagged as a regression. Flip
  // `transferSupported` back to true once a MaineStreet scraper lands.
  // The CT.Net script `scripts/me/scrape-transfer.ts` is retained for
  // manual use if the in-state rule is ever relaxed.
  transferSupported: false,
  popularCourses: ["ENG 101", "MAT 101", "BIO 101", "PSY 101", "HIS 101", "SOC 101"],
  defaultZip: "04101",
  defaultZipCity: "Portland",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://www.mccs.me.edu",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://www.mccs.me.edu",

  branding: {
    siteName: "Community College Path Maine",
    tagline:
      "Search Maine Community College System courses across all 7 colleges.",
    footerText:
      "Community College Path Maine \u2014 Find courses across all 7 MCCS colleges.",
    disclaimer:
      "This is an independent project and is not affiliated with, endorsed by, or sponsored by the Maine Community College System (MCCS).",
    metaKeywords: [
      "Maine community college courses",
      "MCCS course search",
      "Maine Community College System",
      "Maine community college schedule",
    ],
  },
  universityAliases: [
    { slug: "umaine", names: ["UMaine", "University of Maine", "Maine"] },
    { slug: "usm", names: ["USM", "University of Southern Maine"] },
    { slug: "bowdoin", names: ["Bowdoin", "Bowdoin College"] },
    { slug: "bates", names: ["Bates", "Bates College"] },
    { slug: "colby", names: ["Colby", "Colby College"] },
  ],
  scrapers: {
    courses: [{ scripts: ["scripts/me/scrape-mccs.ts"], runner: "playwright" }],
    // manual-only: transfers — CT.Net has zero in-state targets for ME; MaineStreet PeopleSoft scraper is the real fix. See `transferSupported` comment above.
    // manual-only: prereqs — ME prereq scraper not yet built. Tracked in #106.
  },
};

export default meConfig;
