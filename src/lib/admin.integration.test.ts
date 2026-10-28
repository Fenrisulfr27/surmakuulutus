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
  const { connectToDatabase } = await import("./mongodb");
  await connectToDatabase();
  await ads.AdModel.init();
  const { AdminActivity } = await import("./adminAudit");
  await AdminActivity.init();
}, 180_000);

beforeEach(async () => {
  await ads.AdModel.deleteMany({});
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

  it("creates manual submissions as pending and publishes only through approval", async () => {
    const submitted = await ads.createAd({ ...validAd, status: "published" } as typeof validAd);
    let current = (await management.getAdminAd(submitted._id!))!;
    expect(current.status).toBe("pending");
    expect(await ads.getAdBySlug(submitted.slug!)).toBeNull();
    const { cookie } = await login();
    const response = await patch(current._id, { action: "status", status: "published", version: current.version }, cookie);
    expect(response.status).toBe(200);
    current = await response.json();
    expect(await ads.getAdBySlug(submitted.slug!)).toBeTruthy();
    const rejected = await patch(current._id, { action: "status", status: "rejected", version: current.version }, cookie);
    expect(rejected.status).toBe(409);
    expect((await patch(current._id, { action: "status", status: "archived", version: current.version }, cookie)).status).toBe(200);
    expect(await ads.getAdBySlug(submitted.slug!)).toBeNull();
  });

  it("publishes AI obituaries automatically and preserves retry deduplication after deletion", async () => {
    const result = await ads.createAiGeneratedAd(validAd, "2026-10-28", "2026-10-28:test");
    expect(result.created).toBe(true);
    const current = (await management.getAdminAd(result.ad!._id!))!;
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
  it("reports accurate dashboard totals and bounded recent submissions", async () => {
    await ads.AdModel.create([
      ...Array.from({ length: 10 }, (_, i) => ({ ...validAd, slug: `pending-${i}`, status: "pending" })),
      { ...validAd, slug: "published", status: "published", aiGenerated: true },
      { ...validAd, slug: "rejected", status: "rejected" },
      { ...validAd, slug: "archived", status: "archived" },
      { ...validAd, slug: "deleted", status: "published", aiGenerated: true, deletedAt: new Date() },
    ]);
    const dashboard = await management.getAdminDashboard();
    expect(dashboard.total).toBe(13);
    expect(dashboard.ai).toBe(1);
    expect(dashboard.counts).toEqual({ pending: 10, published: 1, rejected: 1, archived: 1 });
    expect(dashboard.recent).toHaveLength(8);
    expect(dashboard.recent.every((ad) => !ad.deletedAt)).toBe(true);
  });

  it("edits only validated content and preserves status, source, slug, and creation time", async () => {
    const created = await ads.createAiGeneratedAd(validAd, "2026-10-28", "edit-test");
    const current = (await management.getAdminAd(created.ad!._id!))!;
    const other = await ads.createAd({ ...validAd, name: "Other Person" });
    const updated = await management.mutateAdminAd(current._id, {
      action: "edit", version: current.version,
      values: { ...validAd, name: "Updated Name", birthYear: "", status: "pending", aiGenerated: false },
    }, "test-admin");
    expect(updated).toMatchObject({ name: "Updated Name", birthYear: "", status: "published", aiGenerated: true, slug: current.slug, createdAt: current.createdAt });
    expect((await management.getAdminAd(other._id!))!.name).toBe("Other Person");
    await expect(management.mutateAdminAd(current._id, { action: "edit", version: updated!.version, values: { ...validAd, email: "invalid" } }, "test-admin"))
      .rejects.toMatchObject({ status: 400 });
  });

  it("soft deletes, hides, and restores into the archive", async () => {
    const result = await ads.createAiGeneratedAd(validAd, "2026-10-28", "delete-test");
    const current = (await management.getAdminAd(result.ad!._id!))!;
    const deleted = (await management.mutateAdminAd(current._id, { action: "delete", version: current.version }, "test-admin"))!;
    expect(deleted.deletedAt).toBeTruthy();
    expect(await ads.getAdBySlug(current.slug!)).toBeNull();
    expect((await management.listAdminAds(new URLSearchParams())).total).toBe(0);
    expect((await management.listAdminAds(new URLSearchParams({ deleted: "true" }))).total).toBe(1);
    const restored = (await management.mutateAdminAd(current._id, { action: "restore", version: deleted.version }, "test-admin"))!;
    expect(restored.status).toBe("archived");
    expect(await ads.getAdBySlug(current.slug!)).toBeNull();
    expect(await ads.AdModel.countDocuments()).toBe(1);
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
    const result = await management.listAdminAds(new URLSearchParams({ search: "Match", status: "pending", source: "manual", sort: "oldest", page: "2" }));
    expect(result.total).toBe(45);
    expect(result.pages).toBe(3);
    expect(result.rows).toHaveLength(20);
    expect(result.rows[0].name).toBe("Match 20");
    const newest = await management.listAdminAds(new URLSearchParams({ search: "Match", status: "pending", source: "manual", sort: "newest", page: "3" }));
    expect(newest.rows.map((ad) => ad.name)).toEqual(["Match 4", "Match 3", "Match 2", "Match 1", "Match 0"]);
    expect((await management.listAdminAds(new URLSearchParams({ search: ".*" }))).total).toBe(0);
  });

  it("prevents stale and simultaneous edits from overwriting another operation", async () => {
    const submitted = await ads.createAd(validAd);
    const current = (await management.getAdminAd(submitted._id!))!;
    const outcomes = await Promise.allSettled(["First", "Second"].map((name) => management.mutateAdminAd(current._id, {
      action: "edit", version: current.version, values: { ...validAd, name },
    }, "test-admin")));
    expect(outcomes.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const rejected = outcomes.find((result) => result.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason.status).toBe(409);
  });

  it("records safe audit entries and rolls changes back if logging fails", async () => {
    const submitted = await ads.createAd(validAd);
    const current = (await management.getAdminAd(submitted._id!))!;
    await management.mutateAdminAd(current._id, { action: "status", status: "rejected", version: current.version }, "test-admin");
    const logs = await mongoose.connection.db!.collection("admin_activity").find().toArray();
    expect(logs).toHaveLength(1);
    expect(logs[0]).toMatchObject({ action: "reject", obituaryId: current._id, administrator: "test-admin", result: "success" });
    const text = JSON.stringify(logs);
    for (const sensitive of [validAd.email, validAd.name, validAd.poem, credentials.password]) expect(text).not.toContain(sensitive);
    const audit = await import("./adminAudit");
    const fail = vi.spyOn(audit, "logAdminActivity").mockRejectedValueOnce(new Error("isolated audit failure"));
    await expect(management.mutateAdminAd(current._id, { action: "status", status: "pending", version: 1 }, "test-admin")).rejects.toThrow();
    expect((await management.getAdminAd(current._id))!.status).toBe("rejected");
    fail.mockRestore();
  });

  it("handles invalid/missing IDs and rejects unvalidated commands", async () => {
    const { cookie } = await login();
    expect(await management.getAdminAd("invalid")).toBeNull();
    expect((await patch("invalid", { action: "delete", version: 0 }, cookie)).status).toBe(404);
    expect((await patch("000000000000000000000001", { action: "delete", version: 0 }, cookie)).status).toBe(404);
    expect((await patch("000000000000000000000001", { action: "status", status: "unknown", version: 0 }, cookie)).status).toBe(400);
  });
});
