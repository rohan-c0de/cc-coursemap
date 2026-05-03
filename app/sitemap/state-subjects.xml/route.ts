import { getAllStates } from "@/lib/states/registry";
import { getSitemapCourseIndex } from "@/lib/courses";
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
      const { subjectSectionCounts } = await getSitemapCourseIndex(
        currentTerm,
        state.slug
      );
      for (const [prefix, count] of subjectSectionCounts) {
        if (count >= 5) {
          entries.push({
            url: `${url}/${state.slug}/subject/${prefix.toLowerCase()}`,
            changeFrequency: "weekly",
            priority: 0.65,
          });
        }
      }
    } catch {
      // skip state if data loading fails
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
