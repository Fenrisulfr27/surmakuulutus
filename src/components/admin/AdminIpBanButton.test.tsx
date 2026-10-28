import { MantineProvider } from "@mantine/core";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import AdminIpBanButton from "./AdminIpBanButton";

const router = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => router }));
beforeEach(() => { vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const ip = "203.0.113.10";

describe("IP ban controls", () => {
  it("requires confirmation before banning, then offers unban", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ip, blocked: true })));
    render(<MantineProvider><AdminIpBanButton ip={ip} /></MantineProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Blokeeri IP" }));
    expect(fetch).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "Kinnita IP-keeld" }));
    expect(await screen.findByRole("button", { name: "Tühista IP-keeld" })).toBeDefined();
    expect(fetch).toHaveBeenCalledWith("/api/admin/ip-bans", expect.objectContaining({
      method: "POST", body: JSON.stringify({ ip, blocked: true }),
    }));
    expect(router.refresh).toHaveBeenCalled();
  });

  it("reverses an existing ban", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ip, blocked: false })));
    render(<MantineProvider><AdminIpBanButton ip={ip} blocked /></MantineProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Tühista IP-keeld" }));
    expect(await screen.findByRole("button", { name: "Blokeeri IP" })).toBeDefined();
    expect(fetch).toHaveBeenCalledWith("/api/admin/ip-bans", expect.objectContaining({ body: JSON.stringify({ ip, blocked: false }) }));
  });

  it("shows failed requests without changing ban state", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: "Palun logi sisse" }, { status: 401 })));
    render(<MantineProvider><AdminIpBanButton ip={ip} blocked /></MantineProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Tühista IP-keeld" }));
    expect((await screen.findByRole("alert")).textContent).toBe("Palun logi sisse");
    await waitFor(() => expect(screen.getByRole("button", { name: "Tühista IP-keeld" }).hasAttribute("disabled")).toBe(false));
    expect(router.refresh).not.toHaveBeenCalled();
  });
});
