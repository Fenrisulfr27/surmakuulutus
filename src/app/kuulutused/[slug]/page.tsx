import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdDetailsPage from "../../../views/AdDetailsPage";
import { getAdBySlug, type PublicAd } from "../../../lib/ads";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ from?: string }>;
}

async function getAd(slug: string): Promise<PublicAd | null> {
  return getAdBySlug(slug);
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://surmakuulutus.ee";
}

function getShareDescription(ad: PublicAd) {
  return `${ad.name} mälestuskuulutus. ${ad.topText ?? ""} ${ad.bottomText ?? ""}`.trim();
}

function getDateValue(value: PublicAd["birthYear"] | PublicAd["deathYear"]) {
  if (!value) {
    return undefined;
  }

  const date = value instanceof Date ? value : new Date(value);

  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ad = await getAd(slug);
  const title = ad
    ? `${ad.name} - mälestuskuulutus`
    : "Kuulutust ei leitud";
  const url = `/kuulutused/${slug}`;
  const description = ad
    ? getShareDescription(ad)
    : "Kuulutust ei leitud.";

  return {
    title: {
      absolute: ad ? `${title} | Surmakuulutus.ee` : "Kuulutust ei leitud",
    },
    description,
    keywords: ad
      ? [
          ad.name,
          "surmakuulutus",
          "surmakuulutused",
          "leinakuulutus",
          "leinakuulutused",
          "mälestuskuulutus",
          "mälestuskuulutused",
        ]
      : undefined,
    robots: {
      index: Boolean(ad),
      follow: true,
    },
    alternates: {
      canonical: new URL(url, getSiteUrl()).toString(),
    },
    openGraph: {
      title: ad ? `${title} | Surmakuulutus.ee` : title,
      description,
      url,
      type: "article",
      locale: "et_EE",
      siteName: "Surmakuulutused.ee",
      images: ["/og-preview.webp"],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-preview.webp"],
    },
  };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = (await searchParams) ?? {};
  const ad = await getAd(slug);

  if (!ad) {
    notFound();
  }

  const adUrl = new URL(`/kuulutused/${slug}`, getSiteUrl()).toString();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${ad.name} - Surmakuulutused`,
    name: ad.name,
    description: getShareDescription(ad),
    url: adUrl,
    datePublished: ad.createdAt,
    mainEntity: {
      "@type": "Person",
      name: ad.name,
      birthDate: getDateValue(ad.birthYear),
      deathDate: getDateValue(ad.deathYear),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AdDetailsPage ad={ad} from={query.from} />
    </>
  );
}
