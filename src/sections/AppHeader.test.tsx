import { MantineProvider } from "@mantine/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../context/LanguageContext";
import { AppHeader } from "./AppHeader";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("admin navigation button", () => {
  it.each([false, true])("shows the button only for an authenticated administrator (%s)", async (authenticated) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ authenticated }) }));
    const client = new QueryClient();
    render(<QueryClientProvider client={client}><MantineProvider><LanguageProvider>
      <AppHeader />
    </LanguageProvider></MantineProvider></QueryClientProvider>);
    await waitFor(() => expect(client.getQueryState(["admin-session", "/"])?.status).toBe("success"));
    if (authenticated) {
      expect((await screen.findByRole("link", { name: "Admin" })).getAttribute("href")).toBe("/admin");
    } else {
      expect(screen.queryByRole("link", { name: "Admin" })).toBeNull();
    }
    client.clear();
  });
});
