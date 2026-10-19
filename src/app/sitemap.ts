import type { MetadataRoute } from "next";
import { listAdSitemapEntries } from "../lib/ads";
import { guides } from "../lib/guides";

export const dynamic = "force-dynamic";

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://surmakuulutus.ee";
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const ads = await listAdSitemapEntries();

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/lisa-kuulutus`,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${siteUrl}/juhendid`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...guides.map((guide) => ({
      url: `${siteUrl}/juhendid/${guide.slug}`,
      changeFrequency: "yearly" as const,
      priority: 0.6,
    })),
    ...ads.map((ad) => ({
      url: `${siteUrl}/kuulutused/${ad.slug}`,
      lastModified: ad.createdAt,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
