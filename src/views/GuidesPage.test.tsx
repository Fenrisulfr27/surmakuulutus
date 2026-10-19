import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { LanguageProvider } from "../context/LanguageContext";
import { useLanguage } from "../context/language";
import { getGuides } from "../lib/guides";
import GuidesPage from "./GuidesPage";
import GuidePage from "./GuidePage";

afterEach(() => {
  cleanup();
  window.sessionStorage.clear();
});

function SwitchLanguage() {
  const { language, setLanguage } = useLanguage();
  return <button onClick={() => setLanguage(language === "et" ? "en" : "et")}>Switch</button>;
}

it("switches guide listings, article content and labels in both directions", () => {
  render(
    <LanguageProvider>
      <SwitchLanguage />
      <GuidesPage />
      <GuidePage slug="lahedase-surm" />
    </LanguageProvider>,
  );

  expect(screen.getByRole("heading", { name: "Juhendid" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "Switch" }));
  expect(screen.getByRole("heading", { name: "Guides" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "First steps after a death" })).toBeDefined();
  expect(screen.getByRole("link", { name: "Back to guides" }).getAttribute("href")).toBe("/juhendid");
  expect(screen.getByRole("link", { name: "Tallinn: funeral benefit" })).toBeDefined();
  expect(screen.queryByText("Esimesed toimingud pärast surma")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Switch" }));
  expect(screen.getByRole("heading", { name: "Esimesed toimingud pärast surma" })).toBeDefined();
});

it("translates every guide without losing sections, steps, links or source destinations", () => {
  const english = getGuides("en");
  const estonian = getGuides("et");
  expect(english).toHaveLength(estonian.length);
  for (const [index, guide] of english.entries()) {
    const original = estonian[index];
    expect(guide.slug).toBe(original.slug);
    expect(guide.reviewed).toBe(original.reviewed);
    expect(guide.title).not.toBe(original.title);
    expect(guide.summary).not.toBe(original.summary);
    expect(guide.paragraphs).toHaveLength(original.paragraphs.length);
    expect(guide.points).toHaveLength(original.points.length);
    expect(guide.sections?.map((section) => section.paragraphs.length)).toEqual(
      original.sections?.map((section) => section.paragraphs.length),
    );
    expect(guide.sources.map((source) => source.url)).toEqual(original.sources.map((source) => source.url));
    for (const source of guide.sources) expect(source.label).toBeTruthy();
    expect(guide.links?.map((link) => link.href)).toEqual(original.links?.map((link) => link.href));
  }
});
