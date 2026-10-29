// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const origin = "http://localhost:3000";
const credentials = { email: "admin@example.test", password: "test-only-long-password-123" };
const validAd = {
  name: "Mari Mets", email: "mari@example.test", poem: "Mälestus jääb.",
  topText: "Teatame kurbusega", bottomText: "Leinavad lähedased", birthYear: "1930-01-01", deathYear: "2026-01-01",
};
let database: MongoMemoryReplSet;
let ads: typeof import("./ads");
let management: typeof import("./adminAds");
let auth: typeof import("./adminAuth");
let authRoute: typeof import("../app/api/admin/auth/[...all]/route");
let itemRoute: typeof import("../app/api/admin/kuulutused/[id]/route");
let listRoute: typeof import("../app/api/admin/kuulutused/route");
let bans: typeof import("./ipBans");
let banRoute: typeof import("../app/api/admin/ip-bans/route");
let viewRoute: typeof import("../app/api/admin/kuulutused/[id]/view/route");
const getAdminAd = (id: string) => management.getAdminAd(id, "test-admin");
const listAdminAds = (params: URLSearchParams) => management.listAdminAds(params, "test-admin");

function request(path: string, body?: unknown, cookie?: string, requestOrigin = origin) {
  return new Request(`${origin}${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { origin: requestOrigin, "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

async function login() {
  const response = await authRoute.POST(request("/api/admin/auth/sign-in/email", credentials));
  expect(response.status).toBe(200);
  const cookies = response.headers.getSetCookie();
  return { response, cookie: cookies.map((value) => value.split(";")[0]).join("; ") };
}

async function patch(id: string, body: unknown, cookie?: string, requestOrigin = origin) {
  return itemRoute.PATCH(new Request(`${origin}/api/admin/kuulutused/${id}`, {
    method: "PATCH", headers: { origin: requestOrigin, "content-type": "application/json", ...(cookie ? { cookie } : {}) },
    body: JSON.stringify(body),
  }), { params: Promise.resolve({ id }) });
}

beforeAll(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  vi.stubEnv("MONGO_URI", database.getUri("admin_tests"));
  vi.stubEnv("ADMIN_EMAIL", credentials.email);
  vi.stubEnv("ADMIN_PASSWORD", credentials.password);
  vi.stubEnv("BETTER_AUTH_URL", origin);
  vi.stubEnv("BETTER_AUTH_SECRET", "isolated-test-secret-at-least-32-characters-long");
  const setup = await run(process.execPath, ["scripts/setup-admin.mjs"], { env: process.env });
  expect(setup.stdout).toContain("Administrator created");
  ads = await import("./ads");
  management = await import("./adminAds");
  auth = await import("./adminAuth");
  authRoute = await import("../app/api/admin/auth/[...all]/route");
  itemRoute = await import("../app/api/admin/kuulutused/[id]/route");
  listRoute = await import("../app/api/admin/kuulutused/route");
  bans = await import("./ipBans");
  banRoute = await import("../app/api/admin/ip-bans/route");
  viewRoute = await import("../app/api/admin/kuulutused/[id]/view/route");
  const { connectToDatabase } = await import("./mongodb");
  await connectToDatabase();
  await ads.AdModel.init();
  await bans.IpBanModel.init();
  const { AdminActivity } = await import("./adminAudit");
  await AdminActivity.init();
}, 180_000);

beforeEach(async () => {
  await ads.AdModel.deleteMany({});
  await bans.IpBanModel.deleteMany({});
  await mongoose.connection.db!.collection("rateLimit").deleteMany({});
  await mongoose.connection.db!.collection("session").deleteMany({});
  await mongoose.connection.db!.collection("admin_activity").deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await database?.stop();
  vi.unstubAllEnvs();
}, 30_000);

describe("administrator authentication", () => {
  it("keeps imported records editable without inventing an email or truncating text", async () => {
    const sourceUrl = "https://www.surmakuulutused.ee/kuulutused/mari-mets/";
    const poem = "Pikem luuletus. ".repeat(40);
    const record = await ads.AdModel.create({ name: "Mari Mets", sourceUrl, slug: "imported-mari", poem,
      topText: "", bottomText: "", status: "published" });
    const edited = await management.mutateAdminAd(String(record._id), {
      action: "edit", version: 0, values: { name: "Mari Kask", email: "", poem, topText: "", bottomText: "" },
    }, "test-admin");
    expect(edited.name).toBe("Mari Kask");
    expect(edited.poem).toBe(poem);
    expect(edited.sourceUrl).toBe(sourceUrl);
    expect(edited.email).toBe("");
    const imported = await listAdminAds(new URLSearchParams("source=imported"));
    expect(imported.total).toBe(1);
    expect((await listAdminAds(new URLSearchParams("source=manual"))).total).toBe(0);
    expect(() => management.parseAdminCommand({ action: "edit", version: 0,
      values: { name: "Mari Kask", email: "", poem, topText: "", bottomText: "" },
    })).toThrow();
  });

  it("rejects anonymous APIs and all unauthorized changes", async () => {
    expect((await listRoute.GET(request("/api/admin/kuulutused"))).status).toBe(401);
    expect((await itemRoute.GET(request("/api/admin/kuulutused/invalid"), { params: Promise.resolve({ id: "invalid" }) })).status).toBe(401);
    expect((await patch("000000000000000000000001", { action: "delete", version: 0 })).status).toBe(401);
  });

  it("rejects invalid credentials and creates an HTTP-only session for valid credentials", async () => {
    const invalid = await authRoute.POST(request("/api/admin/auth/sign-in/email", { ...credentials, password: "wrong-password" }));
    expect(invalid.status).toBe(401);
    const { cookie, response } = await login();
    expect(response.headers.get("set-cookie")).toMatch(/HttpOnly/i);
    expect(response.headers.get("set-cookie")).toMatch(/SameSite=Strict/i);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await response.json()).toEqual({ ok: true });
    expect(await auth.getAdministrator(new Headers({ cookie }))).toBeTruthy();
    const session = await mongoose.connection.db!.collection("session").findOne();
    expect(session!.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(8 * 60 * 60 * 1000);
    expect(session!.expiresAt.getTime() - Date.now()).toBeGreaterThan(7 * 60 * 60 * 1000);
    expect((await listRoute.GET(request("/api/admin/kuulutused", undefined, cookie))).status).toBe(200);
  });

  it("invalidates the server session on logout, including a replayed cookie", async () => {
    const { cookie } = await login();
    const response = await authRoute.POST(request("/api/admin/auth/sign-out", {}, cookie));
    expect(response.status).toBe(200);
    expect(await auth.getAdministrator(new Headers({ cookie }))).toBeNull();
  });

  it("rejects expired sessions", async () => {
    const { cookie } = await login();
    await mongoose.connection.db!.collection("session").updateMany({}, { $set: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await auth.getAdministrator(new Headers({ cookie }))).toBeNull();
  });

  it("rejects cross-origin login and authenticated mutations", async () => {
    expect((await authRoute.POST(request("/api/admin/auth/sign-in/email", credentials, undefined, "https://evil.test"))).status).toBe(403);
    const { cookie } = await login();
    expect((await patch("000000000000000000000001", { action: "delete", version: 0 }, cookie, "https://evil.test")).status).toBe(403);
  });

  it("has no public registration endpoint", async () => {
    expect((await authRoute.POST(request("/api/admin/auth/sign-up/email", { ...credentials, name: "Attacker" }))).status).toBe(404);
    const instance = await auth.getAdminAuth();
    const response = await instance.handler(request("/api/admin/auth/sign-up/email", { ...credentials, name: "Attacker" }));
    expect(response.ok).toBe(false);
  });

  it("limits concurrent login attempts even when IP headers vary", async () => {
    const responses = await Promise.all(Array.from({ length: 8 }, (_, i) => {
      const attempt = request("/api/admin/auth/sign-in/email", { ...credentials, password: "incorrect" });
      attempt.headers.set("x-forwarded-for", `203.0.113.${i + 1}`);
      return authRoute.POST(attempt);
    }));
    const rateRows = await mongoose.connection.db!.collection("rateLimit").find().toArray();
    expect(rateRows.map((row) => ({ key: row.key, count: row.count }))).toEqual([{ key: expect.any(String), count: 5 }]);
    expect(responses.filter((response) => response.status === 429)).toHaveLength(3);
    expect(responses.every((response) => [401, 429].includes(response.status))).toBe(true);
  });

  it("disallows a session when the authorized administrator changes", async () => {
    const { cookie } = await login();
    vi.stubEnv("ADMIN_EMAIL", "another@example.test");
    expect(await auth.getAdministrator(new Headers({ cookie }))).toBeNull();
    vi.stubEnv("ADMIN_EMAIL", credentials.email);
  });
});

describe("publication and moderation", () => {
  it("retains the trusted manual submitter IP while preserving hashed logs and anti-spam checks", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousNetlify = process.env.NETLIFY;
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("NETLIFY", "true");
    const logs = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      const { POST } = await import("../app/api/ads/route");
      const ip = "198.51.100.200";
      const incoming = () => new Request(`${origin}/api/ads`, {
        method: "POST", headers: {
          "content-type": "application/json", origin, "x-nf-client-connection-ip": ip,
          "x-forwarded-for": "203.0.113.99",
        },
        body: JSON.stringify({ ...validAd, turnstileToken: "dev-turnstile-token", website: "" }),
      });
      expect((await POST(incoming())).status).toBe(201);
      const stored = await ads.AdModel.collection.findOne({ name: validAd.name });
      expect(stored!.submitterIp).toBe(ip);
      expect(stored!.status).toBe("published");
      expect((await POST(incoming())).status).toBe(400); // A reused Turnstile token is still rejected.
      expect(JSON.stringify(logs.mock.calls)).not.toContain(ip);
      expect(logs).toHaveBeenCalledWith("security.submission", expect.objectContaining({
        event: "submission_accepted", ipHash: expect.stringMatching(/^[a-f\d]{64}$/), ipSource: "x-nf-client-connection-ip",
      }));
    } finally {
      logs.mockRestore();
      vi.stubEnv("NODE_ENV", previousNodeEnv);
      vi.stubEnv("NETLIFY", previousNetlify);
    }
  });

  it("keeps pending, rejected, archived, and deleted records out of every public read", async () => {
    await ads.AdModel.create([
      ...["pending", "published", "rejected", "archived"].map((status) => ({ ...validAd, name: status, slug: status, status })),
      { ...validAd, name: "deleted", slug: "deleted", status: "published", deletedAt: new Date() },
    ]);
    const page = await ads.listAds({ search: "", limit: 50 });
    expect(page.totalAds).toBe(1);
    expect(page.data.map((ad) => ad.slug)).toEqual(["published"]);
    for (const slug of ["pending", "rejected", "archived", "deleted"]) expect(await ads.getAdBySlug(slug)).toBeNull();
    expect(await ads.getAdBySlug("published")).toBeTruthy();
    expect((await ads.listAdSitemapEntries()).map((ad) => ad.slug)).toEqual(["published"]);
  });

  it("publishes manual submissions automatically and still supports trash removal", async () => {
    const submitted = await ads.createAd({ ...validAd, status: "pending" } as typeof validAd);
    const current = (await getAdminAd(submitted._id!))!;
    expect(current.status).toBe("published");
    expect(await ads.getAdBySlug(submitted.slug!)).toBeTruthy();
    const { cookie } = await login();
    const rejected = await patch(current._id, { action: "status", status: "rejected", version: current.version }, cookie);
    expect(rejected.status).toBe(409);
    expect((await patch(current._id, { action: "status", status: "archived", version: current.version }, cookie)).status).toBe(400);
    expect((await patch(current._id, { action: "delete", version: current.version }, cookie)).status).toBe(200);
    expect(await ads.getAdBySlug(submitted.slug!)).toBeNull();
  });

  it("publishes AI obituaries automatically and preserves retry deduplication after deletion", async () => {
    const result = await ads.createAiGeneratedAd(validAd, "2026-10-28", "2026-10-28:test");
    expect(result.created).toBe(true);
    const current = (await getAdminAd(result.ad!._id!))!;
    expect(current.status).toBe("published");
    expect(current.aiGenerated).toBe(true);
    expect(await ads.getAdBySlug(result.ad!.slug!)).toBeTruthy();
    await management.mutateAdminAd(current._id, { action: "delete", version: current.version }, "test-admin");
    expect(await ads.findAiGeneratedAdByKey("2026-10-28:test")).toBeTruthy();
    expect(await ads.getAdBySlug(result.ad!.slug!)).toBeNull();
  });

  it("preserves legacy visibility and runs migration idempotently without overwriting assigned statuses", async () => {
    const createdAt = new Date("2020-01-01T00:00:00Z");
    await ads.AdModel.collection.insertMany([
      { ...validAd, slug: "legacy", createdAt },
      { ...validAd, slug: "pending", status: "pending", createdAt },
    ]);
    expect(await ads.getAdBySlug("legacy")).toBeTruthy();
    const dryRun = await run(process.execPath, ["scripts/migrate-obituary-status.mjs"], { env: process.env });
    expect(dryRun.stdout).toContain("Dry run");
    expect((await ads.AdModel.collection.findOne({ slug: "legacy" }))!.status).toBeUndefined();
    for (let i = 0; i < 2; i++) await run(process.execPath, ["scripts/migrate-obituary-status.mjs", "--apply"], { env: process.env });
    const legacy = await ads.AdModel.collection.findOne({ slug: "legacy" });
    expect(legacy!.status).toBe("published");
    expect(legacy!.createdAt).toEqual(createdAt);
    expect((await ads.AdModel.collection.findOne({ slug: "pending" }))!.status).toBe("pending");
    expect(await ads.getAdBySlug("legacy")).toBeTruthy();
  });
});

describe("obituary management", () => {
  it("marks details viewed per administrator without changing content versions or timestamps", async () => {
    const submitted = await ads.createAd(validAd);
    const { cookie } = await login();
    const administrator = (await auth.getAdministrator(new Headers({ cookie })))!;
    const id = submitted._id!;
    const before = (await management.getAdminAd(id, administrator.id))!;
    expect(before.unviewed).toBe(true);
    const list = await listRoute.GET(request("/api/admin/kuulutused?unviewed=true", undefined, cookie));
    expect((await list.json()).total).toBe(1);
    await itemRoute.GET(request(`/api/admin/kuulutused/${id}`, undefined, cookie), { params: Promise.resolve({ id }) });
    expect((await management.getAdminAd(id, administrator.id))!.unviewed).toBe(true);
    for (let i = 0; i < 2; i++) {
      expect((await viewRoute.POST(request(`/api/admin/kuulutused/${id}/view`, {}, cookie), { params: Promise.resolve({ id }) })).status).toBe(200);
    }
    const after = (await management.getAdminAd(id, administrator.id))!;
    expect(after).toMatchObject({ unviewed: false, version: before.version, updatedAt: before.updatedAt, createdAt: before.createdAt });
    expect((await management.listAdminAds(new URLSearchParams({ unviewed: "true" }), administrator.id)).total).toBe(0);
    expect((await management.listAdminAds(new URLSearchParams({ unviewed: "true" }), "different-admin")).total).toBe(1);
    const stored = await ads.AdModel.collection.findOne({ slug: submitted.slug });
    expect(stored!.viewedBy).toEqual([administrator.id]);
  });

  it("requires authorization and same-origin requests to mark an obituary viewed", async () => {
    const submitted = await ads.createAd(validAd);
    const id = submitted._id!;
    const context = { params: Promise.resolve({ id }) };
    expect((await viewRoute.POST(request(`/api/admin/kuulutused/${id}/view`, {}), context)).status).toBe(401);
    const { cookie } = await login();
    expect((await viewRoute.POST(request(`/api/admin/kuulutused/${id}/view`, {}, cookie, "https://evil.test"), context)).status).toBe(403);
    expect((await viewRoute.POST(request("/api/admin/kuulutused/invalid/view", {}, cookie), { params: Promise.resolve({ id: "invalid" }) })).status).toBe(404);
    expect((await viewRoute.POST(request("/api/admin/kuulutused/missing/view", {}, cookie), { params: Promise.resolve({ id: "000000000000000000000001" }) })).status).toBe(404);
    expect((await getAdminAd(id))!.unviewed).toBe(true);
  });

  it("prioritizes pending and unviewed submissions and exposes current pending counts", async () => {
    const viewedBy = ["test-admin"];
    const old = new Date("2020-01-01");
    await ads.AdModel.create([
      { ...validAd, slug: "recent-published", status: "published", createdAt: new Date() },
      { ...validAd, slug: "viewed-pending", status: "pending", viewedBy, createdAt: new Date() },
      { ...validAd, slug: "unviewed-pending", status: "pending", createdAt: old },
      { ...validAd, slug: "deleted-pending", status: "pending", deletedAt: new Date() },
    ]);
    const dashboard = await management.getAdminDashboard("test-admin");
    expect(dashboard.recent.map((ad) => ad.slug)).toEqual(["unviewed-pending", "viewed-pending", "recent-published"]);
    expect(dashboard.unviewed).toBe(2);
    expect(await management.getPendingAdminCount()).toBe(2);
  });

  it("stores retained IPs privately, canonicalizes IPv6, and combines IP and unviewed filters", async () => {
    const ip = "2001:db8::1";
    const submitted = await ads.createAd(validAd, "2001:0DB8:0000:0000:0000:0000:0000:0001");
    const stored = await ads.AdModel.collection.findOne({ slug: submitted.slug });
    expect(stored!.submitterIp).toBe(ip);
    expect(stored).not.toHaveProperty("submitterIpExpiresAt");
    expect(submitted).not.toHaveProperty("submitterIp");
    const current = (await getAdminAd(submitted._id!))!;
    expect(current.submitterIp).toBe(ip);
    expect(current.email).toBe(validAd.email);
    expect(current).not.toHaveProperty("viewedBy");
    await ads.createAd({ ...validAd, name: "Other Sender" }, "203.0.113.9");
    const filtered = await listAdminAds(new URLSearchParams({ ip: "2001:db8:0:0::1", unviewed: "true", status: "published", source: "manual", search: "Mari", sort: "oldest" }));
    expect(filtered.total).toBe(1);
    expect(filtered.rows[0]._id).toBe(submitted._id);
    await management.markAdminAdViewed(submitted._id!, "test-admin");
    expect((await listAdminAds(new URLSearchParams({ ip, unviewed: "true" }))).total).toBe(0);
    expect((await listAdminAds(new URLSearchParams({ ip: ".*" }))).total).toBe(0);
    const publicAd = (await ads.getAdBySlug(submitted.slug!))!;
    const page = await ads.listAds();
    for (const result of [publicAd, page.data[0]]) {
      expect(result).not.toHaveProperty("submitterIp");
      expect(result).not.toHaveProperty("submitterIpExpiresAt");
      expect(result).not.toHaveProperty("email");
      expect(result).not.toHaveProperty("viewedBy");
    }
    expect(JSON.stringify(await ads.listAdSitemapEntries())).not.toContain(ip);
  });

  it("keeps IPs available without expiry, ignoring old expiry metadata", async () => {
    const submitted = await ads.createAd(validAd, "203.0.113.10");
    const recent = await ads.createAd(validAd, "203.0.113.11");
    await ads.AdModel.collection.updateOne({ slug: submitted.slug }, { $set: { submitterIpExpiresAt: new Date(Date.now() - 1000) } });
    const before = (await getAdminAd(submitted._id!))!;
    expect(before.submitterIp).toBe("203.0.113.10");
    expect(before).not.toHaveProperty("submitterIpExpiresAt");
    expect((await listAdminAds(new URLSearchParams({ ip: "203.0.113.10" }))).total).toBe(1);
    expect((await management.getAdminDashboard("test-admin")).recent.find((ad) => ad._id === submitted._id)!.submitterIp).toBe("203.0.113.10");
    const stored = await ads.AdModel.collection.findOne({ slug: submitted.slug });
    expect(stored!.submitterIp).toBe("203.0.113.10");
    const after = (await getAdminAd(submitted._id!))!;
    expect(after).toMatchObject({ createdAt: before.createdAt, updatedAt: before.updatedAt, status: before.status, version: before.version });
    expect((await getAdminAd(recent._id!))!.submitterIp).toBe("203.0.113.11");
    expect(await ads.AdModel.countDocuments()).toBe(2);
  });

  it("does not invent submitter IPs for legacy, untrusted, or AI records", async () => {
    const manual = await ads.createAd(validAd);
    const invalid = await ads.createAd(validAd, "unknown");
    const ai = await ads.createAiGeneratedAd(validAd, "2026-10-28", "no-ip-ai");
    await ads.AdModel.collection.insertOne({ ...validAd, slug: "legacy-without-ip" });
    for (const id of [manual._id!, invalid._id!, ai.ad!._id!]) expect((await getAdminAd(id))!.submitterIp).toBeUndefined();
    const legacy = await ads.AdModel.collection.findOne({ slug: "legacy-without-ip" });
    expect(legacy).not.toHaveProperty("submitterIp");
  });

  it("reports accurate dashboard totals and bounded recent submissions", async () => {
    await ads.AdModel.create([
      ...Array.from({ length: 10 }, (_, i) => ({ ...validAd, slug: `pending-${i}`, status: "pending" })),
      { ...validAd, slug: "published", status: "published", aiGenerated: true },
      { ...validAd, slug: "rejected", status: "rejected" },
      { ...validAd, slug: "archived", status: "archived" },
      { ...validAd, slug: "deleted", status: "published", aiGenerated: true, deletedAt: new Date() },
    ]);
    const dashboard = await management.getAdminDashboard("test-admin");
    expect(dashboard.total).toBe(12);
    expect(dashboard.ai).toBe(1);
    expect(dashboard.counts).toEqual({ pending: 10, published: 1, rejected: 1 });
    expect(dashboard.recent).toHaveLength(8);
    expect(dashboard.recent.every((ad) => !ad.deletedAt)).toBe(true);
  });

  it("edits only validated content and preserves status, source, slug, and creation time", async () => {
    const created = await ads.createAiGeneratedAd(validAd, "2026-10-28", "edit-test");
    const current = (await getAdminAd(created.ad!._id!))!;
    const other = await ads.createAd({ ...validAd, name: "Other Person" });
    const updated = await management.mutateAdminAd(current._id, {
      action: "edit", version: current.version,
      values: { ...validAd, name: "Updated Name", birthYear: "", status: "pending", aiGenerated: false },
    }, "test-admin");
    expect(updated).toMatchObject({ name: "Updated Name", birthYear: "", status: "published", aiGenerated: true, slug: current.slug, createdAt: current.createdAt });
    expect((await getAdminAd(other._id!))!.name).toBe("Other Person");
    await expect(management.mutateAdminAd(current._id, { action: "edit", version: updated!.version, values: { ...validAd, email: "invalid" } }, "test-admin"))
      .rejects.toMatchObject({ status: 400 });
  });

  it("moves deleted posts to trash and publishes them again on restoration", async () => {
    const result = await ads.createAiGeneratedAd(validAd, "2026-10-28", "delete-test");
    const current = (await getAdminAd(result.ad!._id!))!;
    const deleted = (await management.mutateAdminAd(current._id, { action: "delete", version: current.version }, "test-admin"))!;
    expect(deleted.deletedAt).toBeTruthy();
    expect(await ads.getAdBySlug(current.slug!)).toBeNull();
    expect((await listAdminAds(new URLSearchParams())).total).toBe(0);
    expect((await listAdminAds(new URLSearchParams({ deleted: "true" }))).total).toBe(1);
    const restored = (await management.mutateAdminAd(current._id, { action: "restore", version: deleted.version }, "test-admin"))!;
    expect(restored.status).toBe("published");
    expect(restored.trashed).toBe(false);
    expect(restored.aiGenerated).toBe(true);
    expect(restored.createdAt).toBe(current.createdAt);
    expect(await ads.getAdBySlug(current.slug!)).toBeTruthy();
    expect(await ads.AdModel.countDocuments()).toBe(1);
  });

  it("publishes legacy archived records only when explicitly restored from trash", async () => {
    const legacy = await ads.AdModel.create({ ...validAd, slug: "legacy-archive", status: "archived" });
    const id = String(legacy._id);
    expect((await listAdminAds(new URLSearchParams())).total).toBe(0);
    const trash = await listAdminAds(new URLSearchParams({ deleted: "true", search: "Mari" }));
    expect(trash.total).toBe(1);
    expect(trash.rows[0]).toMatchObject({ _id: id, trashed: true });
    expect(await ads.getAdBySlug("legacy-archive")).toBeNull();
    const restored = await management.mutateAdminAd(id, { action: "restore", version: 0 }, "test-admin");
    expect(restored).toMatchObject({ status: "published", trashed: false });
    expect((await listAdminAds(new URLSearchParams({ deleted: "true" }))).total).toBe(0);
    expect((await listAdminAds(new URLSearchParams())).total).toBe(1);
    expect(await ads.getAdBySlug("legacy-archive")).toBeTruthy();
  });

  it("combines trash and publication filters without exposing active records", async () => {
    await ads.AdModel.create([
      { ...validAd, slug: "active", status: "published" },
      { ...validAd, slug: "deleted-published", status: "published", deletedAt: new Date() },
      { ...validAd, slug: "legacy-archived", status: "archived" },
    ]);
    const results = await listAdminAds(new URLSearchParams({ deleted: "true", status: "published", search: "Mari" }));
    expect(results.total).toBe(1);
    expect(results.rows[0].slug).toBe("deleted-published");
  });

  it("combines search, source, status, sort and pagination across all records", async () => {
    await ads.AdModel.create(Array.from({ length: 45 }, (_, i) => ({
      ...validAd, name: `Match ${i}`, slug: `match-${i}`, status: "pending", aiGenerated: false,
      createdAt: new Date(Date.UTC(2026, 0, i + 1)),
    })));
    await ads.AdModel.create([
      { ...validAd, slug: "irrelevant", status: "pending" },
      { ...validAd, name: "Match AI", slug: "ai", status: "pending", aiGenerated: true },
      { ...validAd, name: "Match Published", slug: "published", status: "published" },
    ]);
    const result = await listAdminAds(new URLSearchParams({ search: "Match", status: "pending", source: "manual", sort: "oldest", page: "2" }));
    expect(result.total).toBe(45);
    expect(result.pages).toBe(3);
    expect(result.rows).toHaveLength(20);
    expect(result.rows[0].name).toBe("Match 20");
    const newest = await listAdminAds(new URLSearchParams({ search: "Match", status: "pending", source: "manual", sort: "newest", page: "3" }));
    expect(newest.rows.map((ad) => ad.name)).toEqual(["Match 4", "Match 3", "Match 2", "Match 1", "Match 0"]);
    expect((await listAdminAds(new URLSearchParams({ search: ".*" }))).total).toBe(0);
  });

  it("prevents stale and simultaneous edits from overwriting another operation", async () => {
    const submitted = await ads.createAd(validAd);
    const current = (await getAdminAd(submitted._id!))!;
    const outcomes = await Promise.allSettled(["First", "Second"].map((name) => management.mutateAdminAd(current._id, {
      action: "edit", version: current.version, values: { ...validAd, name },
    }, "test-admin")));
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason.status).toBe(409);
  });

  it("records safe audit entries and rolls changes back if logging fails", async () => {
    const submitted = await ads.createAd(validAd);
    await ads.AdModel.collection.updateOne({ slug: submitted.slug }, { $set: { status: "pending" } });
    const current = (await getAdminAd(submitted._id!))!;
    await management.mutateAdminAd(current._id, { action: "status", status: "rejected", version: current.version }, "test-admin");
    const logs = await mongoose.connection.db!.collection("admin_activity").find().toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: "reject", obituaryId: current._id, administrator: "test-admin", result: "success" });
    const text = JSON.stringify(logs);
    for (const sensitive of [validAd.email, validAd.name, validAd.poem, credentials.password]) expect(text).not.toContain(sensitive);
    const audit = await import("./adminAudit");
    const fail = vi.spyOn(audit, "logAdminActivity").mockRejectedValueOnce(new Error("isolated audit failure"));
    await expect(management.mutateAdminAd(current._id, { action: "status", status: "pending", version: 1 }, "test-admin")).rejects.toThrow();
    expect((await getAdminAd(current._id))!.status).toBe("rejected");
    fail.mockRestore();
  });

  it("handles invalid/missing IDs and rejects unvalidated commands", async () => {
    const { cookie } = await login();
    expect(await getAdminAd("invalid")).toBeNull();
    expect((await patch("invalid", { action: "delete", version: 0 }, cookie)).status).toBe(404);
    expect((await patch("000000000000000000000001", { action: "delete", version: 0 }, cookie)).status).toBe(404);
    expect((await patch("000000000000000000000001", { action: "status", status: "unknown", version: 0 }, cookie)).status).toBe(400);
  });
});

describe("IP bans", () => {
  it("requires authentication, same-origin requests, and validated IP commands", async () => {
    expect((await banRoute.GET(request("/api/admin/ip-bans"))).status).toBe(401);
    expect((await banRoute.POST(request("/api/admin/ip-bans", { ip: "203.0.113.10", blocked: true }))).status).toBe(401);
    const { cookie } = await login();
    expect((await banRoute.POST(request("/api/admin/ip-bans", { ip: "203.0.113.10", blocked: true }, cookie, "https://evil.test"))).status).toBe(403);
    for (const body of [
      { ip: "unknown", blocked: true }, { ip: "203.0.113.10,203.0.113.11", blocked: true },
      { ip: { $ne: null }, blocked: true }, { ip: "203.0.113.10", blocked: "false" },
    ]) expect((await banRoute.POST(request("/api/admin/ip-bans", body, cookie))).status).toBe(400);
    expect(await bans.IpBanModel.countDocuments()).toBe(0);
  });

  it("normalizes equivalent IPs, exposes current ban state privately, and supports unbanning", async () => {
    const submitted = await ads.createAd(validAd, "2001:db8::1");
    const { cookie } = await login();
    const response = await banRoute.POST(request("/api/admin/ip-bans", { ip: "2001:0DB8:0:0:0:0:0:1", blocked: true }, cookie));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(await bans.isIpBanned("2001:db8::1")).toBe(true);
    expect(await bans.isIpBanned("2001:db8::2")).toBe(false);
    expect((await getAdminAd(submitted._id!))!.ipBlocked).toBe(true);
    expect((await listAdminAds(new URLSearchParams())).rows[0].ipBlocked).toBe(true);
    expect((await management.getAdminDashboard("test-admin")).recent[0].ipBlocked).toBe(true);
    const results = await banRoute.GET(request("/api/admin/ip-bans?ip=2001:db8::1", undefined, cookie));
    expect((await results.json()).total).toBe(1);
    await banRoute.POST(request("/api/admin/ip-bans", { ip: "2001:db8::1", blocked: false }, cookie));
    expect(await bans.isIpBanned("2001:db8::1")).toBe(false);
    expect((await getAdminAd(submitted._id!))!.ipBlocked).toBe(false);
    expect((await bans.listIpBans(new URLSearchParams())).total).toBe(0);
    const entries = await mongoose.connection.db!.collection("admin_activity").find().toArray();
    expect(entries.filter((entry) => ["ip_ban", "ip_unban"].includes(entry.action))).toHaveLength(2);
    expect(entries.filter((entry) => entry.ipBanId)).toHaveLength(2);
    expect(JSON.stringify(entries)).not.toContain("2001:db8");
  });

  it("blocks banned trusted IPs before Turnstile, while ignoring spoofed client headers", async () => {
    const previousNodeEnv = process.env.NODE_ENV;
    const previousNetlify = process.env.NETLIFY;
    const previousTrust = process.env.TRUST_NETLIFY_PROXY;
    const logs = vi.spyOn(console, "info").mockImplementation(() => {});
    try {
      vi.stubEnv("NODE_ENV", "development"); vi.stubEnv("NETLIFY", "true");
      const ip = "203.0.113.200";
      await bans.setIpBan(ip, true, "test-admin");
      const { protectObituarySubmission } = await import("./submissionSecurity");
      const incoming = new Request(`${origin}/api/ads`, { method: "POST", headers: { "x-nf-client-connection-ip": ip } });
      expect(await protectObituarySubmission(incoming, validAd, {})).toMatchObject({ allowed: false, status: 403 });
      expect(logs).toHaveBeenCalledWith("security.submission", expect.objectContaining({ event: "ip_ban_rejected", ipHash: expect.any(String) }));
      expect(JSON.stringify(logs.mock.calls)).not.toContain(ip);
      await bans.setIpBan(ip, false, "test-admin");
      // After unbanning, the normal verification gate applies again.
      expect(await protectObituarySubmission(incoming, validAd, {})).toMatchObject({ allowed: false, status: 400 });
      await bans.setIpBan("198.51.100.50", true, "test-admin");
      const spoofed = new Request(`${origin}/api/ads`, { method: "POST", headers: {
        "x-nf-client-connection-ip": ip, "x-forwarded-for": "198.51.100.50", "cf-connecting-ip": "198.51.100.50",
      } });
      expect(await protectObituarySubmission(spoofed, validAd, {})).toMatchObject({ allowed: false, status: 400 });
      vi.stubEnv("NETLIFY", ""); vi.stubEnv("TRUST_NETLIFY_PROXY", "");
      expect(await protectObituarySubmission(new Request(`${origin}/api/ads`, { method: "POST", headers: { "x-nf-client-connection-ip": "198.51.100.50" } }), validAd, {}))
        .toMatchObject({ allowed: false, status: 400 });
    } finally {
      logs.mockRestore(); vi.stubEnv("NODE_ENV", previousNodeEnv); vi.stubEnv("NETLIFY", previousNetlify); vi.stubEnv("TRUST_NETLIFY_PROXY", previousTrust);
    }
  });

  it("keeps concurrent bans idempotent and lists bans with server-side pagination", async () => {
    await Promise.all(Array.from({ length: 4 }, () => bans.setIpBan("203.0.113.10", true, "test-admin")));
    expect(await bans.IpBanModel.countDocuments({ ip: "203.0.113.10" })).toBe(1);
    expect(await bans.isIpBanned("203.0.113.10")).toBe(true);
    await bans.IpBanModel.create(Array.from({ length: 24 }, (_, i) => ({ ip: `198.51.100.${i + 1}`, blocked: true })));
    const page = await bans.listIpBans(new URLSearchParams({ page: "2" }));
    expect(page.total).toBe(25); expect(page.pages).toBe(2); expect(page.rows).toHaveLength(5);
    expect((await bans.listIpBans(new URLSearchParams({ ip: ".*" }))).total).toBe(0);
  });

  it("rolls back a ban if its audit entry cannot be written", async () => {
    const audit = await import("./adminAudit");
    const fail = vi.spyOn(audit, "logAdminActivity").mockRejectedValueOnce(new Error("isolated audit failure"));
    await expect(bans.setIpBan("203.0.113.99", true, "test-admin")).rejects.toThrow();
    expect(await bans.isIpBanned("203.0.113.99")).toBe(false);
    fail.mockRestore();
  });
});
