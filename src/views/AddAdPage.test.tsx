import { MantineProvider } from "@mantine/core";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../context/LanguageContext";
import AddAdPage from "./AddAdPage";

vi.mock("../components/AddAdForm", () => ({ default: ({ onSubmit }: { onSubmit: (values: unknown) => Promise<void> }) =>
  <button onClick={() => onSubmit({ name: "Mari Mets" })}>Submit test form</button>,
}));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });

describe("manual submission acknowledgment", () => {
  it.each([
    ["et", "Kuulutus on avaldatud."],
    ["en", "Your obituary has been published."],
  ])("confirms publication in %s and replaces the form after success", async (language, message) => {
    window.sessionStorage.setItem("language", language);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "published" }) }));
    render(<MantineProvider><LanguageProvider><AddAdPage /></LanguageProvider></MantineProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Submit test form" }));
    expect((await screen.findByRole("status")).textContent).toBe(message);
    expect(screen.queryByRole("button", { name: "Submit test form" })).toBeNull();
  });
});
