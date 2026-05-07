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
import { isValidState } from "@/lib/states/registry";
import { requireStateConfig } from "@/lib/states/route-helpers";
import { getCurrentTerm, termLabel } from "@/lib/terms";
import {
  loadProgramData,
  qualifies,
  getProgramBySlug,
  PROGRAMS,
} from "@/lib/programs";
import { loadProgramAcrossColleges } from "@/lib/programs/requirements";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProgramRequirements from "@/components/ProgramRequirements";

export const revalidate = 604800; // 7 days

type PageProps = {
  params: Promise<{ state: string; slug: string }>;
};

export async function generateStaticParams() {
  // On-demand ISR: sitemap drives discovery, no upfront generation
  return [];
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
  const url = siteUrl();

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${program.name} programs at ${config.name} community colleges`,
    description: data.program.description,
    numberOfItems: data.colleges.length,
    url: `${url}/${state}/program/${slug}`,
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

  // Other programs offered in this state (for cross-linking footer)
  const otherProgramSlugs = PROGRAMS.filter((p) => p.slug !== slug).map(
    (p) => p.slug
  );

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
          </p>
        </header>

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
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
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {data.colleges.map((c) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <ProgramRequirements
          state={state}
          entries={requirementEntries}
        />

        {data.sampleCourses.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
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

        <section className="mb-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
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

