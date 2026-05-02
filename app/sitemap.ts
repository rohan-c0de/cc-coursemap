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
import { getQualifyingProgramSlugs } from "@/lib/programs";
import { loadOnlineData, onlineQualifies } from "@/lib/online";

// Thin-content guard: keep in sync with the /[state]/transfer/to/[slug] page.
const MIN_TRANSFER_HUB_COUNT = 10;

const SITEMAP_IDS = [
  "core",
  "colleges",
  "college-subjects",
  "courses",
  "state-subjects",
  "transfer",
  "instructors",
  "programs",
  "blog",
] as const;
type SitemapId = (typeof SITEMAP_IDS)[number];

function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL || "https://communitycollegepath.com"
  );
}

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

export async function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }));
}

async function buildCore(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  const entries: MetadataRoute.Sitemap = [
    { url, changeFrequency: "weekly", priority: 1 },
    { url: `${url}/colleges`, changeFrequency: "weekly", priority: 0.9 },
  ];
  for (const state of getAllStates()) {
    const s = state.slug;
    const stateLastMod = lastModifiedForState(s);
    entries.push(
      { url: `${url}/${s}`, changeFrequency: "weekly", priority: 1, lastModified: stateLastMod },
      { url: `${url}/${s}/courses`, changeFrequency: "weekly", priority: 0.9, lastModified: stateLastMod },
      { url: `${url}/${s}/colleges`, changeFrequency: "weekly", priority: 0.9, lastModified: stateLastMod },
      { url: `${url}/${s}/starting-soon`, changeFrequency: "daily", priority: 0.85, lastModified: stateLastMod },
      { url: `${url}/${s}/about`, changeFrequency: "monthly", priority: 0.6 }
      // /results, /schedule, /plan are noindexed (interactive tools)
    );
    if (state.transferSupported) {
      entries.push({
        url: `${url}/${s}/transfer`,
        changeFrequency: "weekly",
        priority: 0.85,
        lastModified: stateLastMod,
      });
    }
    // Online courses landing — only when threshold met
    try {
      const od = await loadOnlineData(s);
      if (onlineQualifies(od)) {
        entries.push({
          url: `${url}/${s}/online`,
          changeFrequency: "weekly",
          priority: 0.85,
          lastModified: stateLastMod,
        });
      }
    } catch {
      // skip if online data load fails
    }
  }
  return entries;
}

async function buildColleges(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  const out: MetadataRoute.Sitemap = [];
  for (const state of getAllStates()) {
    const institutions = loadInstitutions(state.slug);
    for (const inst of institutions) {
      const collegeLastMod = lastModifiedForCollege(state.slug, inst.college_slug);
      out.push({
        url: `${url}/${state.slug}/college/${inst.id}`,
        changeFrequency: "weekly",
        priority: 0.7,
        lastModified: collegeLastMod,
      });
    }
  }
  return out;
}

async function buildCollegeSubjects(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  const out: MetadataRoute.Sitemap = [];
  for (const state of getAllStates()) {
    const institutions = loadInstitutions(state.slug);
    const currentTerm = await getCurrentTerm(state.slug);
    for (const inst of institutions) {
      const collegeLastMod = lastModifiedForCollege(state.slug, inst.college_slug);
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
            out.push({
              url: `${url}/${state.slug}/college/${inst.id}/courses/${prefix.toLowerCase()}`,
              changeFrequency: "weekly",
              priority: 0.6,
              lastModified: collegeLastMod,
            });
          }
        }
      } catch {
        // skip if course loading fails
      }
    }
  }
  return out;
}

async function buildCourses(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  const out: MetadataRoute.Sitemap = [];
  for (const state of getAllStates()) {
    try {
      const currentTerm = await getCurrentTerm(state.slug);
      const stateLastMod = lastModifiedForState(state.slug);
      const { codes } = await getSitemapCourseIndex(currentTerm, state.slug);
      for (const c of codes) {
        const key = `${c.prefix}-${c.number}`.toLowerCase();
        out.push({
          url: `${url}/${state.slug}/course/${key}`,
          changeFrequency: "weekly",
          priority: 0.7,
          lastModified: stateLastMod,
        });
      }
    } catch {
      // skip state if data loading fails
    }
  }
  return out;
}

