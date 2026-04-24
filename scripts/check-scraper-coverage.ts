/**
 * Scraper-coverage integrity check (issue #59).
 *
 * For every state in `getAllStates()`:
 *   - If `scrapers` is populated, verify every declared script path exists.
 *   - If `scrapers` is omitted entirely, require a `manual-only:` marker
 *     in the config file explaining why (so the gap is intentional, not
 *     accidental drift).
 *
 * Fails the PR if any slug is silently missing coverage. Same shape as
 * scripts/check-registry-integrity.ts.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { getAllStates, type StateConfig } from "../lib/states/registry";

const ROOT = resolve(__dirname, "..");
const errors: string[] = [];

function err(slug: string, msg: string) {
  errors.push(`[${slug}] ${msg}`);
}

function jobsFromCoverage(cfg: StateConfig): string[] {
  const scrapers = cfg.scrapers;
  if (!scrapers) return [];
  const paths: string[] = [];
  for (const job of scrapers.courses ?? []) paths.push(...job.scripts);
  for (const job of scrapers.transfers ?? []) paths.push(...job.scripts);
  if (Array.isArray(scrapers.prereqs)) {
    for (const job of scrapers.prereqs) paths.push(...job.scripts);
  }
  return paths;
}

for (const cfg of getAllStates()) {
  const { slug } = cfg;
  const configPath = resolve(ROOT, `lib/states/${slug}/config.ts`);
  if (!existsSync(configPath)) {
    err(slug, `lib/states/${slug}/config.ts missing (also caught by check-registry-integrity)`);
    continue;
  }

  const hasScrapers = !!cfg.scrapers;
  if (!hasScrapers) {
    // Omitting `scrapers` is fine if the config is explicit about why.
    const source = readFileSync(configPath, "utf8");
    if (!/manual-only:/i.test(source)) {
      err(
        slug,
        `config has no \`scrapers\` field and no \`manual-only: <reason>\` marker. Either declare scrapers or explain the gap — see issue #59.`
      );
    }
    continue;
  }

  // Script paths must resolve. A typo here silently breaks the unified
  // scheduled-scrape workflow (PR 2) at runtime, so catch it now.
  for (const script of jobsFromCoverage(cfg)) {
    const abs = resolve(ROOT, script);
    if (!existsSync(abs)) {
      err(slug, `declared scraper script "${script}" does not exist`);
    }
  }
}

if (errors.length > 0) {
  console.error("Scraper-coverage check FAILED:\n");
  for (const line of errors) console.error("  " + line);
  console.error(
    `\n${errors.length} issue(s) across ${getAllStates().length} registered state(s).`
  );
  console.error(
    "\nEvery state must either declare `scrapers` in its StateConfig or include a `manual-only:` comment explaining the gap. See issue #59."
  );
  process.exit(1);
}

console.log(
  `Scraper-coverage OK — ${getAllStates().length} states accounted for.`
);
