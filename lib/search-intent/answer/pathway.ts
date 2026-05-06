// Pathway answer lookup.
//
// "What do I need to transfer to GMU for Computer Science?"
//
// Stub implementation: returns a helpful no-data response pointing students
// to the transfer equivalency tool. Real pathway data (articulation
// agreements per university per major) is a separate data-ingestion project.

import type { PathwayIntent } from "../types";
import type { Answer, PathwayAnswer } from "./types";
import { resolveUniversity } from "./validate";

export async function lookupPathway(
  intent: PathwayIntent,
  state: string,
): Promise<Answer> {
  if (!intent.university) {
    return makeAnswer({
      status: "missing-entity",
      university: null,
      major: intent.major,
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
      state,
      followups: [
        "Does ENG 111 transfer?",
        "What courses are available online?",
      ],
    });
  }

  const { slug, name } = resolution.resolved;
  const majorLabel = intent.major
    ? intent.major.replace(/-/g, " ")
    : null;

  return makeAnswer({
    status: "no-data",
    university: { slug, name },
    major: intent.major,
    state,
    followups: [
      `What courses transfer to ${name}?`,
      ...(majorLabel
        ? [`Search for ${majorLabel} courses`]
        : []),
      "What are the prereqs for ENG 111?",
    ],
  });
}

function makeAnswer(
  parts: Omit<PathwayAnswer, "type" | "source"> & { state: string },
): PathwayAnswer {
  const { state, ...rest } = parts;
  return {
    type: "pathway",
    ...rest,
    source: {
      source: "transfer-equiv",
      state,
      reference: `data/${state}/transfer-equiv.json`,
    },
  };
}
