import { getAllStates } from "@/lib/states/registry";
import { getSitemapCourseIndex } from "@/lib/courses";
import { getCurrentTerm } from "@/lib/terms";
import {
  toSitemapXml,
  siteOrigin,
  xmlResponse,
  type SitemapEntry,
} from "@/lib/sitemap-xml";

export const revalidate = 86400;

export async function GET() {
  const url = siteOrigin();

  const results = await Promise.allSettled(
    getAllStates().map(async (state) => {
      const currentTerm = await getCurrentTerm(state.slug);
      const { codes } = await getSitemapCourseIndex(currentTerm, state.slug);
      const lastModified = new Date();
      return codes.map((c) => ({
        url: `${url}/${state.slug}/course/${`${c.prefix}-${c.number}`.toLowerCase()}`,
        changeFrequency: "monthly" as const,
        priority: 0.5,
        lastModified,
      }));
    })
  );

  const entries: SitemapEntry[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  return xmlResponse(toSitemapXml(entries));
}
