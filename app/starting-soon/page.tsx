import Link from "next/link";
import type { Metadata } from "next";
import StartingSoonClient from "./StartingSoonClient";

export const metadata: Metadata = {
  title: "Courses Starting Soon — Late-Start Classes | AuditMap Virginia",
  description:
    "Find late-start courses, mini-sessions, and upcoming classes across all 23 Virginia community colleges. Don't miss registration deadlines.",
};

export default function StartingSoonPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link
        href="/"
        className="text-sm text-teal-600 hover:text-teal-700 mb-6 inline-block"
      >
        &larr; Back to search
      </Link>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        Courses Starting Soon
      </h1>
      <p className="text-gray-600 mb-8">
        Late-start courses, mini-sessions, and upcoming classes across all 23
        Virginia community colleges. Find sections still open for registration.
      </p>

      <StartingSoonClient />
    </div>
  );
}
