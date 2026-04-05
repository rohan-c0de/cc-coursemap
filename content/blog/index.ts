export type ArticleMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
  state: string | null; // null = general, "va" = Virginia-specific, etc.
  author: string;
  tags: string[];
  cluster?: string; // optional cluster ID for hub/spoke linking
  clusterRole?: "hub" | "spoke";
};

export const CATEGORIES: Record<string, string> = {
  "transfer-confusion": "Transfer Credits",
  "registration-timing": "Registration & Timing",
  "cross-college-scheduling": "Cross-College Scheduling",
  "senior-waivers": "Senior Waivers & Auditing",
  "state-system-explainers": "State System Explainers",
  "mistake-avoidance": "Mistake Avoidance",
};

export const articles: ArticleMeta[] = [
  {
    slug: "what-direct-match-vs-elective-credit-means",
    title:
      "Community College Transfer Credit: What \"Direct Match\" vs \"Elective Credit\" Actually Means",
    description:
      "Your course transferred — but did it actually count? Learn the difference between a direct match and elective credit, and why it matters for graduation.",
    date: "2026-04-04",
    category: "transfer-confusion",
    state: null,
    author: "CC CourseMap",
    tags: ["transfer", "credits", "direct-match", "elective-credit"],
    cluster: "transfer-credit-guide",
    clusterRole: "hub",
  },
];
