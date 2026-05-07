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
  findRelatedPrograms: vi.fn(async () => []),
  stateHasProgramData: vi.fn(() => false),
}));

vi.mock("../../../programs/matcher", () => ({
  matchProgramSlug: vi.fn(() => null),
}));

import { lookupPathway } from "../pathway";
import { resolveUniversity } from "../validate";
import {
  loadProgramAcrossColleges,
  findRelatedPrograms,
  stateHasProgramData,
} from "../../../programs/requirements";

const resolveMock = vi.mocked(resolveUniversity);
const loadProgramsMock = vi.mocked(loadProgramAcrossColleges);
const findRelatedMock = vi.mocked(findRelatedPrograms);
const stateHasDataMock = vi.mocked(stateHasProgramData);

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

  it("returns found-related when no exact slug match but state has related programs", async () => {
    loadProgramsMock.mockResolvedValue([]);
    stateHasDataMock.mockReturnValue(true);
    findRelatedMock.mockResolvedValue([
      {
        college: {
          id: "ccv",
          name: "Community College of Vermont",
          college_slug: "ccv",
          system: "VSC",
          campuses: [],
          audit_policy: {
            allowed: true,
            cost_model: "free_for_seniors",
            cost_note: "",
            eligibility: { minimum_age: 18, residency_required: false },
            restrictions: [],
            application_process: {
              steps: [],
              timing: "",
              form_url: "",
              contact_email: "",
              contact_phone: "",
            },
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any,
        programs: [
          {
            title: "Behavioral Science (A.S.)",
            credential: "AS",
            program_code: null,
            catalog_url: "https://example.com/behavioral-science",
            total_credits: 60,
            gpa_minimum: 2.0,
            description: null,
            requirement_groups: [],
            matched_program_slug: null,
          },
        ],
      },
    ]);
    const result = await lookupPathway(
      { type: "pathway", university: null, major: "biology", college: null, credential: null },
      "vt",
    );
    if (result.type !== "pathway") return;
    expect(result.status).toBe("found-related");
    expect(result.degreeRequirements?.length).toBe(1);
    expect(result.degreeRequirements?.[0].title).toContain("Behavioral Science");
  });

  it("falls back to no-data when state has no program data at all", async () => {
    loadProgramsMock.mockResolvedValue([]);
    stateHasDataMock.mockReturnValue(false);
    findRelatedMock.mockResolvedValue([]);
    const result = await lookupPathway(
      { type: "pathway", university: null, major: "biology", college: null, credential: null },
      "ks",
    );
    if (result.type !== "pathway") return;
    expect(result.status).toBe("no-data");
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
