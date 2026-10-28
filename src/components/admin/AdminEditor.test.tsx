import { MantineProvider } from "@mantine/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../context/LanguageContext";
import type { AdminAd } from "../../lib/adminAds";
import AdminEditor from "./AdminEditor";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

const ad: AdminAd = {
  _id: "000000000000000000000001", name: "Mari Mets", email: "mari@example.test",
  topText: "Teatame kurbusega", bottomText: "Leinavad lähedased", poem: "",
  status: "pending", version: 0, unviewed: true, trashed: false,
};

beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ...ad, version: 1, deletedAt: "2026-10-28", trashed: true }) }));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function editor() {
  return render(<MantineProvider><LanguageProvider><AdminEditor ad={ad} /></LanguageProvider></MantineProvider>);
}

describe("administrator editor", () => {
  it("requires confirmation before soft deletion", async () => {
    editor();
    fireEvent.click(screen.getByRole("button", { name: "Kustuta" }));
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Kinnita kustutamine" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith(`/api/admin/kuulutused/${ad._id}`, expect.objectContaining({
      method: "PATCH", body: JSON.stringify({ action: "delete", version: 0 }),
    }));
    expect(await screen.findByRole("status")).toBeDefined();
  });

  it("reuses form validation and submits edits without Turnstile or duplicate requests", async () => {
    editor();
    let complete: (response: Response) => void = () => {};
    vi.mocked(fetch).mockReturnValue(new Promise((resolve) => { complete = resolve; }));
    const save = screen.getByRole("button", { name: "Salvesta muudatused" });
    fireEvent.click(save);
    fireEvent.click(save);
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
    const payload = JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string);
    expect(payload).toMatchObject({ action: "edit", version: 0, values: { name: ad.name, email: ad.email } });
    expect(payload.values).not.toHaveProperty("turnstileToken");
    complete(Response.json({ ...ad, version: 1 }));
    expect(await screen.findByRole("status")).toBeDefined();
  });
});
