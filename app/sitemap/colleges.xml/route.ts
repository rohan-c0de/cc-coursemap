import { getAllStates, hasProgramsCoverage } from "@/lib/states/registry";
import { loadInstitutions } from "@/lib/institutions";
import {
  toSitemapXml,
  siteOrigin,
  xmlResponse,
  type SitemapEntry,
} from "@/lib/sitemap-xml";

export function GET() {
  const url = siteOrigin();
  const entries: SitemapEntry[] = [];
  const lastModified = new Date();

  for (const state of getAllStates()) {
    const hasPrograms = hasProgramsCoverage(state.slug);
    for (const inst of loadInstitutions(state.slug)) {
      entries.push({
        url: `${url}/${state.slug}/college/${inst.id}`,
        changeFrequency: "weekly",
        priority: 0.7,
        lastModified,
      });
      if (hasPrograms) {
        entries.push({
          url: `${url}/${state.slug}/college/${inst.id}/programs`,
          changeFrequency: "monthly",
          priority: 0.65,
          lastModified,
        });
      }
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
