import type { Metadata } from "next";
import ScheduleClient from "./ScheduleClient";

export const metadata: Metadata = {
  title: "Smart Schedule Builder — AuditMap Virginia",
  description:
    "Build conflict-free course schedules across all 23 Virginia community colleges. Set your constraints and get personalized schedule suggestions.",
};

export default function SchedulePage() {
  return <ScheduleClient />;
}
