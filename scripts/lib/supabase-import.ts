/**
 * Shared Supabase import utilities for course scrapers.
 *
 * After scraping course data to JSON files, call `importCoursesToSupabase()`
 * to push the data into the live Supabase database — avoiding the manual
 * "forgot to run import-courses.ts" problem.
 *
 * Usage from any scraper:
 *   import { importCoursesToSupabase } from "../lib/supabase-import";
 *   // ... after writing JSON files ...
 *   await importCoursesToSupabase("nc");
 */

import * as fs from "fs";
import * as path from "path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { loadEnv } from "./load-env";

const BATCH_SIZE = 500;

function getSupabase(): SupabaseClient {
  loadEnv();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
    );
  }
  return createClient(url, key);
}

// ---------------------------------------------------------------------------
// Course import
// ---------------------------------------------------------------------------

interface CourseRow {
  state: string;
  college_code: string;
  term: string;
  course_prefix: string;
  course_number: string;
  course_title: string;
  credits: number;
  crn: string;
  days: string;
  start_time: string;
  end_time: string;
  start_date: string | null;
  location: string;
  campus: string;
  mode: string;
  instructor: string | null;
  seats_open: number | null;
  seats_total: number | null;
  prerequisite_text: string | null;
  prerequisite_courses: string[];
}

/**
 * Import all course JSON files for a state into Supabase.
 * Reads from data/{state}/courses/{slug}/{term}.json and upserts into the
 * `courses` table (delete-then-insert per college+term).
 */
export async function importCoursesToSupabase(state: string): Promise<number> {
  let sb: SupabaseClient;
  try {
    sb = getSupabase();
  } catch (e) {
    console.log(`\n  Supabase import skipped: ${(e as Error).message}`);
    return 0;
  }

  const coursesDir = path.join(process.cwd(), "data", state, "courses");
  if (!fs.existsSync(coursesDir)) {
    console.log(`  No courses directory for ${state}, skipping import.`);
    return 0;
  }

  const collegeSlugs = fs.readdirSync(coursesDir).filter((s) => {
    return fs.statSync(path.join(coursesDir, s)).isDirectory();
  });

  console.log(
    `\nImporting ${state.toUpperCase()} into Supabase: ${collegeSlugs.length} college(s)`
  );

  let totalInserted = 0;

  for (const slug of collegeSlugs) {
    const collegeDir = path.join(coursesDir, slug);
    const termFiles = fs
      .readdirSync(collegeDir)
      .filter((f) => f.endsWith(".json"));

    for (const file of termFiles) {
      const term = file.replace(".json", "");
      const filePath = path.join(collegeDir, file);
      const raw = fs.readFileSync(filePath, "utf-8");
      const sections = JSON.parse(raw) as Array<Record<string, unknown>>;

      if (sections.length === 0) continue;

      // Delete existing rows for this (state, college, term)
      const { error: delError } = await sb
        .from("courses")
        .delete()
        .eq("state", state)
        .eq("college_code", slug)
        .eq("term", term);

      if (delError) {
        console.error(`  Error deleting ${slug}/${term}:`, delError.message);
        continue;
      }

      // Prepare rows
      const rows: CourseRow[] = sections.map((s) => ({
        state,
        college_code: (s.college_code as string) || slug,
        term: (s.term as string) || term,
        course_prefix: (s.course_prefix as string) || "",
        course_number: (s.course_number as string) || "",
        course_title: (s.course_title as string) || "",
        credits: (s.credits as number) || 0,
        crn: (s.crn as string) || "",
        days: (s.days as string) || "",
        start_time: (s.start_time as string) || "",
        end_time: (s.end_time as string) || "",
        start_date: (s.start_date as string) || null,
        location: (s.location as string) || "",
        campus: (s.campus as string) || "",
        mode: (s.mode as string) || "in-person",
        instructor: (s.instructor as string) || null,
        seats_open: s.seats_open != null ? (s.seats_open as number) : null,
        seats_total: s.seats_total != null ? (s.seats_total as number) : null,
        prerequisite_text: (s.prerequisite_text as string) || null,
        prerequisite_courses: (s.prerequisite_courses as string[]) || [],
      }));

      // Insert in batches — abort on first failure to limit data loss
      let inserted = 0;
      let aborted = false;
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        const batch = rows.slice(i, i + BATCH_SIZE);
        const { error: insError } = await sb.from("courses").insert(batch);
        if (insError) {
          console.error(
            `  FATAL: Insert failed for ${slug}/${term} batch ${i}: ${insError.message}`
          );
          console.error(
            `  WARNING: ${rows.length - inserted} rows lost — delete already committed.`
          );
          aborted = true;
          break;
        }
        inserted += batch.length;
      }
      if (aborted) {
        console.error(`  Aborting remaining batches for ${slug}/${term}.`);
      }

      totalInserted += inserted;
      console.log(`  ${slug}/${term}: ${inserted} sections`);
    }
  }

  console.log(`  Total for ${state.toUpperCase()}: ${totalInserted} sections`);
  return totalInserted;
}

