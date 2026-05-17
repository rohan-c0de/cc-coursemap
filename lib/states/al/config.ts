import type { StateConfig } from "../registry";

const alConfig: StateConfig = {
  slug: "al",
  name: "Alabama",
  systemName: "ACCS",
  systemFullName: "Alabama Community College System",
  systemUrl: "https://www.accs.edu/",
  collegeCount: 23,

  // TODO: research senior-waiver statute for AL. Alabama has a senior tuition
  // waiver under Alabama Code § 16-60-114 (ACCS Senior Adult Scholarship
  // Program — residents 60+ may attend ACCS courses tuition-free on a
  // space-available basis). Verify text and program scope before populating.
  seniorWaiver: null,

  transferSupported: false,
  popularCourses: [],
  defaultZip: "35203",
  defaultZipCity: "Birmingham",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://www.accs.edu/",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://www.accs.edu/",

  branding: {
    siteName: "Community College Path Alabama",
    tagline: "Search ACCS courses across all 23 Alabama community and technical colleges.",
    footerText: "Community College Path Alabama — Find courses across all 23 ACCS colleges.",
    disclaimer: "This is an independent project and is not affiliated with, endorsed by, or sponsored by the Alabama Community College System (ACCS).",
    metaKeywords: [
      "Alabama community college courses",
      "ACCS course search",
      "Alabama Community College System",
    ],
  },
  scrapers: {
    courses: [
      // Most ACCS colleges run on a shared Banner 8 host at
      // ssb-prod.ec.accs.edu/PROD/<CODE>/bwckschd.p_disp_dyn_sched
      // (one path per college, e.g. /PROD/JSCC for Jefferson State).
      // scripts/al/scrape-accs-banner8.ts wraps the shared Banner 8
      // template with a HOSTS map for 19 of the 23 ACCS colleges.
      {
        scripts: ["scripts/al/scrape-accs-banner8.ts"],
        runner: "http",
      },
      // OneACCS Banner SSB 9 — 4 ACCS colleges that migrated to the
      // newer multi-tenant Banner SSB 9 at reg-prod.ec.accs.edu,
      // distinguished by mepCode (not by URL path). These colleges'
      // codes collide with the Banner 8 path codes for OTHER colleges
      // (e.g. CACC on Banner 8 = Coastal Alabama, but mepCode=CACC on
      // OneACCS = Central Alabama), so the two scrapers are necessarily
      // separate.
      {
        scripts: ["scripts/al/scrape-accs-banner-ssb9.ts"],
        runner: "http",
      },
    ],
    // manual-only: transfers — Phase 3. Alabama runs STARS
    //   (Statewide Transfer and Articulation Reporting System) at
    //   stars.troy.edu — likely the highest-leverage Phase 3 source.
    // manual-only: prereqs — Phase 4.
    // manual-only: programs — Phase 5+.
  },
};

export default alConfig;
