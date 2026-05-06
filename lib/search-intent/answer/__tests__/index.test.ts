import { describe, expect, it, vi } from "vitest";

vi.mock("../transfer", () => ({
  lookupTransfer: vi.fn().mockResolvedValue({ type: "transfer", status: "yes" }),
}));
vi.mock("../prereqs", () => ({
  lookupPrereqs: vi.fn().mockResolvedValue({ type: "prereqs", status: "found" }),
}));
vi.mock("../eligibility", () => ({
  lookupEligibility: vi.fn().mockResolvedValue({ type: "eligibility", topic: "senior" }),
}));
vi.mock("../pathway", () => ({
  lookupPathway: vi.fn().mockResolvedValue({ type: "pathway", status: "no-data" }),
}));

import { lookupAnswer, lookupAnswers } from "..";
import { lookupTransfer } from "../transfer";
import { lookupPrereqs } from "../prereqs";
import { lookupEligibility } from "../eligibility";
import { lookupPathway } from "../pathway";
import type { ClassifiedIntent } from "../../types";

const BASE_CLASSIFICATION = {
  confidence: 0.95,
  studentSummary: "test",
  clarifyingQuestion: null,
  sourceCollege: null,
  suggestedFollowups: [],
};

describe("lookupAnswer dispatch", () => {
  it("dispatches transfer intents to lookupTransfer", async () => {
    await lookupAnswer(
      { type: "transfer", course: { prefix: "ENG", number: "111" }, subjectPrefix: null, university: "gmu" },
      "va",
    );
    expect(lookupTransfer).toHaveBeenCalled();
  });

  it("dispatches prereqs intents to lookupPrereqs", async () => {
    await lookupAnswer(
      { type: "prereqs", course: { prefix: "BIO", number: "256" }, direction: "forward" },
      "va",
    );
    expect(lookupPrereqs).toHaveBeenCalled();
  });

  it("dispatches pathway intents to lookupPathway", async () => {
    await lookupAnswer(
      { type: "pathway", university: "gmu", major: "computer-science" },
      "va",
    );
    expect(lookupPathway).toHaveBeenCalled();
  });

  it("dispatches eligibility intents to lookupEligibility", async () => {
    await lookupAnswer(
      { type: "eligibility", topic: "senior", age: null },
      "va",
    );
    expect(lookupEligibility).toHaveBeenCalled();
  });

  it("returns NoAnswer with intent-not-supported for course intents", async () => {
    const result = await lookupAnswer(
      { type: "course", keyword: "biology", filters: {} },
      "va",
    );
    expect(result.type).toBe("none");
    if (result.type !== "none") return;
    expect(result.reason).toBe("intent-not-supported");
  });

  it("returns NoAnswer with out-of-scope for unknown intents", async () => {
    const result = await lookupAnswer(
      { type: "unknown", raw: "good professors" },
      "va",
    );
    expect(result.type).toBe("none");
    if (result.type !== "none") return;
    expect(result.reason).toBe("out-of-scope");
  });
});

describe("lookupAnswers (multi-intent)", () => {
  it("returns only primary when secondaryIntent is null", async () => {
    const classification: ClassifiedIntent = {
      ...BASE_CLASSIFICATION,
      intent: { type: "prereqs", course: { prefix: "BIO", number: "256" }, direction: "forward" },
      secondaryIntent: null,
    };
    const result = await lookupAnswers(classification, "va");
    expect(result.primary).toBeDefined();
    expect(result.secondary).toBeUndefined();
  });

  it("returns both when secondaryIntent is set", async () => {
    const classification: ClassifiedIntent = {
      ...BASE_CLASSIFICATION,
      intent: { type: "prereqs", course: { prefix: "ENG", number: "111" }, direction: "forward" },
      secondaryIntent: {
        type: "transfer",
        course: { prefix: "ENG", number: "111" },
        subjectPrefix: null,
        university: "gmu",
      },
    };
    const result = await lookupAnswers(classification, "va");
    expect(result.primary).toBeDefined();
    expect(result.secondary).toBeDefined();
  });

  it("filters out secondary when it's an intent-not-supported NoAnswer", async () => {
    // Course intent as secondary always returns intent-not-supported. The
    // wrapper should hide it — we don't want a confusing empty card.
    const classification: ClassifiedIntent = {
      ...BASE_CLASSIFICATION,
      intent: { type: "prereqs", course: { prefix: "ENG", number: "111" }, direction: "forward" },
      secondaryIntent: { type: "course", keyword: "biology", filters: {} },
    };
    const result = await lookupAnswers(classification, "va");
    expect(result.primary).toBeDefined();
    expect(result.secondary).toBeUndefined();
  });

  it("filters out secondary when it's an out-of-scope NoAnswer", async () => {
    const classification: ClassifiedIntent = {
      ...BASE_CLASSIFICATION,
      intent: { type: "prereqs", course: { prefix: "ENG", number: "111" }, direction: "forward" },
      secondaryIntent: { type: "unknown", raw: "good professors" },
    };
    const result = await lookupAnswers(classification, "va");
    expect(result.primary).toBeDefined();
    expect(result.secondary).toBeUndefined();
  });
});
