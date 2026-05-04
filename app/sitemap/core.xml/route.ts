import { getAllStates } from "@/lib/states/registry";
import { loadOnlineData, onlineQualifies } from "@/lib/online";
import {
  toSitemapXml,
  siteOrigin,
  xmlResponse,
  type SitemapEntry,
} from "@/lib/sitemap-xml";

export const revalidate = 86400;

export async function GET() {
  const url = siteOrigin();
  const entries: SitemapEntry[] = [
    { url, changeFrequency: "weekly", priority: 1 },
    { url: `${url}/colleges`, changeFrequency: "weekly", priority: 0.9 },
  ];

  const states = getAllStates();

  for (const state of states) {
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
  }

  const onlineResults = await Promise.allSettled(
    states.map(async (state) => {
      const od = await loadOnlineData(state.slug);
      if (od && onlineQualifies(od)) {
        return {
          url: `${url}/${state.slug}/online`,
          changeFrequency: "weekly" as const,
          priority: 0.85,
        };
      }
      return null;
    })
  );

  for (const r of onlineResults) {
    if (r.status === "fulfilled" && r.value) {
      entries.push(r.value);
    }
  }

  return xmlResponse(toSitemapXml(entries));
}
