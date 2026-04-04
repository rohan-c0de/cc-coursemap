"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { TransferMapping } from "@/lib/types";

interface Props {
  universities: { slug: string; name: string }[];
  mappings: TransferMapping[];
  courseAvailability: Record<
    string,
    { colleges: string[]; totalSections: number }
  >;
  defaultUniversity: string;
  state: string;
}

type GroupMode = "outcome" | "subject";

export default function TransferClient({
  universities,
  mappings,
  courseAvailability,
  defaultUniversity,
  state,
}: Props) {
  const [selectedUniversity, setSelectedUniversity] = useState(defaultUniversity);
  const [subjectFilter, setSubjectFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<
    "" | "direct" | "elective" | "no-credit"
  >("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>("outcome");

  // Filter mappings by selected university first
  const universityMappings = useMemo(() => {
    return mappings.filter((m) => m.university === selectedUniversity);
  }, [mappings, selectedUniversity]);

  // Get unique subjects from university-filtered mappings
  const subjects = useMemo(() => {
    const s = new Set(universityMappings.map((m) => m.cc_prefix));
    return Array.from(s).sort();
  }, [universityMappings]);

  // Apply additional filters
  const filtered = useMemo(() => {
    return universityMappings.filter((m) => {
      if (subjectFilter && m.cc_prefix !== subjectFilter) return false;
      if (typeFilter === "direct" && (m.no_credit || m.is_elective))
        return false;
      if (typeFilter === "elective" && (!m.is_elective || m.no_credit))
        return false;
      if (typeFilter === "no-credit" && !m.no_credit) return false;
      if (availableOnly) {
        const key = `${m.cc_prefix}-${m.cc_number}`;
        if (!courseAvailability[key]) return false;
      }
      return true;
    });
  }, [universityMappings, subjectFilter, typeFilter, availableOnly, courseAvailability]);

  // Group by subject prefix
  const groupedBySubject = useMemo(() => {
    const map = new Map<string, TransferMapping[]>();
    for (const m of filtered) {
      if (!map.has(m.cc_prefix)) map.set(m.cc_prefix, []);
      map.get(m.cc_prefix)!.push(m);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  // Group by transfer outcome
  const groupedByOutcome = useMemo(() => {
    const direct: TransferMapping[] = [];
    const elective: TransferMapping[] = [];
    const noCredit: TransferMapping[] = [];
    for (const m of filtered) {
      if (m.no_credit) noCredit.push(m);
      else if (m.is_elective) elective.push(m);
      else direct.push(m);
    }
    return [
      {
        key: "direct",
        title: "Direct match",
        subtitle: "Transfers as a named equivalent course at the destination university.",
        tone: "teal" as const,
        courses: direct,
      },
      {
        key: "elective",
        title: "Elective credit only",
        subtitle: "Credit transfers as general elective, not as a specific named course.",
        tone: "amber" as const,
        courses: elective,
      },
      {
        key: "no-credit",
        title: "No credit",
        subtitle: "Does not transfer for credit. Shown for transparency.",
        tone: "rose" as const,
        courses: noCredit,
      },
    ].filter((g) => g.courses.length > 0);
  }, [filtered]);

  // Stats (based on selected university's mappings)
  const stats = useMemo(() => {
    const direct = universityMappings.filter((m) => !m.no_credit && !m.is_elective).length;
    const elective = universityMappings.filter((m) => m.is_elective && !m.no_credit).length;
    const noCredit = universityMappings.filter((m) => m.no_credit).length;
    const available = universityMappings.filter((m) => {
      const key = `${m.cc_prefix}-${m.cc_number}`;
      return courseAvailability[key] && !m.no_credit;
    }).length;
    return { direct, elective, noCredit, total: universityMappings.length, available };
  }, [universityMappings, courseAvailability]);

  const uniName =
    universities.find((u) => u.slug === selectedUniversity)?.name ||
    selectedUniversity;

  // Shared row renderer used by both group modes
  function renderCourseRow(m: TransferMapping, i: number, showOutcomeBadge: boolean) {
    const key = `${m.cc_prefix}-${m.cc_number}`;
    const availability = courseAvailability[key];

    return (
      <div
        key={i}
        className={`px-4 py-3 ${m.no_credit ? "bg-gray-50 opacity-60" : ""}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          {/* Left: CC course → University course */}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-gray-900">
                {m.cc_course}
              </span>
              {!m.no_credit && (
                <>
                  <span className="text-gray-400">&rarr;</span>
                  <span
                    className={`font-medium ${
                      m.is_elective
                        ? "text-amber-700"
                        : "text-teal-700"
                    }`}
                  >
                    {m.univ_course}
                  </span>
                </>
              )}
              {m.no_credit && (
                <span className="text-xs text-rose-600 font-medium">
                  No {uniName} credit
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {m.cc_title}
              {!m.no_credit && m.univ_title && (
                <span className="text-gray-400">
                  {" "}
                  &rarr; {m.univ_title}
                </span>
              )}
            </div>
            {m.notes && (
              <p className="text-[10px] text-amber-600 mt-1">
                {m.notes}
              </p>
            )}
          </div>

          {/* Right: credits + badge + availability */}
          <div className="flex items-center gap-3 shrink-0">
            {!m.no_credit && (
              <span className="text-xs text-gray-400">
                {m.cc_credits} cr &rarr; {m.univ_credits} cr
              </span>
            )}
            {showOutcomeBadge && m.is_elective && !m.no_credit && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-200">
                Elective credit only
              </span>
            )}
            {showOutcomeBadge && !m.is_elective && !m.no_credit && (
              <span className="inline-flex items-center rounded-full bg-teal-50 px-2 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-inset ring-teal-200">
                Direct match
              </span>
            )}
            {showOutcomeBadge && m.no_credit && (
              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 ring-1 ring-inset ring-rose-200">
                No credit
              </span>
            )}
            {/* Availability badge */}
            {!m.no_credit && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${
                  availability
                    ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                    : "bg-gray-50 text-gray-500 ring-gray-200"
                }`}
              >
                {availability ? "Available now" : "Not offered"}
              </span>
            )}
            {/* Detail link */}
            {availability && !m.no_credit && (
              <Link
                href={`/${state}/courses?q=${m.cc_prefix}+${m.cc_number}`}
                className="text-[10px] text-teal-600 hover:text-teal-800 hover:underline whitespace-nowrap"
              >
                {availability.totalSections} sections at{" "}
                {availability.colleges.length}{" "}
                {availability.colleges.length === 1
                  ? "college"
                  : "colleges"}{" "}
                &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* University selector */}
      <div className="mb-6">
        <label className="text-sm font-medium text-gray-700 mr-2">
          I want to transfer to:
        </label>
        <select
          value={selectedUniversity}
          onChange={(e) => {
            setSelectedUniversity(e.target.value);
            setSubjectFilter("");
            setTypeFilter("");
          }}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
        >
          {universities.map((u) => (
            <option key={u.slug} value={u.slug}>
              {u.name}
            </option>
          ))}
        </select>
      </div>

      {/* Stats banner */}
      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-center">
          <p className="text-2xl font-bold text-teal-700">{stats.direct}</p>
          <p className="text-xs text-teal-600">Direct Matches</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{stats.elective}</p>
          <p className="text-xs text-amber-600">Elective Only</p>
        </div>
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center">
          <p className="text-2xl font-bold text-rose-700">{stats.noCredit}</p>
          <p className="text-xs text-rose-600">No Credit</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">
            {stats.available}
          </p>
          <p className="text-xs text-emerald-600">Available Now</p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="min-w-[140px]">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Subject
          </label>
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
          >
            <option value="">All Subjects ({subjects.length})</option>
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="min-w-[160px]">
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Transfer Type
          </label>
          <select
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(
                e.target.value as "" | "direct" | "elective" | "no-credit"
              )
            }
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200"
          >
            <option value="">All Types</option>
            <option value="direct">Direct Matches Only</option>
            <option value="elective">Elective Credit Only</option>
            <option value="no-credit">No Credit</option>
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
          />
          <span className="text-sm text-gray-700">
            Available this term only
          </span>
        </label>

        {/* Group by toggle */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-medium text-gray-500">Group by:</span>
          <button
            onClick={() => setGroupMode("outcome")}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              groupMode === "outcome"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
            }`}
          >
            Transfer outcome
          </button>
          <button
            onClick={() => setGroupMode("subject")}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              groupMode === "subject"
                ? "bg-gray-900 text-white"
                : "bg-white text-gray-600 ring-1 ring-inset ring-gray-300 hover:bg-gray-100"
            }`}
          >
            Subject
          </button>
        </div>
      </div>

      {/* Glossary — 3 cards */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg border border-teal-200 bg-white p-3">
          <p className="text-xs font-semibold text-teal-700">Direct match</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Transfers as a named equivalent course at the destination university.
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-white p-3">
          <p className="text-xs font-semibold text-amber-700">Elective credit only</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Credit transfers as general elective, not a specific course. Confirm with your advisor.
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs font-semibold text-gray-700">Important</p>
          <p className="mt-1 text-xs leading-relaxed text-gray-600">
            Always confirm final transfer decisions with your destination school before enrolling.
          </p>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500">No courses match your filters.</p>
        </div>
      ) : groupMode === "outcome" ? (
        /* ── Grouped by transfer outcome ── */
        <div className="space-y-6">
          {groupedByOutcome.map((group) => {
            const toneColors = {
              teal: "text-teal-700 border-teal-200",
              amber: "text-amber-700 border-amber-200",
              rose: "text-rose-700 border-rose-200",
            };
            const headerColor = toneColors[group.tone];

            return (
              <div key={group.key}>
                {/* Outcome group header */}
                <div className="mb-2 flex items-end justify-between gap-4 border-b border-gray-200 pb-2">
                  <div>
                    <h3 className={`text-sm font-semibold ${headerColor.split(" ")[0]}`}>
                      {group.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{group.subtitle}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {group.courses.length} {group.courses.length === 1 ? "course" : "courses"}
                  </span>
                </div>

                {/* Course rows — no per-row outcome badge needed since group header provides context */}
                <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                  {group.courses.map((m, i) => renderCourseRow(m, i, false))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Grouped by subject ── */
        <div className="space-y-6">
          {groupedBySubject.map(([prefix, courses]) => (
            <div key={prefix}>
              {/* Subject header */}
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>{prefix}</span>
                <span className="h-px flex-1 bg-gray-200" />
                <span className="font-normal text-gray-400">
                  {courses.length} courses
                </span>
              </h3>

              {/* Course rows — show per-row outcome badge since group doesn't indicate type */}
              <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
                {courses.map((m, i) => renderCourseRow(m, i, true))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Result count */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        {filtered.length} courses shown
      </p>
    </div>
  );
}
