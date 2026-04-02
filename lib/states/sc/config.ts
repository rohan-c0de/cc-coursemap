import type { StateConfig } from "../registry";

// Maps college slug → Colleague Self-Service base URL for course catalog links
const SELF_SERVICE_URLS: Record<string, string> = {
  "aiken": "https://courses.atc.edu",
  "denmark": "https://selfservice.denmarktech.edu",
  "florence-darlington": "https://selfservice.fdtc.edu",
  "spartanburg": "https://selfserviceprod.sccsc.edu:8172",
  "lowcountry": "https://selfservice.tcl.edu",
  "central-carolina": "https://ssb.cctech.edu",
};

const scConfig: StateConfig = {
  slug: "sc",
  name: "South Carolina",
  systemName: "SCTCS",
  systemFullName: "South Carolina Technical College System",
  systemUrl: "https://www.sctechsystem.edu",
  collegeCount: 16,

  seniorWaiver: {
    ageThreshold: 60,
    legalCitation: "SC Code § 59-111-320",
    description:
      "South Carolina residents aged 60 and older may attend classes at any public technical college with tuition waived, space permitting. Fees and textbooks still apply.",
    bannerTitle: "South Carolina Senior Tuition Waiver",
    bannerSummary:
      "Over 60 in South Carolina? You may be eligible to attend technical college courses with tuition waived.",
    bannerDetail:
      "SC law allows residents aged 60+ to attend classes at public technical colleges with tuition waived, space permitting. Fees and textbooks still apply.",
  },

  transferSupported: false,

  courseDiscoveryUrl: (collegeSlug: string, prefix: string, number: string) => {
    const base = SELF_SERVICE_URLS[collegeSlug];
    if (base && prefix && number) {
      return `${base}/Student/Courses/Search?keyword=${encodeURIComponent(prefix + " " + number)}`;
    }
    if (base) return `${base}/Student/Courses`;
    return `https://www.sctechsystem.edu`;
  },

  collegeCoursesUrl: (collegeSlug: string) => {
    const base = SELF_SERVICE_URLS[collegeSlug];
    if (base) return `${base}/Student/Courses`;
    return `https://www.sctechsystem.edu`;
  },

  branding: {
    siteName: "AuditMap South Carolina",
    tagline:
      "Discover which South Carolina technical colleges allow course auditing, what it costs, and how to apply. Tuition waived for SC residents 60+.",
    footerText:
      "AuditMap South Carolina — Helping South Carolinians discover course auditing opportunities.",
    disclaimer:
      "This is an independent project and is not affiliated with, endorsed by, or sponsored by the South Carolina Technical College System (SCTCS).",
    metaKeywords: [
      "South Carolina technical college audit",
      "SCTCS audit course",
      "audit college class South Carolina",
      "free college courses seniors SC",
      "South Carolina 60+ tuition waiver",
      "SC technical college courses",
    ],
  },
};

export default scConfig;
