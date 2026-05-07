/**
 * Server-side data layer for program/degree requirements.
 *
 * Reads from the `programs` table in Supabase (populated by the import
 * pipeline). Falls back to local JSON files when Supabase is unavailable
 * (same pattern as lib/transfer.ts).
 */

import * as fs from "fs";
import * as path from "path";
import { supabase } from "@/lib/supabase";
import { loadInstitutions } from "@/lib/institutions";
import type {
  ProgramRequirement,
  RequirementGroup,
  RequiredCourse,
} from "@/lib/types";
import type { Institution } from "@/lib/types";

// Re-export types for convenience
export type { ProgramRequirement, RequirementGroup, RequiredCourse };

interface ProgramRow {
  title: string;
  credential: string;
  program_code: string | null;
  catalog_url: string;
  total_credits: number | null;
  gpa_minimum: number | null;
  description: string | null;
  matched_program_slug: string | null;
  requirement_groups: RequirementGroup[];
  college_slug: string;
  catalog_year: string;
}

function rowToProgram(row: ProgramRow): ProgramRequirement {
  return {
    title: row.title,
    credential: row.credential as ProgramRequirement["credential"],
    program_code: row.program_code,
    catalog_url: row.catalog_url,
    total_credits: row.total_credits,
    gpa_minimum: row.gpa_minimum,
    description: row.description,
    matched_program_slug: row.matched_program_slug,
    requirement_groups: row.requirement_groups ?? [],
  };
}

/**
 * Load all programs at one college from Supabase, falling back to local JSON.
 */
export async function loadCollegePrograms(
  state: string,
  collegeSlug: string,
): Promise<ProgramRequirement[]> {
  try {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("state", state)
      .eq("college_slug", collegeSlug)
      .order("title");

    if (!error && data && data.length > 0) {
      return data.map(rowToProgram);
    }
  } catch {
    // Supabase unavailable — fall through to local JSON
  }

  return loadCollegeProgramsFromFile(state, collegeSlug);
}

/**
 * Load all colleges offering a given program category.
 * Returns programs grouped by college with institution metadata.
 */
export async function loadProgramAcrossColleges(
  state: string,
  programSlug: string,
): Promise<
  Array<{ college: Institution; programs: ProgramRequirement[] }>
> {
  let rows: ProgramRow[] = [];

  try {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .eq("state", state)
      .eq("matched_program_slug", programSlug)
      .order("college_slug")
      .order("title");

    if (!error && data) {
      rows = data as ProgramRow[];
    }
  } catch {
    // Fall through to local JSON
  }

  if (rows.length === 0) {
    rows = loadProgramsBySlugFromFiles(state, programSlug);
  }

  if (rows.length === 0) return [];

  const institutions = loadInstitutions(state);
  const byCollege = new Map<string, ProgramRow[]>();
  for (const row of rows) {
    const slug = row.college_slug;
    if (!byCollege.has(slug)) byCollege.set(slug, []);
    byCollege.get(slug)!.push(row);
  }

  const results: Array<{
    college: Institution;
    programs: ProgramRequirement[];
  }> = [];

  for (const [slug, collegeRows] of byCollege) {
    const inst = institutions.find(
      (i) => i.college_slug === slug || i.id === slug,
    );
    if (!inst) continue;
    results.push({
      college: inst,
      programs: collegeRows.map(rowToProgram),
    });
  }

  return results.sort((a, b) => a.college.name.localeCompare(b.college.name));
}

// ---------------------------------------------------------------------------
// Local JSON fallbacks
// ---------------------------------------------------------------------------

function loadCollegeProgramsFromFile(
  state: string,
  collegeSlug: string,
): ProgramRequirement[] {
  const filePath = path.join(
    process.cwd(),
    "data",
    state,
    "programs",
    `${collegeSlug}.json`,
  );
  if (!fs.existsSync(filePath)) return [];
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(raw);
    return (data.programs ?? []) as ProgramRequirement[];
  } catch {
    return [];
  }
}

function loadProgramsBySlugFromFiles(
  state: string,
  programSlug: string,
): ProgramRow[] {
  const dir = path.join(process.cwd(), "data", state, "programs");
  if (!fs.existsSync(dir)) return [];

  const rows: ProgramRow[] = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    try {
      const raw = fs.readFileSync(path.join(dir, file), "utf-8");
      const data = JSON.parse(raw);
      const collegeSlug = file.replace(".json", "");
      for (const p of data.programs ?? []) {
        if (p.matched_program_slug === programSlug) {
          rows.push({ ...p, college_slug: collegeSlug, catalog_year: data.catalog_year ?? "" });
        }
      }
    } catch {
      continue;
    }
  }
  return rows;
}
