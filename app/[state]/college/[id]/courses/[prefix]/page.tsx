import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { loadInstitutions } from "@/lib/institutions";
import {
  loadCoursesForCollege,
  getTermsWithDataForCollegeSubject,
  getUniqueSubjects,
  trimCoursesForClient,
} from "@/lib/courses";
import { getCurrentTerm, termLabel } from "@/lib/terms";
import { getAllStates } from "@/lib/states/registry";
import { requireStateConfig } from "@/lib/states/route-helpers";
import { buildTransferLookupForCourses } from "@/lib/transfer-scoped";
import { subjectName } from "@/lib/subjects";
import SubjectTermSection from "./SubjectTermSection";
import AdUnit from "@/components/AdUnit";
import TrackView from "@/components/TrackView";

export const revalidate = 86400;

type PageProps = {
  params: Promise<{ state: string; id: string; prefix: string }>;
  // searchParams intentionally omitted — reading it would opt the page into
  // dynamic rendering and disable ISR edge caching. `?term=` is now handled
  // client-side in SubjectTermSection via useEffect + history.replaceState.
};

// ---------------------------------------------------------------------------
// Static params — prerender the highest-traffic subject pages at build time
// ---------------------------------------------------------------------------

// The full cartesian product is ~9k pages (all colleges × all subjects
// across 15 states), which blows out deploy output size. Instead, we
// prerender a curated subset: common subjects at the first few colleges per
// state. These are the pages most likely to be visited right after a deploy.
// Everything else ISRs on first request (`dynamicParams` defaults to true).
//
// Uses only sync static data (loadInstitutions + getAllStates), so no
// build-time DB calls. If a (college, subject) combo has no data at
// render time, the page calls notFound() and Next caches a 404 — harmless.

// Subjects present at virtually every US community college.
const PRERENDER_SUBJECTS = ["eng", "mth", "bio", "csc", "psy", "his"];
// First N colleges per state (institution lists are typically ordered by
// largest / most campuses first).
const COLLEGES_PER_STATE = 3;

