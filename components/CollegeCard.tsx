import Link from "next/link";
import type { Institution } from "@/lib/types";

interface CollegeCardProps {
  institution: Institution;
  distance: number;
  courseCount: number;
  state: string;
}

export default function CollegeCard({
  institution,
  distance,
  courseCount,
  state,
}: CollegeCardProps) {
  const { audit_policy } = institution;
  const allowed = audit_policy.allowed;

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-lg sm:p-6">
      {/* Header */}
      <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-teal-700">
            {institution.name}
          </h3>
          <p className="text-sm text-gray-500">
            {distance.toFixed(1)} miles away
          </p>
        </div>

        {/* Status badge */}
        {allowed === true ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Auditing Available
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-200">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Contact to Confirm
          </span>
        )}
      </div>

      {/* Cost summary */}
      <div className="mb-4 rounded-lg bg-gray-50 px-4 py-3">
        <p className="text-sm text-gray-700">
          {audit_policy.eligibility.senior_discount.available ? (
            <>
              <span className="font-semibold text-teal-700">
                Free for {audit_policy.eligibility.senior_discount.age_threshold}+
              </span>
              {audit_policy.cost_note && (
                <span className="text-gray-500"> · {audit_policy.cost_note}</span>
              )}
            </>
          ) : (
            <span>{audit_policy.cost_note || "Contact for pricing details"}</span>
          )}
        </p>
      </div>

      {/* Course count + link */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-700">{courseCount}</span>{" "}
          {courseCount === 1 ? "course" : "courses"} this term
        </p>
        <Link
          href={`/${state}/college/${institution.id}`}
          className="inline-flex items-center text-sm font-semibold text-teal-600 transition hover:text-teal-800"
        >
          Browse Courses
          <svg
            className="ml-1 h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
      </div>
    </div>
  );
}
