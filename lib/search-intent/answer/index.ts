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
      return {
        type: "none",
        reason: "out-of-scope",
        message:
          "I'm not sure what you're asking. Try a course code (like ENG 111), 'prereqs for BIO 256', or 'does ENG 111 transfer to GMU'.",
      };
  }
}
