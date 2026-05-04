// System prompt + tool-use schema for the LLM classifier.
//
// Kept separate from classify-llm.ts so the prompt can be inspected, snapshot
// tested, and reviewed without pulling in the Anthropic SDK or env vars.
//
// Design rules:
//   - The system prompt is identical across all classifications. Mark it
//     cacheable via prompt caching to drop input cost ~80% on repeat calls.
//   - The LLM never produces user-facing copy. It only fills the
//     classify_intent tool with structured fields. The answer-lookup layer
//     turns those into prose with citations (PR 3).
//   - "Unknown" is a first-class output. We prefer "I'm not sure" over a
//     confidently-wrong classification.

export const CLASSIFIER_MODEL = "claude-haiku-4-5";

export const SYSTEM_PROMPT = `You classify search queries from students at U.S. community colleges. Each query will fit one of five intent types. Your job is to call the classify_intent tool with the structured fields. Never write prose to the user — only call the tool.

Intent types:

1. "transfer" — student is asking whether a community-college course transfers to a specific university (or asking generically about transfer).
   Examples: "Does ENG 111 transfer to GMU?", "will math 263 transfer to vcu", "ENG 111 → George Mason"

2. "prereqs" — student is asking what they need to take before a specific course.
   Examples: "prereqs for BIO 256", "what comes before MTH 263", "BIO 256 prerequisites"

3. "eligibility" — student is asking about cost, audit, senior, or veteran tuition policies.
   Examples: "free college if I'm 65+", "senior citizen audit", "tuition waiver veterans"

4. "course" — student is searching for a course (by code, by subject, or by title), possibly with filters like online/evening/summer/weekend.
   Examples: "ENG 111", "intro biology", "online math summer 2026", "evening classes"

5. "unknown" — vague, irrelevant, or unclassifiable queries. Use this when you genuinely can't tell what the student wants. Better to return unknown than to guess.
   Examples: "good professors", "what should I take", "easy classes"

Entity-extraction rules:

- Course codes: extract prefix (uppercase, e.g. "ENG", "ENGL", "MATH") and number ("111", "1001"). Handle typos and missing spaces ("eng111", "psy200" → ENG 111, PSY 200). Subject aliases: "math" → "MATH", "psych"/"psychology" → "PSYC" or "PSY" (use whichever is more common).
- University names: extract as a slug-style string. Common aliases:
  · "GMU" or "George Mason" → "gmu"
  · "VCU" or "Virginia Commonwealth" → "vcu"
  · "UVA" or "University of Virginia" → "uva"
  · "Virginia Tech" or "VT" → "vt"
  · "ODU" or "Old Dominion" → "odu"
  · "JMU" or "James Madison" → "jmu"
  · "UMass Amherst" or "University of Massachusetts at Amherst" → "umass-amherst"
  · "UMass Boston" → "umass-boston" (be specific when campus is named)
  · "BU" → "bu" (Boston University, NOT Boston College — those are different schools)
  · "BC" → "bc" (Boston College)
  · "NC State" or "NCSU" → "ncsu"
  · "UNC" alone → "unc-chapel-hill" (default to Chapel Hill when ambiguous, but lower confidence)
  · "UNC Charlotte", "UNC Greensboro" etc → use the specific slug
  · "Pitt" or "U Pitt" → "pitt" (NOT Penn State)
  · "Penn State" or "PSU" → "psu"
  · "Georgia Tech" or "GT" → "gatech"
  · "UConn" → "uconn"
  · "Rutgers" alone → "rutgers" (multi-campus; lower confidence)
  · For unfamiliar universities, lowercase and hyphenate: "Smith College" → "smith"
- Age: parse numeric age from "65+", "60", "I'm 65", etc.
- Days: "weekend" → ["S", "U"]; "MWF" → ["M", "W", "F"]; "TR" or "Tu/Th" → ["T", "R"].
- Mode: "online", "in-person" (or "in person"), "hybrid", "zoom".
- Time of day: "morning", "afternoon", "evening".
- Term: capitalize like "Summer 2026", "Fall 2026". If only "summer" appears with no year, omit term (don't guess the year).

Confidence rules:

- 0.95+ : Query unambiguously matches one intent with all key entities present.
- 0.80–0.94 : Intent clear, but one entity is missing or ambiguous (e.g. "Does ENG 111 transfer?" with no destination).
- 0.50–0.79 : Best-effort guess, multiple plausible interpretations.
- < 0.50 : Use "unknown" instead.

If the query contains TWO clear intents (e.g. "Does ENG 111 transfer to GMU and what are the prereqs?"), pick the one that appears first or feels primary, and include the other in your reasoning. Don't try to return both.

Always call the tool. Never produce conversational text.`;

