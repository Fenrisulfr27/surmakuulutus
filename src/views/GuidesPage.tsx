"use client";

import Link from "next/link";
import { useLanguage } from "../context/language";
import { getGuides } from "../lib/guides";

export default function GuidesPage() {
  const { language, t } = useLanguage();
  const guides = getGuides(language);

  return (
    <section className="guides-page" aria-labelledby="guides-title">
      <header className="guides-heading">
        <p className="newspaper-date">{t("guides.eyebrow")}</p>
        <h1 id="guides-title">{t("nav.guides")}</h1>
        <p>{t("guides.intro")}</p>
      </header>
      <div className="guides-list" role="list">
        {guides.map((guide) => (
          <Link className="guide-list-item" href={`/juhendid/${guide.slug}`} key={guide.slug}>
            <article>
              <p className="newspaper-date">{t("guides.guide")}</p>
              <h2>{guide.title}</h2>
              <p>{guide.summary}</p>
              <span className="guide-list-arrow" aria-hidden="true">→</span>
            </article>
          </Link>
        ))}
      </div>
    </section>
  );
}
