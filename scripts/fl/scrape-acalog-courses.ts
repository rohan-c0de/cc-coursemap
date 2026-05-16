/**
 * scrape-acalog-courses.ts (FL)
 *
 * Scrapes course catalog data (titles, credits, prereqs) from FL colleges
 * running Acalog catalogs. Outputs the same format as the Coursedog template
 * so prereqs can be aggregated the same way.
 *
 * Currently covers:
 *   - FSW (Florida SouthWestern State College) — catalog.fsw.edu, catoid=22
 *
 * Usage:
 *   npx tsx scripts/fl/scrape-acalog-courses.ts                 # all
 *   npx tsx scripts/fl/scrape-acalog-courses.ts --college fsw   # one
 */

import * as fs from "fs";
import * as path from "path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const CONCURRENCY = 6;
const DELAY_MS = 100;

interface AcalogCollege {
  slug: string;
  baseUrl: string;
  catoid: number;
  navoid: number;
}

const ACALOG_COLLEGES: AcalogCollege[] = [
  { slug: "fsw", baseUrl: "https://catalog.fsw.edu", catoid: 22, navoid: 4260 },
];

interface CourseListing {
  coid: number;
  prefix: string;
  number: string;
  title: string;
}

interface CourseOutput {
  prefix: string;
  number: string;
  title: string;
  credits: number | null;
  description: string;
  prerequisite_text: string | null;
  prerequisite_courses: string[];
}

async function fetchWithRetry(url: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.ok) return await res.text();
      if (i === retries) throw new Error(`HTTP ${res.status}`);
    } catch (e) {
      if (i === retries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  return "";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function discoverCourses(college: AcalogCollege): Promise<CourseListing[]> {
  const courses: CourseListing[] = [];
  let page = 1;

  while (true) {
    const url = `${college.baseUrl}/content.php?catoid=${college.catoid}&navoid=${college.navoid}&cpage=${page}`;
    const html = await fetchWithRetry(url);

    const coidRegex =
      /preview_course_nopop\.php\?catoid=\d+&coid=(\d+)"[^>]*title="([^"]+)"/g;
    let match;
    let count = 0;

    while ((match = coidRegex.exec(html)) !== null) {
      count++;
      const coid = parseInt(match[1]);
      const titleFull = match[2].replace(/ opens a new window$/, "").trim();
      const parts = titleFull.match(/^([A-Z]{2,5})\s+(\S+)\s*-\s*(.+)$/);
      if (parts) {
        courses.push({
          coid,
          prefix: parts[1],
          number: parts[2],
          title: parts[3].trim(),
        });
      }
    }

    console.log(`  Page ${page}: ${count} courses found (total: ${courses.length})`);
    if (count === 0) break;
    page++;
    await sleep(DELAY_MS);
  }

  return courses;
}

function parsePrereqs(html: string): { text: string; courses: string[] } | null {
  const prereqMatch = html.match(
    /[Pp]rerequisite[s]?:?\s*(.*?)(?:<br|<\/p|<\/td|<hr|$)/s
  );
  if (!prereqMatch) return null;

  let text = prereqMatch[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&#8220;|&#8221;|&ldquo;|&rdquo;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();

  if (!text || text.length < 3) return null;

  const courseRegex = /\b([A-Z]{2,5})\s+(\d{4}[A-Z]?)\b/g;
  const courses: string[] = [];
  let m;
  while ((m = courseRegex.exec(text)) !== null) {
    const code = `${m[1]} ${m[2]}`;
    if (!courses.includes(code)) courses.push(code);
  }

  return { text, courses };
}

function parseCredits(html: string): number | null {
  const creditMatch = html.match(
    /(\d+(?:\.\d+)?)\s*(?:credit|Credit|cr\.?\s*hr|semester hour)/i
  );
  if (creditMatch) return parseFloat(creditMatch[1]);

  const rangeMatch = html.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*credit/i);
  if (rangeMatch) return parseInt(rangeMatch[2]);

  return null;
}

function parseDescription(html: string): string {
  const descMatch = html.match(
    /<hr\s*\/?>\s*(.*?)(?:<br\s*\/?>.*?[Pp]rerequisite|<br\s*\/?>.*?[Cc]orequisite|<br\s*\/?>.*?<strong|$)/s
  );
  if (!descMatch) return "";

  return descMatch[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

async function scrapeCourseDetails(
  college: AcalogCollege,
  listings: CourseListing[]
): Promise<CourseOutput[]> {
  const results: CourseOutput[] = [];
  let fetched = 0;

  for (let i = 0; i < listings.length; i += CONCURRENCY) {
    const batch = listings.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (listing) => {
        const url = `${college.baseUrl}/preview_course_nopop.php?catoid=${college.catoid}&coid=${listing.coid}`;
        try {
          const html = await fetchWithRetry(url);
          const prereqs = parsePrereqs(html);
          const credits = parseCredits(html);
          const description = parseDescription(html);

          return {
            prefix: listing.prefix,
            number: listing.number,
            title: listing.title,
            credits,
            description,
            prerequisite_text: prereqs?.text || null,
            prerequisite_courses: prereqs?.courses || [],
          };
        } catch {
          return {
            prefix: listing.prefix,
            number: listing.number,
            title: listing.title,
            credits: null,
            description: "",
            prerequisite_text: null,
            prerequisite_courses: [],
          };
        }
      })
    );

    results.push(...batchResults);
    fetched += batch.length;

    if (fetched % 100 === 0 || fetched === listings.length) {
      const withPrereqs = results.filter((r) => r.prerequisite_text).length;
      console.log(
        `  Fetched ${fetched}/${listings.length} (${withPrereqs} with prereqs)`
      );
    }

    await sleep(DELAY_MS);
  }

  return results;
}

async function scrapeCollege(college: AcalogCollege): Promise<void> {
  console.log(`\n=== Scraping ${college.slug} (${college.baseUrl}) ===`);

  console.log("  Discovering courses...");
  const listings = await discoverCourses(college);
  console.log(`  Found ${listings.length} courses in catalog\n`);

  if (listings.length === 0) {
    console.error(`  ERROR: No courses found for ${college.slug}`);
    return;
  }

  console.log("  Fetching course details + prereqs...");
  const courses = await scrapeCourseDetails(college, listings);

  const outDir = path.join(process.cwd(), "data", "fl", "coursedog-catalog");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${college.slug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(courses, null, 2));

  const withPrereqs = courses.filter((c) => c.prerequisite_text).length;
  console.log(
    `\n  → ${courses.length} courses written to ${outPath} (${withPrereqs} with prereqs)`
  );
}

async function main() {
  const args = process.argv.slice(2);
  const collegeIdx = args.indexOf("--college");
  const collegeFilter = collegeIdx >= 0 ? args[collegeIdx + 1] : undefined;

  const targets = collegeFilter
    ? ACALOG_COLLEGES.filter((c) => c.slug === collegeFilter)
    : ACALOG_COLLEGES;

  if (collegeFilter && targets.length === 0) {
    console.error(`Unknown college: ${collegeFilter}`);
    console.error(
      `Available: ${ACALOG_COLLEGES.map((c) => c.slug).join(", ")}`
    );
    process.exit(1);
  }

  for (const college of targets) {
    await scrapeCollege(college);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
