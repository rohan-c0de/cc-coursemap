"use client";

import { useState } from "react";
import CourseTable from "@/components/CourseTable";
import AuditInstructions from "@/components/AuditInstructions";
import type { Institution, CourseSection } from "@/lib/types";

interface Props {
  courses: CourseSection[];
  institution: Institution;
  sisUrl: string;
}

export default function CollegeDetailClient({
  courses,
  institution,
  sisUrl,
}: Props) {
  const [selectedCourse, setSelectedCourse] = useState<CourseSection | null>(
    null
  );
  const [showInstructions, setShowInstructions] = useState(false);

  return (
    <div>
      <CourseTable
        courses={courses}
        collegeSisUrl={sisUrl}
        onAuditClick={(course) => {
          setSelectedCourse(course);
          setShowInstructions(true);
        }}
      />

      {/* Audit instructions modal */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            <button
              onClick={() => setShowInstructions(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              &times;
            </button>
            <AuditInstructions
              institution={institution}
              course={selectedCourse || undefined}
              defaultOpen={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}
