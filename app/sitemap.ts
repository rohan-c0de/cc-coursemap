import type { MetadataRoute } from "next";
import institutionsData from "@/data/institutions.json";
import type { Institution } from "@/lib/types";

const institutions = institutionsData as Institution[];

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://auditmap.virginia.example.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/courses`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/schedule`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/colleges`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${baseUrl}/about`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const collegePages: MetadataRoute.Sitemap = institutions.map((inst) => ({
    url: `${baseUrl}/college/${inst.id}`,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...collegePages];
}
