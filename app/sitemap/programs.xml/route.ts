import { getAllStates } from "@/lib/states/registry";
import { getQualifyingProgramSlugs } from "@/lib/programs";
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
      const slugs = await getQualifyingProgramSlugs(state.slug);
      for (const slug of slugs) {
        entries.push({
          url: `${url}/${state.slug}/program/${slug}`,
          changeFrequency: "weekly",
          priority: 0.75,
        });
      }
    } catch {
      // skip state if program data loading fails
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
