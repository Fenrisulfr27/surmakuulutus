import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AdDetailsPage from "../../../views/AdDetailsPage";
import { getAdBySlug, type Ad } from "../../../lib/ads";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { slug: string };
}

async function getAd(slug: string): Promise<Ad | null> {
  return getAdBySlug(slug);
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const ad = await getAd(params.slug);

  return {
    title: ad
      ? `${ad.name} – Surmakuulutused`
      : "Kuulutust ei leitud – Surmakuulutused",
  };
}

export default async function Page({ params }: PageProps) {
  const ad = await getAd(params.slug);

  if (!ad) {
    notFound();
  }

  return <AdDetailsPage ad={ad} />;
}
