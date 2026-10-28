import { describe, expect, it, vi } from "vitest";

const getAdministrator = vi.hoisted(() => vi.fn());
vi.mock("../../../../lib/adminAuth", () => ({ getAdministrator }));

describe("admin session indicator", () => {
  it.each([null, { id: "private-admin-id" }])("returns only authentication state (%s)", async (administrator) => {
    getAdministrator.mockResolvedValue(administrator);
    const { GET } = await import("./route");
    const response = await GET(new Request("http://localhost/api/admin/session"));
    expect(await response.json()).toEqual({ authenticated: Boolean(administrator) });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
