"use client";

import Link from "next/link";
import { useLanguage } from "../context/language";
import { getGuide } from "../lib/guides";

export default function GuidePage({ slug }: { slug: string }) {
  const { language, t } = useLanguage();
  const guide = getGuide(slug, language);
  if (!guide) return null;

  return (
    <article className="guide-page">
      <Link className="guide-back-link" href="/juhendid">{t("guides.back")}</Link>
      <header className="guide-heading">
        <p className="newspaper-date">{t("guides.guide")}</p>
        <h1>{guide.title}</h1>
        <p>{guide.summary}</p>
      </header>
      <div className="guide-content">
        {guide.sections ? (
          <>
            <h2>{t("guides.brief")}</h2>
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
            <h2>{t("guides.steps")}</h2>
            <ol>{guide.points.map((point) => <li key={point}>{point}</li>)}</ol>
          </>
        )}
        {guide.links?.map((link) => <p key={link.href}><Link href={link.href}>{link.label}</Link></p>)}
        <p className="guide-reviewed">{t("guides.reviewed")} {guide.reviewed}</p>
        {guide.sources.length > 0 && (
          <footer className="guide-sources">
            <h2>{t("guides.sources")}</h2>
            <ul>{guide.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}</a></li>)}</ul>
          </footer>
        )}
      </div>
    </article>
  );
}
