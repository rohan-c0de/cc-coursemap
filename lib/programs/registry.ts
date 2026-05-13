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
  /**
   * 4-digit NCES Classification of Instructional Programs (CIP) codes
   * that map to this program slug. Used to pair our program pages with
   * federal Scorecard per-program outcomes (issue #406). Multiple CIPs
   * are listed where the program spans related federal categories — e.g.
   * nursing covers RN, LPN/Practical, and Pre-Nursing pathways. Empty
   * array if no clean CIP match exists.
   *
   * CIP codes use 2-digit-dot-2-digit notation in NCES docs (e.g.
   * "51.38"); the Scorecard API returns them as 4-digit strings without
   * the dot (e.g. "5138"). We store the API form to make lookups direct.
   */
  cips: string[];
};

export const PROGRAMS: ProgramDef[] = [
  {
    slug: "nursing",
    name: "Nursing",
    description:
      "Compare nursing programs across community colleges in this state. ADN, LPN, and pre-nursing pathways with section counts and transfer details.",
    prefixes: ["NUR", "NURS", "NSG", "RNS", "ADN"],
    // 5138 = Registered Nursing/Registered Nurse (RN, ADN)
    // 5139 = Practical Nursing/Vocational Nursing (LPN/LVN)
    // 5116 = Nursing Administration / nursing-research adjacencies
    cips: ["5138", "5139", "5116"],
  },
  {
    slug: "business-administration",
    name: "Business Administration",
    description:
      "Business administration courses across community colleges in this state, covering management, accounting, marketing, and economics.",
    prefixes: ["BUS", "MGT", "MGMT", "MKT", "MKTG", "ACC", "ACCT", "ECO", "ECON", "FIN"],
    // 5202 = Business Administration, Management and Operations
    cips: ["5202"],
  },
  {
    slug: "computer-science",
    name: "Computer Science",
    description:
      "Computer science and IT pathways at community colleges in this state. Programming, networking, cybersecurity, and transfer-track CS courses.",
    prefixes: ["CSC", "CSCI", "CSE", "CIS", "CIT", "ITN", "ITP", "ITE", "COMP"],
    // 1101 = Computer and Information Sciences, General (the CC catch-all)
    // 1107 = Computer Science (transfer-track CS)
    cips: ["1101", "1107"],
  },
  {
    slug: "accounting",
    name: "Accounting",
    description:
      "Accounting programs at community colleges in this state. Financial accounting, managerial accounting, and CPA-track coursework.",
    prefixes: ["ACC", "ACCT", "ACG"],
    // 5203 = Accounting and Related Services
    cips: ["5203"],
  },
  {
    slug: "early-childhood-education",
    name: "Early Childhood Education",
    description:
      "Early childhood education programs at community colleges in this state. Coursework for child-care, preschool, and elementary-track teachers.",
    prefixes: ["ECE", "EDU", "CHD", "CD", "CHFD"],
    // 1312 = Teacher Education and Professional Development, Specific Levels
    // 1909 = Child Care and Support Services Management (related vocational track)
    cips: ["1312", "1909"],
  },
  {
    slug: "criminal-justice",
    name: "Criminal Justice",
    description:
      "Criminal justice programs at community colleges in this state. Law-enforcement, corrections, and pre-law pathways.",
    prefixes: ["CRJ", "CJ", "CJU", "ADJ", "LGL", "PLS"],
    // 4301 = Criminal Justice and Corrections
    // 4304 = Criminal Justice/Police Science (NCES has split these)
    cips: ["4301", "4304"],
  },
  {
    slug: "liberal-arts",
    name: "Liberal Arts",
    description:
      "Liberal-arts transfer programs at community colleges in this state. English, history, philosophy, and the social sciences for university transfer.",
    prefixes: ["ENG", "ENGL", "HIS", "HIST", "PHI", "PHIL"],
    // 2401 = Liberal Arts and Sciences/General Studies and Humanities
    cips: ["2401"],
  },
  {
    slug: "engineering",
    name: "Engineering",
    description:
      "Engineering and pre-engineering programs at community colleges in this state. Calculus, physics, and intro engineering for transfer to four-year programs.",
    prefixes: ["EGR", "ENGR", "ENGE", "EGT"],
    // 1401 = Engineering, General (transfer-track)
    // 1501 = Engineering Technology, General (career-track)
    cips: ["1401", "1501"],
  },
  {
    slug: "biology",
    name: "Biology",
    description:
      "Biology coursework across community colleges in this state. Anatomy, microbiology, and pre-health science transfer pathways.",
    prefixes: ["BIO", "BIOL"],
    // 2601 = Biology, General
    cips: ["2601"],
  },
  {
    slug: "psychology",
    name: "Psychology",
    description:
      "Psychology programs at community colleges in this state. Intro psych, abnormal, developmental, and transfer-track coursework for four-year programs.",
    prefixes: ["PSY", "PSYC"],
    // 4201 = Psychology, General
    cips: ["4201"],
  },
  {
    slug: "welding",
    name: "Welding Technology",
    description:
      "Welding technology programs at community colleges in this state. Career-track training for AWS-certified welders.",
    prefixes: ["WEL", "WLD", "WLDG"],
    // 4805 = Welding Technology/Welder
    cips: ["4805"],
  },
  {
    slug: "automotive-technology",
    name: "Automotive Technology",
    description:
      "Automotive technology programs at community colleges in this state. ASE-aligned coursework for technicians and service writers.",
    prefixes: ["AUT", "AUTO", "AUMT", "ATR"],
    // 4706 = Vehicle Maintenance and Repair Technologies (Automotive)
    // 4704 = Heavy Equipment Maintenance (related)
    cips: ["4706", "4704"],
  },
  {
    slug: "history",
    name: "History",
    description:
      "History coursework at community colleges in this state. U.S., world, and topical history sequences for transfer-track liberal-arts students.",
    prefixes: ["HIS", "HIST"],
    // 5401 = History
    cips: ["5401"],
  },
  {
    slug: "mathematics",
    name: "Mathematics",
    description:
      "Mathematics coursework at community colleges in this state. College algebra, precalculus, calculus, and statistics for transfer to four-year programs.",
    prefixes: ["MTH", "MAT", "MATH"],
    // 2701 = Mathematics
    cips: ["2701"],
  },
  {
    slug: "english",
    name: "English",
    description:
      "English coursework at community colleges in this state. Composition, literature, and writing-track classes for transfer-track liberal-arts students.",
    prefixes: ["ENG", "ENGL"],
    // 2301 = English Language and Literature, General
    cips: ["2301"],
  },
  {
    slug: "art",
    name: "Art",
    description:
      "Art and visual-arts coursework at community colleges in this state. Studio art, art history, and design-track classes for fine-arts transfer.",
    prefixes: ["ART", "ARTS", "ARTG", "ARTH"],
    // 5007 = Fine and Studio Arts
    // 5004 = Design and Applied Arts
    cips: ["5007", "5004"],
  },
];

export function getProgramBySlug(slug: string): ProgramDef | undefined {
  return PROGRAMS.find((p) => p.slug === slug);
}
