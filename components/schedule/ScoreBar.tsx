"use client";

import type { ScoreBreakdown } from "@/lib/types";

interface Props {
  breakdown: ScoreBreakdown;
  total: number;
}

const SEGMENTS = [
  { key: "timeCompactness" as const, label: "Compactness", color: "bg-teal-400" },
  { key: "distanceScore" as const, label: "Distance", color: "bg-blue-400" },
  { key: "dayConsolidation" as const, label: "Days", color: "bg-amber-400" },
  { key: "varietyScore" as const, label: "Variety", color: "bg-purple-400" },
] as const;

export default function ScoreBar({ breakdown, total }: Props) {
  return (
    <div className="space-y-1">
      {/* Stacked bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
        {SEGMENTS.map((seg) => {
          const value = breakdown[seg.key];
          const pct = (value / 100) * 100;
          return (
            <div
              key={seg.key}
              className={seg.color}
              style={{ width: `${pct}%` }}
              title={`${seg.label}: ${value}/25`}
            />
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex gap-3 text-[10px] text-gray-500">
        {SEGMENTS.map((seg) => (
          <span key={seg.key} className="flex items-center gap-1">
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${seg.color}`} />
            {seg.label} {breakdown[seg.key]}
          </span>
        ))}
      </div>
    </div>
  );
}
