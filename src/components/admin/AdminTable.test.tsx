import { MantineProvider } from "@mantine/core";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminFilters, AdminTable } from "./AdminTable";
import type { AdminAd } from "../../lib/adminAds";

const router = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }));
const resizeObserver = globalThis.ResizeObserver;
vi.mock("next/navigation", () => ({ useRouter: () => router }));
const ad: AdminAd = {
  _id: "000000000000000000000001", name: "Mari Mets", email: "mari@example.test",
  status: "pending", version: 0, unviewed: true, trashed: false, submitterIp: "203.0.113.10",
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("ResizeObserver", resizeObserver);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...ad, version: 1, status: "published" }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.useRealTimers(); });

function table(values = ad) {
  return render(<MantineProvider><AdminTable rows={[values]} /></MantineProvider>);
}

describe("moderation table", () => {
  it("shows the new badge, private sender information and edit links without marking viewed", () => {
    table();
    expect(screen.getByText("UUS!")).toBeDefined();
    expect(screen.getByText(ad.email)).toBeDefined();
    expect(screen.getByRole("link", { name: ad.submitterIp }).getAttribute("href")).toBe("/admin/kuulutused?ip=203.0.113.10");
    expect(screen.getByRole("link", { name: "Muuda" }).getAttribute("href")).toBe(`/admin/kuulutused/${ad._id}`);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not label viewed submissions as new", () => {
    table({ ...ad, unviewed: false });
    expect(screen.queryByText("UUS!")).toBeNull();
  });

  it("offers trash recovery rather than archive actions", async () => {
    table({ ...ad, status: "published", trashed: true, deletedAt: "2026-10-28" });
    expect(screen.queryByRole("button", { name: "Arhiveeri" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Kustuta" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Taasta ja avalda" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(`/api/admin/kuulutused/${ad._id}`, expect.objectContaining({
      body: JSON.stringify({ action: "restore", version: 0 }),
    }));
  });

  it.each([["Avalda", "published"], ["Lükka tagasi", "rejected"]])("supports quick action %s with version protection", async (label, status) => {
    table();
    fireEvent.click(screen.getByRole("button", { name: label }));
    await screen.findByRole("status");
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(`/api/admin/kuulutused/${ad._id}`, expect.objectContaining({
      method: "PATCH", body: JSON.stringify({ action: "status", status, version: 0 }),
    }));
    expect(router.refresh).toHaveBeenCalled();
  });

  it("waits for confirmation before deleting from a table row", async () => {
    table();
    fireEvent.click(screen.getByRole("button", { name: "Kustuta" }));
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Kinnita kustutamine" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(`/api/admin/kuulutused/${ad._id}`, expect.objectContaining({
      body: JSON.stringify({ action: "delete", version: 0 }),
    }));
  });

  it("shows mutation failures and leaves the record unchanged", async () => {
    vi.mocked(fetch).mockResolvedValue(Response.json({ error: "Kuulutust on muudetud." }, { status: 409 }));
    table();
    fireEvent.click(screen.getByRole("button", { name: "Avalda" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Kuulutust on muudetud.");
    expect(screen.getByText("Ootel")).toBeDefined();
  });

  it("keeps IP, unviewed, search, status, source and sorting filters in the same GET form", () => {
    const { container } = render(<MantineProvider><AdminFilters
      query="ip=203.0.113.10&unviewed=true&search=Mari&status=pending&source=manual&sort=oldest" />
    </MantineProvider>);
    const values = new FormData(container.querySelector("form")!);
    expect(Object.fromEntries(values)).toMatchObject({
      ip: "203.0.113.10", unviewed: "true", search: "Mari", status: "pending", source: "manual", sort: "oldest",
    });
    expect(screen.queryByRole("button", { name: "Rakenda" })).toBeNull();
  });

  it("applies sorting immediately, retains other filters and resets pagination", () => {
    render(<MantineProvider><AdminFilters query="search=Mari&status=published&source=manual&page=3" /></MantineProvider>);
    fireEvent.click(screen.getByRole("textbox", { name: "Järjestus" }));
    fireEvent.click(screen.getByRole("option", { name: "Vanemad enne" }));
    expect(router.replace).toHaveBeenCalledWith("/admin/kuulutused?search=Mari&status=published&source=manual&sort=oldest", { scroll: false });
  });

  it("debounces typing and preserves focus when the resulting URL arrives", () => {
    vi.useFakeTimers();
    const { rerender } = render(<MantineProvider><AdminFilters query="page=3" /></MantineProvider>);
    const search = screen.getByRole("textbox", { name: "Otsi nime järgi" });
    search.focus();
    fireEvent.change(search, { target: { value: "Ma" } });
    fireEvent.change(search, { target: { value: "Mari" } });
    expect(router.replace).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(350));
    expect(router.replace).toHaveBeenCalledTimes(1);
    expect(router.replace).toHaveBeenCalledWith("/admin/kuulutused?search=Mari", { scroll: false });
    rerender(<MantineProvider><AdminFilters query="search=Mari" /></MantineProvider>);
    expect(document.activeElement).toBe(search);
    rerender(<MantineProvider><AdminFilters query="search=Other" /></MantineProvider>);
    expect((search as HTMLInputElement).value).toBe("Other");
  });
});
