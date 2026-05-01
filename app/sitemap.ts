import { existsSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { MetadataRoute } from "next";
import { getAllStates } from "@/lib/states/registry";
import { loadInstitutions } from "@/lib/institutions";
import { getAllArticles } from "@/lib/blog";
import {
  loadCoursesForCollege,
  getUniqueSubjects,
  getSitemapCourseIndex,
} from "@/lib/courses";
import { getInstructorSitemapEntries } from "@/lib/instructors";
import { getCurrentTerm } from "@/lib/terms";
import { getUniversitiesWithCounts } from "@/lib/transfer";

// Thin-content guard: keep in sync with the /[state]/transfer/to/[slug] page.
const MIN_TRANSFER_HUB_COUNT = 10;

// Latest mtime across a state's per-college course files. Course JSON has no
// per-record scraped_at, so the file mtime is the freshness proxy — it bumps
// every time the scheduled scraper rewrites the file. Computed once per state.
function lastModifiedForState(stateSlug: string): Date | undefined {
  const root = join(process.cwd(), "data", stateSlug, "courses");
  if (!existsSync(root)) return undefined;
  let latest = 0;
  for (const college of readdirSync(root)) {
    const dir = join(root, college);
    let stat;
    try {
      stat = statSync(dir);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;
    for (const file of readdirSync(dir)) {
      if (!file.endsWith(".json")) continue;
      try {
        const m = statSync(join(dir, file)).mtimeMs;
        if (m > latest) latest = m;
      } catch {
        // skip unreadable file
      }
    }
  }
  return latest > 0 ? new Date(latest) : undefined;
}

// Latest mtime across one college's course files.
function lastModifiedForCollege(
  stateSlug: string,
  collegeSlug: string
): Date | undefined {
  const dir = join(process.cwd(), "data", stateSlug, "courses", collegeSlug);
  if (!existsSync(dir)) return undefined;
  let latest = 0;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".json")) continue;
    try {
      const m = statSync(join(dir, file)).mtimeMs;
      if (m > latest) latest = m;
    } catch {
      // skip unreadable file
    }
  }
  return latest > 0 ? new Date(latest) : undefined;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://communitycollegepath.com";

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/colleges`, changeFrequency: "weekly", priority: 0.9 },
  ];

  for (const state of getAllStates()) {
    const s = state.slug;
    const stateLastMod = lastModifiedForState(s);
    entries.push(
      { url: `${baseUrl}/${s}`, changeFrequency: "weekly", priority: 1, lastModified: stateLastMod },
      { url: `${baseUrl}/${s}/courses`, changeFrequency: "weekly", priority: 0.9, lastModified: stateLastMod },
      { url: `${baseUrl}/${s}/colleges`, changeFrequency: "weekly", priority: 0.9, lastModified: stateLastMod },
      { url: `${baseUrl}/${s}/starting-soon`, changeFrequency: "daily", priority: 0.85, lastModified: stateLastMod },
      { url: `${baseUrl}/${s}/about`, changeFrequency: "monthly", priority: 0.6 },
      // /results and /schedule are noindexed (client-side interactive tools)
    );
    if (state.transferSupported) {
      entries.push({ url: `${baseUrl}/${s}/transfer`, changeFrequency: "weekly" as const, priority: 0.85, lastModified: stateLastMod });
    }
  }

  // College detail pages + subject pages for all states
  const collegePages: MetadataRoute.Sitemap = [];
  const subjectPages: MetadataRoute.Sitemap = [];

  for (const state of getAllStates()) {
    const institutions = loadInstitutions(state.slug);
    const currentTerm = await getCurrentTerm(state.slug);

    for (const inst of institutions) {
      const collegeLastMod = lastModifiedForCollege(state.slug, inst.college_slug);
      collegePages.push({
        url: `${baseUrl}/${state.slug}/college/${inst.id}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
        lastModified: collegeLastMod,
      });

      // Subject pages (pSEO) — only include if ≥3 sections to avoid thin content
      try {
        const courses = await loadCoursesForCollege(
          inst.college_slug,
          currentTerm,
          state.slug
        );
        const subjects = getUniqueSubjects(courses);
        for (const prefix of subjects) {
          const sectionCount = courses.filter(
            (c) => c.course_prefix === prefix
          ).length;
          if (sectionCount >= 3) {
            subjectPages.push({
              url: `${baseUrl}/${state.slug}/college/${inst.id}/courses/${prefix.toLowerCase()}`,
              changeFrequency: "weekly" as const,
              priority: 0.6,
              lastModified: collegeLastMod,
            });
          }
        }
      } catch {
        // Skip if course loading fails
      }
    }
  }

  // Course detail pages (pSEO) — one page per unique course per state
  const coursePages: MetadataRoute.Sitemap = [];
  // State-wide subject pages (pSEO) — e.g. /va/subject/eng (all ENG across state)
  const stateSubjectPages: MetadataRoute.Sitemap = [];

  for (const state of getAllStates()) {
    try {
      const currentTerm = await getCurrentTerm(state.slug);
      const stateLastMod = lastModifiedForState(state.slug);
      // Single 2-column scan instead of full row catalog (~9 MB → ~50 KB).
      const { codes, subjectSectionCounts } = await getSitemapCourseIndex(
        currentTerm,
        state.slug
      );

      for (const c of codes) {
        const key = `${c.prefix}-${c.number}`.toLowerCase();
        coursePages.push({
          url: `${baseUrl}/${state.slug}/course/${key}`,
          changeFrequency: "weekly" as const,
          priority: 0.7,
          lastModified: stateLastMod,
        });
      }

      // Only include state subject pages with ≥5 sections — avoids thin content
      for (const [prefix, count] of subjectSectionCounts) {
        if (count >= 5) {
          stateSubjectPages.push({
            url: `${baseUrl}/${state.slug}/subject/${prefix.toLowerCase()}`,
            changeFrequency: "weekly" as const,
            priority: 0.65,
            lastModified: stateLastMod,
          });
        }
      }
    } catch {
      // Skip state if data loading fails
    }
  }

  // University transfer hub pages (pSEO) — one per (state, receiving university)
  // where at least MIN_TRANSFER_HUB_COUNT transferable courses exist.
  const transferHubPages: MetadataRoute.Sitemap = [];
  for (const state of getAllStates()) {
    if (!state.transferSupported) continue;
    try {
      const stateLastMod = lastModifiedForState(state.slug);
      const universities = await getUniversitiesWithCounts(state.slug);
      for (const u of universities) {
        if (u.totalCount < MIN_TRANSFER_HUB_COUNT) continue;
        transferHubPages.push({
          url: `${baseUrl}/${state.slug}/transfer/to/${u.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.8,
          lastModified: stateLastMod,
        });
      }
    } catch {
      // Skip if transfer data loading fails
    }
  }

  // Instructor pages (pSEO) — one page per instructor with ≥2 sections
  const instructorPages: MetadataRoute.Sitemap = [];

  for (const state of getAllStates()) {
    try {
      const currentTerm = await getCurrentTerm(state.slug);
      const stateLastMod = lastModifiedForState(state.slug);
      const instructorEntries = await getInstructorSitemapEntries(
        currentTerm,
        state.slug
      );
      for (const entry of instructorEntries) {
        instructorPages.push({
          url: `${baseUrl}/${state.slug}/college/${entry.collegeId}/instructor/${entry.slug}`,
          changeFrequency: "weekly" as const,
          priority: 0.6,
          lastModified: stateLastMod,
        });
      }
    } catch {
      // Skip state if instructor loading fails
    }
  }

  // Blog pages
  const blogPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/blog`, changeFrequency: "weekly" as const, priority: 0.7 },
    ...getAllArticles().map((article) => ({
      url: `${baseUrl}/blog/${article.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      lastModified: new Date(article.date),
    })),
  ];

  return [
    ...entries,
    ...collegePages,
    ...subjectPages,
    ...stateSubjectPages,
    ...coursePages,
    ...transferHubPages,
    ...instructorPages,
    ...blogPages,
  ];
}
