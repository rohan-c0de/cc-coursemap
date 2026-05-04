// LLM-backed classifier. Calls Claude Haiku 4.5 with the classify_intent tool
// and returns the structured ClassifiedIntent.
//
// Hallucination boundary: this layer ONLY produces a structured intent. It
// never generates user-facing copy. Even if the LLM invents a course code or
// university slug, the answer-lookup layer (PR 3) will fail to validate the
// entity and surface a "did you mean" prompt rather than a wrong answer.

import Anthropic from "@anthropic-ai/sdk";
import {
  CLASSIFIER_MODEL,
  CLASSIFY_TOOL,
  SYSTEM_PROMPT,
  type ClassifierToolInput,
} from "./prompt";
import type { Classifier, ClassifiedIntent, SearchIntent } from "./types";

export interface LlmClassifierOptions {
  // Inject a client (real or mock). When omitted, a real client is created
  // from process.env.ANTHROPIC_API_KEY.
  client?: Anthropic;
  // Override the model — useful for evaluation runs against a different
  // version, or for tests that want a stub model name.
  model?: string;
  apiKey?: string;
}

export function llmClassifier(opts: LlmClassifierOptions = {}): Classifier {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!opts.client && !apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local or pass apiKey to llmClassifier().",
    );
  }
  const client = opts.client ?? new Anthropic({ apiKey });
  const model = opts.model ?? CLASSIFIER_MODEL;

  return async (query: string): Promise<ClassifiedIntent> => {
    const response = await client.messages.create({
      model,
      max_tokens: 1024,
      temperature: 0,
      system: [
        {
          type: "text",
          text: SYSTEM_PROMPT,
          // Prompt caching: the system prompt is identical across every call,
          // so Anthropic caches it after the first request and reuses it on
          // subsequent ones. ~80% input-token cost reduction once warm.
          cache_control: { type: "ephemeral" },
        },
      ],
      tools: [CLASSIFY_TOOL],
      // Force the tool. Without this, Claude might respond with prose and
      // we'd have to retry.
      tool_choice: { type: "tool", name: "classify_intent" },
      messages: [{ role: "user", content: query }],
    });

    const toolUse = response.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error(
        `LLM did not return a classify_intent tool call. content=${JSON.stringify(response.content)}`,
      );
    }
    return toClassifiedIntent(query, toolUse.input as ClassifierToolInput);
  };
}

/** Convert tool input into the canonical ClassifiedIntent. Exported for testing. */
export function toClassifiedIntent(
  rawQuery: string,
  input: ClassifierToolInput,
): ClassifiedIntent {
  return {
    intent: toSearchIntent(rawQuery, input),
    confidence: clamp01(input.confidence),
    reasoning: input.reasoning,
  };
}

function toSearchIntent(rawQuery: string, input: ClassifierToolInput): SearchIntent {
  const courseRef =
    input.course_prefix && input.course_number
      ? {
          prefix: input.course_prefix.toUpperCase(),
          number: input.course_number,
        }
      : null;

  switch (input.type) {
    case "transfer":
      return {
        type: "transfer",
        course: courseRef,
        university: input.university ?? null,
      };
    case "prereqs":
      return {
        type: "prereqs",
        course: courseRef,
      };
    case "eligibility":
      // Topic is required by our type. If the LLM omitted it, default to
      // "senior" — the most common eligibility ask. The reasoning field
      // will record what actually happened.
      return {
        type: "eligibility",
        topic: input.topic ?? "senior",
        age: input.age ?? null,
      };
    case "course":
      return {
        type: "course",
        keyword: input.keyword ?? null,
        filters: {
          course: courseRef ?? undefined,
          mode: input.mode ?? undefined,
          timeOfDay: input.time_of_day ?? undefined,
          days: input.days && input.days.length > 0 ? input.days : undefined,
          term: input.term ?? undefined,
        },
      };
    case "unknown":
      return { type: "unknown", raw: rawQuery };
  }
}

function clamp01(n: number): number {
  if (typeof n !== "number" || Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
