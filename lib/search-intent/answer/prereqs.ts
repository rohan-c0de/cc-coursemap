// Prereqs answer lookup.
//
// Decision tree:
//
//   intent.course == null
//     → status: "no-course-named" → "Which course?"
//
//   prereqs map for state is empty
//     → status: "no-data" — state has no prereq data yet
//
//   course not in prereqs map (and doesn't exist in courses table)
//     → status: "unknown-course"
//
//   course in prereqs map but no recorded prereqs
//     → status: "no-prereqs"
//
//   else
//     → status: "found", chain returned

import { buildChain, loadPrereqs } from "../../prereqs";
import type { PrereqsIntent } from "../types";
import type { Answer, PrereqsAnswer } from "./types";
import { courseExists } from "./validate";

export async function lookupPrereqs(
  intent: PrereqsIntent,
  state: string,
): Promise<Answer> {
  const { course } = intent;

  if (!course) {
    return makeAnswer({
      status: "no-course-named",
      course: null,
      state,
    });
  }

  const prereqs = loadPrereqs(state);
  if (prereqs.size === 0) {
    return makeAnswer({
      status: "no-data",
      course,
      state,
    });
  }

  // The map keys use the form "PREFIX NUMBER" (e.g. "BIO 256"). Try that
  // first; if not present, fall back to the courses-table existence check
  // before declaring "unknown-course" — the prereq scrape may not have
  // covered every catalog course.
  const key = `${course.prefix.toUpperCase()} ${course.number}`;
  const entry = prereqs.get(key);

  if (!entry) {
    const check = await courseExists(state, course.prefix, course.number);
    if (!check.exists) {
      return makeAnswer({
        status: "unknown-course",
        course,
        state,
      });
    }
    // Course exists in catalog but isn't in prereqs.json — most likely it
    // has none.
    return makeAnswer({
      status: "no-prereqs",
      course,
      state,
    });
  }

  // Course is in the map. If text and courses are both empty, treat as
  // no prereqs.
  if ((!entry.text || entry.text.trim() === "") && entry.courses.length === 0) {
    return makeAnswer({
      status: "no-prereqs",
      course,
      state,
    });
  }

  const chain = buildChain(key, prereqs, new Set(), 0);
  return makeAnswer({
    status: "found",
    course,
    chain,
    state,
  });
}

function makeAnswer(
  parts: Omit<PrereqsAnswer, "type" | "source"> & { state: string },
): PrereqsAnswer {
  const { state, ...rest } = parts;
  return {
    type: "prereqs",
    ...rest,
    followups: buildFollowups(rest),
    source: {
      source: "prereqs",
      state,
      reference: `data/${state}/prereqs.json`,
    },
  };
}

function buildFollowups(parts: Omit<PrereqsAnswer, "type" | "source">): string[] {
  if (!parts.course) return [];
  const courseCode = `${parts.course.prefix} ${parts.course.number}`;

  switch (parts.status) {
    case "found": {
      const followups = [`Does ${courseCode} transfer?`];
      const firstPrereq = parts.chain?.children[0]?.course;
      if (firstPrereq) followups.push(`What are the prereqs for ${firstPrereq}?`);
      return followups;
    }
    case "no-prereqs":
      return [
        `Does ${courseCode} transfer?`,
        `Search for ${parts.course.prefix} courses`,
      ];
    case "unknown-course":
      return [`Search for ${parts.course.prefix} courses`];
    default:
      return [];
  }
}
