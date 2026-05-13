/**
 * Programs / majors hub page. e.g. `/va/program/nursing` lists every VCCS
 * college offering ≥5 sections in nursing-program prefixes (NUR, NURS, NSG,
 * RNS, ADN). Targets queries like "nursing programs Virginia community
 * college".
 *
 * Threshold-gated to avoid thin pSEO — see `qualifies()` in lib/programs.
 * ISR: 7 days, same as subject/course pages. Sitemap (programs partition)
 * lists only qualifying (state, program) pairs.
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getAllStates, isValidState } from "@/lib/states/registry";
import { requireStateConfig } from "@/lib/states/route-helpers";
import { getCurrentTerm, termLabel } from "@/lib/terms";
import {
  loadProgramData,
  qualifies,
  getProgramBySlug,
  getQualifyingProgramSlugs,
  PROGRAMS,
} from "@/lib/programs";
import { loadProgramAcrossColleges, checkCourseAvailability } from "@/lib/programs/requirements";
import { computeCourseAvailabilityProfile } from "@/lib/course-stats";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProgramRequirements from "@/components/ProgramRequirements";
import {
  getProgramLastUpdated,
  formatLastUpdated,
} from "@/lib/data-freshness";
import {
  getScorecardProgramForCips,
  formatDollar,
  type ScorecardProgramRecord,
} from "@/lib/scorecard";

export const revalidate = 604800; // 7 days

type PageProps = {
  params: Promise<{ state: string; slug: string }>;
};

// Force HTTP 404 (not a cached 200 soft-404) for any (state, slug) pair
// that's not in the qualifying-program set. See #337. Build cost: one
// loadProgramData call per (state, PROGRAMS[i]) pair (~22 × ~10 = ~220).
export const dynamicParams = false;

export async function generateStaticParams() {
  // Serialize across states — each call iterates every program and runs
  // multiple subject queries, so a parallel fan-out across 22 states would
  // saturate Supabase connections at build time.
  const out: { state: string; slug: string }[] = [];
  for (const s of getAllStates()) {
    const slugs = await getQualifyingProgramSlugs(s.slug).catch(
      () => [] as string[]
    );
    for (const slug of slugs) out.push({ state: s.slug, slug });
  }
  return out;
}

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://communitycollegepath.com"
  );
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { state, slug } = await props.params;
  if (!isValidState(state)) return { title: "Not Found" };
  const program = getProgramBySlug(slug);
  if (!program) return { title: "Not Found" };

  const config = requireStateConfig(state);
  const data = await loadProgramData(state, slug);
  if (!data || !qualifies(data)) return { title: "Not Found" };

  const term = await getCurrentTerm(state);
  const title = `${program.name} Programs at ${config.name} Community Colleges`;
  const description = `${data.totalColleges} ${config.systemName} colleges offer ${program.name.toLowerCase()} coursework — ${data.totalSections} sections across ${data.totalUniqueCourses} courses for ${termLabel(term)}. Compare colleges and transfer options.`;
  const canonical = `${siteUrl()}/${state}/program/${slug}`;

  return {
    title,
    description,
    keywords: [
      `${program.name.toLowerCase()} programs ${config.name}`,
      `${program.name.toLowerCase()} community college ${config.name}`,
      `${config.systemName} ${program.name.toLowerCase()}`,
      `${program.name.toLowerCase()} degree ${config.name}`,
      ...config.branding.metaKeywords,
    ],
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      siteName: config.branding.siteName,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function ProgramPage(props: PageProps) {
  const { state, slug } = await props.params;
  if (!isValidState(state)) notFound();
  const program = getProgramBySlug(slug);
  if (!program) notFound();

  const data = await loadProgramData(state, slug);
  if (!data || !qualifies(data)) notFound();

  const config = requireStateConfig(state);
  const [term, requirementEntries] = await Promise.all([
    getCurrentTerm(state),
    loadProgramAcrossColleges(state, slug),
  ]);

  const availabilityByCollege: Record<string, Record<string, number>> = {};
  if (requirementEntries.length > 0) {
    const results = await Promise.all(
      requirementEntries.map(async ({ college, programs }) => {
        const avMap = await checkCourseAvailability(state, college.college_slug, term, programs);
        return [college.college_slug, Object.fromEntries(avMap)] as const;
      }),
    );
    for (const [slug, av] of results) {
      availabilityByCollege[slug] = av;
    }
  }

  const url = siteUrl();
  const lastUpdated = getProgramLastUpdated(state);

  // Per-college Scorecard program outcomes for the CIP codes this program
  // maps to. Many entries will be null (no Scorecard data, or unitid not
  // mapped, or all relevant CIPs suppressed at that school).
  const outcomesByCollege: Record<string, ScorecardProgramRecord | null> = {};
  if (program.cips.length > 0) {
    for (const c of data.colleges) {
      outcomesByCollege[c.collegeCode] = getScorecardProgramForCips(
        state,
        c.collegeId,
        program.cips,
      );
    }
  }
  // National benchmark — same for every college, so grab the first
  // non-null we see. Used as a fallback in the summary when no college
  // has school-specific earnings populated.
  const nationalBenchmark: ScorecardProgramRecord | null = (() => {
    for (const c of data.colleges) {
      const r = outcomesByCollege[c.collegeCode];
      if (r?.earnings4YrMedianNational != null) return r;
    }
    return null;
  })();
  const collegesWithEarnings = data.colleges
    .map((c) => ({ college: c, outcomes: outcomesByCollege[c.collegeCode] }))
    .filter(
      (x): x is { college: typeof data.colleges[number]; outcomes: ScorecardProgramRecord } =>
        x.outcomes != null &&
        (x.outcomes.earnings5YrMedian != null ||
          x.outcomes.earnings1YrMedian != null),
    );

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${url}/${state}/program/${slug}#itemlist`,
    name: `${program.name} programs at ${config.name} community colleges`,
    description: data.program.description,
    numberOfItems: data.colleges.length,
    url: `${url}/${state}/program/${slug}`,
    // Connect to the site-wide WebSite/Organization graph from the root
    // layout so Google sees this program list as part of the site.
    isPartOf: { "@id": `${url}/#website` },
    ...(lastUpdated && { dateModified: lastUpdated.toISOString() }),
    itemListElement: data.colleges.slice(0, 25).map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CollegeOrUniversity",
        name: c.collegeName,
        url: `${url}/${state}/college/${c.collegeId}`,
      },
    })),
  };

  // Program Availability Snapshot — server-rendered substantive content
  // pulled from the same flatSections that loadProgramData has already
  // aggregated. Same helper used by /[state]/course/[code] for consistency.
  const programProfile = computeCourseAvailabilityProfile(data.flatSections);

  // Other programs offered in this state (for cross-linking footer)
  const otherProgramSlugs = PROGRAMS.filter((p) => p.slug !== slug).map(
    (p) => p.slug
  );

  // Cross-state nav (#413): same program in every other state where it
  // qualifies. Builds a topic cluster — both for student comparison
  // (\"how does nursing in NC stack up vs VA, SC, GA?\") and for SEO
  // link equity flowing through topically-related pages.
  const otherStatesWithThisProgram = (
    await Promise.all(
      getAllStates()
        .filter((s) => s.slug !== state)
        .map(async (s) => {
          const slugs = await getQualifyingProgramSlugs(s.slug).catch(
            () => [] as string[],
          );
          return slugs.includes(slug) ? s : null;
        }),
    )
  )
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }}
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumbs
          siteUrl={url}
          items={[
            { name: "Home", href: "/" },
            { name: config.name, href: `/${state}` },
            { name: "Programs", href: `/${state}` },
            {
              name: program.name,
              href: `/${state}/program/${slug}`,
            },
          ]}
        />

        <header className="mb-8">
          <p className="text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">
            {config.name} Community Colleges
          </p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
            {program.name} Programs
          </h1>
          <p className="text-gray-600 dark:text-slate-400 mt-3 leading-relaxed">
            {program.description}
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-3">
            {data.totalColleges}{" "}
            {data.totalColleges === 1 ? "college" : "colleges"} &middot;{" "}
            {data.totalSections} sections &middot; {data.totalUniqueCourses}{" "}
            unique courses &middot; {termLabel(term)}
            {lastUpdated && (
              <> &middot; {formatLastUpdated(lastUpdated)}</>
            )}
          </p>
        </header>

        {(collegesWithEarnings.length > 0 || nationalBenchmark != null) && (
          <section className="mb-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h2
              id="outcomes"
              className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-1"
            >
              Earnings &amp; outcomes for {program.name} graduates
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Federal College Scorecard data on what graduates of this program
              actually earn after completion. Where a school&rsquo;s cohort is
              too small to publish, we show the national benchmark for the
              same field of study.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {nationalBenchmark?.earnings4YrMedianNational != null && (
                <div className="rounded-lg border border-gray-200 dark:border-slate-700 p-4">
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    National median (4 yrs after completion)
                  </div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {formatDollar(nationalBenchmark.earnings4YrMedianNational)}
                  </div>
                  {nationalBenchmark.earnings4YrP25National != null &&
                    nationalBenchmark.earnings4YrP75National != null && (
                      <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                        Range:{" "}
                        {formatDollar(nationalBenchmark.earnings4YrP25National)}
                        &thinsp;–&thinsp;
                        {formatDollar(nationalBenchmark.earnings4YrP75National)}
                      </div>
                    )}
                </div>
              )}
              {collegesWithEarnings.slice(0, 5).map(({ college, outcomes }) => (
                <div
                  key={college.collegeCode}
                  className="rounded-lg border border-gray-200 dark:border-slate-700 p-4"
                >
                  <div className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-slate-400">
                    {college.collegeName} graduates
                  </div>
                  <div className="mt-1 text-2xl font-bold text-gray-900 dark:text-slate-100">
                    {formatDollar(
                      outcomes.earnings5YrMedian ?? outcomes.earnings1YrMedian,
                    )}
                  </div>
                  <div className="mt-0.5 text-xs text-gray-500 dark:text-slate-400">
                    {outcomes.earnings5YrMedian != null
                      ? "median, 5 yrs after completion"
                      : "median, 1 yr after completion"}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-gray-500 dark:text-slate-400">
              Source: U.S. Department of Education College Scorecard,
              per-program (4-digit CIP) data.{" "}
              {nationalBenchmark != null &&
                `CIP ${nationalBenchmark.cipCode} — ${nationalBenchmark.cipTitle}.`}{" "}
              School cohorts are suppressed by the federal source when fewer
              than ~30 completers in the reporting cohort.
            </p>
          </section>
        )}

        <section className="mb-10">
          <h2 id="colleges" className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Colleges offering {program.name}
          </h2>
          <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-900">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 dark:bg-slate-800 text-xs uppercase tracking-wider text-gray-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-2.5 font-medium">College</th>
                  <th className="px-4 py-2.5 font-medium text-right">
                    Sections
                  </th>
                  <th className="px-4 py-2.5 font-medium text-right">Courses</th>
                  <th className="px-4 py-2.5 font-medium text-right">Online</th>
                  {program.cips.length > 0 && (
                    <>
                      <th
                        className="px-4 py-2.5 font-medium text-right"
                        title="Annual program awards reported to IPEDS — sum of certificate + associate awards in the most recent year. A higher number suggests the program is more established at that college."
                      >
                        Awards/yr
                      </th>
                      <th
                        className="px-4 py-2.5 font-medium text-right"
                        title="Median earnings of completers 5 years after completion (federal Scorecard). '—' means the cohort was too small to publish."
                      >
                        5-yr earnings
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {data.colleges.map((c) => {
                  const o = outcomesByCollege[c.collegeCode];
                  const awards =
                    (o?.awardsLevel1 ?? 0) + (o?.awardsLevel2 ?? 0);
                  return (
                    <tr
                      key={c.collegeCode}
                      className="hover:bg-gray-50 dark:hover:bg-slate-800"
                    >
                      <td className="px-4 py-2.5">
                        <Link
                          href={`/${state}/college/${c.collegeId}`}
                          className="font-medium text-teal-600 dark:text-teal-400 hover:underline"
                        >
                          {c.collegeName}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-900 dark:text-slate-100">
                        {c.sectionCount}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-slate-400">
                        {c.uniqueCourses}
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-600 dark:text-slate-400">
                        {c.onlineCount > 0 ? c.onlineCount : "—"}
                      </td>
                      {program.cips.length > 0 && (
                        <>
                          <td className="px-4 py-2.5 text-right text-gray-600 dark:text-slate-400">
                            {awards > 0 ? awards : "—"}
                          </td>
                          <td className="px-4 py-2.5 text-right text-gray-900 dark:text-slate-100">
                            {o?.earnings5YrMedian != null
                              ? formatDollar(o.earnings5YrMedian)
                              : "—"}
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Program Availability Snapshot — server-rendered substantive
            content per term. Helps long-tail SEO ("[program] online
            community college [state]", "[program] evening sections").
            Computed inline from data.flatSections — no extra I/O. */}
        {programProfile && programProfile.totalSections > 0 && (
          <section className="mb-10 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-6">
            <h2 id="availability" className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-1">
              {program.name} Availability Snapshot
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              How {program.name.toLowerCase()} sections are being offered
              across {programProfile.collegeCount}{" "}
              {programProfile.collegeCount === 1 ? "college" : "colleges"} in{" "}
              {config.name} this term ({programProfile.totalSections}{" "}
              {programProfile.totalSections === 1 ? "section" : "sections"}{" "}
              total).
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                  Delivery format
                </h3>
                <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
                  {Object.entries(programProfile.modes.counts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([mode, count]) => (
                      <li key={mode} className="flex justify-between">
                        <span className="capitalize">
                          {mode.replace("-", " ")}
                        </span>
                        <span>
                          <span className="font-medium text-gray-900 dark:text-slate-100">
                            {count}
                          </span>{" "}
                          <span className="text-xs text-gray-500 dark:text-slate-400">
                            ({programProfile.modes.pcts[mode].toFixed(0)}%)
                          </span>
                        </span>
                      </li>
                    ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-slate-100 mb-2">
                  When sections meet
                </h3>
                <ul className="text-sm text-gray-700 dark:text-slate-300 space-y-1">
                  {programProfile.timeOfDay.morning > 0 && (
                    <li className="flex justify-between">
                      <span>Morning (before noon)</span>
                      <span className="font-medium text-gray-900 dark:text-slate-100">
                        {programProfile.timeOfDay.morning}
                      </span>
                    </li>
                  )}
                  {programProfile.timeOfDay.afternoon > 0 && (
                    <li className="flex justify-between">
                      <span>Afternoon (noon&ndash;5 PM)</span>
                      <span className="font-medium text-gray-900 dark:text-slate-100">
                        {programProfile.timeOfDay.afternoon}
                      </span>
                    </li>
                  )}
                  {programProfile.timeOfDay.evening > 0 && (
                    <li className="flex justify-between">
                      <span>Evening (5 PM and after)</span>
                      <span className="font-medium text-gray-900 dark:text-slate-100">
                        {programProfile.timeOfDay.evening}
                      </span>
                    </li>
                  )}
                  {programProfile.timeOfDay.asynchronous > 0 && (
                    <li className="flex justify-between">
                      <span>Asynchronous / TBA</span>
                      <span className="font-medium text-gray-900 dark:text-slate-100">
                        {programProfile.timeOfDay.asynchronous}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {(programProfile.startDates.distinct > 0 ||
              programProfile.instructorCount > 0) && (
              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-slate-700 grid sm:grid-cols-2 gap-6 text-sm">
                {programProfile.startDates.distinct > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-1">
                      Start dates
                    </h3>
                    <p className="text-gray-700 dark:text-slate-300">
                      Sections begin on{" "}
                      <span className="font-medium text-gray-900 dark:text-slate-100">
                        {programProfile.startDates.distinct}
                      </span>{" "}
                      distinct date
                      {programProfile.startDates.distinct === 1 ? "" : "s"}.
                      {programProfile.startDates.lateStartCount > 0 && (
                        <>
                          {" "}
                          <Link
                            href={`/${state}/starting-soon`}
                            className="font-medium text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                          >
                            {programProfile.startDates.lateStartCount}{" "}
                            late-start
                          </Link>{" "}
                          more than two weeks after the term&apos;s earliest
                          start.
                        </>
                      )}
                    </p>
                  </div>
                )}
                {programProfile.instructorCount > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-slate-100 mb-1">
                      Instructor diversity
                    </h3>
                    <p className="text-gray-700 dark:text-slate-300">
                      Taught by{" "}
                      <span className="font-medium text-gray-900 dark:text-slate-100">
                        {programProfile.instructorCount}
                      </span>{" "}
                      distinct instructor
                      {programProfile.instructorCount === 1 ? "" : "s"} across{" "}
                      {programProfile.collegeCount}{" "}
                      {programProfile.collegeCount === 1
                        ? "college"
                        : "colleges"}
                      .
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        <ProgramRequirements
          state={state}
          entries={requirementEntries}
          availabilityByCollege={availabilityByCollege}
        />

        {data.sampleCourses.length > 0 && (
          <section className="mb-10">
            <h2 id="common-courses" className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
              Common {program.name} courses
            </h2>
            <ul className="grid sm:grid-cols-2 gap-2">
              {data.sampleCourses.map((c) => (
                <li key={`${c.prefix}-${c.number}`}>
                  <Link
                    href={`/${state}/course/${c.prefix.toLowerCase()}-${c.number.toLowerCase()}`}
                    className="block rounded-lg border border-gray-200 dark:border-slate-700 px-3 py-2 hover:border-teal-300 dark:hover:border-teal-600 transition"
                  >
                    <span className="font-mono text-sm font-medium text-teal-600 dark:text-teal-400">
                      {c.prefix} {c.number}
                    </span>
                    <span className="ml-2 text-sm text-gray-700 dark:text-slate-300">
                      {c.title}
                    </span>
                    <span className="ml-2 text-xs text-gray-500 dark:text-slate-400">
                      ({c.sectionCount}{" "}
                      {c.sectionCount === 1 ? "section" : "sections"})
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {otherStatesWithThisProgram.length > 0 && (
          <section className="mb-10">
            <h2
              id="other-states"
              className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-1"
            >
              Compare {program.name} programs in other states
            </h2>
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Same comparison view, different state systems. Useful if
              you&rsquo;re considering an out-of-state community college or
              just want to see how {config.name}&rsquo;s {program.name.toLowerCase()}{" "}
              programs stack up.
            </p>
            <div className="flex flex-wrap gap-2">
              {otherStatesWithThisProgram.map((s) => (
                <Link
                  key={s.slug}
                  href={`/${s.slug}/program/${slug}`}
                  className="rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm text-gray-700 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-600 hover:text-teal-700 dark:hover:text-teal-400 transition"
                >
                  {program.name} in {s.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 id="other-programs" className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
            Other programs in {config.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {otherProgramSlugs.map((s) => {
              const p = getProgramBySlug(s)!;
              return (
                <Link
                  key={s}
                  href={`/${state}/program/${s}`}
                  className="rounded-full border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1 text-sm text-gray-700 dark:text-slate-300 hover:border-teal-300 dark:hover:border-teal-600 transition"
                >
                  {p.name}
                </Link>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-2">
            Some programs may not be offered at every college — pages render
            only when the program meets a coverage threshold for the state.
          </p>
        </section>
      </div>
    </>
  );
}

