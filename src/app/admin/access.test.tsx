// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdministrator: vi.fn(), getAdminDashboard: vi.fn(), listAdminAds: vi.fn(),
  getAdminAd: vi.fn(), listAdminActivity: vi.fn(),
  listIpBans: vi.fn(),
}));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/navigation", () => ({ redirect: (path: string) => { throw new Error(`redirect:${path}`); } }));
vi.mock("../../lib/adminAuth", () => ({ getAdministrator: mocks.getAdministrator }));
vi.mock("../../lib/adminAds", () => ({ getAdminDashboard: mocks.getAdminDashboard, listAdminAds: mocks.listAdminAds, getAdminAd: mocks.getAdminAd }));
vi.mock("../../lib/adminAudit", () => ({ listAdminActivity: mocks.listAdminActivity }));
vi.mock("../../lib/ipBans", () => ({ listIpBans: mocks.listIpBans }));

beforeEach(() => { vi.clearAllMocks(); mocks.getAdministrator.mockResolvedValue(null); });

describe("administrator page access", () => {
  it("renders login at /admin without loading dashboard data", async () => {
    const { default: Page } = await import("./page");
    expect(await Page()).toBeTruthy();
    expect(mocks.getAdminDashboard).not.toHaveBeenCalled();
  });

  it("redirects anonymous management, editor, and log pages before any data read", async () => {
    const { default: List } = await import("./kuulutused/page");
    const { default: Edit } = await import("./kuulutused/[id]/page");
    const { default: Log } = await import("./logi/page");
    const { default: Bans } = await import("./ip-keelud/page");
    await expect(List({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/admin");
    await expect(Edit({ params: Promise.resolve({ id: "000000000000000000000001" }) })).rejects.toThrow("redirect:/admin");
    await expect(Log({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/admin");
    await expect(Bans({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/admin");
    expect(mocks.listAdminAds).not.toHaveBeenCalled();
    expect(mocks.getAdminAd).not.toHaveBeenCalled();
    expect(mocks.listAdminActivity).not.toHaveBeenCalled();
    expect(mocks.listIpBans).not.toHaveBeenCalled();
  });
});
