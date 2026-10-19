import type { Metadata } from "next";
import GuidePageContent from "../../../views/GuidePage";
import { notFound } from "next/navigation";
import { getGuide, guides } from "../../../lib/guides";

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = getGuide((await params).slug);
  if (!guide) return {};
  return {
    title: guide.title,
    description: guide.summary,
    alternates: { canonical: `/juhendid/${guide.slug}` },
    openGraph: { title: guide.title, description: guide.summary, type: "article" },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = getGuide((await params).slug);
  if (!guide) notFound();

  return <GuidePageContent slug={guide.slug} />;
}
