import { describe, expect, it, vi } from "vitest";

vi.mock("../validate", () => ({
  resolveUniversity: vi.fn(),
}));

vi.mock("../../../institutions", () => ({
  loadInstitutions: vi.fn(() => []),
}));

vi.mock("../../../programs/requirements", () => ({
  loadCollegePrograms: vi.fn(async () => []),
  loadProgramAcrossColleges: vi.fn(async () => []),
}));

vi.mock("../../../programs/matcher", () => ({
  matchProgramSlug: vi.fn(() => null),
}));

import { lookupPathway } from "../pathway";
import { resolveUniversity } from "../validate";
import { loadProgramAcrossColleges } from "../../../programs/requirements";

const resolveMock = vi.mocked(resolveUniversity);
const loadProgramsMock = vi.mocked(loadProgramAcrossColleges);

describe("lookupPathway", () => {
  it("looks up degree by major when no university or college specified", async () => {
    loadProgramsMock.mockResolvedValue([]);
    const result = await lookupPathway(
      { type: "pathway", university: null, major: "nursing", college: null, credential: null },
      "va",
    );
    expect(result.type).toBe("pathway");
    if (result.type !== "pathway") return;
    expect(result.status).toBe("no-data");
  });

  it("returns missing-entity when nothing specified", async () => {
    const result = await lookupPathway(
      { type: "pathway", university: null, major: null, college: null, credential: null },
      "va",
    );
    expect(result.type).toBe("pathway");
    if (result.type !== "pathway") return;
    expect(result.status).toBe("missing-entity");
  });

  it("returns unknown-university when resolution fails", async () => {
    resolveMock.mockResolvedValue({ resolved: null, suggestions: [] });
    const result = await lookupPathway(
      { type: "pathway", university: "fake-u", major: null, college: null, credential: null },
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
      { type: "pathway", university: "gmu", major: "computer-science", college: null, credential: null },
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
      { type: "pathway", university: "vcu", major: "nursing", college: null, credential: null },
      "va",
    );
    if (result.type !== "pathway") return;
    expect(result.followups!.some((f) => f.toLowerCase().includes("nursing"))).toBe(true);
  });
});
