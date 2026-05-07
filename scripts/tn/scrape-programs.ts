/**
 * scrape-programs.ts — scrape degree/program requirements for Tennessee
 * community colleges from Acalog catalogs.
 *
 * TBR colleges share a common course numbering system. Pellissippi State
 * is used as the authoritative catalog source (same pattern as the prereq
 * scraper). Other TN colleges with Acalog catalogs can be added below.
 *
 * Usage:
 *   npx tsx scripts/tn/scrape-programs.ts
 *   npx tsx scripts/tn/scrape-programs.ts --college pstcc
 */

import * as fs from "fs";
import * as path from "path";
import { scrapeAcalogPrograms } from "../lib/scrape-acalog-programs.js";
import { applyProgramMatching } from "../../lib/programs/matcher.js";
import type { AcalogProgramConfig } from "../lib/scrape-acalog-programs.js";

const COLLEGES: AcalogProgramConfig[] = [
  {
    collegeSlug: "pstcc",
    baseUrl: "https://catalog.pstcc.edu",
    catoidFallback: 20,
    programNavoids: [1127, 1140, 1132],
    autoDiscoverCatoid: false,
  },
];

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

  const outDir = path.join(process.cwd(), "data", "tn", "programs");
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`TN program scraper — ${colleges.length} college(s)\n`);

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

      const { matched, unmatched } = applyProgramMatching(data.programs);
      console.log(
        `  Matcher: ${matched} matched to registry slugs, ${unmatched} unmatched`,
      );

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
