import { MantineProvider } from "@mantine/core";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LanguageProvider } from "../context/LanguageContext";
import AdCard from "./AdCard";

afterEach(cleanup);

describe("AdCard poem line breaks", () => {
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
