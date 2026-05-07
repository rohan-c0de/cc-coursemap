// Pathway answer lookup.
//
// Two modes:
//   1. CC degree: "nursing degree at NOVA" → look up program requirements
//   2. Transfer pathway: "transfer to GMU for CS" → stub (future work)

import type { PathwayIntent } from "../types";
import type { Answer, PathwayAnswer, DegreeRequirementSummary } from "./types";
import { resolveUniversity } from "./validate";
import { loadInstitutions } from "../../institutions";
import {
  loadCollegePrograms,
  loadProgramAcrossColleges,
} from "../../programs/requirements";
import { matchProgramSlug } from "../../programs/matcher";

export async function lookupPathway(
  intent: PathwayIntent,
  state: string,
): Promise<Answer> {
  if (intent.college) {
    return lookupDegree(intent, state);
  }

  if (intent.major && !intent.university) {
    return lookupDegreeByMajor(intent, state);
  }

  return lookupTransferPathway(intent, state);
}

async function lookupDegree(
  intent: PathwayIntent,
  state: string,
): Promise<Answer> {
  const college = resolveCollege(state, intent.college!);
  if (!college) {
    return makeAnswer({
      status: "missing-entity",
      university: null,
      major: intent.major,
      college: null,
      state,
      followups: [
        "What degree programs are available?",
        "What courses are available online?",
      ],
    });
  }

  const programs = await loadCollegePrograms(state, college.college_slug);

  if (programs.length === 0) {
    return makeAnswer({
      status: "no-data",
      university: null,
      major: intent.major,
      college: { slug: college.id, name: college.name },
      state,
      followups: [
        `What courses are offered at ${college.name}?`,
        "What are the prereqs for ENG 111?",
      ],
    });
  }

  let filtered = programs;
  if (intent.major) {
    const slug = matchProgramSlug(intent.major.replace(/-/g, " "));
    if (slug) {
      filtered = programs.filter((p) => p.matched_program_slug === slug);
    }
    if (filtered.length === 0) {
      filtered = programs.filter(
        (p) =>
          p.title.toLowerCase().includes(intent.major!.replace(/-/g, " ")),
      );
    }
  }

  if (intent.credential) {
    const cred = intent.credential.toUpperCase();
    const credFiltered = filtered.filter(
      (p) => p.credential.toUpperCase() === cred,
    );
    if (credFiltered.length > 0) filtered = credFiltered;
  }

  if (filtered.length === 0) filtered = programs.slice(0, 5);

  const degreeRequirements: DegreeRequirementSummary[] = filtered
    .slice(0, 5)
    .map((p) => ({
      title: p.title,
      credential: p.credential,
      total_credits: p.total_credits,
      gpa_minimum: p.gpa_minimum,
      catalog_url: p.catalog_url,
      groups: p.requirement_groups.map((g) => ({
        name: g.name,
        credits_required: g.credits_required,
        course_count: g.courses.length,
      })),
    }));

  const majorLabel = intent.major?.replace(/-/g, " ") ?? null;

  return makeAnswer({
    status: "found-degree",
    university: null,
    major: intent.major,
    college: { slug: college.id, name: college.name },
    degreeRequirements,
    state,
    followups: [
      `View all programs at ${college.name}`,
      ...(majorLabel
        ? [`Search for ${majorLabel} courses`]
        : []),
      `What courses are offered at ${college.name}?`,
    ],
  });
}

async function lookupDegreeByMajor(
  intent: PathwayIntent,
  state: string,
): Promise<Answer> {
  const slug = matchProgramSlug(intent.major!.replace(/-/g, " "));
  const programSlug = slug ?? intent.major!;

  const entries = await loadProgramAcrossColleges(state, programSlug);

  if (entries.length === 0) {
    return makeAnswer({
      status: "no-data",
      university: null,
      major: intent.major,
      college: null,
      state,
      followups: [
        `Search for ${intent.major!.replace(/-/g, " ")} courses`,
        "What programs are available?",
      ],
    });
  }

  const degreeRequirements: DegreeRequirementSummary[] = [];
  for (const entry of entries.slice(0, 3)) {
    for (const p of entry.programs.slice(0, 2)) {
      degreeRequirements.push({
        title: `${p.title} — ${entry.college.name}`,
        credential: p.credential,
        total_credits: p.total_credits,
        gpa_minimum: p.gpa_minimum,
        catalog_url: p.catalog_url,
        groups: p.requirement_groups.map((g) => ({
          name: g.name,
          credits_required: g.credits_required,
          course_count: g.courses.length,
        })),
      });
    }
  }

  const majorLabel = intent.major!.replace(/-/g, " ");

  return makeAnswer({
    status: "found-degree",
    university: null,
    major: intent.major,
    college: null,
    degreeRequirements,
    state,
    followups: [
      `${majorLabel} courses available this term`,
      `What are the prereqs for common ${majorLabel} courses?`,
    ],
  });
}

async function lookupTransferPathway(
  intent: PathwayIntent,
  state: string,
): Promise<Answer> {
  if (!intent.university) {
    return makeAnswer({
      status: "missing-entity",
      university: null,
      major: intent.major,
      college: null,
      state,
      followups: [
        "Does ENG 111 transfer?",
        "What courses are available online?",
      ],
    });
  }

  const resolution = await resolveUniversity(state, intent.university);
  if (!resolution.resolved) {
    return makeAnswer({
      status: "unknown-university",
      university: null,
      major: intent.major,
      college: null,
      state,
      followups: [
        "Does ENG 111 transfer?",
        "What courses are available online?",
      ],
    });
  }

  const { slug, name } = resolution.resolved;
  const majorLabel = intent.major?.replace(/-/g, " ") ?? null;

  return makeAnswer({
    status: "no-data",
    university: { slug, name },
    major: intent.major,
    college: null,
    state,
    followups: [
      `What courses transfer to ${name}?`,
      ...(majorLabel ? [`Search for ${majorLabel} courses`] : []),
      "What are the prereqs for ENG 111?",
    ],
  });
}

function resolveCollege(
  state: string,
  slugOrName: string,
): { id: string; name: string; college_slug: string } | null {
  const institutions = loadInstitutions(state);
  const normalized = slugOrName.toLowerCase().replace(/[^a-z0-9]/g, "");

  for (const inst of institutions) {
    if (inst.id === slugOrName || inst.college_slug === slugOrName) {
      return inst;
    }
  }

  for (const inst of institutions) {
    const normId = inst.id.replace(/[^a-z0-9]/g, "");
    const normSlug = inst.college_slug.replace(/[^a-z0-9]/g, "");
    if (normId === normalized || normSlug === normalized) {
      return inst;
    }
  }

  for (const inst of institutions) {
    const normName = inst.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (normName.includes(normalized) || normalized.includes(normName)) {
      return inst;
    }
  }

  return null;
}

function makeAnswer(
  parts: Omit<PathwayAnswer, "type" | "source"> & { state: string },
): PathwayAnswer {
  const { state, ...rest } = parts;
  return {
    type: "pathway",
    ...rest,
    source: {
      source: "supabase-courses",
      state,
      reference: `data/${state}/programs/`,
    },
  };
}
