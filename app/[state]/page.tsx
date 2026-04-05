import type { Metadata } from "next";
import SeniorBanner from "@/components/SeniorBanner";
import SearchForm from "@/components/SearchForm";
import StartingSoonCallout from "@/components/StartingSoonCallout";
import NotifyBanner from "@/components/NotifyBanner";
import { getNextTerm } from "@/lib/terms";
import { getStateConfig } from "@/lib/states/registry";

type Props = {
  params: Promise<{ state: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state } = await params;
  const config = getStateConfig(state);
  const b = config.branding;
  return {
    title: `${b.siteName} — Community College Course Finder`,
    description: b.tagline,
    keywords: b.metaKeywords,
  };
}

export default async function HomePage({ params }: Props) {
  const { state } = await params;
  const config = getStateConfig(state);
  const nextTerm = await getNextTerm(state);

  return (
    <div>
      {/* Search section */}
      <section id="search" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-slate-100 mb-4">
            Find {config.name} Community College Courses
          </h1>
          <p className="text-lg text-gray-600 dark:text-slate-400 mb-8">
            Search by zip code to find nearby {config.systemName} colleges,
            browse courses, check transfer equivalencies, and build your
            schedule.
          </p>
          <SearchForm state={state} />
          <StartingSoonCallout state={state} />
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-slate-800">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                Find a College
              </h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Enter your zip code to find nearby community colleges. Browse
                courses, check transfer info, and compare schedules.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                Choose a Course
              </h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Browse current course listings with schedules, locations, and
                delivery modes. Filter by subject, day, or format.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-slate-100 mb-2">
                Enroll or Audit
              </h3>
              <p className="text-gray-600 dark:text-slate-400 text-sm">
                Enroll for credit, or audit without grades. We provide
                college-specific steps, contacts, and email templates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Senior waiver banner — secondary position */}
      {config.seniorWaiver && (
        <SeniorBanner
          bannerTitle={config.seniorWaiver.bannerTitle}
          bannerSummary={config.seniorWaiver.bannerSummary}
          bannerDetail={config.seniorWaiver.bannerDetail}
        />
      )}

      {/* Notify banner */}
      <section className="px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-2xl mx-auto">
          <NotifyBanner nextTerm={nextTerm.label} state={state} />
        </div>
      </section>

      {/* What is auditing */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100 mb-6">
            What is Course Auditing?
          </h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-slate-400">
              Auditing a college course means attending classes without receiving
              a grade or academic credit. You get to learn the material,
              participate in lectures, and engage with the subject — without
              exams, homework pressure, or GPA impact.
            </p>
            <p className="text-gray-600 dark:text-slate-400">
              {config.name}&apos;s {config.collegeCount} community colleges (the{" "}
              {config.systemName} system) generally allow community members to
              audit courses, though policies vary by college. Most require you to
              complete an admission application and submit an audit request form
              during the add/drop period.
            </p>
            {config.seniorWaiver && (
              <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800 rounded-lg p-4 mt-6">
                <h3 className="font-semibold text-teal-900 dark:text-teal-200 mb-2">
                  {config.name} {config.seniorWaiver.ageThreshold}+ Tuition
                  Waiver
                </h3>
                <p className="text-teal-800 dark:text-teal-300 text-sm">
                  {config.seniorWaiver.legalCitation} provides a tuition waiver
                  for {config.name} residents aged{" "}
                  {config.seniorWaiver.ageThreshold} and older at{" "}
                  {config.systemName} colleges. This may make auditing free — but
                  whether the waiver applies specifically to audit enrollment
                  varies by college. We flag this on every college page and link
                  to the source so you can verify.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
