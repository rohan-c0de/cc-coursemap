/**
 * scrape-jenzabar.ts (template)
 *
 * Parameterized Jenzabar JICS / Jenzabar EX course-section scraper.
 * Designed to be called by the auto-add-state orchestrator or imported
 * directly by per-state scripts. Additive — does not touch any existing
 * per-state scraper.
 *
 * Targets the public Jenzabar Course_Search.jnz portlet served under
 * /ICS/Academics/. Most Jenzabar installs expose this page without auth
 * (the SSO wall sits in front of registration but not search). Each
 * college's URL has a different portlet/screen query, so callers pass
 * the full search-page URL per college.
 *
 * Why Playwright (vs fetch): the search portlet is an ASP.NET WebForms
 * AjaxPortletForm with ViewState; results render after an XHR fires on
 * "Search Courses" click. The result table also uses footable.js for
 * pagination, which only updates the DOM client-side. A real browser
 * context is the simplest correct approach. There IS an internal REST
 * endpoint at /ICS/webserviceproxy/exi/... but it requires a session
 * cookie that's tied to the page load, so bypassing the page buys very
 * little.
 *
 * Usage as a library:
 *
 *   import { scrapeJenzabarState } from "../lib/scrape-jenzabar";
 *
 *   await scrapeJenzabarState({
 *     state: "mi",
 *     hosts: {
 *       "montcalm-community-college": "https://my.montcalm.edu/ICS/Academics/?portlet=Student_Registration&screen=StudentRegistrationPortlet_CourseSearchView&screenType=next",
 *     },
 *   });
 *
 * Output schema matches the shared CourseSection shape used by every
 * other scrape-* template.
 */

import * as fs from "fs";
import * as path from "path";
import {
  chromium,
  type Page,
  type BrowserContext,
  type Browser,
} from "playwright";

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type CourseMode = "in-person" | "online" | "hybrid" | "zoom";

export interface CourseSection {
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
  start_date: string;
  location: string;
  campus: string;
  mode: CourseMode;
  instructor: string | null;
  seats_open: number | null;
  seats_total: number | null;
  prerequisite_text: string | null;
  prerequisite_courses: string[];
}

export interface ScrapeStateOptions {
  /** State slug — lowercase 2-letter code. */
  state: string;
  /** Map of college slug → Jenzabar Course_Search.jnz portlet URL. */
  hosts: Record<string, string>;
  /** When set, only scrape this college slug. */
  collegeFilter?: string;
  /** When true, skip the Supabase import after scraping. */
  noImport?: boolean;
  /** Run headless in production; set true to debug. */
  headed?: boolean;
}

export interface ScrapeCollegeResult {
  slug: string;
  baseUrl: string;
  totalSections: number;
  termsScraped: { name: string; code: string; sections: number }[];
  errors: string[];
}

