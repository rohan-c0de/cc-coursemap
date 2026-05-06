/**
 * scrape-programs.ts — scrape degree/program requirements for Virginia
 * community colleges (VCCS) from their individual Acalog catalogs.
 *
 * Not all 23 VCCS colleges use Acalog. This scraper covers the ones that do.
 * Others can be added as their catalog systems are identified.
 *
 * Usage:
 *   npx tsx scripts/va/scrape-programs.ts
 *   npx tsx scripts/va/scrape-programs.ts --college gcc     # single college
 *   npx tsx scripts/va/scrape-programs.ts --limit 5         # smoke test (5 programs per college)
 */

import * as fs from "fs";
import * as path from "path";
import { scrapeAcalogPrograms } from "../lib/scrape-acalog-programs.js";
import { applyProgramMatching } from "../../lib/programs/matcher.js";
import type { AcalogProgramConfig } from "../lib/scrape-acalog-programs.js";

// ---------------------------------------------------------------------------
// VA colleges with confirmed Acalog catalogs
// ---------------------------------------------------------------------------

// VA college Acalog instances use dropdown values for content types, not
// catalog editions, so auto-discovery picks the wrong catoid. Use known values.
const COLLEGES: AcalogProgramConfig[] = [
  {
    collegeSlug: "gcc",
    baseUrl: "https://catalog.germanna.edu",
    catoidFallback: 15,
    programNavoids: [453],
    autoDiscoverCatoid: false,
  },
  {
    collegeSlug: "pvcc",
    baseUrl: "https://catalog.pvcc.edu",
    catoidFallback: 9,
    programNavoids: [1076],
    autoDiscoverCatoid: false,
  },
  {
    collegeSlug: "nova",
    baseUrl: "https://nvcc.catalog.acalog.com",
    catoidFallback: 15,
    programNavoids: [1882],
    autoDiscoverCatoid: false,
  },
  {
    collegeSlug: "mecc",
    baseUrl: "https://catalog.mecc.edu",
    catoidFallback: 6,
    programNavoids: [408],
    autoDiscoverCatoid: false,
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const collegeArg = args
    .find((a) => a.startsWith("--college="))
    ?.split("=")[1]
    || (args.indexOf("--college") >= 0
      ? args[args.indexOf("--college") + 1]
      : null);

  let colleges = COLLEGES;
  if (collegeArg) {
    colleges = COLLEGES.filter((c) => c.collegeSlug === collegeArg);
    if (colleges.length === 0) {
      console.error(
        `Unknown college: ${collegeArg}. Available: ${COLLEGES.map((c) => c.collegeSlug).join(", ")}`,
      );
      process.exit(1);
    }
  }

  const outDir = path.join(process.cwd(), "data", "va", "programs");
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`VA program scraper — ${colleges.length} college(s)\n`);

  let totalPrograms = 0;

  for (const config of colleges) {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Scraping ${config.collegeSlug} (${config.baseUrl})`);
    console.log("=".repeat(60));

    try {
      const data = await scrapeAcalogPrograms(config);

      if (data.programs.length === 0) {
        console.log(`  No programs found for ${config.collegeSlug}, skipping.`);
        continue;
      }

      // Run the program-slug matcher
      const { matched, unmatched } = applyProgramMatching(data.programs);
      console.log(
        `  Matcher: ${matched} matched to registry slugs, ${unmatched} unmatched`,
      );

      // Write output
      const outPath = path.join(outDir, `${config.collegeSlug}.json`);
      fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
      console.log(
        `  ✓ Wrote ${data.programs.length} programs to ${outPath}`,
      );

      totalPrograms += data.programs.length;
    } catch (e) {
      console.error(`  ERROR scraping ${config.collegeSlug}: ${e}`);
    }
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log(`Done. Total: ${totalPrograms} programs across ${colleges.length} college(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
