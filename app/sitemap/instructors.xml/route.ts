import { getAllStates } from "@/lib/states/registry";
import { getInstructorSitemapEntries } from "@/lib/instructors";
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
      const instructors = await getInstructorSitemapEntries(
        currentTerm,
        state.slug
      );
      return instructors.map((e) => ({
        url: `${url}/${state.slug}/college/${e.collegeId}/instructor/${e.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
    })
  );

  const entries: SitemapEntry[] = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : []
  );

  return xmlResponse(toSitemapXml(entries));
}
