/**
 * weekly-scrape-diff.ts
 *
 * Compares the freshly-scraped `data/va/courses/**.json` files in the
 * working tree against the versions committed on `HEAD`. Used by the
 * weekly scheduled-scrape workflow (issue #50) to decide whether to open
 * a PR with the new data, or instead open an issue because the scraper
 * probably broke.
 *
 * Exits 0 always; writes a JSON report to stdout:
 *   {
 *     "broken": <boolean>,           // true if any (college,term) dropped >50%
 *     "changed": <number>,           // total files with any diff
 *     "regressions": [               // only populated when broken=true
 *       { "file": "...", "before": 500, "after": 10, "ratio": "2.0%" }
 *     ],
 *     "summary": "human-readable one-liner"
 *   }
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ABORT_RATIO = 0.5;
const ROOT = resolve(__dirname, "..", "..");

interface Regression {
  file: string;
  before: number;
  after: number;
  ratio: string;
}

function sh(cmd: string): string {
  // 64 MB buffer — a single VA (college, term) JSON can exceed the
  // Node default 1 MB limit once a few hundred sections land.
  return execSync(cmd, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function countRows(json: string): number {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function beforeCount(file: string): number {
  try {
    // `git show HEAD:path` — if file didn't exist on HEAD, throws.
    return countRows(sh(`git show HEAD:${file}`));
  } catch {
    return 0;
  }
}

function afterCount(file: string): number {
  const abs = resolve(ROOT, file);
  if (!existsSync(abs)) return 0;
  return countRows(readFileSync(abs, "utf8"));
}

const tracked = sh("git ls-files data/va/courses")
  .trim()
  .split("\n")
  .filter((f) => f.endsWith(".json"));

const untracked = sh("git ls-files --others --exclude-standard data/va/courses")
  .trim()
  .split("\n")
  .filter((f) => f.endsWith(".json"));

const files = Array.from(new Set([...tracked, ...untracked])).filter(Boolean);

const regressions: Regression[] = [];
let changed = 0;

for (const file of files) {
  const before = beforeCount(file);
  const after = afterCount(file);
  if (before === after) continue;
  changed++;

  // First-time-added file (before = 0) cannot regress.
  if (before === 0) continue;

  const ratio = after / before;
  if (ratio < ABORT_RATIO) {
    regressions.push({
      file,
      before,
      after,
      ratio: `${(ratio * 100).toFixed(1)}%`,
    });
  }
}

const broken = regressions.length > 0;
const summary = broken
  ? `ABORT: ${regressions.length} file(s) dropped below ${(ABORT_RATIO * 100).toFixed(0)}% of prior row count.`
  : changed === 0
    ? "No changes — scraper output identical to main."
    : `${changed} file(s) changed; all within acceptable range.`;

console.log(
  JSON.stringify({ broken, changed, regressions, summary }, null, 2)
);
