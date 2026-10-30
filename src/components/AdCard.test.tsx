import { MantineProvider } from "@mantine/core";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "../context/LanguageContext";
import AdCard from "./AdCard";

afterEach(cleanup);

describe("AdCard poem line breaks", () => {
  it("styles actual and example dates independently in the preview", () => {
    const { container } = render(
      <MantineProvider><LanguageProvider>
        <AdCard ad={{ name: "Mari Mets", birthYear: "1960-01-02" }} examplePreview />
      </LanguageProvider></MantineProvider>,
    );
    const dates = container.querySelectorAll(".newspaper-dates > span");
    expect(dates[0].textContent).toBe("02.01.1960");
    expect(dates[0].hasAttribute("data-example")).toBe(false);
    expect(dates[1].textContent).toBe("23.10.2026");
    expect(dates[1].getAttribute("data-example")).toBe("true");
    expect(container.querySelector(".newspaper-name")?.hasAttribute("data-example")).toBe(false);
  });

  it.each([
    ["escaped newlines", "First line\\nSecond line\\n\\nLast stanza"],
    ["real newlines", "First line\nSecond line\n\nLast stanza"],
  ])("renders %s as line breaks", (_, poem) => {
    const { container } = render(
      <MantineProvider>
        <LanguageProvider>
          <AdCard ad={{ name: "Test Name", poem }} />
        </LanguageProvider>
      </MantineProvider>,
    );

    const renderedPoem = container.querySelector(".newspaper-poem");
    expect(renderedPoem?.textContent).toBe("First line\nSecond line\n\nLast stanza");
    expect((renderedPoem as HTMLElement).style.whiteSpace).toBe("pre-wrap");
  });
});
