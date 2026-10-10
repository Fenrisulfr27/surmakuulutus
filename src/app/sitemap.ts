import type { MetadataRoute } from "next";
import { listAdSitemapEntries } from "../lib/ads";

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
    ...ads.map((ad) => ({
      url: `${siteUrl}/kuulutused/${ad.slug}`,
      lastModified: ad.createdAt,
      changeFrequency: "yearly" as const,
      priority: 0.8,
    })),
  ];
}
