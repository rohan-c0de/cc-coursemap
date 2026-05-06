import { describe, expect, it, vi } from "vitest";

vi.mock("../validate", () => ({
  resolveUniversity: vi.fn(),
}));

import { lookupPathway } from "../pathway";
import { resolveUniversity } from "../validate";

const resolveMock = vi.mocked(resolveUniversity);

describe("lookupPathway", () => {
  it("returns missing-entity when no university specified", async () => {
    const result = await lookupPathway(
      { type: "pathway", university: null, major: "nursing" },
      "va",
    );
    expect(result.type).toBe("pathway");
    if (result.type !== "pathway") return;
    expect(result.status).toBe("missing-entity");
    expect(result.followups).toBeDefined();
  });

  it("returns unknown-university when resolution fails", async () => {
    resolveMock.mockResolvedValue({ resolved: null, suggestions: [] });
    const result = await lookupPathway(
      { type: "pathway", university: "fake-u", major: null },
      "va",
    );
    expect(result.type).toBe("pathway");
    if (result.type !== "pathway") return;
    expect(result.status).toBe("unknown-university");
  });

  it("returns no-data with resolved university when university is valid", async () => {
    resolveMock.mockResolvedValue({
      resolved: { slug: "gmu", name: "George Mason University" },
      suggestions: [],
    });
    const result = await lookupPathway(
      { type: "pathway", university: "gmu", major: "computer-science" },
      "va",
    );
    expect(result.type).toBe("pathway");
    if (result.type !== "pathway") return;
    expect(result.status).toBe("no-data");
    expect(result.university).toEqual({ slug: "gmu", name: "George Mason University" });
    expect(result.major).toBe("computer-science");
    expect(result.followups).toBeDefined();
    expect(result.followups!.length).toBeGreaterThan(0);
  });

  it("includes major-specific followup when major is present", async () => {
    resolveMock.mockResolvedValue({
      resolved: { slug: "vcu", name: "Virginia Commonwealth University" },
      suggestions: [],
    });
    const result = await lookupPathway(
      { type: "pathway", university: "vcu", major: "nursing" },
      "va",
    );
    if (result.type !== "pathway") return;
    expect(result.followups!.some((f) => f.toLowerCase().includes("nursing"))).toBe(true);
  });
});
