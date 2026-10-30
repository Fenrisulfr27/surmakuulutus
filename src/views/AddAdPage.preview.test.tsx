import { MantineProvider } from "@mantine/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../context/LanguageContext";
import AddAdPage from "./AddAdPage";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.sessionStorage.clear(); });

function renderPage(theme: "light" | "dark" = "light", language = "et") {
  window.sessionStorage.setItem("language", language);
  return render(<MantineProvider forceColorScheme={theme}><LanguageProvider><AddAdPage /></LanguageProvider></MantineProvider>);
}

describe("hybrid obituary preview", () => {
  it.each(["light", "dark"] as const)("shows a complete example without filling actual inputs in %s", (theme) => {
    const { container } = renderPage(theme);
    const preview = container.querySelector(".create-preview")!;
    expect(preview.querySelector(".newspaper-name")?.textContent).toBe("Eesnimi Perekonnanimi");
    expect(preview.querySelector(".newspaper-dates")?.textContent).toBe("15.05.1950 – 23.10.2026");
    expect(preview.querySelector(".newspaper-poem")?.textContent).toBe("Vaikselt lahkusid meie juurest,\nkuid mälestus Sinust jääb...");
    expect(preview.querySelectorAll('[data-example="true"]')).toHaveLength(6);
    expect(preview.textContent).not.toContain("nimi@näide.ee");
    for (const input of container.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("input, textarea")) {
      expect(input.value).toBe("");
    }
  });

  it("replaces individual examples, keeps line breaks, restores cleared fields, and never previews email", async () => {
    const { container } = renderPage();
    const name = screen.getByPlaceholderText("Eesnimi Perekonnanimi");
    const poem = screen.getByPlaceholderText(/Vaikselt lahkusid meie juurest/);
    fireEvent.change(name, { target: { value: "Mari Mets" } });
    fireEvent.change(poem, { target: { value: "Esimene\n\nTeine" } });
    fireEvent.change(screen.getByPlaceholderText("nimi@näide.ee"), { target: { value: "private@example.com" } });
    const preview = container.querySelector(".create-preview")!;
    await waitFor(() => expect(preview.querySelector(".newspaper-name")?.textContent).toBe("Mari Mets"));
    expect(preview.querySelector(".newspaper-name")?.hasAttribute("data-example")).toBe(false);
    expect(preview.querySelector(".newspaper-poem")?.textContent).toBe("Esimene\n\nTeine");
    expect(preview.querySelector(".newspaper-kicker")?.getAttribute("data-example")).toBe("true");
    expect(preview.textContent).not.toContain("private@example.com");
    fireEvent.change(name, { target: { value: "" } });
    fireEvent.change(poem, { target: { value: "" } });
    await waitFor(() => expect(preview.querySelector(".newspaper-name")?.getAttribute("data-example")).toBe("true"));
    expect(preview.querySelector(".newspaper-poem")?.getAttribute("data-example")).toBe("true");
  });

  it("validates and submits only actual input even while examples are visible", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ status: "published" }) });
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Avalda kuulutus" }));
    expect(await screen.findByText("Nimi on kohustuslik")).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByPlaceholderText("Eesnimi Perekonnanimi"), { target: { value: "Mari Mets" } });
    fireEvent.change(screen.getByPlaceholderText("Teatame sügava kurbusega, et meie seast on lahkunud"), { target: { value: "Mälestame" } });
    fireEvent.change(screen.getByPlaceholderText("Leinavad omaksed"), { target: { value: "Perekond" } });
    fireEvent.change(screen.getByPlaceholderText("nimi@näide.ee"), { target: { value: "private@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Avalda kuulutus" }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload).toMatchObject({ name: "Mari Mets", topText: "Mälestame", bottomText: "Perekond", email: "private@example.com", poem: "" });
    expect(payload.birthYear).toBeUndefined();
    expect(payload.deathYear).toBeUndefined();
    expect(JSON.stringify(payload)).not.toContain("Vaikselt lahkusid");
  });

  it("uses translated examples for the English preview", () => {
    const { container } = renderPage("light", "en");
    const preview = container.querySelector(".create-preview")!;
    expect(preview.querySelector(".newspaper-name")?.textContent).toBe("First name Last name");
    expect(preview.querySelector(".newspaper-footer")?.textContent).toBe("Mourned by loved ones");
  });
});
