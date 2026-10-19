import type { Metadata } from "next";
import Link from "next/link";
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

  return (
    <article className="guide-page">
      <Link className="guide-back-link" href="/juhendid">Tagasi juhendite juurde</Link>
      <header className="guide-heading">
        <p className="newspaper-date">JUHEND</p>
        <h1>{guide.title}</h1>
        <p>{guide.summary}</p>
      </header>
      <div className="guide-content">
        {guide.sections ? (
          <>
            <h2>Lühidalt</h2>
            {guide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {guide.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                <ol className="guide-section-steps">
                  {section.paragraphs.map((paragraph) => <li key={paragraph}>{paragraph}</li>)}
                </ol>
              </section>
            ))}
          </>
        ) : (
          <>
            {guide.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <h2>Sammud</h2>
            <ol>{guide.points.map((point) => <li key={point}>{point}</li>)}</ol>
          </>
        )}
        {guide.links?.map((link) => <p key={link.href}><Link href={link.href}>{link.label}</Link></p>)}
        <p className="guide-reviewed">Viimati üle vaadatud: {guide.reviewed}</p>
        {guide.sources.length > 0 && (
          <footer className="guide-sources">
            <h2>Allikad</h2>
            <ul>{guide.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>
          </footer>
        )}
      </div>
    </article>
  );
}
