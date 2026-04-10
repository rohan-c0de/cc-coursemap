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
};

export default meConfig;
