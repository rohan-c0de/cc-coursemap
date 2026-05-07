/**
 * scrape-courseleaf-programs.ts — shared CourseLeaf program scraper.
 *
 * CourseLeaf catalogs publish a `/programs-study/` index page listing all
 * degrees/certificates offered by a college. Each program has its own
 * detail page (e.g. `/programs-study/accounting/`) that contains one or
 * more award sections (AAS + Career Studies Certificate, etc.) — each with
 * a "Plan of Study Grid" table (`<table class="sc_plangrid">`) covering
 * the recommended semester-by-semester courses.
 *
 * Mirrors the shape of scrape-acalog-programs.ts so it can be invoked by
 * a per-state wrapper script with a list of college configs.
 *
 * Used by:
 *   scripts/va/scrape-courseleaf-programs.ts — Blue Ridge CC (brcc), see #234
 *   scripts/ma/scrape-courseleaf-programs.ts — Mount Wachusett CC (mwcc), see #240
 */

import * as cheerio from "cheerio";
import type {
  CollegePrograms,
  ProgramCredential,
  ProgramRequirement,
  RequiredCourse,
} from "../../lib/types.js";

export interface CourseleafProgramConfig {
  /** Stable college identifier matching `data/{state}/programs/{collegeSlug}.json`. */
  collegeSlug: string;
  /** Catalog root, e.g. https://catalog.brcc.edu (no trailing slash). */
  baseUrl: string;
  /**
   *  Path of the program-list page, default `/programs-study/`.
   *  Override if a college uses a different convention.
   */
  programIndexPath?: string;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const CONCURRENCY = 6;
const DELAY_MS = 80;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function retryFetch(
  url: string,
  label: string,
  attempts = 3,
): Promise<string> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      const u = new URL(url);
      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
          Referer: `${u.protocol}//${u.host}/`,
          "Sec-Fetch-Dest": "document",
          "Sec-Fetch-Mode": "navigate",
          "Sec-Fetch-Site": "same-origin",
          "Upgrade-Insecure-Requests": "1",
        },
      });
      if (res.ok) return res.text();
      if (res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status}`);
      } else {
        return "";
      }
    } catch (e) {
      lastErr = e;
    }
    await sleep(500 * Math.pow(2, i));
  }
  throw new Error(`${label} failed after ${attempts} attempts: ${lastErr}`);
}

async function pmap<T, R>(
  items: T[],
  n: number,
  fn: (item: T, idx: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    while (true) {
      const idx = next++;
      if (idx >= items.length) return;
      try {
        results[idx] = await fn(items[idx], idx);
      } catch (e) {
        console.error(`  pmap[${idx}] error: ${e}`);
        results[idx] = undefined as unknown as R;
      }
      if (DELAY_MS > 0) await sleep(DELAY_MS);
    }
  }
  await Promise.all(Array.from({ length: n }, () => worker()));
  return results;
}

// ---------------------------------------------------------------------------
// Step 1: discover all program detail page paths from the index
// ---------------------------------------------------------------------------

function discoverProgramPaths(
  indexHtml: string,
  programIndexPath: string,
): string[] {
  const $ = cheerio.load(indexHtml);
  const paths = new Set<string>();
  $(`a[href^="${programIndexPath}"]`).each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    if (href === programIndexPath) return;
    if (href === programIndexPath.replace(/\/$/, "")) return;
    if (!href.endsWith("/")) return;
    paths.add(href);
  });
  return Array.from(paths).sort();
}

// ---------------------------------------------------------------------------
// Step 2: classify a credential string into our enum
// ---------------------------------------------------------------------------

function parseCredential(awardText: string): ProgramCredential {
  const t = awardText.toLowerCase();
  if (/applied\s+science/.test(t)) return "AAS";
  if (/associate\s+of\s+arts/.test(t)) return "AA";
  if (/associate\s+of\s+science/.test(t)) return "AS";
  if (/career\s+studies\s+certificate/.test(t)) return "certificate";
  if (/diploma/.test(t)) return "diploma";
  if (/certificate/.test(t)) return "certificate";
  return "other";
}

// ---------------------------------------------------------------------------
// Step 3: parse a single sc_plangrid table into RequiredCourse[]
// ---------------------------------------------------------------------------

interface PlanGridResult {
  courses: RequiredCourse[];
  totalCredits: number | null;
}

function parsePlanGrid(
  $: cheerio.CheerioAPI,
  $table: cheerio.Cheerio<cheerio.AnyNode>,
): PlanGridResult {
  const courses: RequiredCourse[] = [];
  const seen = new Set<string>();
  let totalCredits: number | null = null;

  $table.find("tr").each((_, row) => {
    const $row = $(row);
    const classes = $row.attr("class") || "";

    // Total Credit Hours summary row — sc_plangrid uses "plangridtotal",
    // sc_courselist uses "listsum"
    if (classes.includes("plangridtotal") || classes.includes("listsum")) {
      const hoursText = $row.find("td.hourscol").last().text().trim();
      // Take the upper bound of any range like "60-62"
      const m = hoursText.match(/(\d+)(?:\s*-\s*(\d+))?/);
      if (m) totalCredits = parseInt(m[2] ?? m[1], 10);
      return;
    }
    // Per-semester subtotals, semester/year/area headers — no course
    if (classes.includes("plangridsum")) return;
    if (classes.includes("plangridyear")) return;
    if (classes.includes("areaheader")) return;

    const $code = $row.find("td.codecol").first();
    if (!$code.length) return;

    // Course rows: <a class="bubblelink code">PREFIX NUM</a>
    // Comment / placeholder rows have <span class="comment">…</span> instead
    // of an anchor — those are "Select one of the following:" or generic
    // electives without a concrete course; skip them.
    const $courseLink = $code.find("a.bubblelink.code").first();
    if (!$courseLink.length) return;
    const codeText = $courseLink.text().trim();
    const m = codeText.match(/^([A-Z]{2,5})\s+(\d{3,4}[A-Z]?)/);
    if (!m) return;
    const [, prefix, number] = m;

    // Title can be in td.titlecol (sc_plangrid) or in the second <td>
    // (sc_courselist, where titlecol isn't always set on the td)
    const $title = $row.find("td.titlecol").first().length
      ? $row.find("td.titlecol").first()
      : $code.next("td");
    const titleText = $title
      .clone()
      .children("sup")
      .remove()
      .end()
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const hoursText = $row.find("td.hourscol").first().text().trim();
    const credits = hoursText && /^\d+/.test(hoursText)
      ? parseInt(hoursText, 10)
      : 0;

    const key = `${prefix} ${number}`;
    if (seen.has(key)) return;
    seen.add(key);
    courses.push({
      prefix,
      number,
      title: titleText,
      credits,
      or_alternatives: [],
    });
  });

  return { courses, totalCredits };
}

// ---------------------------------------------------------------------------
// Step 4: parse a program detail page into one or more ProgramRequirements
// ---------------------------------------------------------------------------

function parseProgramPage(
  html: string,
  baseUrl: string,
  programPath: string,
): ProgramRequirement[] {
  const $ = cheerio.load(html);
  const programTitle = $("h1.page-title").first().text().trim();
  if (!programTitle) return [];

  const catalogUrl = new URL(programPath, baseUrl).toString();
  const programs: ProgramRequirement[] = [];

  // Each program detail page can list multiple awards (e.g. AAS + Career
  // Studies Certificate). The structure is:
  //   <p><strong>Award: <credential>...</strong></p>
  //   …
  //   <table class="sc_plangrid"> or <table class="sc_courselist">
  // Sometimes the award strong tag lives outside the textcontainer (for the
  // page's primary award) and sometimes inside it (for additional awards).
  // Walk both lists in document order and pair each award with the next
  // curriculum table that follows it.
  const TABLE_SELECTOR = "table.sc_plangrid, table.sc_courselist";

  // Collect award elements: any inline element whose visible text starts with
  // "Award:". Limit the suffix at the next sentence boundary to avoid pulling
  // in unrelated paragraph content.
  type DocItem = { kind: "award"; line: string; index: number } | {
    kind: "table";
    el: cheerio.AnyNode;
    index: number;
  };
  const items: DocItem[] = [];

  $("strong").each((_, el) => {
    // Replace <br> with a newline so the credential phrase doesn't get
    // glued to the next sub-line ("Major: ...", "Additional Program...").
    const html = $(el).html() ?? "";
    const withBreaks = html.replace(/<br\s*\/?>/gi, "\n");
    const text = cheerio
      .load(`<x>${withBreaks}</x>`)("x")
      .text()
      .replace(/​/g, ""); // zero-width space
    // Take only the first line (everything before the first \n)
    const firstLine = text.split("\n")[0].replace(/\s+/g, " ").trim();
    const m = firstLine.match(/^Award:\s*(.+)$/);
    if (!m) return;
    const line = m[1].trim().replace(/\s*Degree$/i, "");
    // @ts-expect-error cheerio doesn't expose document positions directly,
    // but we can use the DOM-ordered index from $('*').index(el).
    const index = $("*").index(el);
    items.push({ kind: "award", line, index });
  });

  $(TABLE_SELECTOR).each((_, el) => {
    const index = $("*").index(el);
    items.push({ kind: "table", el, index });
  });

  items.sort((a, b) => a.index - b.index);

  // Pair: every table consumes the most recent award seen so far. Once an
  // award is consumed, additional tables before the next award are sub-tables
  // (elective lists, sample schedules per specialization, etc.) — skip them.
  let lastAward = "";
  for (const item of items) {
    if (item.kind === "award") {
      lastAward = item.line;
      continue;
    }
    if (!lastAward) continue;
    const $table = $(item.el);
    const { courses, totalCredits } = parsePlanGrid($, $table);
    if (courses.length === 0) continue;

    const credential = parseCredential(lastAward);
    const suffix = ` — ${lastAward}`;
    const fullTitle = `${programTitle}${suffix}`;

    programs.push({
      title: fullTitle,
      credential,
      program_code: null,
      catalog_url: catalogUrl,
      total_credits: totalCredits,
      gpa_minimum: 2.0,
      description: null,
      requirement_groups: [
        {
          name: "Recommended Course Sequence",
          credits_required: totalCredits,
          choose_n: null,
          courses,
        },
      ],
      matched_program_slug: null,
    });
    // After consuming an award for this table, clear it so a sibling table
    // without its own award doesn't re-use the same credential incorrectly.
    lastAward = "";
  }

  // Some pages have a curriculum table that's not wrapped in a textcontainer.
  // Fall back to scanning the page for any un-claimed table.
  if (programs.length === 0) {
    const $tables = $(TABLE_SELECTOR);
    if ($tables.length > 0) {
      const $first = $tables.first();
      const { courses, totalCredits } = parsePlanGrid($, $first);
      if (courses.length > 0) {
        programs.push({
          title: programTitle,
          credential: "other",
          program_code: null,
          catalog_url: catalogUrl,
          total_credits: totalCredits,
          gpa_minimum: 2.0,
          description: null,
          requirement_groups: [
            {
              name: "Recommended Course Sequence",
              credits_required: totalCredits,
              choose_n: null,
              courses,
            },
          ],
          matched_program_slug: null,
        });
      }
    }
  }

  return programs;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export async function scrapeCourseleafPrograms(
  config: CourseleafProgramConfig,
): Promise<CollegePrograms> {
  const { collegeSlug, baseUrl } = config;
  const programIndexPath = config.programIndexPath ?? "/programs-study/";

  const indexUrl = `${baseUrl}${programIndexPath}`;
  console.log(`  [${collegeSlug}] Discovering programs at ${indexUrl}`);
  const indexHtml = await retryFetch(indexUrl, "program-index");
  const paths = discoverProgramPaths(indexHtml, programIndexPath);
  console.log(`  [${collegeSlug}] Found ${paths.length} program paths`);

  if (paths.length === 0) {
    return {
      college_slug: collegeSlug,
      catalog_year: "",
      catalog_url: indexUrl,
      scraped_at: new Date().toISOString(),
      programs: [],
    };
  }

  console.log(`  [${collegeSlug}] Fetching program detail pages...`);
  const all: ProgramRequirement[] = [];
  let parsed = 0;
  let skipped = 0;

  await pmap(paths, CONCURRENCY, async (programPath) => {
    const url = `${baseUrl}${programPath}`;
    const html = await retryFetch(url, `program(${programPath})`);
    if (!html) {
      skipped++;
      return;
    }
    const programs = parseProgramPage(html, baseUrl, programPath);
    if (programs.length === 0) {
      skipped++;
      return;
    }
    all.push(...programs);
    parsed += programs.length;
  });

  console.log(
    `  [${collegeSlug}] Parsed ${parsed} program awards across ${paths.length} pages, skipped ${skipped}`,
  );

  return {
    college_slug: collegeSlug,
    catalog_year: "",
    catalog_url: indexUrl,
    scraped_at: new Date().toISOString(),
    programs: all,
  };
}
