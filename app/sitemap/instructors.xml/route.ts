import { getAllStates } from "@/lib/states/registry";
import { getInstructorSitemapEntries } from "@/lib/instructors";
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
    try {
      const currentTerm = await getCurrentTerm(state.slug);
      const instructors = await getInstructorSitemapEntries(
        currentTerm,
        state.slug
      );
      for (const e of instructors) {
        entries.push({
          url: `${url}/${state.slug}/college/${e.collegeId}/instructor/${e.slug}`,
          changeFrequency: "weekly",
          priority: 0.6,
        });
      }
    } catch {
      // skip state if instructor loading fails
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
