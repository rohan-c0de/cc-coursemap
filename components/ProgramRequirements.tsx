"use client";

import { useState } from "react";
import Link from "next/link";
import type { ProgramRequirement } from "@/lib/types";
import type { Institution } from "@/lib/types";

// ---------------------------------------------------------------------------
// Per-college expandable card
// ---------------------------------------------------------------------------

function ProgramCard({
  program,
  state,
  defaultOpen,
}: {
  program: ProgramRequirement;
  state: string;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  const credLabel =
    program.credential === "other"
      ? ""
      : ` (${program.credential.toUpperCase()})`;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-slate-800"
        aria-expanded={open}
      >
        <div className="min-w-0">
          <span className="text-sm font-semibold text-gray-900 dark:text-slate-100">
            {program.title}
          </span>
          {credLabel && (
            <span className="ml-1.5 text-xs text-gray-500 dark:text-slate-400">
              {credLabel}
            </span>
          )}
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-slate-400">
            {program.total_credits != null && (
              <span>{program.total_credits} credits</span>
            )}
            {program.gpa_minimum != null && (
              <span>{program.gpa_minimum} GPA min</span>
            )}
            {program.requirement_groups.length > 0 && (
              <span>
                {program.requirement_groups.length}{" "}
                {program.requirement_groups.length === 1
                  ? "group"
                  : "groups"}
              </span>
            )}
          </div>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 text-gray-400 dark:text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {open && (
        <div className="border-t border-gray-200 dark:border-slate-700 px-4 py-3 space-y-4">
          {program.description && (
            <p className="text-sm text-gray-600 dark:text-slate-400">
              {program.description}
            </p>
          )}

          {program.requirement_groups.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-slate-400 italic">
              Detailed course requirements are not yet available for this
              program.{" "}
              {program.catalog_url && (
                <a
                  href={program.catalog_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-600 dark:text-teal-400 underline"
                >
                  View in college catalog
                </a>
              )}
            </p>
          ) : (
            program.requirement_groups.map((group, gi) => (
              <RequirementGroupBlock
                key={gi}
                group={group}
                state={state}
              />
            ))
          )}

          {program.catalog_url && (
            <p className="text-xs text-gray-500 dark:text-slate-400 pt-1 border-t border-gray-100 dark:border-slate-800">
              Source:{" "}
              <a
                href={program.catalog_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-600 dark:text-teal-400 hover:underline"
              >
                College catalog
              </a>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Requirement group (e.g. "Core Requirements", "General Education")
// ---------------------------------------------------------------------------

function RequirementGroupBlock({
  group,
  state,
}: {
  group: ProgramRequirement["requirement_groups"][number];
  state: string;
}) {
  return (
    <div>
      <div className="flex items-baseline gap-2 mb-1.5">
        <h4 className="text-sm font-medium text-gray-900 dark:text-slate-100">
          {group.name}
        </h4>
        {group.credits_required != null && (
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {group.credits_required} credits
          </span>
        )}
        {group.choose_n != null && (
          <span className="text-xs text-teal-600 dark:text-teal-400">
            choose {group.choose_n}
          </span>
        )}
      </div>

      {group.courses.length > 0 ? (
        <ul className="space-y-0.5">
          {group.courses.map((course, ci) => (
            <li key={ci} className="flex items-baseline gap-1.5 text-sm">
              <Link
                href={`/${state}/course/${course.prefix.toLowerCase()}-${course.number.toLowerCase()}`}
                className="font-mono text-xs font-medium text-teal-600 dark:text-teal-400 hover:underline whitespace-nowrap"
              >
                {course.prefix} {course.number}
              </Link>
              <span className="text-gray-700 dark:text-slate-300 truncate">
                {course.title}
              </span>
              {course.credits != null && (
                <span className="text-xs text-gray-400 dark:text-slate-500 whitespace-nowrap">
                  ({course.credits} cr)
                </span>
              )}
              {course.or_alternatives.length > 0 && (
                <span className="text-xs text-gray-500 dark:text-slate-400">
                  or{" "}
                  {course.or_alternatives.map((alt, ai) => (
                    <span key={ai}>
                      {ai > 0 && " or "}
                      <Link
                        href={`/${state}/course/${alt.prefix.toLowerCase()}-${alt.number.toLowerCase()}`}
                        className="font-mono text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        {alt.prefix} {alt.number}
                      </Link>
                    </span>
                  ))}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 dark:text-slate-400 italic">
          See catalog for course list
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Exported component: requirements section for the program hub page
// ---------------------------------------------------------------------------

export default function ProgramRequirements({
  state,
  entries,
}: {
  state: string;
  entries: Array<{ college: Institution; programs: ProgramRequirement[] }>;
}) {
  if (entries.length === 0) return null;

  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-1">
        Degree requirements by college
      </h2>
      <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
        Expand a college to see the courses required for graduation. Data
        sourced from each college&apos;s official catalog.
      </p>

      <div className="space-y-4">
        {entries.map(({ college, programs }) => (
          <div key={college.id}>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-slate-100 mb-2 flex items-center gap-2">
              <Link
                href={`/${state}/college/${college.id}`}
                className="text-teal-600 dark:text-teal-400 hover:underline"
              >
                {college.name}
              </Link>
              <span className="text-xs font-normal text-gray-500 dark:text-slate-400">
                {programs.length}{" "}
                {programs.length === 1 ? "program" : "programs"}
              </span>
            </h3>
            <div className="space-y-2 ml-0 sm:ml-4">
              {programs.map((prog, pi) => (
                <ProgramCard
                  key={pi}
                  program={prog}
                  state={state}
                  defaultOpen={programs.length === 1}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Standalone component for per-college programs page
// ---------------------------------------------------------------------------

export function ProgramList({
  state,
  programs,
}: {
  state: string;
  programs: ProgramRequirement[];
}) {
  const byCredential = new Map<string, ProgramRequirement[]>();
  for (const p of programs) {
    const key = p.credential;
    if (!byCredential.has(key)) byCredential.set(key, []);
    byCredential.get(key)!.push(p);
  }

  const credOrder = ["AS", "AA", "AAS", "certificate", "diploma", "other"];
  const credLabels: Record<string, string> = {
    AS: "Associate of Science (AS)",
    AA: "Associate of Arts (AA)",
    AAS: "Associate of Applied Science (AAS)",
    certificate: "Certificates",
    diploma: "Diplomas",
    other: "Other Programs",
  };

  const sorted = [...byCredential.entries()].sort(
    (a, b) => credOrder.indexOf(a[0]) - credOrder.indexOf(b[0]),
  );

  return (
    <div className="space-y-8">
      {sorted.map(([cred, progs]) => (
        <section key={cred}>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
            {credLabels[cred] ?? cred}
            <span className="ml-2 text-sm font-normal text-gray-500 dark:text-slate-400">
              ({progs.length})
            </span>
          </h2>
          <div className="space-y-2">
            {progs
              .sort((a, b) => a.title.localeCompare(b.title))
              .map((prog, pi) => (
                <ProgramCard key={pi} program={prog} state={state} />
              ))}
          </div>
        </section>
      ))}
    </div>
  );
}
