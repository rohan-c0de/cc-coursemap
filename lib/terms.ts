import fs from "fs";
import path from "path";
import { getAvailableTerms } from "./courses";

/**
 * Convert a term code like "2026SU" into a human-readable label like "Summer 2026".
 */
export function termLabel(code: string): string {
  const match = code.match(/^(\d{4})(SP|SU|FA)$/);
  if (!match) return code;
  const year = match[1];
  const season = match[2];
  const seasonName =
    season === "SP" ? "Spring" : season === "SU" ? "Summer" : "Fall";
  return `${seasonName} ${year}`;
}

/**
 * Sort key for term codes — later terms sort higher.
 * "2026SP" → 20261, "2026SU" → 20262, "2026FA" → 20263
 */
function termSortKey(code: string): number {
  const match = code.match(/^(\d{4})(SP|SU|FA)$/);
  if (!match) return 0;
  const year = parseInt(match[1]);
  const season = match[2] === "SP" ? 1 : match[2] === "SU" ? 2 : 3;
  return year * 10 + season;
}

/**
 * Get all available terms with labels, sorted newest first.
 */
export function getAvailableTermsForDisplay(state = "va"): {
  code: string;
  label: string;
}[] {
  const terms = getAvailableTerms(state);
  return terms
    .map((code) => ({ code, label: termLabel(code) }))
    .sort((a, b) => termSortKey(b.code) - termSortKey(a.code));
}

/**
 * Get the current term code by scanning the data directory.
 * Returns the term with the most college data files (i.e. the term most
 * colleges are actively publishing), breaking ties by recency.
 * Falls back to "2026SP" if no data is found.
 */
export function getCurrentTerm(state = "va"): string {
  const terms = getAvailableTerms(state);
  if (terms.length === 0) return "2026SP";

  const coursesDir = path.join(process.cwd(), "data", state, "courses");
  let bestTerm = terms[0];
  let bestCount = 0;

  try {
    const slugs = fs.readdirSync(coursesDir);
    for (const term of terms) {
      let count = 0;
      for (const slug of slugs) {
        const filePath = path.join(coursesDir, slug, `${term}.json`);
        if (fs.existsSync(filePath)) count++;
      }
      if (count > bestCount || (count === bestCount && termSortKey(term) > termSortKey(bestTerm))) {
        bestTerm = term;
        bestCount = count;
      }
    }
  } catch {
    // Fall back to latest term if directory doesn't exist
    return terms.sort((a, b) => termSortKey(b) - termSortKey(a))[0];
  }

  return bestTerm;
}

/**
 * Get the next term after the latest one we have data for.
 * SP → SU → FA → next year SP
 */
export function getNextTerm(state = "va"): { code: string; label: string } {
  const current = getCurrentTerm(state);
  const match = current.match(/^(\d{4})(SP|SU|FA)$/);
  if (!match) return { code: "2026FA", label: "Fall 2026" };

  const year = parseInt(match[1]);
  const season = match[2];

  let nextCode: string;
  if (season === "SP") nextCode = `${year}SU`;
  else if (season === "SU") nextCode = `${year}FA`;
  else nextCode = `${year + 1}SP`;

  return { code: nextCode, label: termLabel(nextCode) };
}
