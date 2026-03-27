import { Suspense } from "react";
import ResultsContent from "./ResultsContent";

export const metadata = {
  title: "Search Results — AuditMap Virginia",
  description: "Community colleges near you that offer course auditing.",
};

export default function ResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="grid lg:grid-cols-2 gap-8 mt-8">
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-gray-200 rounded-lg" />
                ))}
              </div>
              <div className="h-[500px] bg-gray-200 rounded-lg" />
            </div>
          </div>
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
