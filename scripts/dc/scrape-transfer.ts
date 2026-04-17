/**
 * scrape-transfer.ts
 *
 * Scrapes transfer equivalency data for UDC Community College (DC's only
 * community college program, part of the University of the District of
 * Columbia) from CollegeTransfer.Net's public OData v2 API.
 *
 * DC has no state-run articulation system (no ARTSYS-equivalent).
 * UDC is registered as institution #990 in the CollegeTransfer.Net
 * database and exposes ~1,400+ outgoing equivalencies to 4-year
 * universities across the country. UDC-CC uses the same course catalog
 * as the broader UDC (lower-division is shared), so these equivalencies
 * apply to UDC-CC students too.
 *
 * Strategy (simpler than the PA scraper — only one source institution):
 *   1. Page through `/Equivalencies?$filter=SourceInstitutionId eq 990`
 *      until exhausted
 *   2. Shape each row into the TransferMapping format used by the rest
 *      of the codebase
 *   3. Write to data/dc/transfer-equiv.json and import to Supabase
 *
 * Usage:
 *   npx tsx scripts/dc/scrape-transfer.ts
 *   npx tsx scripts/dc/scrape-transfer.ts --no-import    # skip Supabase
 */

import fs from "fs";
import path from "path";
import { importTransfersToSupabase } from "../lib/supabase-import.js";

// ---------------------------------------------------------------------------
// Types — match the shape in scripts/lib/scrape-collegetransfer.ts
// ---------------------------------------------------------------------------

