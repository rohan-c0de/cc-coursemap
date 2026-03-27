import fs from "fs";
import path from "path";
import type { CourseSection } from "./types";

const DATA_DIR = path.join(process.cwd(), "data", "courses");

/**
 * Load all course sections for a given college and term from the static JSON
 * file at data/courses/{slug}/{term}.json.
 */
export function loadCoursesForCollege(
  collegeSlug: string,
  term: string
): CourseSection[] {
  const filePath = path.join(DATA_DIR, collegeSlug, `${term}.json`);

  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw) as CourseSection[];
  } catch {
    return [];
  }
}

/**
 * Scan the data/courses directory tree and return all term identifiers that
 * have at least one JSON file present across any college.
 */
export function getAvailableTerms(): string[] {
  const terms = new Set<string>();

  try {
    const slugs = fs.readdirSync(DATA_DIR);

    for (const slug of slugs) {
      const slugDir = path.join(DATA_DIR, slug);
      if (!fs.statSync(slugDir).isDirectory()) continue;

      const files = fs.readdirSync(slugDir);
      for (const file of files) {
        if (file.endsWith(".json")) {
          terms.add(file.replace(".json", ""));
        }
      }
    }
  } catch {
    // data directory may not exist yet
  }

  return Array.from(terms).sort();
}

/**
 * Return the number of course sections for a college/term combination without
 * loading the full array into the caller's scope.
 */
export function getCourseCount(collegeSlug: string, term: string): number {
  return loadCoursesForCollege(collegeSlug, term).length;
}

/**
 * Filter an array of course sections by optional subject prefix, day pattern,
 * and delivery mode.
 */
export function filterCourses(
  courses: CourseSection[],
  filters: { subject?: string; days?: string; mode?: string }
): CourseSection[] {
  return courses.filter((course) => {
    if (filters.subject && course.course_prefix !== filters.subject) {
      return false;
    }

    if (filters.days && !course.days.includes(filters.days)) {
      return false;
    }

    if (filters.mode && course.mode !== filters.mode) {
      return false;
    }

    return true;
  });
}

/**
 * Check whether the data file for a college/term is stale (more than 8 days
 * old based on file modification time).
 */
export function isDataStale(collegeSlug: string, term: string): boolean {
  const filePath = path.join(DATA_DIR, collegeSlug, `${term}.json`);

  try {
    const stat = fs.statSync(filePath);
    const ageMs = Date.now() - stat.mtimeMs;
    const eightDaysMs = 8 * 24 * 60 * 60 * 1000;
    return ageMs > eightDaysMs;
  } catch {
    // If the file does not exist, consider it stale
    return true;
  }
}

/**
 * Extract a sorted list of unique course prefixes (subjects) from an array of
 * course sections.
 */
export function getUniqueSubjects(courses: CourseSection[]): string[] {
  const subjects = new Set<string>();

  for (const course of courses) {
    subjects.add(course.course_prefix);
  }

  return Array.from(subjects).sort();
}
