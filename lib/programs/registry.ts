/**
 * Curated program → course-prefix mapping for the programs/majors hub
 * (`/[state]/program/[slug]`). Each program lists candidate course prefixes;
 * the page filters to whichever prefixes actually have data in the target
 * state. State-by-state prefix variation is handled here, not at call sites.
 *
 * Add a program by appending to PROGRAMS. The slug becomes the URL segment;
 * use kebab-case lower. To add a new prefix variant, append to that program's
 * `prefixes` — it's a superset, no harm done if a state lacks it.
 */

export type ProgramDef = {
  slug: string;
  name: string;
  // 1-2 sentence description used for meta description and page intro.
  description: string;
  // Candidate course prefixes. Match is OR — any prefix in this list counts
  // toward program coverage. Variants across state systems are intentional
  // (e.g. NUR, NURS, NSG all map to Nursing).
  prefixes: string[];
};

export const PROGRAMS: ProgramDef[] = [
  {
    slug: "nursing",
    name: "Nursing",
    description:
      "Compare nursing programs across community colleges in this state. ADN, LPN, and pre-nursing pathways with section counts and transfer details.",
    prefixes: ["NUR", "NURS", "NSG", "RNS", "ADN"],
  },
  {
    slug: "business-administration",
    name: "Business Administration",
    description:
      "Business administration courses across community colleges in this state, covering management, accounting, marketing, and economics.",
    prefixes: ["BUS", "MGT", "MGMT", "MKT", "MKTG", "ACC", "ACCT", "ECO", "ECON", "FIN"],
  },
  {
    slug: "computer-science",
    name: "Computer Science",
    description:
      "Computer science and IT pathways at community colleges in this state. Programming, networking, cybersecurity, and transfer-track CS courses.",
    prefixes: ["CSC", "CSCI", "CSE", "CIS", "CIT", "ITN", "ITP", "ITE", "COMP"],
  },
  {
    slug: "accounting",
    name: "Accounting",
    description:
      "Accounting programs at community colleges in this state. Financial accounting, managerial accounting, and CPA-track coursework.",
    prefixes: ["ACC", "ACCT", "ACG"],
  },
  {
    slug: "early-childhood-education",
    name: "Early Childhood Education",
    description:
      "Early childhood education programs at community colleges in this state. Coursework for child-care, preschool, and elementary-track teachers.",
    prefixes: ["ECE", "EDU", "CHD", "CD", "CHFD"],
  },
  {
    slug: "criminal-justice",
    name: "Criminal Justice",
    description:
      "Criminal justice programs at community colleges in this state. Law-enforcement, corrections, and pre-law pathways.",
    prefixes: ["CRJ", "CJ", "CJU", "ADJ", "LGL", "PLS"],
  },
  {
    slug: "liberal-arts",
    name: "Liberal Arts",
    description:
      "Liberal-arts transfer programs at community colleges in this state. English, history, philosophy, and the social sciences for university transfer.",
    prefixes: ["ENG", "ENGL", "HIS", "HIST", "PHI", "PHIL"],
  },
  {
    slug: "engineering",
    name: "Engineering",
    description:
      "Engineering and pre-engineering programs at community colleges in this state. Calculus, physics, and intro engineering for transfer to four-year programs.",
    prefixes: ["EGR", "ENGR", "ENGE", "EGT"],
  },
  {
    slug: "biology",
    name: "Biology",
    description:
      "Biology coursework across community colleges in this state. Anatomy, microbiology, and pre-health science transfer pathways.",
    prefixes: ["BIO", "BIOL"],
  },
  {
    slug: "psychology",
    name: "Psychology",
    description:
      "Psychology programs at community colleges in this state. Intro psych, abnormal, developmental, and transfer-track coursework for four-year programs.",
    prefixes: ["PSY", "PSYC"],
  },
  {
    slug: "welding",
    name: "Welding Technology",
    description:
      "Welding technology programs at community colleges in this state. Career-track training for AWS-certified welders.",
    prefixes: ["WEL", "WLD", "WLDG"],
  },
  {
    slug: "automotive-technology",
    name: "Automotive Technology",
    description:
      "Automotive technology programs at community colleges in this state. ASE-aligned coursework for technicians and service writers.",
    prefixes: ["AUT", "AUTO", "AUMT", "ATR"],
  },
];

export function getProgramBySlug(slug: string): ProgramDef | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}