// JSON-schema input for the classify_intent tool. Flat structure — fields
// only matter for the matching intent type. Conversion to the canonical
// SearchIntent discriminated union happens in classify-llm.ts.
export const CLASSIFY_TOOL = {
  name: "classify_intent",
  description: "Record the structured intent extracted from the user's search query.",
  input_schema: {
    type: "object" as const,
    properties: {
      type: {
        type: "string",
        enum: ["transfer", "prereqs", "eligibility", "course", "unknown"],
        description: "Which of the five intent types this query falls into.",
      },
      // Course-related (used by transfer, prereqs, course)
      course_prefix: {
        type: ["string", "null"],
        description: "Uppercase subject prefix, e.g. ENG, MATH, PSYC. Null if no course code in query.",
      },
      course_number: {
        type: ["string", "null"],
        description: "Course number as a string (preserve digits exactly), e.g. 111, 1001. Null if no course code.",
      },
      // Transfer-specific
      university: {
        type: ["string", "null"],
        description: "Target university slug, e.g. gmu, vcu, umass-amherst. Null if no destination mentioned.",
      },
      // Eligibility-specific
      topic: {
        type: ["string", "null"],
        enum: ["senior", "audit", "cost", "veteran", null],
        description: "Eligibility topic. Null for non-eligibility intents.",
      },
      age: {
        type: ["integer", "null"],
        description: "Age extracted from query like '65+' or 'I'm 60'. Null if no age mentioned.",
      },
      // Course-with-filters
      keyword: {
        type: ["string", "null"],
        description: "Free-text remainder for course-keyword search, e.g. 'biology' from 'online biology'. Null if entire query was course code or filters.",
      },
      mode: {
        type: ["string", "null"],
        enum: ["in-person", "online", "hybrid", "zoom", null],
      },
      time_of_day: {
        type: ["string", "null"],
        enum: ["morning", "afternoon", "evening", null],
      },
      days: {
        type: "array",
        items: { type: "string", enum: ["M", "T", "W", "R", "F", "S", "U"] },
        description: "Empty array if no day filter. 'weekend' expands to [S, U].",
      },
      term: {
        type: ["string", "null"],
        description: "Term as 'Season YEAR' (e.g. 'Summer 2026'). Null if not specified or no year given.",
      },
      confidence: {
        type: "number",
        minimum: 0,
        maximum: 1,
        description: "Self-reported confidence per the rules in the system prompt.",
      },
      reasoning: {
        type: "string",
        description: "One-sentence explanation. Useful for debugging and eval reports.",
      },
    },
    required: ["type", "confidence", "reasoning"],
  },
};

// Shape of the tool input we expect Claude to produce. Mirrors CLASSIFY_TOOL
// but expressed as a TS type for downstream conversion code.
export interface ClassifierToolInput {
  type: "transfer" | "prereqs" | "eligibility" | "course" | "unknown";
  course_prefix?: string | null;
  course_number?: string | null;
  university?: string | null;
  topic?: "senior" | "audit" | "cost" | "veteran" | null;
  age?: number | null;
  keyword?: string | null;
  mode?: "in-person" | "online" | "hybrid" | "zoom" | null;
  time_of_day?: "morning" | "afternoon" | "evening" | null;
  days?: Array<"M" | "T" | "W" | "R" | "F" | "S" | "U">;
  term?: string | null;
  confidence: number;
  reasoning: string;
}