export function generateStaticParams() {
  return getAllStates().flatMap((s) => {
    const colleges = loadInstitutions(s.slug).slice(0, COLLEGES_PER_STATE);
    return colleges.flatMap((c) =>
      PRERENDER_SUBJECTS.map((prefix) => ({
        state: s.slug,
        id: c.id,
        prefix,
      }))
    );
  });
}

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { state, id, prefix: rawPrefix } = await props.params;
  const prefix = rawPrefix.toUpperCase();
  const config = requireStateConfig(state);
  const institutions = loadInstitutions(state);
  const institution = institutions.find((i) => i.id === id);

  if (!institution) return { title: "Not Found" };

  const subject = subjectName(prefix);

  // Resolve the default term for SEO copy — same fallback logic the page uses.
  // Use the targeted `getTermsWithDataForCollegeSubject` query instead of
  // loading every term's full catalog so metadata generation stays cheap.
  const termsWithData = await getTermsWithDataForCollegeSubject(
    institution.college_slug,
    prefix,
    state
  );
  if (termsWithData.length === 0) return { title: "Not Found" };

  const preferredTerm = await getCurrentTerm(state);
  const resolvedTerm = termsWithData.includes(preferredTerm)
    ? preferredTerm
    : termsWithData[termsWithData.length - 1];

  const allCourses = await loadCoursesForCollege(
    institution.college_slug,
    resolvedTerm,
    state
  );
  const filtered = allCourses.filter((c) => c.course_prefix === prefix);

  const onlineCount = filtered.filter((c) => c.mode === "online").length;
  const uniqueCourses = new Set(
    filtered.map((c) => `${c.course_prefix} ${c.course_number}`)
  ).size;

  // Build a deduplicated list of unique courses ordered by section count so
  // the most common course appears first (e.g. SDV 100 before SDV 106).
  const courseMap = new Map<string, { number: string; title: string; credits: number; count: number }>();
  for (const c of filtered) {
    const key = `${c.course_prefix} ${c.course_number}`;
    const existing = courseMap.get(key);
    if (existing) {
      existing.count++;
    } else {
      courseMap.set(key, { number: c.course_number, title: c.course_title, credits: c.credits, count: 1 });
    }
  }
  const sortedCourses = [...courseMap.values()].sort((a, b) => b.count - a.count);
  const primaryCourse = sortedCourses[0];

  const term = termLabel(resolvedTerm);
  let title: string;
  let description: string;

  if (uniqueCourses === 1 && primaryCourse) {
    // Single-course prefix: include full course name in the title so the page
    // matches queries like "SDV 100 college success skills danville community college".
    const creditStr = `${primaryCourse.credits} ${primaryCourse.credits === 1 ? "credit" : "credits"}`;
    title = `${prefix} ${primaryCourse.number}: ${primaryCourse.title} at ${institution.name} — ${term}`;
    description = `${prefix} ${primaryCourse.number} (${primaryCourse.title}, ${creditStr}) at ${institution.name} for ${term}. ${filtered.length} section${filtered.length !== 1 ? "s" : ""}${onlineCount > 0 ? `, ${onlineCount} online` : ""}. View schedule, instructors, and prerequisites.`;
  } else {
    // Multi-course prefix: keep the generic title but enumerate course codes and
    // names in the description so SERP snippets surface the specific course the
    // searcher is looking for.
    const courseSnippet = sortedCourses
      .slice(0, 3)
      .map((c) => `${prefix} ${c.number} (${c.title})`)
      .join(", ");
    const andMore = uniqueCourses > 3 ? `, and ${uniqueCourses - 3} more` : "";
    title = `${subject} Courses at ${institution.name} — ${term} Schedule`;
    description = `Browse ${courseSnippet}${andMore} at ${institution.name} for ${term}. ${filtered.length} section${filtered.length !== 1 ? "s" : ""}${onlineCount > 0 ? `, ${onlineCount} online` : ""}. View schedules, instructors, and prerequisites.`;
  }

  return {
    title,
    description,
    keywords: [
      `${subject} courses ${institution.name}`,
      `${prefix} classes ${config.name}`,
      `${institution.name} ${subject.toLowerCase()} schedule`,
      `${subject.toLowerCase()} community college ${config.name}`,
      ...config.branding.metaKeywords,
    ],
    alternates: {
      canonical: `/${state}/college/${id}/courses/${rawPrefix}`,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function SubjectPage(props: PageProps) {
  const { state, id, prefix: rawPrefix } = await props.params;
  const prefix = rawPrefix.toUpperCase();
  const config = requireStateConfig(state);
  const institutions = loadInstitutions(state);
  const institution = institutions.find((i) => i.id === id);

  if (!institution) notFound();

  // Discover which terms have data for this subject at this college via a
  // targeted `SELECT term` query (~hundreds of rows). Cheap enough to run on
  // every render, avoids loading every term's full catalog upfront.
  const termsWithData = await getTermsWithDataForCollegeSubject(
    institution.college_slug,
    prefix,
    state
  );

  if (termsWithData.length === 0) notFound();

  // Default term = most-recent term with data for this subject at this college.
  const preferredTerm = await getCurrentTerm(state);
  const defaultTerm = termsWithData.includes(preferredTerm)
    ? preferredTerm
    : termsWithData[termsWithData.length - 1];

  // Load ONLY the default term's full catalog for this college. Other terms
  // are lazy-loaded client-side via the `/api/[state]/college/[id]/courses/
  // [prefix]?term=...` route when the user switches, keeping cold ISR
  // latency bounded to a single-term round trip.
  const defaultTermFullCourses = await loadCoursesForCollege(
    institution.college_slug,
    defaultTerm,
    state
  );
  const defaultCoursesFull = defaultTermFullCourses.filter(
    (c) => c.course_prefix === prefix
  );
  const defaultCourses = trimCoursesForClient(defaultCoursesFull);

  // Build URL templates for every term up front — no DB work, just string
  // formatting via the state config.
  const courseListingUrlByTerm: Record<string, string> = {};
  for (const t of termsWithData) {
    courseListingUrlByTerm[t] = config.courseDiscoveryUrl(
      institution.college_slug,
      "__PREFIX__",
      "__NUMBER__",
      t
    );
  }

  // Transfer lookup is scoped to the default term's courses. When the client
  // switches terms, the API route returns a fresh lookup filtered to that
  // term's courses. Targeted Supabase query — avoids loading the full state
  // transfer catalog just to discard 99% of it.
  const defaultTransferLookup = await buildTransferLookupForCourses(
    defaultCoursesFull,
    state
  );

  const subject = subjectName(prefix);
  const uniqueCoursesForJsonLd = [
    ...new Set(
      defaultCourses.map((c) => `${c.course_prefix} ${c.course_number}`)
    ),
  ].sort();

  // All subjects at this college for the "Browse Other Subjects" links.
  // Reuses the default term's full course list we already loaded above.
  const allSubjects = getUniqueSubjects(defaultTermFullCourses);

  // Structured data — reflects the default term the page prerenders with.
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://communitycollegepath.com";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${subject} Courses at ${institution.name}`,
    description: `${defaultCourses.length} ${subject} sections available for ${termLabel(defaultTerm)}`,
    numberOfItems: defaultCourses.length,
    url: `${siteUrl}/${state}/college/${id}/courses/${rawPrefix}`,
    itemListElement: uniqueCoursesForJsonLd.slice(0, 20).map((code, i) => {
      const sample = defaultCourses.find(
        (c) => `${c.course_prefix} ${c.course_number}` === code
      )!;
      return {
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "Course",
          name: `${code}: ${sample.course_title}`,
          provider: {
            "@type": "EducationalOrganization",
            name: institution.name,
          },
          courseCode: code,
          ...(sample.credits > 0 && {
            numberOfCredits: {
              "@type": "StructuredValue",
              value: sample.credits,
            },
          }),
        },
      };
    }),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: config.branding.siteName,
        item: `${siteUrl}/${state}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: institution.name,
        item: `${siteUrl}/${state}/college/${id}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${subject} Courses`,
        item: `${siteUrl}/${state}/college/${id}/courses/${rawPrefix}`,
      },
    ],
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <TrackView
        event="subject_page_view"
        params={{
          state,
          college: id,
          subject: prefix,
          sections: defaultCourses.length,
          scope: "college",
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }}
      />

      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400 mb-4 flex-wrap">
        <Link
          href={`/${state}`}
          className="text-teal-600 hover:text-teal-700"
        >
          {config.name}
        </Link>
        <span>/</span>
        <Link
          href={`/${state}/college/${id}`}
          className="text-teal-600 hover:text-teal-700"
        >
          {institution.name}
        </Link>
        <span>/</span>
        <span className="text-gray-900 dark:text-slate-100 font-medium">
          {subject}
        </span>
      </nav>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          {subject} Courses at {institution.name}
        </h1>
      </div>

      {/* Term-scoped content (stats bar, term picker, course table) */}
      <SubjectTermSection
        defaultTerm={defaultTerm}
        defaultCourses={defaultCourses}
        defaultTransferLookup={defaultTransferLookup}
        termsWithData={termsWithData}
        courseListingUrlByTerm={courseListingUrlByTerm}
        institution={institution}
        systemName={config.systemName}
        state={state}
        collegeId={id}
        prefix={prefix}
      />

      {/* In-content ad */}
      <div className="mt-8">
        <AdUnit slot="9402617538" format="auto" className="min-h-[100px]" />
      </div>

      {/* Browse other subjects */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-slate-100 mb-3">
          Browse Other Subjects at {institution.name}
        </h2>
        <div className="flex flex-wrap gap-2">
          {allSubjects
            .filter((s) => s !== prefix)
            .map((s) => (
              <Link
                key={s}
                href={`/${state}/college/${id}/courses/${s.toLowerCase()}`}
                className="inline-block rounded-md bg-gray-100 dark:bg-slate-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-slate-300 hover:bg-teal-100 dark:hover:bg-teal-900/40 hover:text-teal-700 dark:hover:text-teal-400 transition-colors"
              >
                {subjectName(s)} ({s})
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
