import type { Metadata } from "next";
import Link from "next/link";
import { guides } from "../../lib/guides";

export const metadata: Metadata = {
  title: "Juhendid",
  description: "Praktilised juhendid lähedase surma, matuste, pärimise ja surmakuulutuse korraldamiseks.",
  alternates: { canonical: "/juhendid" },
};

export default function GuidesPage() {
  return (
    <section className="guides-page" aria-labelledby="guides-title">
      <header className="guides-heading">
        <p className="newspaper-date">TEAVE JA ABI</p>
        <h1 id="guides-title">Juhendid</h1>
        <p>Praktiline teave lähedase kaotuse järel vajalike toimingute kohta.</p>
      </header>
      <div className="guides-list" role="list">
        {guides.map((guide) => (
          <Link className="guide-list-item" href={`/juhendid/${guide.slug}`} key={guide.slug}>
            <article>
              <p className="newspaper-date">JUHEND</p>
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
