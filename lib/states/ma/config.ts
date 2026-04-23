import type { StateConfig } from "../registry";

const maConfig: StateConfig = {
  slug: "ma",
  name: "Massachusetts",
  systemName: "MassCC",
  systemFullName: "Massachusetts Community Colleges",
  systemUrl: "https://masscc.org",
  collegeCount: 15,

  seniorWaiver: {
    ageThreshold: 60,
    legalCitation: "MGL c. 15A, \u00A719",
    description:
      "Massachusetts residents aged 60 and older may attend state community college courses tuition-free on a space-available basis.",
    bannerTitle: "Massachusetts Senior Tuition Waiver",
    bannerSummary:
      "Over 60 in Massachusetts? You may be eligible to attend community college tuition-free.",
    bannerDetail:
      "Massachusetts law allows residents aged 60+ to attend credit courses at state community colleges tuition-free on a space-available basis.",
  },

  transferSupported: false,
  popularCourses: ["ENG 101", "MAT 128", "BIO 110", "PSY 101", "HIS 101", "SOC 101"],
  defaultZip: "02108",
  defaultZipCity: "Boston",

  courseDiscoveryUrl: (_collegeSlug: string, _prefix: string, _number: string) =>
    "https://masscc.org",

  collegeCoursesUrl: (_collegeSlug: string) =>
    "https://masscc.org",

  branding: {
    siteName: "Community College Path Massachusetts",
    tagline:
      "Search Massachusetts Community Colleges courses across all 15 colleges.",
    footerText:
      "Community College Path Massachusetts \u2014 Find courses across all 15 MassCC colleges.",
    disclaimer:
      "This is an independent project and is not affiliated with, endorsed by, or sponsored by Massachusetts Community Colleges (MassCC) or the Commonwealth of Massachusetts.",
    metaKeywords: [
      "Massachusetts community college courses",
      "MassCC course search",
      "Massachusetts Community Colleges",
      "Massachusetts community college schedule",
    ],
  },
};

export default maConfig;
