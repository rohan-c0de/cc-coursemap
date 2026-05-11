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
  "course-format-density": "Course Format & Density",
};

export const articles: ArticleMeta[] = [
  // --- Cluster H: Course availability (hub + state spokes) ---
  {
    slug: "which-community-college-courses-are-hard-to-find",
    title:
      "Which Community College Courses Are Actually Hard to Find — And What to Do When Yours Isn't Available",
    description:
      "A small set of gen-ed courses run at every college in a state system. Most of the catalog concentrates at 1–3 anchor campuses. Here's how to tell which type your course is before you build your schedule around it.",
    date: "2026-05-10",
    category: "registration-timing",
    state: null,
    author: "Community College Path",
    tags: [
      "course-availability",
      "registration",
      "course-search",
      "schedule-planning",
      "anchor-campus",
    ],
    cluster: "course-availability-guide",
    clusterRole: "hub",
  },
  {
    slug: "north-carolina-community-college-course-availability",
    title:
      "North Carolina Community College Course Availability: What's at Every Campus, What's at One, and How to Tell the Difference",
    description:
      "NC's 55-college system has a 78.9% scarcity ratio — nearly 4 in 5 courses concentrate at fewer than 25% of campuses. ENG-111 is at all 55; architecture, animal science, and ASL are at one or two.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "nc",
    author: "Community College Path",
    tags: [
      "course-availability",
      "registration",
      "north-carolina",
      "ncccs",
      "anchor-campus",
      "schedule-planning",
    ],
    cluster: "course-availability-guide",
    clusterRole: "spoke",
  },
  {
    slug: "georgia-community-college-course-availability",
    title:
      "Georgia Technical College Course Availability: Central Georgia Tech Holds 41% of the State's Point-Source Courses — And Nursing Is Almost Entirely Concentrated",
    description:
      "Central Georgia Technical College holds 43 exclusive courses in Georgia's 20-college TCSG system. Nursing (RNSG) is 100% concentrated statewide — 59 courses, none available outside a handful of campuses.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "ga",
    author: "Community College Path",
    tags: [
      "course-availability",
      "registration",
      "georgia",
      "tcsg",
      "anchor-campus",
      "nursing",
      "schedule-planning",
    ],
    cluster: "course-availability-guide",
    clusterRole: "spoke",
  },
  {
    slug: "kentucky-community-college-course-availability",
    title:
      "Kentucky KCTCS Course Availability: Nursing Prereqs at Every Campus, Three Anchor Colleges Each Holding 20+ Exclusive Programs",
    description:
      "KCTCS puts NAA-100 and both A&P courses at all 16 colleges — unusual universal access for nursing tracks. But Jefferson, Madisonville, and Bluegrass each hold 20+ exclusive courses.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "ky",
    author: "Community College Path",
    tags: [
      "course-availability",
      "registration",
      "kentucky",
      "kctcs",
      "anchor-campus",
      "nursing",
      "schedule-planning",
    ],
    cluster: "course-availability-guide",
    clusterRole: "spoke",
  },
  {
    slug: "virginia-community-college-course-availability",
    title:
      "Virginia VCCS Course Availability: Which Courses Are at All 23 Colleges and Which Are at One",
    description:
      "VCCS's 23-college system has a 68.6% scarcity ratio — lower than NC's 78.9% but still meaning 2 in 3 courses concentrate at fewer than 25% of campuses. NOVA and TCC each hold 5 exclusive programs; veterinary technology and architecture are entirely scarce statewide.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "va",
    author: "Community College Path",
    tags: [
      "course-availability",
      "registration",
      "virginia",
      "vccs",
      "anchor-campus",
      "schedule-planning",
    ],
    cluster: "course-availability-guide",
    clusterRole: "spoke",
  },
  {
    slug: "tennessee-community-college-course-availability",
    title:
      "Tennessee Community College Course Availability: 251 Point-Source Courses, Three Regional Anchors, and the Best Scarcity Ratio in the Southeast",
    description:
      "Tennessee's TBR system has the best scarcity ratio of any southeastern system in this cluster — but 19.5% of its catalog (251 courses) is available at exactly one campus. Here's how gen-ed breadth and specialized concentration coexist across 12 colleges.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "tn",
    author: "Community College Path",
    tags: [
      "course-availability",
      "registration",
      "tennessee",
      "tbr",
      "anchor-campus",
      "schedule-planning",
    ],
    cluster: "course-availability-guide",
    clusterRole: "spoke",
  },
  {
    slug: "south-carolina-technical-college-course-availability",
    title:
      "South Carolina Technical College Course Availability: Tri-County Holds 40% of All Exclusive Programs",
    description:
      "SCTCS has only 21 universal courses (1.7% of the catalog) — the lowest of any state in the cluster. Tri-County Technical College holds 43 exclusive point-source courses, 40% of all concentrated programs in a 14-college system. Nursing concentrates at Horry-Georgetown; auto body repair (ABR) is 100% scarce statewide.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "sc",
    author: "Community College Path",
    tags: [
      "course-availability",
      "registration",
      "south-carolina",
      "sctcs",
      "anchor-campus",
      "schedule-planning",
    ],
    cluster: "course-availability-guide",
    clusterRole: "spoke",
  },

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

  // --- Cluster G: Late-start by state (hub + future state spokes) ---
  {
    slug: "how-to-find-late-start-community-college-classes",
    title:
      "How Late Can You Enroll in Community College? Late-Start Classes Explained",
    description:
      "Late-start sections are 8.5% of community college fall offerings nationally — but range from 18% in NH to 1% in ME. Here's how to find them and what the state-by-state variation means for you.",
    date: "2026-04-04",
    category: "registration-timing",
    state: null,
    author: "Community College Path",
    tags: ["late-start", "mini-session", "registration", "accelerated", "density"],
    cluster: "late-start-by-state-guide",
    clusterRole: "hub",
    faqs: [
      {
        q: "What are late-start community college classes?",
        a: "Late-start classes (also called mini-sessions, second-start, or accelerated sections) are regular college courses that begin weeks or months after the main semester starts. They're compressed into 8, 10, or 12 weeks instead of the full 16, but cover the same material, carry the same credits, and transfer the same way.",
      },
      {
        q: "Do late-start classes count the same as full-term classes for transfer?",
        a: "Yes. A late-start section of a course has the same course number, same credits, and same transfer equivalency as a full-term section. Universities do not distinguish between a 16-week and an 8-week section of the same course.",
      },
      {
        q: "How do I find late-start classes at my community college?",
        a: "Filter your college's course search by start date (look for courses starting 2-8 weeks after the semester begins), look for session labels like '2nd 8-week' or 'Mini-Session 2,' and check online sections first — they're more likely to have late-start options.",
      },
      {
        q: "How common are late-start classes at community colleges?",
        a: "Nationally, late-start sections make up about 8.5% of fall offerings, but this varies dramatically by state — from 18% in New Hampshire to 1.3% in Maine. Individual colleges vary even more: some run 30%+ late-start sections while others offer almost none.",
      },
    ],
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
    faqs: [
      {
        q: "What percentage of community college courses have prerequisites?",
        a: "Across the 12 community college systems indexed, roughly 40-60% of courses have at least one prerequisite. A meaningful share have chains two, three, or four levels deep — especially in math, science, and nursing sequences.",
      },
      {
        q: "Why does a two-year degree take longer than two years?",
        a: "Prerequisite chains are a major contributor. Students who place into developmental math or English face 1-4 extra semesters of catch-up courses before they can start their major-track classes. Only about 15% of community college students finish an associate degree in two years.",
      },
      {
        q: "How do I plan around prerequisite chains?",
        a: "Start with your destination major's last required course and work backwards to the community college level. Take placement tests early — where you place in math and English determines your entire runway. Budget a failure buffer so one bad semester doesn't reset your timeline by 6-12 months.",
      },
      {
        q: "Do minimum grade requirements affect prerequisite chains?",
        a: "Yes. 'Prereq: ENG 101' is different from 'Prereq: ENG 101 with C or better.' Some programs — nursing is notorious — require B+ or better in prereqs. A grade below the minimum means retaking the course, which adds a semester to your plan.",
      },
    ],
  },
  // --- Pipeline batch 2026-05-09d: FL prereq spoke ---
  {
    slug: "florida-community-college-prereq-bottlenecks",
    title:
      "Florida Community College Prerequisite Chains: How Developmental English Gates 319 Courses Across FCS",
    description:
      "ENC 0025 is the most consequential course in Florida's state college system — a prerequisite for 319 other courses. The deepest chain reaches 22 levels into nursing. Here's how FL's prereq structure shapes planning.",
    date: "2026-05-09",
    category: "mistake-avoidance",
    state: "fl",
    author: "Community College Path",
    tags: ["prerequisites", "florida", "fcs", "developmental", "bottlenecks", "course-sequence", "nursing"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
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

  // --- Cluster F: Course format density (hub + future state spokes) ---
  {
    slug: "hybrid-community-college-classes-explained",
    title:
      "Hybrid Community College Classes: The Hidden Third Option",
    description:
      "Hybrid courses are 4.7% of community college offerings nationally — but vary 0% to 14.6% by state. Here's what hybrid actually is (including HyFlex), where it's common vs hidden under other labels, and when it wins.",
    date: "2026-04-20",
    category: "course-format-density",
    state: null,
    author: "Community College Path",
    tags: ["hybrid", "hyflex", "online", "in-person", "course-format", "scheduling", "density"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "hub",
    faqs: [
      {
        q: "What is a hybrid community college class?",
        a: "A hybrid class blends in-person and online components. Some portion of class time happens synchronously in a physical classroom, and the rest happens asynchronously online. Common formats include 50/50 splits (one in-person meeting per week plus online work), front-loaded hybrids, and periodic in-person sessions for exams or labs.",
      },
      {
        q: "What is HyFlex and how is it different from hybrid?",
        a: "HyFlex is a subset of hybrid that gives students per-class flexibility. Each class session is offered simultaneously in-person, synchronously online via Zoom, and asynchronously via recording. You choose which modality to use each week. It started as a pandemic response but several colleges have kept it permanently.",
      },
      {
        q: "Do hybrid classes transfer the same as in-person classes?",
        a: "Yes. A hybrid section transfers as a regular credit-bearing course. The receiving university doesn't see or care about the delivery format — only the course number and credits matter. Format flexibility costs you nothing on transfer.",
      },
      {
        q: "How common are hybrid classes at community colleges?",
        a: "Nationally, hybrid sections are about 4.7% of all offerings, but this varies widely by state. Maryland leads at 14.6%, followed by Massachusetts at 14.2% and Virginia at 11.3%. Some states like Florida and Tennessee report near-zero hybrid sections, though this often reflects labeling differences rather than a true absence of blended courses.",
      },
    ],
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
  // Cluster C spokes (session-timing): GA, FL
  {
    slug: "georgia-technical-college-session-timing-guide",
    title:
      "Georgia TCSG Session Timing: Central Georgia Tech's 195 Start Dates and What Session Diversity Means for Technical College Students",
    description:
      "Central Georgia Technical College has 195 distinct start dates across all terms — the highest session diversity of any college we've indexed, nearly 2.7x Virginia's most flexible VCCS campus. Here's how TCSG's workforce-first calendar works and how to find sections that fit your schedule.",
    date: "2026-05-10",
    category: "session-timing",
    state: "ga",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "georgia", "tcsg", "8-week", "workforce", "technical-college"],
    cluster: "session-timing-guide",
    clusterRole: "spoke",
  },
  {
    slug: "florida-community-college-session-timing-guide",
    title:
      "Florida College System Session Timing: South Florida State's 111 Start Dates vs. Valencia's 4",
    description:
      "South Florida State College runs 111 distinct start dates; Valencia College runs 4 — but with 5,672 sections. How Florida's FCS colleges divide between rolling-start flexibility and high-density conventional semesters, and what that means for your scheduling strategy.",
    date: "2026-05-10",
    category: "session-timing",
    state: "fl",
    author: "Community College Path",
    tags: ["sessions", "session-timing", "florida", "fcs", "8-week", "mini-mester", "summer"],
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

  // --- Cluster F spokes (hybrid-course-density): ME, MD, MA ---
  {
    slug: "maine-community-college-hybrid-density",
    title:
      "Maine Community College Hybrid Classes: Where the State's 16.2% Hybrid Share Actually Lives",
    description:
      "MCCS runs 16.2% hybrid sections statewide — second highest in the East. EMCC, SMCC, and YCCC each top 20% hybrid. Here's what the data shows and how to use it as an MCCS student.",
    date: "2026-05-10",
    category: "course-format-density",
    state: "me",
    author: "Community College Path",
    tags: ["hybrid", "maine", "mccs", "course-format", "density", "adult-learners"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },
  {
    slug: "maryland-community-college-hybrid-density",
    title:
      "Maryland Community College Hybrid Classes: How Frederick CC's 63% Hybrid Share Skews the State Average",
    description:
      "MACC reports 13.7% hybrid sections statewide — but Frederick CC alone runs 63%. The state-level number hides extreme college-level variation. Here's what the data shows and how to navigate it.",
    date: "2026-05-10",
    category: "course-format-density",
    state: "md",
    author: "Community College Path",
    tags: ["hybrid", "maryland", "macc", "frederick", "course-format", "density"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },
  {
    slug: "massachusetts-community-college-hybrid-density",
    title:
      "Massachusetts Community College Hybrid Classes: How BHCC's 40% Concentration Drives the State's 14.2% Hybrid Share",
    description:
      "MassCC reports 14.2% hybrid sections statewide — but Bunker Hill CC alone runs 40%. The bimodal distribution shapes what 'hybrid in Massachusetts' actually means depending on which college you attend.",
    date: "2026-05-10",
    category: "course-format-density",
    state: "ma",
    author: "Community College Path",
    tags: ["hybrid", "massachusetts", "masscc", "bhcc", "course-format", "density"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },

  // --- Cluster G spokes (late-start-by-state): NH, GA, SC ---
  {
    slug: "new-hampshire-community-college-late-start-classes",
    title:
      "New Hampshire Community College Late-Start Classes: Why CCSNH Has 18% Late-Start — Highest in the East",
    description:
      "CCSNH runs 18.1% late-start sections — the highest density in any East Coast community college system. LRCC, GBCC, WMCC, and MCCNH all top 21%. Here's how to use the catalog if you missed main registration.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "nh",
    author: "Community College Path",
    tags: ["late-start", "new-hampshire", "ccsnh", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "georgia-community-college-late-start-classes",
    title:
      "Georgia TCSG Late-Start Classes: Where the System's 14.5% Late-Start Density Actually Lives",
    description:
      "TCSG runs 1,307 late-start sections across 22 colleges — the largest absolute late-start catalog on the East Coast. Albany Tech leads at 29.4%. Here's how to use it if you missed main registration.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "ga",
    author: "Community College Path",
    tags: ["late-start", "georgia", "tcsg", "registration", "workforce", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "south-carolina-technical-college-late-start-classes",
    title:
      "South Carolina Technical College Late-Start Classes: Why Piedmont Tech's 38% Late-Start Density Skews the State Average",
    description:
      "SC tech colleges run 11.8% late-start sections — but Piedmont Tech alone reports 38%, carrying 60% of the statewide late-start catalog. Here's what the data shows and how to navigate it.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "sc",
    author: "Community College Path",
    tags: ["late-start", "south-carolina", "piedmont-tech", "registration", "workforce"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  // --- Pipeline batch 2026-05-10a: prereq spokes (RI, NY, PA) ---
  {
    slug: "rhode-island-community-college-prereq-bottlenecks",
    title:
      "Rhode Island Community College Prerequisite Chains: How CCRI's Single-College System Concentrates the Bottleneck",
    description:
      "Rhode Island has one community college — CCRI. ENGL 0700 gates 262 downstream courses; the nursing chain runs 21 levels deep. Here's how to sequence around the bottleneck when there's no alternative campus.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "ri",
    author: "Community College Path",
    tags: ["prerequisites", "rhode-island", "ccri", "developmental", "bottlenecks", "course-sequence", "nursing"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "new-york-cuny-community-college-prereq-bottlenecks",
    title:
      "CUNY Community College Prerequisite Chains: Why a Maximum Depth of 8 Is a Structural Advantage Worth Understanding",
    description:
      "Across CUNY's seven community colleges, the maximum prereq chain depth is 8 — far below the 21-22 levels in FL and SC. Co-requisite remediation explains the ceiling. Here's what it means for CUNY planning.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "ny",
    author: "Community College Path",
    tags: ["prerequisites", "new-york", "cuny", "developmental", "bottlenecks", "course-sequence", "co-requisite"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "pennsylvania-community-college-prereq-bottlenecks",
    title:
      "Pennsylvania Community College Prerequisite Chains: How Fundamental Math Gates Vocational-Tech Programs at CCP",
    description:
      "At CCP and across PA, FNMT developmental math — not English — drives the deepest chains. Biomedical tech (BMET) reaches depth 12, diagnostic imaging (DMI) depth 11. Here's how PA's prereq structure works.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "pa",
    author: "Community College Path",
    tags: ["prerequisites", "pennsylvania", "ccp", "developmental", "math", "bottlenecks", "vocational", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  // --- Pipeline batch 2026-05-10a: hybrid-density spokes (VA, SC, NC) ---
  {
    slug: "virginia-community-college-hybrid-density",
    title:
      "Virginia Community College Hybrid Classes: Rural Southwest Colleges Lead at 35%, While NOVA's 17% Anchors the DC Suburbs",
    description:
      "VCCS runs 11.3% hybrid across 26,236 sections. Mountain Gateway leads at 35%; NRCC and WCC are under 2%. NOVA at 17% is the largest hybrid footprint in dollar-volume terms. Here's the full per-college breakdown.",
    date: "2026-05-10",
    category: "planning",
    state: "va",
    author: "Community College Path",
    tags: ["hybrid", "virginia", "vccs", "online", "nova", "schedule", "format"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },
  {
    slug: "south-carolina-community-college-hybrid-density",
    title:
      "South Carolina Technical College Hybrid Classes: Trident at 23% with Zero Online, Greenville at 0% with 3,500 Sections",
    description:
      "SCCTCS runs 10.6% hybrid statewide — but Trident Technical College (23%) runs zero online, making hybrid its only remote option. Greenville Tech (3,563 sections) and Midlands Tech both run 0% hybrid.",
    date: "2026-05-10",
    category: "planning",
    state: "sc",
    author: "Community College Path",
    tags: ["hybrid", "south-carolina", "scctcs", "trident", "online", "schedule", "format"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },
  {
    slug: "north-carolina-community-college-hybrid-density",
    title:
      "North Carolina Community College Hybrid Classes: 4.8% Statewide — But That Number Conceals a Bimodal Split Larger Than Any Other East Coast System",
    description:
      "NCCCS has 55 colleges and 53,631 sections — the largest East Coast system we track. Sandhills CC runs 31% hybrid; CPCC (4,982 sections) and Wake Tech (4,311 sections) both run 0%. Here's the full breakdown.",
    date: "2026-05-10",
    category: "planning",
    state: "nc",
    author: "Community College Path",
    tags: ["hybrid", "north-carolina", "ncccs", "sandhills", "wake-tech", "cpcc", "online", "schedule", "format"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },
  // --- Pipeline batch 2026-05-10a: late-start spokes (TN, MD, NC) ---
  {
    slug: "tennessee-community-college-late-start-classes",
    title:
      "Tennessee Community College Late-Start Classes: How TBR's 7.8% Late-Start Share Is Distributed",
    description:
      "TBR's 12 community colleges hold 1,157 late-start sections for fall 2026 — a 7.8% share. Chattanooga State leads at 26.4%; Pellissippi State is at 2.3%. Here's how to find and use Tennessee's late-start catalog.",
    date: "2026-05-10",
    category: "planning",
    state: "tn",
    author: "Community College Path",
    tags: ["late-start", "tennessee", "tbr", "registration", "chattanooga-state", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "maryland-community-college-late-start-classes",
    title:
      "Maryland Community College Late-Start Classes: AACC and PGCC Lead a 9.0% System Average",
    description:
      "Maryland's 12 tracked community colleges hold 847 late-start sections for fall 2026 — a 9.0% share. AACC leads on rate at 14.9%; PGCC leads on volume at 267 sections. Here's how to find and use Maryland's late-start catalog.",
    date: "2026-05-10",
    category: "planning",
    state: "md",
    author: "Community College Path",
    tags: ["late-start", "maryland", "aacc", "pgcc", "registration", "montgomery-college", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "north-carolina-community-college-late-start-classes",
    title:
      "North Carolina Community College Late-Start Classes: Rural Colleges Lead a 9.6% System Average",
    description:
      "NC community colleges hold 366 late-start sections in the fall 2026 catalog — a 9.6% share, above the East Coast average. College of Albemarle leads at 15.8%. Here's how rural geography shapes NC's late-start distribution.",
    date: "2026-05-10",
    category: "planning",
    state: "nc",
    author: "Community College Path",
    tags: ["late-start", "north-carolina", "ncccs", "registration", "rural", "albemarle", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  // --- Pipeline batch 2026-05-10b: prereq spokes (DC, CT, NH) ---
  {
    slug: "district-of-columbia-community-college-prereq-bottlenecks",
    title:
      "District of Columbia Community College Prerequisite Chains: How UDC-CC's Single-Institution System Concentrates the Bottleneck",
    description:
      "UDC Community College is DC's sole community college. 100% of indexed courses carry explicit prerequisites. MATH 151 gates 149 courses; architecture, engineering, and dietetics chains reach depth 7.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "dc",
    author: "Community College Path",
    tags: ["prerequisites", "district-of-columbia", "udc", "developmental", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "connecticut-community-college-prereq-bottlenecks",
    title:
      "Connecticut Community College Prerequisite Chains: How ENG 0930 Gates 200 Downstream Courses Across CT-State",
    description:
      "Across CT-State's 12 campuses, ENG 0930 is the single most consequential course — gating 200 downstream courses despite a max depth of only 5. Music, CMGT, and CSC chains run unexpectedly deep.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "ct",
    author: "Community College Path",
    tags: ["prerequisites", "connecticut", "ct-state", "developmental", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "new-hampshire-community-college-prereq-bottlenecks",
    title:
      "New Hampshire Community College Prerequisite Chains: How Radiologic Technology Dominates CCSNH's Deepest Sequences",
    description:
      "CCSNH's prereq structure is broadly shallow — but Radiologic Technology (RADT) chains reach depth 8, the deepest in the system. Only 78 deep chains out of 592 total courses. Here's what that means for NH planning.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "nh",
    author: "Community College Path",
    tags: ["prerequisites", "new-hampshire", "ccsnh", "radiologic-technology", "bottlenecks", "course-sequence"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  // --- Pipeline batch 2026-05-10b: hybrid-density spokes (KY, AL, NY) ---
  {
    slug: "kentucky-community-college-hybrid-density",
    title:
      "Kentucky Community College Hybrid Classes: KCTCS at 13.2% — Gateway Leads at 22.8%, Henderson Runs Zero",
    description:
      "KCTCS runs 13.2% hybrid across 16,512 sections and 16 colleges. Gateway CTC leads at 22.8% (hybrid is the plurality format); Henderson CC runs 0%. Online at 48.2% dwarfs hybrid statewide.",
    date: "2026-05-10",
    category: "planning",
    state: "ky",
    author: "Community College Path",
    tags: ["hybrid", "kentucky", "kctcs", "gateway", "online", "schedule", "format", "workforce"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },
  {
    slug: "alabama-community-college-hybrid-density",
    title:
      "Alabama Community College Hybrid Classes: Enterprise State at 35.6%, Coastal Alabama at 5.4% — and Why the Gap Matters",
    description:
      "ACCS runs 10.9% hybrid across 8,883 sections and 6 colleges. Enterprise State leads at 35.6% (Fort Novosel military enrollment). Coastal Alabama (43% of all sections) runs only 5.4%, pulling the statewide average down.",
    date: "2026-05-10",
    category: "planning",
    state: "al",
    author: "Community College Path",
    tags: ["hybrid", "alabama", "accs", "enterprise-state", "coastal-alabama", "online", "schedule", "format"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },
  {
    slug: "new-york-community-college-hybrid-density",
    title:
      "New York Community College Hybrid Classes: CUNY's 6.2% Reflects NYC Transit Density — Kingsborough Leads at 17%",
    description:
      "CUNY's 7 community colleges run 6.2% hybrid across 5,775 sections — below all East Coast peers. Kingsborough leads at 17%; BMCC and LaGuardia together hold 43% of sections and anchor the system near zero.",
    date: "2026-05-10",
    category: "planning",
    state: "ny",
    author: "Community College Path",
    tags: ["hybrid", "new-york", "cuny", "kingsborough", "bmcc", "laguardia", "online", "schedule", "format"],
    cluster: "hybrid-course-density-guide",
    clusterRole: "spoke",
  },
  // --- Pipeline batch 2026-05-10b: late-start spokes (DE, RI, FL) ---
  {
    slug: "delaware-community-college-late-start-classes",
    title:
      "Delaware Community College Late-Start Classes: Del Tech's 12.5% Rate Across 12 Dates at 4 Campuses",
    description:
      "Delaware Technical Community College is DE's sole community college — 275 late-start sections across 12 distinct dates, clustered in two cohort windows (late September, mid-October). Here's how to navigate Del Tech's late-start calendar.",
    date: "2026-05-10",
    category: "planning",
    state: "de",
    author: "Community College Path",
    tags: ["late-start", "delaware", "dtcc", "del-tech", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "rhode-island-community-college-late-start-classes",
    title:
      "Rhode Island Community College Late-Start Classes: CCRI's 12.8% Rate in Just 4 Distinct Date Windows",
    description:
      "CCRI is RI's only community college — 240 late-start sections at a 12.8% rate, but only 4 distinct start dates. The concentrated calendar means missing one window shifts you weeks forward. Here's how CCRI's late-start structure works.",
    date: "2026-05-10",
    category: "planning",
    state: "ri",
    author: "Community College Path",
    tags: ["late-start", "rhode-island", "ccri", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "florida-community-college-late-start-classes",
    title:
      "Florida Community College Late-Start Classes: 42 Distinct Dates Across 8 Colleges — and What That Means for Registration",
    description:
      "Florida's state college system holds 753 late-start sections across 8 colleges at a 7.0% rate — with 42 distinct start dates. CFK leads at 22.4%; Valencia anchors volume. Each college manages its own registration separately.",
    date: "2026-05-10",
    category: "planning",
    state: "fl",
    author: "Community College Path",
    tags: ["late-start", "florida", "fcs", "valencia", "cfk", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  // --- Pipeline batch 2026-05-10c: prereq spokes (TN, VA, VT) ---
  {
    slug: "tennessee-community-college-prereq-bottlenecks",
    title:
      "Tennessee Community College Prerequisite Chains: ENGL 1010 Gates 64 Courses, CITC 1301 Is the Non-Obvious Bottleneck",
    description:
      "Across TBR's 12 community colleges, ENGL 1010 is the widest gate at 64 downstream courses. But CITC 1301 (a CIS course) gates 31 — the non-obvious bottleneck. Agriculture chains reach the max depth of 8.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "tn",
    author: "Community College Path",
    tags: ["prerequisites", "tennessee", "tbr", "developmental", "bottlenecks", "course-sequence", "cis"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "virginia-community-college-prereq-bottlenecks",
    title:
      "Virginia Community College Prerequisite Chains: VCCS Has the Shallowest Chains in Any Multi-College System We've Indexed",
    description:
      "VCCS's max depth is 4 — the shallowest of any multi-college system in our dataset. Only 19 deep chains across 292 prereq-bearing courses. ENG 111 gates just 23 courses. Here's what that means for VA students.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "va",
    author: "Community College Path",
    tags: ["prerequisites", "virginia", "vccs", "bottlenecks", "course-sequence", "shallow-chains"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  {
    slug: "vermont-community-college-prereq-bottlenecks",
    title:
      "Vermont Community College Prerequisite Chains: How VTSU's Post-Merger System Structures Its 101 Prereq-Bearing Courses",
    description:
      "Vermont State University merged CCV, Johnson, Lyndon, and Castleton in 2022. The prereq dataset has 101 courses; CIS 1100 and MAT 0310 tie as top bottlenecks at 15 each. STEM chains reach depth 5.",
    date: "2026-05-10",
    category: "mistake-avoidance",
    state: "vt",
    author: "Community College Path",
    tags: ["prerequisites", "vermont", "vtsu", "merger", "bottlenecks", "course-sequence", "stem"],
    cluster: "prereq-chains-guide",
    clusterRole: "spoke",
  },
  // --- Pipeline batch 2026-05-10c: late-start spokes (KY, MS, MA) ---
  {
    slug: "kentucky-community-college-late-start-classes",
    title:
      "Kentucky Community College Late-Start Classes: KCTCS at 14.9% — Elizabethtown Leads at 39.7%",
    description:
      "KCTCS runs 14.9% late-start across 13,048 sections and 16 colleges — the highest rate in our dataset. Elizabethtown CTC leads at 39.7%. Jefferson (Louisville) and Bluegrass (Lexington) run at 9.2–9.5%.",
    date: "2026-05-10",
    category: "planning",
    state: "ky",
    author: "Community College Path",
    tags: ["late-start", "kentucky", "kctcs", "elizabethtown", "registration", "workforce", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "mississippi-community-college-late-start-classes",
    title:
      "Mississippi Community College Late-Start Classes: Meridian CC's 9.1% Rate Across 16 Distinct Dates",
    description:
      "Meridian Community College is the only MS institution in our dataset — 71 late-start sections at 9.1%, spread across 16 distinct dates between September 15 and November 16. Here's how the calendar is structured.",
    date: "2026-05-10",
    category: "planning",
    state: "ms",
    author: "Community College Path",
    tags: ["late-start", "mississippi", "meridian", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "massachusetts-community-college-late-start-classes",
    title:
      "Massachusetts Community College Late-Start Classes: Middlesex and BHCC Lead, STCC Runs Zero Across 1,087 Sections",
    description:
      "MA's 6 tracked community colleges hold 389 late-start sections at 7.5% — but STCC (Springfield) runs 0% across 1,087 sections. Middlesex leads at 10.9%, BHCC at 10.8%. 18 distinct dates across the system.",
    date: "2026-05-10",
    category: "planning",
    state: "ma",
    author: "Community College Path",
    tags: ["late-start", "massachusetts", "middlesex", "bhcc", "stcc", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "vermont-community-college-late-start-classes",
    title:
      "Vermont Community College Late-Start Classes: 6.8% Rate Across a Single Unified System",
    description:
      "Vermont State University runs the state's only community college track. Fall 2026 data: 112 late-start sections, 6.8% rate, 8 distinct dates from mid-September through early November.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "vt",
    author: "Community College Path",
    tags: ["late-start", "vermont", "vtsu", "ccv", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "alabama-community-college-late-start-classes",
    title:
      "Alabama Community College Late-Start Classes: 5.3% Rate, 6 Colleges, 16 Distinct Dates",
    description:
      "ACCS fall 2026 data across 6 colleges: 236 late-start sections at 5.3%. Chattahoochee Valley and Enterprise State lead at 9.6% each; Wallace–Dothan trails at 3.4%. Sixteen distinct entry points from September through November.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "al",
    author: "Community College Path",
    tags: ["late-start", "alabama", "accs", "enterprise-state", "coastal-alabama", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
  {
    slug: "district-of-columbia-community-college-late-start-classes",
    title:
      "DC Community College Late-Start Classes: UDC-CC's 5.6% Rate and 6 Entry Points",
    description:
      "UDC Community College is DC's only public two-year institution. Fall 2026: 59 late-start sections, 5.6% rate, 6 distinct dates — including a tight September 22–28 rescue window and two December short-format dates.",
    date: "2026-05-10",
    category: "registration-timing",
    state: "dc",
    author: "Community College Path",
    tags: ["late-start", "district-of-columbia", "udc-cc", "registration", "adult-learners"],
    cluster: "late-start-by-state-guide",
    clusterRole: "spoke",
  },
];
