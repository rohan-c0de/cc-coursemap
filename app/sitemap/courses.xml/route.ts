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
      const { codes } = await getSitemapCourseIndex(currentTerm, state.slug);
      for (const c of codes) {
        const key = `${c.prefix}-${c.number}`.toLowerCase();
        entries.push({
          url: `${url}/${state.slug}/course/${key}`,
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }
    } catch {
      // skip state if data loading fails
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
