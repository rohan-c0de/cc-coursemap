import { getAllStates } from "@/lib/states/registry";
import { getUniversitiesWithCounts } from "@/lib/transfer";
import {
  toSitemapXml,
  siteOrigin,
  xmlResponse,
  type SitemapEntry,
} from "@/lib/sitemap-xml";

const MIN_TRANSFER_HUB_COUNT = 10;

export async function GET() {
  const url = siteOrigin();
  const entries: SitemapEntry[] = [];

  for (const state of getAllStates()) {
    if (!state.transferSupported) continue;
    try {
      const universities = await getUniversitiesWithCounts(state.slug);
      for (const u of universities) {
        if (u.totalCount < MIN_TRANSFER_HUB_COUNT) continue;
        entries.push({
          url: `${url}/${state.slug}/transfer/to/${u.slug}`,
          changeFrequency: "weekly",
          priority: 0.8,
        });
      }
    } catch {
      // skip if transfer data loading fails
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
