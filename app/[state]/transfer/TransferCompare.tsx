"use client";

import { useState, useMemo } from "react";
import type { TransferMapping } from "@/lib/types";

interface Props {
  universities: { slug: string; name: string }[];
  mappings: TransferMapping[];
  courseAvailability: Record<
    string,
    { colleges: string[]; totalSections: number }
  >;
  state: string;
}

interface CCCourse {
  prefix: string;
  number: string;
  course: string;
  title: string;
}

type CellStatus = "direct" | "elective" | "no-credit" | "unknown";

export default function TransferCompare({
  universities,
  mappings,
  courseAvailability,
  state,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(
    new Set()
  );

  // Build unique CC courses from all mappings (de-duped by course code)
  const allCourses = useMemo(() => {
    const seen = new Map<string, CCCourse>();
    for (const m of mappings) {
      const key = `${m.cc_prefix} ${m.cc_number}`;
      if (!seen.has(key)) {
        seen.set(key, {
          prefix: m.cc_prefix,
          number: m.cc_number,
          course: key,
          title: m.cc_title,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) =>
      a.course.localeCompare(b.course)
    );
  }, [mappings]);

  // Group courses by prefix for the selector
  const coursesByPrefix = useMemo(() => {
    const map = new Map<string, CCCourse[]>();
    for (const c of allCourses) {
      if (!map.has(c.prefix)) map.set(c.prefix, []);
      map.get(c.prefix)!.push(c);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allCourses]);

  // Filter courses by search query
  const filteredCourses = useMemo(() => {
    if (!searchQuery) return coursesByPrefix;
    const q = searchQuery.toLowerCase();
    return coursesByPrefix
      .map(
        ([prefix, courses]) =>
          [
            prefix,
            courses.filter(
              (c) =>
                c.course.toLowerCase().includes(q) ||
                c.title.toLowerCase().includes(q)
            ),
          ] as [string, CCCourse[]]
      )
      .filter(([, courses]) => courses.length > 0);
  }, [coursesByPrefix, searchQuery]);

  // Build transfer lookup: "ENG 111|vt" → TransferMapping
  const transferLookup = useMemo(() => {
    const map = new Map<string, TransferMapping>();
    for (const m of mappings) {
      const key = `${m.cc_prefix} ${m.cc_number}|${m.university}`;
      map.set(key, m);
    }
    return map;
  }, [mappings]);

  // Selected courses as ordered list
  const selectedCoursesList = useMemo(() => {
    return allCourses.filter((c) => selectedCourses.has(c.course));
  }, [allCourses, selectedCourses]);

  // Score each university based on selected courses
  const universityScores = useMemo(() => {
    if (selectedCoursesList.length === 0) return [];

    return universities
      .map((uni) => {
        let direct = 0;
        let elective = 0;
        let noCredit = 0;
        let unknown = 0;

        for (const c of selectedCoursesList) {
          const m = transferLookup.get(`${c.course}|${uni.slug}`);
          if (!m) {
            unknown++;
          } else if (m.no_credit) {
            noCredit++;
          } else if (m.is_elective) {
            elective++;
          } else {
            direct++;
          }
        }

        const transferable = direct + elective;
        const total = selectedCoursesList.length;
        const pct = total > 0 ? Math.round((transferable / total) * 100) : 0;

        return {
          ...uni,
          direct,
          elective,
          noCredit,
          unknown,
          transferable,
          total,
          pct,
        };
      })
      .sort((a, b) => b.transferable - a.transferable || b.direct - a.direct);
  }, [universities, selectedCoursesList, transferLookup]);

  function toggleCourse(course: string) {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      if (next.has(course)) next.delete(course);
      else next.add(course);
      return next;
    });
  }

  function togglePrefix(prefix: string, courses: CCCourse[]) {
    setSelectedCourses((prev) => {
      const next = new Set(prev);
      const allSelected = courses.every((c) => next.has(c.course));
      for (const c of courses) {
        if (allSelected) next.delete(c.course);
        else next.add(c.course);
      }
      return next;
    });
  }

  function clearAll() {
    setSelectedCourses(new Set());
  }

  function getCellInfo(
    course: CCCourse,
    uniSlug: string
  ): { status: CellStatus; label: string; course: string } {
    const m = transferLookup.get(`${course.course}|${uniSlug}`);
    if (!m)
      return { status: "unknown", label: "\u2014", course: "" };
    if (m.no_credit)
      return { status: "no-credit", label: "\u2717", course: "" };
    if (m.is_elective)
      return { status: "elective", label: "~", course: m.univ_course };
    return { status: "direct", label: "\u2713", course: m.univ_course };
  }

  const cellColors: Record<CellStatus, string> = {
    direct:
      "bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400",
    elective:
      "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400",
    "no-credit":
      "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400",
    unknown:
      "bg-gray-50 dark:bg-slate-800 text-gray-300 dark:text-slate-600",
  };

  return (
    <div>
      {/* ── Course Selector ── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
            Select your courses
          </h3>
          {selectedCourses.size > 0 && (
            <button
              onClick={clearAll}
              className="text-xs text-teal-600 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
            >
              Clear all ({selectedCourses.size})
            </button>
          )}
        </div>

        <input
          type="text"
          placeholder="Search courses (e.g. ENG 111 or Biology)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-gray-900 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-200 mb-3"
        />

        {/* Selected chips */}
        {selectedCourses.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {selectedCoursesList.map((c) => (
              <button
                key={c.course}
                onClick={() => toggleCourse(c.course)}
                className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-teal-700 transition-colors"
              >
                {c.course}
                <span className="text-teal-200">&times;</span>
              </button>
            ))}
          </div>
        )}

        {/* Course grid */}
        <div className="max-h-64 overflow-y-auto rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-3">
          {filteredCourses.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-slate-500 text-center py-4">
              No courses match &ldquo;{searchQuery}&rdquo;
            </p>
          ) : (
            filteredCourses.map(([prefix, courses]) => {
              const allSelected = courses.every((c) =>
                selectedCourses.has(c.course)
              );
              const someSelected = courses.some((c) =>
                selectedCourses.has(c.course)
              );

              return (
                <div key={prefix}>
                  <button
                    onClick={() => togglePrefix(prefix, courses)}
                    className="flex items-center gap-2 text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[8px] transition-colors ${
                        allSelected
                          ? "bg-teal-600 border-teal-600 text-white"
                          : someSelected
                            ? "bg-teal-100 dark:bg-teal-900/40 border-teal-400 dark:border-teal-600"
                            : "border-gray-300 dark:border-slate-600"
                      }`}
                    >
                      {allSelected && "\u2713"}
                      {someSelected && !allSelected && "\u2013"}
                    </span>
                    {prefix} ({courses.length})
                  </button>
                  <div className="flex flex-wrap gap-1.5 ml-5">
                    {courses.map((c) => (
                      <button
                        key={c.course}
                        onClick={() => toggleCourse(c.course)}
                        className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                          selectedCourses.has(c.course)
                            ? "bg-teal-600 text-white"
                            : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-700"
                        }`}
                        title={c.title}
                      >
                        {c.course}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ── Results ── */}
      {selectedCourses.size === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 dark:border-slate-600 py-16 text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">
            Select courses above to compare transfer credit across universities
          </p>
          <p className="text-gray-400 dark:text-slate-500 text-xs mt-2">
            Click a subject heading (like ENG) to select all courses in that
            subject
          </p>
        </div>
      ) : (
        <>
          {/* ── Summary cards — ranked by acceptance ── */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
              Best transfer destinations for your {selectedCourses.size}{" "}
              {selectedCourses.size === 1 ? "course" : "courses"}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {universityScores.map((uni, rank) => (
                <div
                  key={uni.slug}
                  className={`rounded-lg border p-4 transition-shadow ${
                    rank === 0
                      ? "border-teal-300 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-900/20 ring-1 ring-teal-200 dark:ring-teal-800 shadow-sm"
                      : "border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-slate-100 leading-tight pr-2">
                      {rank === 0 && (
                        <span className="text-teal-600 dark:text-teal-400 mr-1">
                          ★
                        </span>
                      )}
                      {uni.name}
                    </h4>
                    <span
                      className={`text-lg font-bold tabular-nums shrink-0 ${
                        uni.pct >= 80
                          ? "text-teal-600 dark:text-teal-400"
                          : uni.pct >= 50
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {uni.pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-800 overflow-hidden flex mb-2">
                    {uni.direct > 0 && (
                      <div
                        className="bg-teal-500 h-full"
                        style={{
                          width: `${(uni.direct / uni.total) * 100}%`,
                        }}
                      />
                    )}
                    {uni.elective > 0 && (
                      <div
                        className="bg-amber-400 h-full"
                        style={{
                          width: `${(uni.elective / uni.total) * 100}%`,
                        }}
                      />
                    )}
                    {uni.noCredit > 0 && (
                      <div
                        className="bg-rose-400 h-full"
                        style={{
                          width: `${(uni.noCredit / uni.total) * 100}%`,
                        }}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs">
                    <span className="text-teal-600 dark:text-teal-400">
                      {uni.direct} direct
                    </span>
                    <span className="text-amber-600 dark:text-amber-400">
                      {uni.elective} elective
                    </span>
                    {uni.noCredit > 0 && (
                      <span className="text-rose-500 dark:text-rose-400">
                        {uni.noCredit} no credit
                      </span>
                    )}
                    {uni.unknown > 0 && (
                      <span className="text-gray-400 dark:text-slate-500">
                        {uni.unknown} no data
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-[10px] text-gray-400 dark:text-slate-500">
                    {uni.transferable}/{uni.total} courses transfer
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Comparison table ── */}
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300 mb-3">
              Course-by-course comparison
            </h3>
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-800">
                    <th className="sticky left-0 z-10 bg-gray-50 dark:bg-slate-800 px-3 py-2.5 text-left font-semibold text-gray-700 dark:text-slate-300 min-w-[130px] border-r border-gray-200 dark:border-slate-700">
                      Course
                    </th>
                    {universityScores.map((uni) => (
                      <th
                        key={uni.slug}
                        className="px-3 py-2.5 text-center font-semibold text-gray-700 dark:text-slate-300 min-w-[130px]"
                      >
                        <div className="truncate max-w-[130px]">
                          {uni.name}
                        </div>
                        <div className="font-normal text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">
                          {uni.pct}% transfer
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                  {selectedCoursesList.map((course) => {
                    const avail =
                      courseAvailability[
                        `${course.prefix}-${course.number}`
                      ];
                    return (
                      <tr
                        key={course.course}
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/30"
                      >
                        <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-3 py-2.5 border-r border-gray-200 dark:border-slate-700">
                          <div className="font-medium text-gray-900 dark:text-slate-100">
                            {course.course}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-slate-500 truncate max-w-[150px]">
                            {course.title}
                          </div>
                          {avail && (
                            <span className="inline-flex items-center mt-0.5 text-[9px] text-emerald-600 dark:text-emerald-400">
                              ● {avail.totalSections} sections available
                            </span>
                          )}
                        </td>
                        {universityScores.map((uni) => {
                          const cell = getCellInfo(course, uni.slug);
                          return (
                            <td
                              key={uni.slug}
                              className={`px-3 py-2.5 text-center ${cellColors[cell.status]}`}
                            >
                              <div className="font-semibold text-sm">
                                {cell.label}
                              </div>
                              {cell.course && (
                                <div className="text-[10px] mt-0.5 opacity-80 truncate max-w-[120px] mx-auto">
                                  {cell.course}
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>

                {/* Summary footer row */}
                <tfoot>
                  <tr className="bg-gray-50 dark:bg-slate-800 font-semibold">
                    <td className="sticky left-0 z-10 bg-gray-50 dark:bg-slate-800 px-3 py-2.5 text-gray-700 dark:text-slate-300 border-r border-gray-200 dark:border-slate-700">
                      Total
                    </td>
                    {universityScores.map((uni) => (
                      <td
                        key={uni.slug}
                        className="px-3 py-2.5 text-center"
                      >
                        <span
                          className={`${
                            uni.pct >= 80
                              ? "text-teal-700 dark:text-teal-400"
                              : uni.pct >= 50
                                ? "text-amber-700 dark:text-amber-400"
                                : "text-rose-700 dark:text-rose-400"
                          }`}
                        >
                          {uni.transferable}/{uni.total}
                        </span>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* ── Legend ── */}
          <div className="flex flex-wrap items-center gap-4 text-[10px] text-gray-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-100 dark:bg-teal-900/30 inline-block" />
              ✓ Direct match
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-100 dark:bg-amber-900/30 inline-block" />
              ~ Elective credit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-100 dark:bg-rose-900/30 inline-block" />
              ✗ No credit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-gray-100 dark:bg-slate-800 inline-block" />
              — No data
            </span>
          </div>
        </>
      )}
    </div>
  );
}
