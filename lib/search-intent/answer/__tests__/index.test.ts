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

import { lookupAnswer } from "..";
import { lookupTransfer } from "../transfer";
import { lookupPrereqs } from "../prereqs";
import { lookupEligibility } from "../eligibility";

describe("lookupAnswer dispatch", () => {
  it("dispatches transfer intents to lookupTransfer", async () => {
    await lookupAnswer(
      { type: "transfer", course: { prefix: "ENG", number: "111" }, university: "gmu" },
      "va",
    );
    expect(lookupTransfer).toHaveBeenCalled();
  });

  it("dispatches prereqs intents to lookupPrereqs", async () => {
    await lookupAnswer(
      { type: "prereqs", course: { prefix: "BIO", number: "256" } },
      "va",
    );
    expect(lookupPrereqs).toHaveBeenCalled();
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
