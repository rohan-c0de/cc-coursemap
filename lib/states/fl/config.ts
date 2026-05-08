import type { StateConfig } from "../registry";

const flConfig: StateConfig = {
  slug: "fl",
  name: "Florida",
  systemName: "FCS",
  systemFullName: "Florida College System",
  systemUrl: "https://www.fldoe.org/schools/higher-ed/fl-college-system/",
  collegeCount: 28,

  seniorWaiver: {
    ageThreshold: 60,
    legalCitation: "FL Stat. § 1009.26(4)",
    description:
      "Florida residents aged 60 and older may have tuition and fees waived at Florida College System institutions for credit courses on a space-available basis. Each college decides which fees to waive; credit earned this way does not count toward graduation.",
    bannerTitle: "Florida Senior Tuition Waiver",
    bannerSummary:
      "Over 60 in Florida? Tuition and fees may be waived at FCS colleges for space-available enrollment.",
    bannerDetail:
      "Florida law allows residents aged 60+ to attend Florida College System credit courses with tuition and fees waived on a space-available basis. Each college sets its own policy on which fees are waivable; credit earned this way generally does not apply toward graduation.",
  },

  // Florida runs a state-wide articulation system (SCNS — Statewide Course
  // Numbering System) plus the FloridaShines transfer portal. That's a
  // Phase 3 source. Until that scrape lands, transferSupported stays false
  // so the UI doesn't surface the empty transfer tool.
  transferSupported: false,
  popularCourses: ["ENC 1101", "MAC 1105", "BSC 1010", "PSY 2012", "AMH 2010", "SYG 2000"],
  defaultZip: "33132",
  defaultZipCity: "Miami",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://www.fldoe.org/schools/higher-ed/fl-college-system/",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://www.fldoe.org/schools/higher-ed/fl-college-system/",

  branding: {
    siteName: "Community College Path Florida",
    tagline:
      "Search Florida College System courses across all 28 state colleges.",
    footerText:
      "Community College Path Florida — Find courses across all 28 FCS colleges.",
    disclaimer:
      "This is an independent project and is not affiliated with, endorsed by, or sponsored by the Florida College System or the Florida Department of Education.",
    metaKeywords: [
      "Florida community college courses",
      "FCS course search",
      "Florida College System",
      "Florida community college schedule",
      "Florida senior tuition waiver",
    ],
  },
  universityAliases: [
    { slug: "uf", names: ["UF", "University of Florida", "Gators"] },
    { slug: "fsu", names: ["FSU", "Florida State", "Florida State University"] },
    { slug: "ucf", names: ["UCF", "Central Florida", "University of Central Florida"] },
    { slug: "usf", names: ["USF", "South Florida", "University of South Florida"] },
    { slug: "fiu", names: ["FIU", "Florida International", "Florida International University"] },
    { slug: "fau", names: ["FAU", "Florida Atlantic", "Florida Atlantic University"] },
    { slug: "famu", names: ["FAMU", "Florida A&M", "Florida A&M University"] },
    { slug: "fgcu", names: ["FGCU", "Florida Gulf Coast", "Florida Gulf Coast University"] },
    { slug: "unf", names: ["UNF", "North Florida", "University of North Florida"] },
    { slug: "uwf", names: ["UWF", "West Florida", "University of West Florida"] },
    { slug: "miami", names: ["Miami", "University of Miami", "UM"] },
    { slug: "rollins", names: ["Rollins", "Rollins College"] },
  ],
  scrapers: {
    courses: [
      // Banner SSB 9 — 8 colleges (the largest cluster after the platform
      // survey in #270). The other 20 FCS colleges use Banner 8, Jenzabar,
      // Workday, custom apps, or are auth-gated; those will land in
      // separate scrapers as Phase 2 follow-up PRs.
      { scripts: ["scripts/fl/scrape-banner-ssb.ts"], runner: "http" },
    ],
    // manual-only: transfers — Phase 3. FloridaShines + SCNS are the
    // state-run sources; one scrape can cover all 28 × every public
    // university destination.
    // manual-only: prereqs — Phase 4. Banner SSB 9 prereqs come along
    // inline in scrape-banner-ssb.ts; the other platforms (Banner 8,
    // Jenzabar, custom) need separate catalog scrapers when those Phase 2
    // follow-ups land.
    // manual-only: programs — Phase 5+.
  },
};

export default flConfig;
