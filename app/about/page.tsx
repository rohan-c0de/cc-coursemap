import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Course Auditing — AuditMap Virginia",
  description:
    "Learn what course auditing is, how it works at Virginia community colleges, and whether you're eligible.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/"
        className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block"
      >
        &larr; Back to search
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        About Course Auditing
      </h1>

      <div className="space-y-8">
        {/* What is auditing */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            What is Course Auditing?
          </h2>
          <p className="text-gray-600 mb-3">
            Auditing a college course means attending classes without receiving a
            grade or academic credit. You participate in lectures, follow the
            material, and learn alongside enrolled students — but without exams,
            graded assignments, or GPA impact.
          </p>
          <p className="text-gray-600">
            It&apos;s a way to explore subjects you&apos;re curious about, build
            skills for a career change, preview a program before committing, or
            simply learn something new.
          </p>
        </section>

        {/* Who is it for */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Who Audits Courses?
          </h2>
          <ul className="text-gray-600 space-y-2">
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold shrink-0">-</span>
              <span>
                <strong>Career explorers</strong> — testing a field before
                committing to a degree or certificate
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold shrink-0">-</span>
              <span>
                <strong>Lifelong learners</strong> — pursuing interests in
                history, art, science, or any subject
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold shrink-0">-</span>
              <span>
                <strong>Professionals</strong> — brushing up on skills or
                learning adjacent topics without needing credits
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold shrink-0">-</span>
              <span>
                <strong>Students</strong> — previewing a challenging course
                before taking it for credit
              </span>
            </li>
            <li className="flex gap-2">
              <span className="text-teal-600 font-bold shrink-0">-</span>
              <span>
                <strong>Retirees and seniors</strong> — Virginia residents 60+
                may qualify for free tuition under state law
              </span>
            </li>
          </ul>
        </section>

        {/* How it works in Virginia */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            How It Works at Virginia Community Colleges
          </h2>
          <p className="text-gray-600 mb-4">
            Virginia&apos;s 23 community colleges (the VCCS system) generally
            allow course auditing, though policies vary by college. The typical
            process:
          </p>
          <ol className="space-y-3">
            {[
              "Apply for admission at the college (even auditors need to be in the system)",
              "Browse available courses and pick the one you want to audit",
              "Submit a Course Audit Request form during the add/drop period",
              "Get instructor approval — some courses require a signature or email confirmation",
              "Attend classes and participate (no exams or grades)",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">
                  {i + 1}
                </span>
                <span className="text-gray-600 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Cost */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            What Does It Cost?
          </h2>
          <p className="text-gray-600 mb-3">
            At most VCCS colleges, audit students pay the same tuition and fees
            as credit students — typically around $165 per credit hour for
            Virginia residents. A 3-credit course would cost roughly $495.
          </p>
          <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
            <h3 className="font-semibold text-teal-900 mb-1">
              Virginia 60+ Tuition Waiver
            </h3>
            <p className="text-teal-800 text-sm">
              Virginia Code 23.1-638 provides a tuition waiver for Virginia
              residents aged 60 and older at public colleges. This may make
              auditing free or significantly reduced — but whether it applies
              specifically to audit enrollment varies by college. We flag this on
              every college page with links to verify.
            </p>
          </div>
        </section>

        {/* Important notes */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            Things to Know
          </h2>
          <ul className="text-gray-600 space-y-2 list-disc list-inside">
            <li>
              Audited courses do not count toward a degree or appear on your
              transcript with a grade (you may receive an &quot;AU&quot; notation)
            </li>
            <li>
              Financial aid typically cannot be applied to audited courses
            </li>
            <li>
              Some courses (labs, clinicals, studios) may not be available for
              auditing
            </li>
            <li>
              You usually cannot switch from audit to credit (or vice versa)
              after the add/drop period
            </li>
            <li>
              Audit seats are subject to availability — credit-seeking students
              get priority
            </li>
          </ul>
        </section>

        {/* About this site */}
        <section className="border-t border-gray-200 pt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-3">
            About AuditMap Virginia
          </h2>
          <p className="text-gray-600 mb-3">
            AuditMap Virginia is a free tool that helps you find and navigate
            course auditing opportunities at Virginia community colleges. We
            aggregate course listings from the VCCS system and pair them with
            manually researched audit policies for each college.
          </p>
          <p className="text-gray-600 mb-3">
            Every audit policy on this site includes a &quot;last verified&quot;
            date and a link to the source. Policies can change, so always
            confirm directly with the college before enrolling.
          </p>
          <p className="text-sm text-gray-400">
            AuditMap Virginia is not affiliated with VCCS or any individual
            college.
          </p>
        </section>
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors"
        >
          Find Colleges Near You
        </Link>
      </div>
    </div>
  );
}