export interface ScrapeStateResult {
  state: string;
  results: ScrapeCollegeResult[];
  grandTotal: number;
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

/**
 * Map a Jenzabar term label like "Spring 2026" to our standard term code.
 * Jenzabar's `stuRegTermSelect` option value uses academic-year encoding
 * (e.g. "2026;30" for Spring 2026) which differs from calendar year for
 * Summer/Fall — we parse the human label instead so the output term code
 * stays in sync with how the rest of the site stores terms.
 */
export function jenzabarTermLabelToCode(label: string): string | null {
  const clean = label.trim();
  // Standard variant: "Spring 2026", "Fall 2026", etc.
  const std = clean.match(/^(Spring|Summer|Fall|Winter)\s+(\d{4})$/i);
  if (std) {
    return `${std[2]}${seasonSuffix(std[1])}`;
  }
  // AddDrop variant: "2025-2026 - Winter - Winter Full Semester",
  //                  "2026-2027 - Fall - Fall Full Semester", etc.
  // The academic year YYYY-(YYYY+1) maps:
  //   Fall    → calendar year = first year
  //   Winter/Spring/Summer → calendar year = first year + 1
  // We ignore sub-term qualifiers (Full Semester, 8 week, Concurrent) for
  // the output code. Sub-terms write to the same JSON file; downstream
  // dedup is by CRN. Skipping sub-term labels that would collide.
  const ad = clean.match(/^(\d{4})-(\d{4})\s+-\s+(Spring|Summer|Fall|Winter)(?:\s+-\s+.+)?$/i);
  if (ad) {
    const firstYear = parseInt(ad[1], 10);
    const season = ad[3].toLowerCase();
    const year = season === "fall" ? firstYear : firstYear + 1;
    return `${year}${seasonSuffix(ad[3])}`;
  }
  return null;
}

function seasonSuffix(season: string): string {
  const s = season.toLowerCase();
  if (s === "spring") return "SP";
  if (s === "summer") return "SU";
  if (s === "fall") return "FA";
  return "WI";
}

/**
 * Parse a Jenzabar course code into prefix/number/section. Two formats
 * are in the wild:
 *   "ACCT-115--01"  (standard Student_Registration portlet)
 *   "ACC 211 A"     (AddDrop_Courses portlet; modifiers like "HY" may
 *                    appear between the number and section letter)
 */
export function parseCourseCode(
  code: string,
): { prefix: string; number: string; section: string } | null {
  const clean = code.trim();
  // Dashed: "ACCT-115--01" or "ACCT-115-01"
  const dashed = clean.match(/^([A-Z]{2,5})-([A-Z0-9]+)-{1,2}([A-Z0-9 ]+)$/);
  if (dashed) {
    return { prefix: dashed[1], number: dashed[2], section: dashed[3].trim() };
  }
  // Spaced: "ACC 211 A" or "ACC 211 HY A". Everything after the second
  // whitespace-separated token is the section designator.
  const spaced = clean.match(/^([A-Z]{2,5})\s+([A-Z0-9]+)\s+(.+)$/);
  if (spaced) {
    return { prefix: spaced[1], number: spaced[2], section: spaced[3].trim() };
  }
  return null;
}

/** "10/24" → { open: 10, total: 24 }. Returns nulls if unparseable. */
export function parseSeats(text: string): { open: number | null; total: number | null } {
  const m = text.trim().match(/(\d+)\s*\/\s*(\d+)/);
  if (!m) return { open: null, total: null };
  return { open: parseInt(m[1], 10), total: parseInt(m[2], 10) };
}

/** "1/12/2026" → "2026-01-12". Returns input on failure. */
export function normalizeDate(dateStr: string): string {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const m = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return dateStr;
  return `${m[3]}-${m[1].padStart(2, "0")}-${m[2].padStart(2, "0")}`;
}

/**
 * Parse a Jenzabar schedule cell. Two flavours observed:
 *   "Mon 1:00-5:00 PM 1/12/2026 - 4/27/2026 Greenville Learning Center Greenville - G118"
 *   "1/12/2026 - 5/1/2026 Online Online (proctored exams may be required) - ONLNE"
 */
export function parseSchedule(text: string): {
  days: string;
  start_time: string;
  end_time: string;
  start_date: string;
  location: string;
  campus: string;
  mode: CourseMode;
} {
  const clean = text.replace(/\s+/g, " ").trim();
  // Date range like "1/12/2026 - 5/1/2026"
  const dateRange = clean.match(
    /(\d{1,2}\/\d{1,2}\/\d{4})\s*-\s*(\d{1,2}\/\d{1,2}\/\d{4})/,
  );
  const start_date = dateRange ? normalizeDate(dateRange[1]) : "";

  // Days + time appear before the date range when present:
  //   "Mon 1:00-5:00 PM <date range> ..."
  //   "Mon, Wed 9:00-9:50 AM <date range> ..."
  // Day tokens: M, T, W, R, F, S, U or Mon/Tue/Wed/.../Sun.
  let days = "";
  let start_time = "";
  let end_time = "";
  if (dateRange) {
    const before = clean.slice(0, dateRange.index ?? 0).trim();
    // Handle both "8:00-9:55 AM" (one trailing meridian, standard format)
    // and "8:00 AM-9:55 AM" (meridian on each side, AddDrop format).
    const timeMatch = before.match(
      /(\d{1,2}:\d{2})\s*(AM|PM|am|pm)?\s*-\s*(\d{1,2}:\d{2})\s*(AM|PM|am|pm)?/,
    );
    if (timeMatch) {
      const startMeridian = (timeMatch[2] ?? timeMatch[4] ?? "").toUpperCase();
      const endMeridian = (timeMatch[4] ?? timeMatch[2] ?? "").toUpperCase();
      start_time = startMeridian ? `${timeMatch[1]} ${startMeridian}` : timeMatch[1];
      end_time = endMeridian ? `${timeMatch[3]} ${endMeridian}` : timeMatch[3];
      days = before.slice(0, timeMatch.index ?? 0).trim();
    } else {
      // Online-only / async — no day/time, just date range.
      days = "";
    }
  }

  // Location parsing. Two layouts in the wild:
  //  Standard:  "<days> <time> <date range> <campus> - <room-code>"
  //             — location info trails the date range, ends in " - CODE"
  //  AddDrop:   "<days> <time>; <campus>, <room> <date range>"
  //             — location info is between time and date range, joined
  //               to time by "; "
  let location = "";
  let campus = "";
  if (dateRange) {
    const afterIdx = (dateRange.index ?? 0) + dateRange[0].length;
    const after = clean.slice(afterIdx).trim();
    const before = clean.slice(0, dateRange.index ?? 0);

    // First try the AddDrop "; campus, location" layout in the before-portion.
    const semiIdx = before.indexOf(";");
    if (semiIdx > -1) {
      const locInfo = before
        .slice(semiIdx + 1)
        .replace(/\s+/g, " ")
        .trim();
      // "Petoskey, Borra Learning Center, Room 142" — last comma piece is
      // room/location, earlier pieces form campus name.
      const commaIdx = locInfo.lastIndexOf(",");
      if (commaIdx > -1) {
        location = locInfo.slice(commaIdx + 1).trim();
        campus = locInfo.slice(0, commaIdx).trim();
      } else {
        campus = locInfo;
      }
    }

    // Then the standard "<campus> - <code>" trailing layout.
    if (!campus && !location && after) {
      const dashSplit = after.lastIndexOf(" - ");
      if (dashSplit > -1) {
        location = after.slice(dashSplit + 3).trim();
        campus = after.slice(0, dashSplit).trim();
      } else {
        campus = after;
      }
    }
  }

  // Mode heuristic
  const lower = clean.toLowerCase();
  const mode: CourseMode = /\bonline\b/.test(lower)
    ? /\bhybrid\b|f2f|in[-\s]?person/.test(lower)
      ? "hybrid"
      : "online"
    : /\bhybrid\b/.test(lower)
      ? "hybrid"
      : /\bzoom\b|\blive online\b/.test(lower)
        ? "zoom"
        : "in-person";

  return { days, start_time, end_time, start_date, location, campus, mode };
}

// ---------------------------------------------------------------------------
// Core scraping
// ---------------------------------------------------------------------------

interface RawJenzabarRow {
  yearterm: string;
  sectionId: string;
  advisingCode: string; // e.g. "ACCT115" — prefix+number, no separator
  courseCode: string; // e.g. "ACCT-115--01"
  title: string;
  faculty: string;
  seats: string;
  status: string;
  schedule: string;
  credits: string;
  /** AddDrop variant only — start date in MM/DD/YYYY. */
  startDate?: string;
  /** AddDrop variant only — end date in MM/DD/YYYY (unused downstream). */
  endDate?: string;
}

/**
 * Two variants of the Jenzabar JICS course search are deployed:
 *   "standard"  — Student_Registration portlet, #stuRegTermSelect dropdown,
 *                 footable.js result table (#CourseSearchResultsTable).
 *                 e.g. Montcalm Community College.
 *   "adddrop"   — AddDrop_Courses portlet, #pg0_V_ddlTerm dropdown,
 *                 ASP.NET DataGrid result table (#pg0_V_dgCourses) with
 *                 alternating subItem textbook sub-rows, __doPostBack
 *                 pagination.
 *                 e.g. North Central Michigan College.
 *
 * The two share term-code parsing (jenzabarTermLabelToCode handles both
 * label formats) and the high-level orchestration; the rest is variant-
 * specific.
 */
export type JenzabarVariant = "standard" | "adddrop";

async function detectVariant(page: Page): Promise<JenzabarVariant | null> {
  const standard = await page.$("#stuRegTermSelect");
  if (standard) return "standard";
  const adddrop = await page.$("#pg0_V_ddlTerm");
  if (adddrop) return "adddrop";
  return null;
}

async function clickSearchCourses(
  page: Page,
  variant: JenzabarVariant,
): Promise<void> {
  if (variant === "adddrop") {
    await page.click("#pg0_V_btnSearch");
    return;
  }
  await page.evaluate(() => {
    const candidates = Array.from(
      document.querySelectorAll("button, input"),
    ) as HTMLElement[];
    for (const b of candidates) {
      const txt = (b.textContent ?? (b as HTMLInputElement).value ?? "").trim();
      if (txt === "Search Courses") {
        b.click();
        return;
      }
    }
  });
}

async function getRows(
  page: Page,
  variant: JenzabarVariant,
): Promise<RawJenzabarRow[]> {
  if (variant === "adddrop") {
    return getRowsAddDrop(page);
  }
  return getRowsStandard(page);
}

/**
 * AddDrop result rows alternate: data row (no subItem class) followed by
 * a hidden textbook row (.subItem). Columns:
 *   0: spacer (1%)
 *   1: +/- expand image
 *   2: <a> course code link (e.g. "ACC 211 A", "ACC 211 HY A")
 *   3: Title
 *   4: Instructor (inside <span class="ju-word-wrap">)
 *   5: Seats ("14/24")
 *   6: Status ("Open"/"Closed"/etc)
 *   7: Schedule (<ul><li>days time; campus, location</li>...</ul>)
 *   8: Credits ("4.00")
 *   9: Start date
 *   10: End date
 *   11: Hours
 *
 * The CRN-equivalent isn't exposed in this view; we synthesize one from
 * the postback link's section index in lieu of a real CRN.
 */
async function getRowsAddDrop(page: Page): Promise<RawJenzabarRow[]> {
  return page.$$eval(
    "#pg0_V_dgCourses > tbody > tr, #pg0_V_dgCourses > tr",
    (trs) =>
      trs
        .map((tr) => {
          // Skip textbook subItems and header rows.
          if (tr.classList.contains("subItem")) return null;
          const ths = tr.querySelectorAll("th");
          if (ths.length > 0) return null;
          const tds = Array.from(tr.querySelectorAll(":scope > td"));
          if (tds.length < 9) return null;
          const link = tds[2]?.querySelector("a");
          if (!link) return null;
          const code = (link.textContent || "").replace(/\s+/g, " ").trim();
          if (!code) return null;
          // Inline cell extraction — see standard variant for why.
          const cells: (Element | undefined | null)[] = [
            link,
            tds[3],
            tds[4],
            tds[5],
            tds[6],
            tds[7],
            tds[8],
            tds[9],
            tds[10],
          ];
          const texts: string[] = [];
          for (let ci = 0; ci < cells.length; ci++) {
            const el = cells[ci];
            if (!el) {
              texts.push("");
              continue;
            }
            const clone = el.cloneNode(true) as Element;
            const labels = clone.querySelectorAll(".sr-only");
            for (let li = 0; li < labels.length; li++) labels[li].remove();
            texts.push(
              (clone.textContent || "").replace(/\s+/g, " ").trim(),
            );
          }
          const [t0, t1, t2, t3, t4, t5, t6, t7, t8] = texts;
          // Synthesize a stable CRN from the postback link's row index.
          const linkId = (link as HTMLAnchorElement).id || "";
          const idMatch = linkId.match(/row(\d+)_lnkCourse/);
          const sectionId = idMatch ? `nc-row-${idMatch[1]}` : "";
          // Embed start/end dates in the schedule string so the existing
          // parseSchedule()-style logic can pick them up; we override with
          // the explicit columns below in the section assembly step.
          const sched = `${t5} ${t7} - ${t8}`.trim();
          return {
            yearterm: "",
            sectionId,
            advisingCode: "",
            courseCode: code,
            title: t1,
            faculty: t2,
            seats: t3,
            status: t4,
            schedule: sched,
            credits: t6,
            startDate: t7,
            endDate: t8,
          } as RawJenzabarRow;
        })
        .filter((r): r is RawJenzabarRow => r !== null),
  );
}

async function getRowsStandard(page: Page): Promise<RawJenzabarRow[]> {
  return page.$$eval(
    "#CourseSearchResultsTable tbody tr, #CourseSearchResultsTable tr",
    (trs) =>
      trs
        .map((tr) => {
          // Skip header row (has only <th>) and the "no results" placeholder.
          const ths = tr.querySelectorAll("th");
          if (ths.length > 0) return null;
          const tds = Array.from(tr.querySelectorAll("td"));
          if (tds.length < 5) return null;
          const link = tr.querySelector(
            "a[data-yearterm]",
          ) as HTMLAnchorElement | null;
          if (!link) return null;
          // Clone each cell and strip <label class="sr-only"> screen-reader
          // markers before reading textContent — otherwise "Title" prefixes
          // bleed into "Principles of Accounting I" etc.
          // tsx wraps any nested function/arrow with `__name(...)`, which
          // breaks inside page.$$eval. So clean each cell inline — no
          // local function abstraction.
          const cells: (Element | undefined | null)[] = [
            link,
            tds[1],
            tds[2],
            tds[3],
            tds[4],
            tds[5],
            tds[6],
          ];
          const texts: string[] = [];
          for (let ci = 0; ci < cells.length; ci++) {
            const el = cells[ci];
            if (!el) {
              texts.push("");
              continue;
            }
            const clone = el.cloneNode(true) as Element;
            const labels = clone.querySelectorAll(".sr-only");
            for (let li = 0; li < labels.length; li++) labels[li].remove();
            texts.push((clone.textContent || "").replace(/\s+/g, " ").trim());
          }
          const [t0, t1, t2, t3, t4, t5, t6] = texts;
          return {
            yearterm: link.getAttribute("data-yearterm") ?? "",
            sectionId: link.getAttribute("data-sectionid") ?? "",
            advisingCode:
              link.getAttribute("data-advisingrequirementcode") ?? "",
            courseCode: t0,
            title: t1,
            faculty: t2,
            seats: t3,
            status: t4,
            schedule: t5,
            credits: t6,
          };
        })
        .filter((r): r is RawJenzabarRow => r !== null),
  );
}

async function clickNextPage(
  page: Page,
  variant: JenzabarVariant,
): Promise<boolean> {
  if (variant === "adddrop") {
    return page.evaluate(() => {
      // AddDrop pagination is an ASP.NET postback link rendered by the
      // `ltrNav` literal. The link's href is javascript:__doPostBack(...);
      // clicking the <a> directly is enough — ASP.NET wires the rest.
      const links = Array.from(document.querySelectorAll("a"));
      for (const a of links) {
        const txt = (a.textContent || "").trim();
        const href = (a as HTMLAnchorElement).getAttribute("href") || "";
        if (
          /Next\s*page/i.test(txt) &&
          /ltrNav/.test(href) &&
          !a.classList.contains("aspNetDisabled")
        ) {
          (a as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
  }
  return page.evaluate(() => {
    // footable.js binds clicks on the inner <a class="footable-page-link">.
    // Clicking the <li> directly does nothing; clicking the <a> triggers
    // the pagination XHR (data-is-server="true").
    const nextLi = document.querySelector(
      "#CourseSearchResultsTable tfoot .footable-page-nav[data-page='next']",
    ) as HTMLElement | null;
    if (!nextLi) return false;
    if (nextLi.classList.contains("disabled")) return false;
    const a = nextLi.querySelector("a") as HTMLElement | null;
    if (!a) return false;
    a.click();
    return true;
  });
}

async function harvestTerms(
  page: Page,
  variant: JenzabarVariant,
): Promise<{ value: string; label: string; code: string }[]> {
  const selector =
    variant === "adddrop"
      ? "#pg0_V_ddlTerm option"
      : "#stuRegTermSelect option";
  const opts = await page.$$eval(selector, (os) =>
    os.map((o) => ({
      value: (o as HTMLOptionElement).value,
      label: o.textContent?.trim() ?? "",
    })),
  );
  // De-dup by output term code: AddDrop sometimes lists both
  // "2026-2027 - Fall" and "2026-2027 - Fall - Fall Full Semester" which
  // map to the same 2026FA code. Keep the longest/most-specific label so
  // we run the search against the more concrete sub-term.
  const byCode = new Map<string, { value: string; label: string; code: string }>();
  for (const o of opts) {
    const code = jenzabarTermLabelToCode(o.label);
    if (!code) continue;
    const existing = byCode.get(code);
    if (!existing || o.label.length > existing.label.length) {
      byCode.set(code, { value: o.value, label: o.label, code });
    }
  }
  return Array.from(byCode.values());
}

function rowsToSections(
  rows: RawJenzabarRow[],
  collegeSlug: string,
  termCode: string,
): CourseSection[] {
  const out: CourseSection[] = [];
  for (const r of rows) {
    const parsed = parseCourseCode(r.courseCode);
    if (!parsed) continue;
    const seats = parseSeats(r.seats);
    const sched = parseSchedule(r.schedule);
    const credits = parseFloat(r.credits) || 0;
    // AddDrop exposes the section start/end dates in dedicated columns,
    // so prefer those over what parseSchedule extracted from the cell
    // text (which can drift when the cell omits a date range).
    const startDate = r.startDate
      ? normalizeDate(r.startDate)
      : sched.start_date;
    out.push({
      college_code: collegeSlug,
      term: termCode,
      course_prefix: parsed.prefix,
      course_number: parsed.number,
      course_title: r.title,
      credits,
      crn: r.sectionId || parsed.section,
      days: sched.days,
      start_time: sched.start_time,
      end_time: sched.end_time,
      start_date: startDate,
      location: sched.location,
      campus: sched.campus,
      mode: sched.mode,
      instructor: r.faculty || null,
      seats_open: seats.open,
      seats_total: seats.total,
      prerequisite_text: null,
      prerequisite_courses: [],
    });
  }
  return out;
}

export interface ScrapeCollegeOptions {
  state: string;
  slug: string;
  baseUrl: string;
  context: BrowserContext;
  dryRun?: boolean;
  silent?: boolean;
}

export async function scrapeJenzabarCollege(
  opts: ScrapeCollegeOptions,
): Promise<ScrapeCollegeResult> {
  const log = opts.silent ? () => {} : (m: string) => console.log(m);
  const result: ScrapeCollegeResult = {
    slug: opts.slug,
    baseUrl: opts.baseUrl,
    totalSections: 0,
    termsScraped: [],
    errors: [],
  };

  const page = await opts.context.newPage();
  try {
    log(`\n--- ${opts.slug}: ${opts.baseUrl} ---`);
    await page.goto(opts.baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60_000,
    });
    await page.waitForTimeout(2000);

    // Detect which Jenzabar variant this college runs.
    const variant = await detectVariant(page);
    if (!variant) {
      result.errors.push(
        "no Jenzabar term dropdown found (#stuRegTermSelect or #pg0_V_ddlTerm) — wrong URL or auth-gated",
      );
      log(`  skip: term dropdown not found`);
      return result;
    }
    log(`  variant: ${variant}`);

    const terms = await harvestTerms(page, variant);
    if (terms.length === 0) {
      result.errors.push("no terms discovered");
      log(`  skip: no terms discovered`);
      return result;
    }
    log(`  ${terms.length} term(s): ${terms.map((t) => t.label).join(", ")}`);

    const termSelector =
      variant === "adddrop" ? "#pg0_V_ddlTerm" : "#stuRegTermSelect";
    const tableSelector =
      variant === "adddrop"
        ? "#pg0_V_dgCourses"
        : "#CourseSearchResultsTable";

    for (const term of terms) {
      try {
        await page.selectOption(termSelector, term.value);
        await page.waitForTimeout(800);
        // Record the current first-row identifier so we can wait for the
        // search results to actually swap after clicking Search. Without
        // this, a search click that fires before the table fully rebuilds
        // can return stale page-1 rows from the previous term.
        const beforeFirst = await page
          .$$eval(
            tableSelector + " tbody tr a, " + tableSelector + " tr a",
            (els) =>
              (els[0]?.textContent || "").replace(/\s+/g, " ").trim() ||
              (els[0]?.getAttribute("data-sectionid") ?? ""),
          )
          .catch(() => "");
        await clickSearchCourses(page, variant);

        // Wait for results to render — at least one populated row, and
        // ideally one whose link is different from the previous term's.
        await page
          .waitForFunction(
            (params: { sel: string; prev: string }) => {
              const tbl = document.querySelector(params.sel);
              if (!tbl) return false;
              const links = tbl.querySelectorAll("tbody tr a, tr a");
              if (links.length === 0) return false;
              const first = (links[0].textContent || "")
                .replace(/\s+/g, " ")
                .trim();
              const firstId = links[0].getAttribute("data-sectionid") || "";
              if (!params.prev) return links.length > 1;
              return first !== params.prev && firstId !== params.prev;
            },
            { sel: tableSelector, prev: beforeFirst },
            { timeout: 20_000 },
          )
          .catch(() => {
            // Fall through; we'll still try to read rows below.
          });
        await page.waitForTimeout(1500);

        const all: RawJenzabarRow[] = [];
        const seen = new Set<string>();
        const MAX_PAGES = 500;
        for (let i = 0; i < MAX_PAGES; i++) {
          const pageRows = await getRows(page, variant);
          let added = 0;
          for (const r of pageRows) {
            // For AddDrop synthesized IDs (nc-row-N), the row indices reset
            // across pagination postbacks — use the course code + section
            // designator as a more stable dedup key.
            const dedupKey =
              variant === "adddrop"
                ? `${term.code}|${r.courseCode}`
                : `${r.yearterm}|${r.sectionId}|${r.courseCode}`;
            if (seen.has(dedupKey)) continue;
            seen.add(dedupKey);
            all.push(r);
            added++;
          }
          if (added === 0 && i > 0) break;
          const firstSectionId = pageRows[0]?.sectionId ?? "";
          const firstCourseCode = pageRows[0]?.courseCode ?? "";
          const advanced = await clickNextPage(page, variant);
          if (!advanced) break;
          await page
            .waitForFunction(
              (params: { sel: string; v: string; prevId: string; prevCode: string }) => {
                const tbl = document.querySelector(params.sel);
                if (!tbl) return false;
                if (params.v === "adddrop") {
                  const firstLink = tbl.querySelector(
                    ":scope > tbody > tr > td a, :scope > tr > td a",
                  ) as HTMLAnchorElement | null;
                  if (!firstLink) return false;
                  return (
                    (firstLink.textContent || "").replace(/\s+/g, " ").trim() !==
                    params.prevCode
                  );
                }
                const firstLink = tbl.querySelector(
                  "tbody tr a[data-yearterm]",
                ) as HTMLAnchorElement | null;
                if (!firstLink) return false;
                return firstLink.getAttribute("data-sectionid") !== params.prevId;
              },
              {
                sel: tableSelector,
                v: variant,
                prevId: firstSectionId,
                prevCode: firstCourseCode,
              },
              { timeout: 15_000 },
            )
            .catch(() => undefined);
          // Extra settle time after the wait — server-side postbacks
          // sometimes return before the table is fully rebuilt.
          await page.waitForTimeout(800);
        }

        const sections = rowsToSections(all, opts.slug, term.code);
        if (sections.length === 0) {
          log(`  ${term.label} (${term.code}): no sections`);
          continue;
        }

        if (!opts.dryRun) {
          const outDir = path.join(
            process.cwd(),
            "data",
            opts.state,
            "courses",
            opts.slug,
          );
          fs.mkdirSync(outDir, { recursive: true });
          const outPath = path.join(outDir, `${term.code}.json`);
          fs.writeFileSync(
            outPath,
            JSON.stringify(sections, null, 2) + "\n",
          );
          log(`  ${term.label} (${term.code}): ${sections.length} sections → ${outPath}`);
        } else {
          log(
            `  ${term.label} (${term.code}): ${sections.length} sections (dry-run)`,
          );
        }

        result.termsScraped.push({
          name: term.label,
          code: term.code,
          sections: sections.length,
        });
        result.totalSections += sections.length;
      } catch (e) {
        const msg = `term ${term.label}: ${e instanceof Error ? e.message : String(e)}`;
        result.errors.push(msg);
        log(`  error: ${msg}`);
      }
    }
  } finally {
    await page.close();
  }

  return result;
}

export async function scrapeJenzabarState(
  opts: ScrapeStateOptions,
): Promise<ScrapeStateResult> {
  const targets: Array<[string, string]> = opts.collegeFilter
    ? (() => {
        const baseUrl = opts.hosts[opts.collegeFilter];
        if (!baseUrl) {
          throw new Error(
            `Unknown college: ${opts.collegeFilter}. Known: ${Object.keys(opts.hosts).join(", ")}`,
          );
        }
        return [[opts.collegeFilter, baseUrl]];
      })()
    : Object.entries(opts.hosts);

  console.log(`Scraping ${targets.length} Jenzabar college(s)...\n`);

  let browser: Browser | null = null;
  const results: ScrapeCollegeResult[] = [];
  let grandTotal = 0;
  try {
    browser = await chromium.launch({ headless: !opts.headed });
    const context = await browser.newContext();
    for (const [slug, baseUrl] of targets) {
      const r = await scrapeJenzabarCollege({
        state: opts.state,
        slug,
        baseUrl,
        context,
      });
      results.push(r);
      grandTotal += r.totalSections;
    }
    await context.close();
  } finally {
    if (browser) await browser.close();
  }

  console.log(`\n=== Jenzabar scrape complete: ${grandTotal} total sections ===`);
  return { state: opts.state, results, grandTotal };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const isMain =
  typeof import.meta !== "undefined" &&
  import.meta.url.startsWith("file:") &&
  process.argv[1] &&
  import.meta.url === `file://${process.argv[1]}`;

if (isMain) {
  const args = process.argv.slice(2);
  const flag = (name: string): string | null => {
    const i = args.indexOf(name);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : null;
  };
  const smoke = args.includes("--smoke");
  const url = flag("--url");
  const slug = flag("--slug") || "test-college";
  const state = flag("--state") || "test";

  if (!url) {
    console.error(
      `Usage: tsx scripts/lib/scrape-jenzabar.ts --url <course-search-url> --slug <slug> [--state <state>] [--smoke]\n` +
        `  --smoke: dry-run, no JSON written`,
    );
    process.exit(1);
  }

  scrapeJenzabarState({
    state,
    hosts: { [slug]: url },
    noImport: true,
  })
    .then((r) => {
      if (smoke) {
        console.log(JSON.stringify(r, null, 2));
      }
      process.exit(0);
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
