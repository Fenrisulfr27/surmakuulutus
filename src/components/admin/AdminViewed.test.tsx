import { MantineProvider } from "@mantine/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import AdminViewed from "./AdminViewed";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("viewed details", () => {
  it("marks an obituary viewed only when details mount", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
    render(<MantineProvider><AdminViewed id="ad-id" unviewed /></MantineProvider>);
    await waitFor(() => expect(router.refresh).toHaveBeenCalled());
    expect(fetch).toHaveBeenCalledWith("/api/admin/kuulutused/ad-id/view", { method: "POST" });
  });

  it("does not write viewed metadata again after it is already recorded", () => {
    vi.stubGlobal("fetch", vi.fn());
    render(<MantineProvider><AdminViewed id="ad-id" unviewed={false} /></MantineProvider>);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("allows retry when saving viewed metadata fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValueOnce({ ok: false }).mockResolvedValueOnce({ ok: true }));
    render(<MantineProvider><AdminViewed id="ad-id" unviewed /></MantineProvider>);
    await screen.findByRole("alert");
    expect(router.refresh).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Proovi uuesti" }));
    await waitFor(() => expect(router.refresh).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