async function buildStateSubjects(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  const out: MetadataRoute.Sitemap = [];
  for (const state of getAllStates()) {
    try {
      const currentTerm = await getCurrentTerm(state.slug);
      const stateLastMod = lastModifiedForState(state.slug);
      const { subjectSectionCounts } = await getSitemapCourseIndex(
        currentTerm,
        state.slug
      );
      for (const [prefix, count] of subjectSectionCounts) {
        if (count >= 5) {
          out.push({
            url: `${url}/${state.slug}/subject/${prefix.toLowerCase()}`,
            changeFrequency: "weekly",
            priority: 0.65,
            lastModified: stateLastMod,
          });
        }
      }
    } catch {
      // skip state if data loading fails
    }
  }
  return out;
}

async function buildTransfer(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  const out: MetadataRoute.Sitemap = [];
  for (const state of getAllStates()) {
    if (!state.transferSupported) continue;
    try {
      const stateLastMod = lastModifiedForState(state.slug);
      const universities = await getUniversitiesWithCounts(state.slug);
      for (const u of universities) {
        if (u.totalCount < MIN_TRANSFER_HUB_COUNT) continue;
        out.push({
          url: `${url}/${state.slug}/transfer/to/${u.slug}`,
          changeFrequency: "weekly",
          priority: 0.8,
          lastModified: stateLastMod,
        });
      }
    } catch {
      // skip if transfer data loading fails
    }
  }
  return out;
}

async function buildInstructors(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  const out: MetadataRoute.Sitemap = [];
  for (const state of getAllStates()) {
    try {
      const currentTerm = await getCurrentTerm(state.slug);
      const stateLastMod = lastModifiedForState(state.slug);
      const entries = await getInstructorSitemapEntries(
        currentTerm,
        state.slug
      );
      for (const e of entries) {
        out.push({
          url: `${url}/${state.slug}/college/${e.collegeId}/instructor/${e.slug}`,
          changeFrequency: "weekly",
          priority: 0.6,
          lastModified: stateLastMod,
        });
      }
    } catch {
      // skip state if instructor loading fails
    }
  }
  return out;
}

async function buildPrograms(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  const out: MetadataRoute.Sitemap = [];
  for (const state of getAllStates()) {
    try {
      const stateLastMod = lastModifiedForState(state.slug);
      const slugs = await getQualifyingProgramSlugs(state.slug);
      for (const slug of slugs) {
        out.push({
          url: `${url}/${state.slug}/program/${slug}`,
          changeFrequency: "weekly",
          priority: 0.75,
          lastModified: stateLastMod,
        });
      }
    } catch {
      // skip state if program data loading fails
    }
  }
  return out;
}

async function buildBlog(): Promise<MetadataRoute.Sitemap> {
  const url = baseUrl();
  return [
    { url: `${url}/blog`, changeFrequency: "weekly", priority: 0.7 },
    ...getAllArticles().map((article) => ({
      url: `${url}/blog/${article.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
      lastModified: new Date(article.date),
    })),
  ];
}

export default async function sitemap({
  id,
}: {
  id: Promise<string> | string;
}): Promise<MetadataRoute.Sitemap> {
  const resolved = typeof id === "string" ? id : await id;
  const which = resolved as SitemapId;
  switch (which) {
    case "core":
      return buildCore();
    case "colleges":
      return buildColleges();
    case "college-subjects":
      return buildCollegeSubjects();
    case "courses":
      return buildCourses();
    case "state-subjects":
      return buildStateSubjects();
    case "transfer":
      return buildTransfer();
    case "instructors":
      return buildInstructors();
    case "programs":
      return buildPrograms();
    case "blog":
      return buildBlog();
    default:
      return [];
  }
}