interface TransferMapping {
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

interface ODataCourse {
  Prefix: string;
  Number: string;
  Title: string;
  Credits?: string;
}

interface ODataEquivalency {
  EquivalencyId: number;
  SourceInstitutionId: number;
  SourceInstitutionName: string;
  TargetInstitutionId: number;
  TargetInstitutionName: string;
  DoesNotTransfer: boolean;
  Notes: string | null;
  SourceCourses: ODataCourse[];
  TargetCourses: ODataCourse[];
}

interface ODataResponse {
  value: ODataEquivalency[];
  "odata.nextLink"?: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BASE_URL = "https://courseatlasservices.azurewebsites.net/odata/v2";
const API_KEY =
  process.env.COLLEGETRANSFER_API_KEY ||
  "bc923312-6f95-4340-8eed-c89bd576521c";
const UDC_INSTITUTION_ID = 990; // University of the District of Columbia
const PAGE_SIZE = 100;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Best-effort slug from a full university name. Mirrors the convention
 * used elsewhere in the codebase (lowercase, hyphenated, strip punctuation).
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/**
 * Heuristic: target course number ending in `XXX`, `XX`, or `X` or titled
 * "Elective"/"transfer credit" is an elective-only equivalency.
 */
function isElectiveCourse(course: ODataCourse): boolean {
  const num = (course.Number || "").toUpperCase();
  const title = (course.Title || "").toLowerCase();
  if (/X{2,}$/.test(num)) return true;
  if (/^(elective|transfer\s+credit|general\s+elective)/.test(title)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Main scrape
// ---------------------------------------------------------------------------

async function scrapeAllUdcEquivalencies(): Promise<TransferMapping[]> {
  const mappings: TransferMapping[] = [];
  let skip = 0;
  let total = 0;
  let skippedCombos = 0;
  let skippedEmpty = 0;

  console.log(
    `\nPaging /Equivalencies?SourceInstitutionId=${UDC_INSTITUTION_ID} at ${PAGE_SIZE}/page...`
  );

  while (true) {
    const params = new URLSearchParams({
      $format: "json",
      apikey: API_KEY,
      $filter: `SourceInstitutionId eq ${UDC_INSTITUTION_ID}`,
      $expand: "SourceCourses,TargetCourses",
      $top: String(PAGE_SIZE),
      $skip: String(skip),
    });

    const url = `${BASE_URL}/Equivalencies?${params}`;
    const resp = await fetch(url);

    if (!resp.ok) {
      throw new Error(`OData API HTTP ${resp.status}: ${resp.statusText}`);
    }

    const data: ODataResponse = await resp.json();
    const batch = data.value;
    if (batch.length === 0) break;

    total += batch.length;
    process.stdout.write(`  page ${skip / PAGE_SIZE + 1}: +${batch.length} (total ${total})\r`);

    for (const eq of batch) {
      const sources = eq.SourceCourses || [];
      const targets = eq.TargetCourses || [];

      // Skip combo courses (multiple source courses required together) —
      // matches behavior in shared `scrape-collegetransfer.ts`.
      if (sources.length > 1) {
        skippedCombos++;
        continue;
      }
      if (sources.length === 0 || targets.length === 0) {
        skippedEmpty++;
        continue;
      }

      const src = sources[0];
      const ccPrefix = src.Prefix?.trim() || "";
      const ccNumber = src.Number?.trim() || "";
      const ccTitle = src.Title?.trim() || "";
      if (!ccPrefix || !ccNumber) continue;

      const tgt = targets[0];
      const univCourse = `${tgt.Prefix} ${tgt.Number}`.trim();
      const univTitle = tgt.Title?.trim() || "";
      const univCredits = tgt.Credits?.trim() || "";

      const noCredit = eq.DoesNotTransfer === true;
      const isElective = !noCredit && isElectiveCourse(tgt);

      let notes = eq.Notes?.trim() || "";
      if (targets.length > 1) {
        const additional = targets
          .slice(1)
          .map((t) => `${t.Prefix} ${t.Number}`)
          .join(", ");
        notes = notes
          ? `${notes}; Also awards: ${additional}`
          : `Also awards: ${additional}`;
      }

      mappings.push({
        state: "dc",
        cc_prefix: ccPrefix,
        cc_number: ccNumber,
        cc_course: `${ccPrefix} ${ccNumber}`,
        cc_title: ccTitle,
        cc_credits: src.Credits?.trim() || "",
        university: slugify(eq.TargetInstitutionName),
        university_name: eq.TargetInstitutionName,
        univ_course: univCourse,
        univ_title: univTitle,
        univ_credits: univCredits,
        notes,
        no_credit: noCredit,
        is_elective: isElective,
      });
    }

    if (batch.length < PAGE_SIZE) break; // last page
    skip += PAGE_SIZE;
    await sleep(200); // Rate limit: courteous pacing against a public API
  }

  console.log(
    `\n  Total rows fetched: ${total} · skipped-combos: ${skippedCombos} · skipped-empty: ${skippedEmpty}`
  );
  return mappings;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const skipImport = args.includes("--no-import");

  console.log("CollegeTransfer.Net — DC (UDC-CC) Transfer Scraper");

  const mappings = await scrapeAllUdcEquivalencies();

  const transferable = mappings.filter((m) => !m.no_credit);
  const directCount = transferable.filter((m) => !m.is_elective).length;
  const electiveCount = transferable.filter((m) => m.is_elective).length;

  // Summary by target university
  const byUniv = new Map<string, number>();
  for (const m of transferable) {
    byUniv.set(m.university_name, (byUniv.get(m.university_name) || 0) + 1);
  }
  const topUnivs = Array.from(byUniv.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  console.log("\n=== Summary ===");
  console.log(`  Total mappings: ${mappings.length}`);
  console.log(`  Transferable: ${transferable.length}`);
  console.log(`    Direct equivalencies: ${directCount}`);
  console.log(`    Elective credit: ${electiveCount}`);
  console.log(`  No transfer: ${mappings.filter((m) => m.no_credit).length}`);
  console.log(`  Unique target universities: ${byUniv.size}`);
  console.log("\n  Top targets:");
  for (const [univ, count] of topUnivs) {
    console.log(`    ${univ}: ${count}`);
  }

  // Spot checks
  const eng101 = transferable.find(
    (m) => m.cc_prefix === "ENG" && m.cc_number === "101"
  );
  if (eng101) {
    console.log(
      `\n  Spot check — ENG 101 → ${eng101.university_name}: ${eng101.univ_course} (${eng101.univ_title})`
    );
  }

  if (transferable.length === 0) {
    console.error("\nNo transferable mappings found. Aborting.");
    process.exit(1);
  }

  // Write output
  const outPath = path.join(
    process.cwd(),
    "data",
    "dc",
    "transfer-equiv.json"
  );
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(mappings, null, 2) + "\n");
  console.log(`\nSaved ${mappings.length} mappings → ${outPath}`);

  // Import to Supabase
  if (!skipImport) {
    try {
      const imported = await importTransfersToSupabase("dc");
      if (imported > 0) {
        console.log(`Imported ${imported} rows to Supabase`);
      }
    } catch (err) {
      console.log(`Supabase import skipped: ${(err as Error).message}`);
    }
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
