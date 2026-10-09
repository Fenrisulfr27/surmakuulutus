import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdDetailsPage from "../../../views/AdDetailsPage";
import { getAdBySlug, type Ad } from "../../../lib/ads";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ from?: string }>;
}

async function getAd(slug: string): Promise<Ad | null> {
  return getAdBySlug(slug);
}

function getSiteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://surmakuulutus.netlify.app";
}

function getShareDescription(ad: Ad) {
  return `Vaata mälestuskuulutust: ${ad.name}`;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ad = await getAd(slug);
  const title = ad
    ? `${ad.name} – Surmakuulutused`
    : "Kuulutust ei leitud – Surmakuulutused";
  const url = `/ads/${slug}`;
  const description = ad
    ? getShareDescription(ad)
    : "Kuulutust ei leitud.";

  return {
    title,
    description,
    alternates: {
      canonical: new URL(url, getSiteUrl()).toString(),
    },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      siteName: "Surmakuulutused",
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

  return <AdDetailsPage ad={ad} from={query.from} />;
}
