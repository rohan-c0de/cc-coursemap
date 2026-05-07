// Public entry point for the answer-lookup layer.
//
// `lookupAnswer(intent, state)` is the bridge between the LLM classifier
// (PR 2) and the UI answer card (PR 5). It dispatches by intent type to
// the per-domain lookups and returns an `Answer` discriminated union the
// UI can render directly.

import type { ClassifiedIntent, SearchIntent } from "../types";
import type { Answer } from "./types";
import { lookupEligibility } from "./eligibility";
import { lookupPathway } from "./pathway";
import { lookupPrereqs } from "./prereqs";
import { lookupTransfer } from "./transfer";

export type { Answer, SourceCitation } from "./types";

/**
 * Look up answers for a classified query. Returns the primary answer
 * always, and a secondary answer when the classifier identified a second
 * intent. The two lookups run in parallel.
 *
 * Secondary answers that are NoAnswer with `intent-not-supported` (course
 * intent) or `out-of-scope` (unknown) are filtered out — they would render
 * as a confusing empty card with no studentSummary to anchor them. The
 * primary's studentSummary already covers the whole query.
 */
export async function lookupAnswers(
  classification: ClassifiedIntent,
  state: string,
): Promise<{ primary: Answer; secondary?: Answer }> {
  const primaryPromise = lookupAnswer(classification.intent, state);
  const secondaryPromise = classification.secondaryIntent
    ? lookupAnswer(classification.secondaryIntent, state)
    : Promise.resolve(null);

  const [primary, secondary] = await Promise.all([primaryPromise, secondaryPromise]);

  if (!secondary) return { primary };
  if (secondary.type === "none") {
    if (secondary.reason === "intent-not-supported" || secondary.reason === "out-of-scope") {
      return { primary };
    }
  }
  return { primary, secondary };
}

export async function lookupAnswer(
  intent: SearchIntent,
  state: string,
): Promise<Answer> {
  switch (intent.type) {
    case "transfer":
      return lookupTransfer(intent, state);
    case "pathway":
      return lookupPathway(intent, state);
    case "prereqs":
      return lookupPrereqs(intent, state);
    case "eligibility":
      return lookupEligibility(intent, state);
    case "course":
      return {
        type: "none",
        reason: "intent-not-supported",
        message: "Use the course search results below.",
      };
    case "unknown":
      return lookupUnknown(intent.raw, state);
  }
}

/**
 * Bare-word queries like "premed", "law", "coding", "teaching" land here:
 * the classifier doesn't have enough context to mark them as a specific
 * intent type, but they're almost always asking about a field of study.
 *
 * Heuristic: if `raw` looks like a field-of-study term (1–3 words,
 * letters-and-spaces only, 3–40 chars, not a known stop-word), try a
 * pathway lookup with `major = raw`. The 3-layer pathway resolution
 * (canonical slug → lexical stem → LLM semantic) takes it from there
 * and either returns a populated answer or its own no-data. If the
 * heuristic doesn't fit, fall through to the original out-of-scope copy.
 */
async function lookupUnknown(raw: string, state: string): Promise<Answer> {
  const trimmed = raw.trim();
  if (looksLikeFieldOfStudy(trimmed)) {
    const pathwayAnswer = await lookupPathway(
      {
        type: "pathway",
        university: null,
        major: trimmed.toLowerCase(),
        college: null,
        credential: null,
      },
      state,
    );
    if (
      pathwayAnswer.type === "pathway" &&
      (pathwayAnswer.status === "found-degree" ||
        pathwayAnswer.status === "found-related")
    ) {
      return pathwayAnswer;
    }
  }
  return {
    type: "none",
    reason: "out-of-scope",
    message:
      "I'm not sure what you're asking. Try a course code (like ENG 111), 'prereqs for BIO 256', or 'does ENG 111 transfer to GMU'.",
  };
}

const FIELD_STOP_WORDS = new Set([
  "help",
  "what",
  "when",
  "where",
  "how",
  "the",
  "a",
  "an",
  "yes",
  "no",
  "ok",
  "okay",
  "test",
  "hello",
  "hi",
  "thanks",
]);

function looksLikeFieldOfStudy(s: string): boolean {
  if (s.length < 3 || s.length > 40) return false;
  if (!/^[a-zA-Z][a-zA-Z\s]*$/.test(s)) return false; // letters + spaces, must start with letter
  const words = s.toLowerCase().split(/\s+/);
  if (words.length === 0 || words.length > 3) return false;
  if (words.every((w) => FIELD_STOP_WORDS.has(w))) return false;
  return true;
}
