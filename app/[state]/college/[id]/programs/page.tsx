import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { loadInstitutions } from "@/lib/institutions";
import { requireStateConfig } from "@/lib/states/route-helpers";
import { getAllStates } from "@/lib/states/registry";
import { loadCollegePrograms } from "@/lib/programs/requirements";
import { ProgramList } from "@/components/ProgramRequirements";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 604800; // 7 days

type PageProps = {
  params: Promise<{ state: string; id: string }>;
};

function siteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://communitycollegepath.com"
  );
}

export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { state, id } = await props.params;
  const institutions = loadInstitutions(state);
  const institution = institutions.find((i) => i.id === id);
  if (!institution) return { title: "Not Found" };

  const config = requireStateConfig(state);
  const title = `Degree Programs at ${institution.name} | Community College Path`;
  const description = `Browse degree and certificate programs at ${institution.name}. See requirements, courses, and credits needed for graduation.`;

  return {
    title,
    description,
    alternates: { canonical: `/${state}/college/${id}/programs` },
  };
}

export default async function CollegeProgramsPage(props: PageProps) {
  const { state, id } = await props.params;
  const config = requireStateConfig(state);
  const institutions = loadInstitutions(state);
  const institution = institutions.find((i) => i.id === id);
  if (!institution) notFound();

  const programs = await loadCollegePrograms(
    state,
    institution.college_slug,
  );

  const url = siteUrl();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Breadcrumbs
        siteUrl={url}
        items={[
          { name: "Home", href: "/" },
          { name: config.name, href: `/${state}` },
          { name: institution.name, href: `/${state}/college/${id}` },
          {
            name: "Programs",
            href: `/${state}/college/${id}/programs`,
          },
        ]}
      />

      <header className="mb-8">
        <p className="text-sm font-medium text-teal-600 dark:text-teal-400 mb-1">
          <Link
            href={`/${state}/college/${id}`}
            className="hover:underline"
          >
            {institution.name}
          </Link>
        </p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">
          Degree &amp; Certificate Programs
        </h1>
        {programs.length > 0 ? (
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            {programs.length}{" "}
            {programs.length === 1 ? "program" : "programs"} available.
            Expand any program to see the courses required for graduation.
          </p>
        ) : (
          <p className="text-gray-600 dark:text-slate-400 mt-2">
            Program requirement data is not yet available for{" "}
            {institution.name}. Check back soon or visit the{" "}
            <Link
              href={`/${state}/college/${id}`}
              className="text-teal-600 dark:text-teal-400 hover:underline"
            >
              college page
            </Link>{" "}
            to browse available courses.
          </p>
        )}
      </header>

      {programs.length > 0 && (
        <ProgramList state={state} programs={programs} />
      )}

      <div className="mt-10 pt-6 border-t border-gray-200 dark:border-slate-700">
        <Link
          href={`/${state}/college/${id}`}
          className="text-sm text-teal-600 dark:text-teal-400 hover:underline"
        >
          &larr; Back to {institution.name}
        </Link>
      </div>
    </div>
  );
}
