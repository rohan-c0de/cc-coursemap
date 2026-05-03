import { getAllStates } from "@/lib/states/registry";
import { loadInstitutions } from "@/lib/institutions";
import { loadCoursesForCollege, getUniqueSubjects } from "@/lib/courses";
import { getCurrentTerm } from "@/lib/terms";
import {
  toSitemapXml,
  siteOrigin,
  xmlResponse,
  type SitemapEntry,
} from "@/lib/sitemap-xml";

export async function GET() {
  const url = siteOrigin();
  const entries: SitemapEntry[] = [];

  for (const state of getAllStates()) {
    const institutions = loadInstitutions(state.slug);
    const currentTerm = await getCurrentTerm(state.slug);
    for (const inst of institutions) {
      try {
        const courses = await loadCoursesForCollege(
          inst.college_slug,
          currentTerm,
          state.slug
        );
        for (const prefix of getUniqueSubjects(courses)) {
          const count = courses.filter(
            (c) => c.course_prefix === prefix
          ).length;
          if (count >= 3) {
            entries.push({
              url: `${url}/${state.slug}/college/${inst.id}/courses/${prefix.toLowerCase()}`,
              changeFrequency: "weekly",
              priority: 0.6,
            });
          }
        }
      } catch {
        // skip if course loading fails
      }
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
