import {
  toSitemapXml,
  siteOrigin,
  xmlResponse,
  type SitemapEntry,
} from "@/lib/sitemap-xml";

export const revalidate = 86400;

export async function GET() {
  const entries: SitemapEntry[] = [];

  return xmlResponse(toSitemapXml(entries));
}
