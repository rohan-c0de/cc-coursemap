import { getAllStates } from "@/lib/states/registry";
import { loadOnlineData, onlineQualifies } from "@/lib/online";
import {
  toSitemapXml,
  siteOrigin,
  xmlResponse,
  type SitemapEntry,
} from "@/lib/sitemap-xml";

export async function GET() {
  const url = siteOrigin();
  const entries: SitemapEntry[] = [
    { url, changeFrequency: "weekly", priority: 1 },
    { url: `${url}/colleges`, changeFrequency: "weekly", priority: 0.9 },
  ];

  for (const state of getAllStates()) {
    const s = state.slug;
    entries.push(
      { url: `${url}/${s}`, changeFrequency: "weekly", priority: 1 },
      { url: `${url}/${s}/courses`, changeFrequency: "weekly", priority: 0.9 },
      {
        url: `${url}/${s}/colleges`,
        changeFrequency: "weekly",
        priority: 0.9,
      },
      {
        url: `${url}/${s}/starting-soon`,
        changeFrequency: "daily",
        priority: 0.85,
      },
      { url: `${url}/${s}/about`, changeFrequency: "monthly", priority: 0.6 }
    );
    if (state.transferSupported) {
      entries.push({
        url: `${url}/${s}/transfer`,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }
    try {
      const od = await loadOnlineData(s);
      if (onlineQualifies(od)) {
        entries.push({
          url: `${url}/${s}/online`,
          changeFrequency: "weekly",
          priority: 0.85,
        });
      }
    } catch {
      // skip if online data load fails
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
