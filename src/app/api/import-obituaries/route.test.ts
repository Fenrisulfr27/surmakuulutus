// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ importObituaries: vi.fn(), fetchObituaryArchive: vi.fn() }));
vi.mock("../../../lib/obituaryImport", () => mocks);
import { POST } from "./route";

afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });
const request = (token = "secret", query = "") => new Request(`https://example.test/api/import-obituaries${query}`, {
  method: "POST", headers: { authorization: `Bearer ${token}` },
});

describe("import endpoint", () => {
  it("fails closed without configured credentials or with incorrect credentials", async () => {
    vi.stubEnv("OBITUARY_IMPORT_SECRET", "");
    expect((await POST(request())).status).toBe(401);
    vi.stubEnv("OBITUARY_IMPORT_SECRET", "secret");
    expect((await POST(request("wrong!"))).status).toBe(401);
    expect(mocks.importObituaries).not.toHaveBeenCalled();
    expect(mocks.fetchObituaryArchive).not.toHaveBeenCalled();
  });
  it("previews without publishing and never returns source contents", async () => {
    vi.stubEnv("OBITUARY_IMPORT_SECRET", "secret");
    mocks.fetchObituaryArchive.mockResolvedValue({ ads: [{ name: "Private preview" }], invalid: 0 });
    const response = await POST(request("secret", "?dryRun=true"));
    expect(await response.json()).toEqual({ dryRun: true, found: 1, invalid: 0 });
    expect(mocks.importObituaries).not.toHaveBeenCalled();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
  it("returns counters and distinguishes partially invalid archives", async () => {
    vi.stubEnv("OBITUARY_IMPORT_SECRET", "secret");
    mocks.importObituaries.mockResolvedValue({ created: 1, existing: 3, remaining: 2, invalid: 0 });
    expect((await POST(request())).status).toBe(200);
    mocks.importObituaries.mockResolvedValue({ created: 1, existing: 3, invalid: 1 });
    expect((await POST(request())).status).toBe(207);
  });
  it("does not disclose internal errors", async () => {
    vi.stubEnv("OBITUARY_IMPORT_SECRET", "secret");
    mocks.importObituaries.mockRejectedValue(new Error("mongodb://secret"));
    const response = await POST(request());
    expect(response.status).toBe(502);
    expect(await response.text()).not.toContain("mongodb");
  });
});
