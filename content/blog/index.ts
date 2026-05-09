export type FaqEntry = { q: string; a: string };
export type HowToStep = { name: string; text: string };
export type HowToSpec = {
  name: string;
  description?: string;
  steps: HowToStep[];
};

export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  state: string | null; // null = general, "va" = Virginia-specific, etc.
  // Optional college binding for college-specific spokes. The post still
  // routes under its `state` (renderer uses StateToolsCTA for state); the
  // college slug ties the article to a specific institution for cluster
  // gap detection and cross-linking.
  college?: string;
  author: string;
  tags: string[];
  cluster?: string; // optional cluster ID for hub/spoke linking
  clusterRole?: "hub" | "spoke";
  // Optional rich-result inputs. Emitted as schema.org FAQPage / HowTo JSON-LD
  // when present. Opt-in per article — keeps thin/inferred FAQs out of search.
  faqs?: FaqEntry[];
  howTo?: HowToSpec;
};

export const CATEGORIES: Record<string, string> = {
  "transfer-confusion": "Transfer Credits",
  "registration-timing": "Registration & Timing",
  "cross-college-scheduling": "Cross-College Scheduling",
  "senior-waivers": "Senior Waivers & Auditing",
  "state-system-explainers": "State System Explainers",
  "mistake-avoidance": "Mistake Avoidance",
  "session-timing": "Sessions & Calendar Timing",
};

