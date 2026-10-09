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

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ad = await getAd(slug);

  return {
    title: ad
      ? `${ad.name} – Surmakuulutused`
      : "Kuulutust ei leitud – Surmakuulutused",
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