// ---------------------------------------------------------------------------
// Transfer import
// ---------------------------------------------------------------------------

interface TransferRow {
  state: string;
  cc_prefix: string;
  cc_number: string;
  cc_course: string;
  cc_title: string;
  cc_credits: string;
  university: string;
  university_name: string;
  univ_course: string;
  univ_title: string;
  univ_credits: string;
  notes: string;
  no_credit: boolean;
  is_elective: boolean;
}

/**
 * Import transfer equivalency data for a state into Supabase.
 * Reads from data/{state}/transfer-equiv.json.
 */
export async function importTransfersToSupabase(
  state: string
): Promise<number> {
  let sb: SupabaseClient;
  try {
    sb = getSupabase();
  } catch (e) {
    console.log(`\n  Supabase transfer import skipped: ${(e as Error).message}`);
    return 0;
  }

  const filePath = path.join(
    process.cwd(),
    "data",
    state,
    "transfer-equiv.json"
  );
  if (!fs.existsSync(filePath)) {
    console.log(`  No transfer-equiv.json for ${state}, skipping.`);
    return 0;
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const mappings = JSON.parse(raw) as Array<Record<string, unknown>>;

  // Skip header row if present (cc_prefix === "VCCS" or similar header-like value)
  const data = mappings.filter(
    (m) =>
      m.cc_number !== "Course Number" &&
      m.cc_prefix !== "VCCS" &&
      m.cc_prefix !== "NCCCS" &&
      m.cc_prefix !== "SCTCS"
  );

  if (data.length === 0) {
    console.log(`  No transfer mappings for ${state}.`);
    return 0;
  }

  console.log(
    `\nImporting ${state.toUpperCase()} transfers into Supabase: ${data.length} mappings`
  );

  // Delete existing rows for this state
  const { error: delError } = await sb
    .from("transfers")
    .delete()
    .eq("state", state);

  if (delError) {
    console.error(`  Error deleting ${state} transfers:`, delError.message);
    return 0;
  }

  // Prepare rows
  const rows: TransferRow[] = data.map((m) => ({
    state,
    cc_prefix: (m.cc_prefix as string) || "",
    cc_number: (m.cc_number as string) || "",
    cc_course: (m.cc_course as string) || "",
    cc_title: (m.cc_title as string) || "",
    cc_credits: (m.cc_credits as string) || "",
    university: (m.university as string) || "",
    university_name: (m.university_name as string) || "",
    univ_course: (m.univ_course as string) || "",
    univ_title: (m.univ_title as string) || "",
    univ_credits: (m.univ_credits as string) || "",
    notes: (m.notes as string) || "",
    no_credit: (m.no_credit as boolean) || false,
    is_elective: (m.is_elective as boolean) || false,
  }));

  // Insert in batches — abort on first failure to limit data loss
  let totalInserted = 0;
  let aborted = false;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error: insError } = await sb.from("transfers").insert(batch);
    if (insError) {
      console.error(
        `  FATAL: Insert failed for ${state} transfers batch ${i}: ${insError.message}`
      );
      console.error(
        `  WARNING: ${rows.length - totalInserted} rows lost — delete already committed.`
      );
      aborted = true;
      break;
    }
    totalInserted += batch.length;
  }
  if (aborted) {
    console.error(`  Aborting remaining transfer batches for ${state}.`);
  }

  console.log(`  Total transfers for ${state.toUpperCase()}: ${totalInserted}`);
  return totalInserted;
}
