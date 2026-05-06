/**
 * matcher.ts — maps scraped program titles to the 12 registry slugs.
 *
 * Conservative: returns null on low confidence. Unmatched programs still
 * appear on college program pages, just not on category hub pages.
 */

import { PROGRAMS } from "./registry";
import type { ProgramRequirement } from "../types";

interface MatchRule {
  slug: string;
  keywords: RegExp;
  antiKeywords?: RegExp;
}

const RULES: MatchRule[] = [
  {
    slug: "nursing",
    keywords: /\bnurs(?:ing|e)\b|\badn\b|\blpn\b|\brn\b/i,
    antiKeywords: /\bvet(?:erinary)?\b/i,
  },
  {
    slug: "business-administration",
    keywords: /\bbusiness\b|\bmanagement\b|\bmarketing\b/i,
    antiKeywords: /\bmusic\s+business\b|\bagri-?business\b/i,
  },
  {
    slug: "computer-science",
    keywords:
      /\bcomputer\s+science\b|\bcybersecurity\b|\binformation\s+tech/i,
  },
  {
    slug: "accounting",
    keywords: /\baccounting\b/i,
  },
  {
    slug: "early-childhood-education",
    keywords: /\bearly\s+childhood\b|\bchild\s+develop/i,
  },
  {
    slug: "criminal-justice",
    keywords: /\bcriminal\s+justice\b|\blaw\s+enforcement\b|\bcorrections\b/i,
  },
  {
    slug: "liberal-arts",
    keywords: /\bliberal\s+arts\b|\bgeneral\s+studies\b|\bliberal\s+studies\b/i,
  },
  {
    slug: "engineering",
    keywords: /\bengineering\b/i,
    antiKeywords: /\bsound\s+engineering\b|\baudio\b/i,
  },
  {
    slug: "biology",
    keywords: /\bbiology\b|\bbiotech/i,
  },
  {
    slug: "psychology",
    keywords: /\bpsychology\b/i,
  },
  {
    slug: "welding",
    keywords: /\bwelding\b/i,
  },
  {
    slug: "automotive-technology",
    keywords: /\bautomotive\b|\bauto\s+tech/i,
  },
];

/**
 * Match a single program title to a registry slug. Returns null if no
 * confident match. Does not attempt fuzzy matching — a missed match is
 * better than a wrong one.
 */
export function matchProgramSlug(title: string): string | null {
  for (const rule of RULES) {
    if (rule.keywords.test(title)) {
      if (rule.antiKeywords && rule.antiKeywords.test(title)) continue;
      return rule.slug;
    }
  }
  return null;
}

/**
 * Run the matcher across all programs in a CollegePrograms dataset,
 * populating matched_program_slug in place.
 */
export function applyProgramMatching(programs: ProgramRequirement[]): {
  matched: number;
  unmatched: number;
} {
  let matched = 0;
  let unmatched = 0;
  for (const p of programs) {
    const slug = matchProgramSlug(p.title);
    p.matched_program_slug = slug;
    if (slug) matched++;
    else unmatched++;
  }
  return { matched, unmatched };
}

/** Get the set of valid program slugs (for validation). */
export function getValidSlugs(): Set<string> {
  return new Set(PROGRAMS.map((p) => p.slug));
}
