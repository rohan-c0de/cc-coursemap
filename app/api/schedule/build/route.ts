import { NextResponse } from "next/server";
import type { ScheduleRequest } from "@/lib/types";
import { generateSchedules } from "@/lib/schedule";
import institutionsData from "@/data/institutions.json";
import type { Institution } from "@/lib/types";

const institutions = institutionsData as Institution[];

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Validate required fields
    if (
      !body.subjects ||
      !Array.isArray(body.subjects) ||
      body.subjects.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one subject is required." },
        { status: 400 }
      );
    }

    if (
      !body.daysAvailable ||
      !Array.isArray(body.daysAvailable) ||
      body.daysAvailable.length === 0
    ) {
      return NextResponse.json(
        { error: "At least one available day is required." },
        { status: 400 }
      );
    }

    const maxCourses = body.maxCourses || 2;
    if (![1, 2, 3].includes(maxCourses)) {
      return NextResponse.json(
        { error: "maxCourses must be 1, 2, or 3." },
        { status: 400 }
      );
    }

    const request: ScheduleRequest = {
      subjects: body.subjects.map((s: string) => s.trim()).filter(Boolean),
      daysAvailable: body.daysAvailable,
      timeWindowStart: body.timeWindowStart || "morning",
      timeWindowEnd: body.timeWindowEnd || "evening",
      maxCourses: maxCourses as 1 | 2 | 3,
      zip: body.zip || undefined,
      maxDistance: body.maxDistance || undefined,
      mode: body.mode || "any",
      minBreakMinutes: body.minBreakMinutes ?? 0,
    };

    const result = generateSchedules(request, institutions);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Schedule build error:", error);
    return NextResponse.json(
      { error: "Failed to generate schedules." },
      { status: 500 }
    );
  }
}