export const articles: ArticleMeta[] = [
  // --- Cluster A: Transfer credit confusion (hub + spokes) ---
  {
    slug: "what-direct-match-vs-elective-credit-means",
    title:
      'Community College Transfer Credit: What "Direct Match" vs "Elective Credit" Actually Means',
    description:
      "Your course transferred — but did it actually count? Learn the difference between a direct match and elective credit, and why it matters for graduation.",
    date: "2026-04-04",
    category: "transfer-confusion",
    state: null,
    author: "Community College Path",
    tags: ["transfer", "credits", "direct-match", "elective-credit"],
    cluster: "transfer-credit-guide",
    clusterRole: "hub",
  },
  {
    slug: "virginia-community-college-transfer-guaranteed-admission",
    title:
      "Virginia Community College Transfer: How Guaranteed Admission Actually Works",
    description:
      "Virginia's GAA promises guaranteed admission to public universities — but it doesn't guarantee your major or your credits. Here's what it actually covers.",
    date: "2026-04-04",
    category: "state-system-explainers",
    state: "va",
    author: "Community College Path",
    tags: ["transfer", "virginia", "vccs", "guaranteed-admission", "gaa"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },
  {
    slug: "north-carolina-community-college-unc-transfer-caa",
    title:
      "North Carolina Community College to UNC Transfer: What the CAA Covers and What It Does Not",
    description:
      "The Comprehensive Articulation Agreement defines NC transfer rules — but it doesn't guarantee admission to every school or program. Here's what to know.",
    date: "2026-04-04",
    category: "state-system-explainers",
    state: "nc",
    author: "Community College Path",
    tags: ["transfer", "north-carolina", "ncccs", "unc", "caa"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster B: Senior waivers and auditing (hub + spokes) ---
  {
    slug: "free-community-college-classes-for-seniors",
    title:
      "Free or Reduced-Cost Community College Classes for Seniors: Which States Actually Offer Them?",
    description:
      "Several states waive tuition for seniors at community colleges. Here's what exists, how it works, and what the fine print says.",
    date: "2026-04-04",
    category: "senior-waivers",
    state: null,
    author: "Community College Path",
    tags: ["seniors", "tuition-waiver", "auditing", "free-classes"],
    cluster: "senior-waivers-guide",
    clusterRole: "hub",
    faqs: [
      {
        q: "Which states offer free community college classes for seniors?",
        a: "Several states waive community college tuition for senior residents, including Virginia (60+), North Carolina (65+), South Carolina (60+), and the District of Columbia (65+). Age thresholds, residency rules, and what's actually covered (auditing vs credit) vary by state.",
      },
      {
        q: "What does \"space permitting\" mean for senior tuition waivers?",
        a: "It means seniors register after credit-seeking students. If a class is already full when senior registration opens, you cannot enroll. Popular gen-ed and online sections fill fastest; niche electives, morning sections, and late-start courses tend to have more availability.",
      },
      {
        q: "Does a senior tuition waiver cover credits or just auditing?",
        a: "It depends on the state. North Carolina's waiver covers auditing only — no grade, no credit. Virginia waives tuition for auditing but charges a reduced rate for credit enrollment. Always confirm with the college before you register.",
      },
      {
        q: "Are there income limits for senior tuition waivers?",
        a: "Some states impose income caps. Virginia, for example, requires taxable income below roughly $29,000 for the credit-bearing waiver — auditing is free regardless. Most other states do not have an income test, but residency is always required.",
      },
    ],
  },
  {
    slug: "virginia-senior-citizens-community-college-free-tuition",
    title:
      "Virginia Senior Citizens and Community College: Free Tuition vs Audit-Only Explained",
    description:
      "Virginia residents 60+ can take community college classes for free — but there's an income cap for credit enrollment. Here's how the waiver actually works.",
    date: "2026-04-04",
    category: "senior-waivers",
    state: "va",
    author: "Community College Path",
    tags: ["seniors", "virginia", "vccs", "tuition-waiver", "auditing"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },
  {
    slug: "north-carolina-senior-citizens-community-colleges",
    title:
      "North Carolina Senior Citizens at Community Colleges: What 65+ Students Can Still Do",
    description:
      "North Carolina waives tuition for residents 65+ at all 58 community colleges — but it's audit only. Here's what that means and how to get started.",
    date: "2026-04-04",
    category: "senior-waivers",
    state: "nc",
    author: "Community College Path",
    tags: ["seniors", "north-carolina", "ncccs", "tuition-waiver", "auditing"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },
  {
    slug: "maryland-senior-citizens-community-college-tuition-waiver",
    title:
      "Maryland Senior Citizens at Community Colleges: How the 60+ Tuition Waiver Actually Works",
    description:
      "Maryland law waives tuition for residents 60+ at all 16 community colleges — no income cap, no retirement requirement. Here's how to actually use it.",
    date: "2026-05-02",
    category: "senior-waivers",
    state: "md",
    author: "Community College Path",
    tags: ["seniors", "maryland", "tuition-waiver", "auditing", "macc"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },
  {
    slug: "new-jersey-senior-citizens-county-college-tuition-waiver",
    title:
      "New Jersey Senior Citizens at County Colleges: How the 65+ Tuition Waiver Actually Works",
    description:
      "New Jersey law waives tuition at all 18 county colleges for residents 65+. The waiver covers credit enrollment, not just auditing. Here's how to actually use it.",
    date: "2026-05-02",
    category: "senior-waivers",
    state: "nj",
    author: "Community College Path",
    tags: ["seniors", "new-jersey", "tuition-waiver", "njccc", "county-college"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },
  {
    slug: "massachusetts-senior-citizens-community-college-tuition-waiver",
    title:
      "Massachusetts Senior Citizens at Community Colleges: How the 60+ Tuition Waiver Actually Works",
    description:
      "Massachusetts law waives tuition for residents 60+ at all 15 community colleges — no income cap, no retirement requirement. Here's how to actually use it.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "ma",
    author: "Community College Path",
    tags: ["seniors", "massachusetts", "tuition-waiver", "auditing", "masscc"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },
  {
    slug: "florida-community-college-transfer-credit-guide",
    title:
      "How Florida Community College Transfer Credit Actually Works: An SCNS Student's Guide",
    description:
      "Florida's Statewide Course Numbering System makes 100% of community college courses direct matches at every public university — but the catches are in prerequisites, limited-access majors, and excess credit hours.",
    date: "2026-05-09",
    category: "state-system-explainers",
    state: "fl",
    author: "Community College Path",
    tags: ["transfer", "florida", "fcs", "scns", "2+2"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster E: Auditing-at-college (hub + future per-college spokes) ---
  {
    slug: "what-does-audit-a-class-mean",
    title:
      'What Does "Audit a Class" Actually Mean at a Community College?',
    description:
      "Auditing means attending a course without earning credits or a grade. Here's who does it, how it works, and what it costs.",
    date: "2026-04-04",
    category: "senior-waivers",
    state: null,
    author: "Community College Path",
    tags: ["auditing", "audit-vs-credit", "community-college"],
    cluster: "audit-at-college-guide",
    clusterRole: "hub",
  },

  // --- Standalone: Registration timing ---
  {
    slug: "how-to-find-late-start-community-college-classes",
    title:
      "How Late Can You Enroll in Community College? Late-Start Classes Explained",
    description:
      "You can enroll days before a late-start section begins — weeks after the main semester started. Here's how to find open sections and what to expect.",
    date: "2026-04-04",
    category: "registration-timing",
    state: null,
    author: "Community College Path",
    tags: ["late-start", "mini-session", "registration", "accelerated"],
  },

  // --- Standalone: Transfer verification ---
  {
    slug: "how-to-check-if-community-college-course-transfers",
    title:
      "How to Tell if a Community College Course Will Count for Your Target University Before You Enroll",
    description:
      "Checking transfer equivalencies before registration takes 15 minutes. Not checking can cost you a semester. Here's the step-by-step process.",
    date: "2026-04-04",
    category: "transfer-confusion",
    state: null,
    author: "Community College Path",
    tags: ["transfer", "equivalency", "course-planning"],
  },

  // --- Standalone: Multi-college enrollment ---
  {
    slug: "taking-classes-at-multiple-community-colleges",
    title:
      "Can You Take Classes at More Than One Community College at the Same Time?",
    description:
      "Yes — and sometimes it's the smartest option. Here's how multi-campus enrollment works, including financial aid, schedules, and transfer.",
    date: "2026-04-04",
    category: "cross-college-scheduling",
    state: null,
    author: "Community College Path",
    tags: ["multi-campus", "scheduling", "enrollment", "financial-aid"],
  },

  // --- Standalone: Schedule building ---
  {
    slug: "how-to-build-community-college-schedule",
    title:
      "How to Build a Community College Schedule Across Multiple Campuses or Colleges",
    description:
      "Multi-campus scheduling takes more planning, but it's entirely doable. Here's a step-by-step system for building a workable schedule across locations.",
    date: "2026-04-04",
    category: "cross-college-scheduling",
    state: null,
    author: "Community College Path",
    tags: ["scheduling", "multi-campus", "schedule-builder", "commute"],
  },

  // --- Standalone: Schedule timing ---
  {
    slug: "when-do-community-college-schedules-go-live",
    title:
      "Community College Class Schedules: Typical Times and When They Go Live",
    description:
      "Most community college classes run in morning (8–noon), afternoon (noon–5pm), or evening (5–9:30pm) blocks. Here's what to expect for class times — and when the schedule for next semester posts.",
    date: "2026-04-04",
    category: "registration-timing",
    state: null,
    author: "Community College Path",
    tags: ["registration", "schedule", "timing", "course-catalog"],
  },

  // --- Cluster A spoke: NC transfer guides ---
  {
    slug: "north-carolina-transfer-guides-how-to-use",
    title:
      "North Carolina Community College Transfer Guides: How to Use Them Without Getting Lost",
    description:
      "NC has transfer guides, equivalency tables, and pre-major pathways — but most students don't know how to find or read them. Here's a practical walkthrough.",
    date: "2026-04-04",
    category: "state-system-explainers",
    state: "nc",
    author: "Community College Path",
    tags: ["transfer", "north-carolina", "ncccs", "transfer-guides"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: GA transfer ---
  {
    slug: "georgia-tcsg-transfer-credit-guide",
    title:
      "How Georgia Transfer Credit Actually Works: A TCSG Student's Guide",
    description:
      "The same TCSG course can be a direct match at one Georgia university and worth nothing at another. Here's how transfer credit works across Georgia Tech, UGA, GSU, KSU, and UWG.",
    date: "2026-04-06",
    category: "state-system-explainers",
    state: "ga",
    author: "Community College Path",
    tags: ["transfer", "georgia", "tcsg", "georgia-tech", "uga", "gsu", "ksu", "uwg"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: comparing transfer credit ---
  {
    slug: "comparing-transfer-credit-across-universities",
    title:
      'Comparing Transfer Credit Across Universities: What "Transfers" Really Means',
    description:
      "Two universities can evaluate the same transcript and reach completely different conclusions. Here's how to compare transfer credit across schools — and why direct matches matter more than total credits.",
    date: "2026-04-06",
    category: "transfer-confusion",
    state: null,
    author: "Community College Path",
    tags: ["transfer", "comparison", "direct-match", "elective-credit", "university-selection"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: SC transfer ---
  {
    slug: "south-carolina-technical-college-transfer",
    title:
      "South Carolina Technical College Transfer: What Transfers to USC, Clemson, and Other Universities",
    description:
      "SC technical college courses can transfer to public universities — but equivalencies vary by school. Here's how the system works and how to check before you register.",
    date: "2026-04-04",
    category: "state-system-explainers",
    state: "sc",
    author: "Community College Path",
    tags: ["transfer", "south-carolina", "sctcs", "usc", "clemson"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster B spoke: SC seniors ---
  {
    slug: "south-carolina-senior-citizens-technical-colleges",
    title:
      "South Carolina Senior Citizens at Technical Colleges: How the 60+ Tuition Waiver Works",
    description:
      "SC residents aged 60+ can take technical college classes with tuition waived — and unlike NC, it's for credit, not just auditing. Here's how it works.",
    date: "2026-04-04",
    category: "senior-waivers",
    state: "sc",
    author: "Community College Path",
    tags: ["seniors", "south-carolina", "sctcs", "tuition-waiver"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },

  // --- Cluster B spoke: DC seniors ---
  {
    slug: "dc-senior-citizens-udc-community-college",
    title:
      "DC Senior Citizens and UDC Community College: What the 65+ Tuition Waiver Covers",
    description:
      "DC residents 65+ may have tuition and fees waived at UDC Community College. Here's what the waiver covers, what it doesn't, and how to enroll.",
    date: "2026-04-04",
    category: "senior-waivers",
    state: "dc",
    author: "Community College Path",
    tags: ["seniors", "dc", "udc-cc", "tuition-waiver"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },

  // --- Standalone: Class full alternatives ---
  {
    slug: "what-to-do-when-community-college-class-is-full",
    title:
      "What to Do When the Community College Class You Need Is Full",
    description:
      "The course you need is full. Don't wait until next semester — here are six concrete steps to find an alternative fast.",
    date: "2026-04-04",
    category: "registration-timing",
    state: null,
    author: "Community College Path",
    tags: ["registration", "waitlist", "alternatives", "course-planning"],
  },

  // --- Cluster A spoke: MD transfer ---
  {
    slug: "maryland-community-college-transfer-credit-guide",
    title:
      "How Maryland Community College Transfer Credit Actually Works: An ARTSYS Student's Guide",
    description:
      "Maryland has 122,000+ published transfer equivalencies across 8 universities — but the same course can be a direct match at Towson and elective credit at UMGC. Here's how to navigate it.",
    date: "2026-04-11",
    category: "state-system-explainers",
    state: "md",
    author: "Community College Path",
    tags: ["transfer", "maryland", "artsys", "umd", "towson", "umbc", "umgc"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: NY CUNY transfer ---
  {
    slug: "new-york-cuny-community-college-transfer-guide",
    title:
      "How CUNY Community College Transfer Credit Actually Works: A Student's Guide",
    description:
      "CUNY's 7 community colleges feed into 14 senior colleges — but transfer outcomes vary wildly. Brooklyn College accepts 68% as direct matches; Medgar Evers rejects 57%. Here's what to know.",
    date: "2026-04-11",
    category: "state-system-explainers",
    state: "ny",
    author: "Community College Path",
    tags: ["transfer", "new-york", "cuny", "brooklyn-college", "hunter", "baruch", "t-rex"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Standalone: Online vs in-person ---
  {
    slug: "online-vs-in-person-community-college-classes",
    title:
      "Online vs In-Person vs Hybrid Community College Classes: How to Choose the Right Format",
    description:
      "Online isn't automatically easier. Hybrid has mandatory attendance. Here's how to pick the right course format for your situation.",
    date: "2026-04-04",
    category: "mistake-avoidance",
    state: null,
    author: "Community College Path",
    tags: ["online", "hybrid", "in-person", "course-format", "scheduling"],
  },

  // --- Cluster A spoke: NJ transfer ---
  {
    slug: "new-jersey-community-college-transfer-credit-guide",
    title:
      "NJ Community College Transfer Credits: Where Your Courses Go at Rutgers, Rowan & 38 More Schools",
    description:
      "NJTransfer.org publishes course equivalencies for every NJ community college at 40 four-year schools. Here's which universities accept the most credits — and why the same course counts at Rowan but not at Rutgers Engineering.",
    date: "2026-04-12",
    category: "state-system-explainers",
    state: "nj",
    author: "Community College Path",
    tags: ["transfer", "new-jersey", "njtransfer", "rutgers", "rowan", "njit"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: cross-state comparison ---
  {
    slug: "comparing-transfer-credit-across-states",
    title:
      "How Transfer Credit Compares Across States: What 300,000+ Equivalencies Reveal",
    description:
      "We analyzed 300,000+ transfer equivalencies across 12 states. Direct match rates range from 12% to 56%. Here's what the data shows — and what it means for your transfer plan.",
    date: "2026-04-12",
    category: "transfer-confusion",
    state: null,
    author: "Community College Path",
    tags: ["transfer", "comparison", "direct-match", "elective-credit", "cross-state"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: PA transfer ---
  {
    slug: "pennsylvania-community-college-transfer-credit-guide",
    title:
      "How Pennsylvania Community College Transfer Credit Actually Works",
    description:
      "PA has 14 community colleges but no statewide articulation agreement. Penn State, Pitt, Temple, West Chester, and Drexel each evaluate CC credits independently. Here's what that actually looks like.",
    date: "2026-04-20",
    category: "state-system-explainers",
    state: "pa",
    author: "Community College Path",
    tags: ["transfer", "pennsylvania", "penn-state", "pitt", "temple", "pa-trac", "ccp"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: MA MassTransfer ---
  {
    slug: "massachusetts-community-college-transfer-credit-guide",
    title:
      "How Massachusetts Community College Transfer Credit Actually Works: A MassTransfer Student's Guide",
    description:
      "MA has 46k+ published transfer mappings via MassTransfer — but at UMass Amherst, more than half come back as elective credit. Here's how to read MassTransfer before you register.",
    date: "2026-05-02",
    category: "state-system-explainers",
    state: "ma",
    author: "Community College Path",
    tags: ["transfer", "massachusetts", "masscc", "masstransfer", "umass"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: NH CCSNH transfer ---
  {
    slug: "new-hampshire-ccsnh-transfer-credit-guide",
    title:
      "How New Hampshire Community College Transfer Credit Actually Works: A CCSNH Student's Guide",
    description:
      "NH has 7 CCSNH colleges and transfer equivalencies published for only one university so far — Keene State, with a 31.1% direct match rate. Here's what that means if you're planning to transfer.",
    date: "2026-05-04",
    category: "state-system-explainers",
    state: "nh",
    author: "Community College Path",
    tags: ["transfer", "new-hampshire", "ccsnh", "keene-state", "unh"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: TN TBR transfer ---
  {
    slug: "tennessee-tbr-community-college-transfer-guide",
    title:
      "Tennessee TBR Transfer Credit: Why It's Easier Than Most States",
    description:
      "TN is the only state that enforces common course numbering across all 13 community colleges. ENGL 1010 is ENGL 1010 everywhere. Here's why that matters and how the Tennessee Transfer Pathways work.",
    date: "2026-04-20",
    category: "state-system-explainers",
    state: "tn",
    author: "Community College Path",
    tags: ["transfer", "tennessee", "tbr", "ttp", "tsu", "mtsu", "apsu", "common-course-numbering"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: DE transfer ---
  {
    slug: "delaware-community-college-transfer-credit-guide",
    title:
      "Delaware Community College Transfer: A DTCC Student's Guide",
    description:
      "Delaware has one community college (DTCC, four campuses) and three primary transfer destinations (UDel, Delaware State, Wilmington). Here's how the Connected Degree program works and when to use it.",
    date: "2026-04-20",
    category: "state-system-explainers",
    state: "de",
    author: "Community College Path",
    tags: ["transfer", "delaware", "dtcc", "udel", "connected-degree", "wilmington-university"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster A spoke: CT unified system ---
  {
    slug: "connecticut-ct-state-unified-system-guide",
    title:
      "Connecticut's CT State Community College: What the 2023 Merger Means for Students",
    description:
      "Connecticut merged 12 community colleges into one accredited institution in 2023. One transcript, one catalog, one articulation agreement. Here's what changed and what didn't.",
    date: "2026-04-20",
    category: "state-system-explainers",
    state: "ct",
    author: "Community College Path",
    tags: ["transfer", "connecticut", "ct-state", "caga", "ccsu", "ecsu", "scsu", "merger"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster D: Prereq chains (hub + state-specific spokes) ---
  {
    slug: "prerequisite-chains-why-four-semester-plans-take-six",
    title:
      "Why Your Four-Semester Community College Plan Is Actually Six",
    description:
      "Across 12 states, 40-60% of courses have at least one prerequisite. Some chains go four levels deep. Here's how to spot them before you register — using real data from community college catalogs.",
    date: "2026-04-20",
    category: "mistake-avoidance",
    state: null,
    author: "Community College Path",
    tags: ["prerequisites", "planning", "two-year-degree", "course-sequence", "developmental"],
    cluster: "prereq-chains-guide",
    clusterRole: "hub",
  },
  {
    slug: "georgia-community-college-prereq-bottlenecks",
    title:
      "Georgia TCSG Prereq Chains: How Developmental English Gates 1,400+ Downstream Courses",
    description:
      "Across the 22 colleges of TCSG, developmental English and reading courses sit at the base of prereq chains for 1,400+ downstream courses. Here's how the chains are structured and how to sequence around them.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "ga",
    author: "Community College Path",
    tags: ["prerequisites", "georgia", "tcsg", "developmental", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "maryland-community-college-prereq-bottlenecks",
    title:
      "Maryland Community College Prereq Chains: How ESOL and Dev English Gate 400+ Downstream Courses",
    description:
      "Across MD's 16 community colleges, ESOL and developmental English courses gate 400+ downstream courses. Surgical Tech and Nursing chains run 14 levels deep. Here's how to sequence around them.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "md",
    author: "Community College Path",
    tags: ["prerequisites", "maryland", "esol", "developmental", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "north-carolina-community-college-prereq-bottlenecks",
    title:
      "North Carolina Community College Prereq Chains: How ACA 085 and Dev English Gate 900+ Downstream Courses",
    description:
      "Across NCCCS's 58 colleges, ACA 085 (academic orientation) and developmental English gate 900+ downstream courses. Nursing and EMS chains run 15 levels deep. Here's how to sequence around them.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "nc",
    author: "Community College Path",
    tags: ["prerequisites", "north-carolina", "ncccs", "developmental", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "south-carolina-technical-college-prereq-bottlenecks",
    title:
      "South Carolina SCCTCS Prereq Chains: How RDG 100 and Dev English Gate 460+ Downstream Courses",
    description:
      "Across SCCTCS colleges, RDG 100 and developmental English gate 460+ downstream courses. The nursing chain runs 21 levels deep. Here's how to sequence around the bottlenecks.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "sc",
    author: "Community College Path",
    tags: ["prerequisites", "south-carolina", "scctcs", "developmental", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "delaware-technical-community-college-prereq-bottlenecks",
    title:
      "Delaware Technical Community College Prereq Chains: How SSC 100 Gates 606 Downstream Courses",
    description:
      "At Del Tech, SSC 100 sits upstream of 606 courses statewide — more than any English or math prereq. Engineering and MLT chains reach depth 9. Here's what to map before registering.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "de",
    author: "Community College Path",
    tags: ["prerequisites", "delaware", "dtcc", "developmental", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "massachusetts-community-college-prereq-bottlenecks",
    title:
      "Massachusetts Community College Prereq Chains: How Dev English Gates 400+ Downstream Courses",
    description:
      "Across MA community colleges, ENG 109 and related developmental courses gate 400+ downstream courses. Nursing chains reach depth 13. The English sequence is the primary planning variable.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "ma",
    author: "Community College Path",
    tags: ["prerequisites", "massachusetts", "mcccs", "developmental", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "last-day-to-add-drop-community-college-class",
    title:
      "What Is the Last Day to Add a Class at Community College? How Add/Drop Deadlines Work",
    description:
      "The add deadline is usually 1-2 weeks into the semester for full-term courses — but just days for late-start sections. Here's how the three key deadlines work and how to find yours.",
    date: "2026-05-10",
    category: "registration-timing",
    state: null,
    author: "Community College Path",
    tags: ["add-drop", "registration", "deadlines", "late-start", "financial-aid"],
  },

  // --- Cluster A spoke: transfer equivalency reading ---
  {
    slug: "how-to-read-transfer-equivalency-table",
    title:
      "How to Read a Community College Transfer Equivalency Table",
    description:
      "Transfer tables use notation nobody teaches: direct match vs elective, wildcards, grade minimums, credit caps. Here's how to decode them before you lose a semester assuming a course will count.",
    date: "2026-04-20",
    category: "transfer-confusion",
    state: null,
    author: "Community College Path",
    tags: ["transfer", "equivalency", "direct-match", "elective-credit", "notation"],
    cluster: "transfer-credit-guide",
    clusterRole: "spoke",
  },

  // --- Cluster B spoke: 15-state senior tuition comparison ---
  {
    slug: "senior-citizen-community-college-tuition-all-15-states",
    title:
      "Senior Citizen Community College Tuition: All 15 States Compared",
    description:
      "Age thresholds, income caps, audit-only vs credit-eligible. Senior tuition waiver rules vary dramatically across states. Here's the complete comparison matrix for all 15 states we track.",
    date: "2026-04-20",
    category: "senior-waivers",
    state: null,
    author: "Community College Path",
    tags: ["seniors", "tuition-waiver", "auditing", "comparison", "all-states"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },

  // --- Cluster B spoke: TN seniors ---
  {
    slug: "tennessee-senior-citizens-tbr-community-colleges",
    title:
      "Tennessee Senior Citizens at TBR Community Colleges: How the 65+ Tuition Waiver Actually Works",
    description:
      "Tennessee residents aged 65+ can take credit courses at TBR community colleges with tuition and most fees waived under Tenn. Code Ann. § 49-7-113. A small service fee (~$70/term) still applies. Here's how it works.",
    date: "2026-05-04",
    category: "senior-waivers",
    state: "tn",
    author: "Community College Path",
    tags: ["seniors", "tennessee", "tbr", "tuition-waiver", "65-plus"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },

  // --- Standalone: hybrid classes ---
  {
    slug: "hybrid-community-college-classes-explained",
    title:
      "Hybrid Community College Classes: The Hidden Third Option",
    description:
      "Hybrid courses are now 10-20% of community college offerings in most states. Here's what they actually are (including HyFlex), when hybrid wins over online or in-person, and how to spot them in registration.",
    date: "2026-04-20",
    category: "registration-timing",
    state: null,
    author: "Community College Path",
    tags: ["hybrid", "hyflex", "online", "in-person", "course-format", "scheduling"],
  },

  // --- Cluster C: Sessions and academic calendar timing (hub + future spokes) ---
  {
    slug: "community-college-sessions-explained",
    title:
      "Community College Sessions Explained: Full-Term, 8-Week, Mini-Mester, Late-Start, and Summer",
    description:
      "Community college schedules look like one 16-week term but actually contain a stack of overlapping sessions. Here's how each format works, when to use which, and how to stack them to finish faster.",
    date: "2026-05-09",
    category: "session-timing",
    state: null,
    author: "Community College Path",
    tags: ["sessions", "session-timing", "academic-calendar", "8-week", "mini-mester", "summer", "scheduling"],
    cluster: "session-timing-guide",
    clusterRole: "hub",
    faqs: [
      {
        q: "What's the difference between a full-term and 8-week community college class?",
        a: "Full-term classes run for the standard 15-16 weeks of the semester. 8-week classes cover the same content and award the same credits, but meet twice as often or twice as long to fit into half the calendar. Each 8-week session has its own registration, drop, and refund deadlines separate from the main term.",
      },
      {
        q: "What is a mini-mester?",
        a: "A mini-mester (also called intersession, winter session, or May-mester) is a compressed 2-5 week term, usually wedged between fall and spring or spring and summer. Course content from a full 3-credit class is delivered in a few weeks of intensive meetings — roughly 36 hours per week of total work for a single course.",
      },
      {
        q: "Are 8-week or summer credits worth less than full-term credits?",
        a: "No. A 3-credit course is a 3-credit course regardless of session length. Credits transfer the same, count toward financial aid the same, and post to your transcript the same. What changes is the weekly workload, not the value of the credit.",
      },
      {
        q: "Can I take 8-week classes back-to-back to fit two courses in one semester?",
        a: "Yes — this is one of the most common ways students compress an associate degree timeline. Take one course in the first 8-week session, finish it, then take another in the second 8-week session. You earn 6 credits over the same calendar period as a single full-term course.",
      },
    ],
  },

  // --- Cluster C spoke: MD session timing ---
  {
    slug: "maryland-community-college-session-timing-guide",
    title:
      "Maryland Community College Sessions Explained: Full-Term, 8-Week, Mini-Mester, and Late-Start Across MD's 16 Colleges",
    description:
      "AACC alone has 93 distinct start dates per term. Here's how MD's 16 community colleges actually structure session length, when each format helps, and how to spot the right one before you register.",
    date: "2026-05-09",
    category: "session-timing",
    state: "md",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "maryland", "8-week", "mini-mester", "macc"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },

  // --- Cluster E spoke: Germanna audit-at-college (per-college) ---
  {
    slug: "germanna-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Germanna Community College: Cost, Application, and Eligibility",
    description:
      "Germanna allows auditing at full credit-equivalent cost — or free for VA residents 60+ under the senior tuition waiver. Here's the application process, the constraints, and when auditing makes sense.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "gcc",
    author: "Community College Path",
    tags: ["auditing", "virginia", "germanna", "vccs", "senior-waiver"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },

  // --- Pipeline batch 2026-05-09b: 7 state-spokes + 3 college-spokes ---

  // Cluster C spokes (session-timing): TN, MA, NY, NC, VA, CT
  {
    slug: "tennessee-community-college-session-timing-guide",
    title:
      "Tennessee Community College Sessions Explained: How TBR's 12 Colleges Use 8-Week, Mini-Mester, and Late-Start Formats",
    description:
      "Northeast State publishes 62 distinct start dates per term. Here's how TBR's 12 community colleges actually structure session length, when each format helps, and how to find the right one before you register.",
    date: "2026-05-09",
    category: "session-timing",
    state: "tn",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "tennessee", "tbr", "8-week", "wintermester"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },
  {
    slug: "massachusetts-community-college-session-timing-guide",
    title:
      "Massachusetts Community College Sessions Explained: How MassCC's 15 Colleges Use Full-Term, 8-Week, and Summer Formats",
    description:
      "MassCC runs leaner session menus than peer states. Here's how the 15 colleges structure session length, when each format helps, and where Middlesex and Greenfield offer the deepest options.",
    date: "2026-05-09",
    category: "session-timing",
    state: "ma",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "massachusetts", "masscc", "8-week", "intersession"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },
  {
    slug: "new-york-cuny-community-college-session-timing-guide",
    title:
      "New York CUNY Community College Sessions Explained: How the 7 CUNY-CC Colleges Use 8-Week, Winter, and Summer Formats",
    description:
      "CUNY's 7 community colleges run a centrally synchronized session menu — narrower than peer systems but with a unique cross-campus enrollment advantage in winter and summer terms.",
    date: "2026-05-09",
    category: "session-timing",
    state: "ny",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "new-york", "cuny", "8-week", "winter-session"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },
  {
    slug: "north-carolina-community-college-session-timing-guide",
    title:
      "North Carolina Community College Sessions Explained: How NCCCS's 58 Colleges Use 8-Week, Mini-Mester, and Late-Start Formats",
    description:
      "Central Piedmont alone publishes 49 distinct start dates per term. Here's how NCCCS's 58 community colleges actually structure session length, when each format helps, and how to find the right one.",
    date: "2026-05-09",
    category: "session-timing",
    state: "nc",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "north-carolina", "ncccs", "8-week", "mini-session"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },
  {
    slug: "virginia-community-college-session-timing-guide",
    title:
      "Virginia Community College Sessions Explained: How VCCS's 23 Colleges Use 8-Week, Dynamic, and Late-Start Formats",
    description:
      "TCC publishes 74 distinct start dates per term. Here's how VCCS's 23 community colleges actually structure session length, including the dynamic-dated sections unique to Virginia.",
    date: "2026-05-09",
    category: "session-timing",
    state: "va",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "virginia", "vccs", "8-week", "dynamic-dated"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },
  {
    slug: "connecticut-state-community-college-session-timing-guide",
    title:
      "Connecticut State Community College Sessions Explained: How CT State's Unified System Uses 8-Week, Late-Start, and Summer Formats",
    description:
      "CT State's 2023 merger created a unified 12-campus system with shared accreditation. Here's how that affects session diversity and cross-campus enrollment for 8-week, intersession, and summer formats.",
    date: "2026-05-09",
    category: "session-timing",
    state: "ct",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "connecticut", "ct-state", "8-week", "unified-system"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },

  // Cluster B spoke: NY senior waivers
  {
    slug: "new-york-cuny-senior-citizens-tuition-waiver",
    title:
      "New York CUNY Senior Citizens at Community Colleges: How the 60+ Audit Program Actually Works",
    description:
      "N.Y. Education Law § 6304(5) waives tuition for residents 60+ at all 7 CUNY community colleges — but only for audit enrollment, not credit. Here's what's covered and how it compares to nearby states.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "ny",
    author: "Community College Path",
    tags: ["seniors", "new-york", "cuny", "tuition-waiver", "auditing", "audit-only"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },

  // Cluster E spokes (audit-at-college): NOVA, Reynolds, TCC
  {
    slug: "nova-northern-virginia-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Northern Virginia Community College: Cost, Application, and Eligibility",
    description:
      "NOVA, Virginia's largest community college, allows auditing at full credit cost — or free for VA residents 60+. Here's the process across NOVA's six campuses and online catalog.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "nova",
    author: "Community College Path",
    tags: ["auditing", "virginia", "nova", "vccs", "senior-waiver", "northern-virginia"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },
  {
    slug: "reynolds-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Reynolds Community College: Cost, Application, and Eligibility",
    description:
      "Reynolds Community College in central Virginia allows auditing at full credit cost — or free for VA residents 60+. Here's the process across the three Richmond-area campuses.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "reynolds",
    author: "Community College Path",
    tags: ["auditing", "virginia", "reynolds", "vccs", "senior-waiver", "richmond"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },
  {
    slug: "tcc-tidewater-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Tidewater Community College: Cost, Application, and Eligibility",
    description:
      "TCC serves Hampton Roads with four campuses and a heavy military-affiliated student body. Auditing rules, cost (free for seniors), and important notes for military and veteran auditors.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "tcc",
    author: "Community College Path",
    tags: ["auditing", "virginia", "tcc", "tidewater", "vccs", "senior-waiver", "hampton-roads"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },

  // --- Pipeline batch 2026-05-09c: 4 senior-waiver state-spokes + 1 session + 5 audit college-spokes ---

  // Cluster B spokes (senior-waivers): CT, GA, PA, FL
  {
    slug: "connecticut-senior-citizens-ct-state-tuition-waiver",
    title:
      "Connecticut Senior Citizens at CT State Community College: How the 62+ Audit Program Actually Works",
    description:
      "CGS § 10a-27 lets CT residents 62+ audit courses at CT State Community College tuition-free. Here's what's covered, what isn't, and how the unified-system structure affects access.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "ct",
    author: "Community College Path",
    tags: ["seniors", "connecticut", "ct-state", "tuition-waiver", "auditing", "audit-only"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },
  {
    slug: "georgia-senior-citizens-tcsg-tuition-waiver",
    title:
      "Georgia Senior Citizens at TCSG Technical Colleges: How the 62+ Tuition Waiver Actually Works",
    description:
      "OCGA 20-4-20 waives tuition at all 22 TCSG technical colleges for residents 62+ — covering credit enrollment, not just audit. Here's the credit-eligible structure and how to use it.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "ga",
    author: "Community College Path",
    tags: ["seniors", "georgia", "tcsg", "tuition-waiver", "credit-eligible"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },
  {
    slug: "pennsylvania-senior-citizens-community-college-tuition-waiver",
    title:
      "Pennsylvania Senior Citizens at Community Colleges: How the 60+ Audit Program Actually Works",
    description:
      "24 P.S. § 19-1908-B lets PA residents 60+ audit community college courses tuition-free. Here's how it works across PA's 14 community colleges and what makes the sponsor-district structure unique.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "pa",
    author: "Community College Path",
    tags: ["seniors", "pennsylvania", "tuition-waiver", "auditing", "audit-only"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },
  {
    slug: "florida-senior-citizens-fcs-tuition-waiver",
    title:
      "Florida Senior Citizens at FCS Colleges: How the 60+ Tuition Waiver Actually Works (And Why Credit Doesn't Count Toward Graduation)",
    description:
      "FL Stat. § 1009.26(4) waives tuition and fees at all 28 FCS colleges for residents 60+ — but credit earned doesn't count toward an associate degree. Here's what that constraint actually means.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "fl",
    author: "Community College Path",
    tags: ["seniors", "florida", "fcs", "tuition-waiver", "fee-waiver"],
    cluster: "senior-waivers-guide",
    clusterRole: "spoke",
  },

  // Cluster C spoke (session-timing): SC
  {
    slug: "south-carolina-technical-college-session-timing-guide",
    title:
      "South Carolina Technical College Sessions Explained: How SC's 16 Technical Colleges Use 8-Week, Mini-Mester, and Late-Start Formats",
    description:
      "Horry-Georgetown publishes 83 distinct start dates per term; Greenville Tech 76. Here's how SC's 16 technical colleges actually structure session length and how to find the right one.",
    date: "2026-05-09",
    category: "session-timing",
    state: "sc",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "south-carolina", "technical-college", "8-week"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },

  // Cluster E spokes (audit-at-college): BRCC, Brightpoint, Camp, CVCC, DCC
  {
    slug: "blue-ridge-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Blue Ridge Community College: Cost, Application, and Eligibility",
    description:
      "Blue Ridge Community College in the Shenandoah Valley allows auditing at full credit cost — or free for VA residents 60+. Here's the process across the Weyers Cave campus and education centers.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "brcc",
    author: "Community College Path",
    tags: ["auditing", "virginia", "brcc", "vccs", "senior-waiver", "shenandoah-valley"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },
  {
    slug: "brightpoint-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Brightpoint Community College: Cost, Application, and Eligibility",
    description:
      "Brightpoint Community College (formerly John Tyler) serves the Tri-Cities region with two campuses. Auditing rules, cost (free for seniors), and the application process for the south-of-Richmond auditor.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "brightpoint",
    author: "Community College Path",
    tags: ["auditing", "virginia", "brightpoint", "vccs", "senior-waiver", "tri-cities"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },
  {
    slug: "camp-paul-d-camp-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Paul D. Camp Community College: Cost, Application, and Eligibility",
    description:
      "Paul D. Camp Community College serves Western Tidewater with smaller class sizes and a focused workforce-program catalog. Auditing rules, cost (free for seniors), and how to enroll.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "camp",
    author: "Community College Path",
    tags: ["auditing", "virginia", "camp", "paul-d-camp", "vccs", "senior-waiver", "western-tidewater"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },
  {
    slug: "central-virginia-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Central Virginia Community College: Cost, Application, and Eligibility",
    description:
      "Central Virginia Community College serves the Lynchburg region from main campus plus the Bedford and Amherst centers. Auditing rules, cost (free for seniors), and the application process.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "cvcc",
    author: "Community College Path",
    tags: ["auditing", "virginia", "cvcc", "vccs", "senior-waiver", "lynchburg"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },
  {
    slug: "danville-community-college-audit-class-guide",
    title:
      "How to Audit a Class at Danville Community College: Cost, Application, and Eligibility",
    description:
      "Danville Community College serves Southside Virginia with a workforce-program emphasis and smaller class sizes. Auditing rules, cost (free for seniors), and how to enroll.",
    date: "2026-05-09",
    category: "senior-waivers",
    state: "va",
    college: "dcc",
    author: "Community College Path",
    tags: ["auditing", "virginia", "dcc", "danville", "vccs", "senior-waiver", "southside"],
    cluster: "audit-at-college-guide",
    clusterRole: "spoke",
  },
];
