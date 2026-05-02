import type { MetadataRoute } from "next";

// Keep in sync with SITEMAP_IDS in app/sitemap.ts.
const SITEMAP_IDS = [
  "core",
  "colleges",
  "college-subjects",
  "courses",
  "state-subjects",
  "transfer",
  "instructors",
  "programs",
  "blog",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://communitycollegepath.com";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/"],
    },
    sitemap: SITEMAP_IDS.map((id) => `${baseUrl}/sitemap/${id}.xml`),
  };
}
