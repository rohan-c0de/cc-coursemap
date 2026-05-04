// Public entry point for the answer-lookup layer.
//
// `lookupAnswer(intent, state)` is the bridge between the LLM classifier
// (PR 2) and the UI answer card (PR 5). It dispatches by intent type to
// the per-domain lookups and returns an `Answer` discriminated union the
// UI can render directly.

import type { SearchIntent } from "../types";
import type { Answer } from "./types";
import { lookupEligibility } from "./eligibility";
import { lookupPrereqs } from "./prereqs";
import { lookupTransfer } from "./transfer";

export type { Answer } from "./types";

export async function lookupAnswer(
  intent: SearchIntent,
  state: string,
): Promise<Answer> {
  switch (intent.type) {
    case "transfer":
      return lookupTransfer(intent, state);
    case "prereqs":
      return lookupPrereqs(intent, state);
    case "eligibility":
      return lookupEligibility(intent, state);
    case "course":
      // Course intents flow into the existing course-search results.
      // No answer card; PR 5 will render the standard course list.
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
