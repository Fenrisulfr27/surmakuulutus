// @vitest-environment node
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { readFile } from "node:fs/promises";

let database: MongoMemoryServer;
let importer: typeof import("./obituaryImport");
let ads: typeof import("./ads");

const card = (slug = "mari-mets", birth = "27.07.1934") => `<a class="project-item-anchor" href="/kuulutused/${slug}/">
  <span class="o_sk_post_first_name"> Mari </span><span class="o_sk_post_last_name"> Mets </span>
  <span class="o_sk_post_birth_date">${birth}</span><span class="o_sk_post_death_date">23.10.2026</span>
  <span class="o_sk_post_poem">Esimene &amp; teine<br>Kolmas<script>alert(1)</script></span>
  <span class="o_sk_post_top_text">${"Pikk tekst. ".repeat(20)}</span>
  <span class="o_sk_post_bottom_text"></span></a>`;

beforeAll(async () => {
  database = await MongoMemoryServer.create();
  vi.stubEnv("MONGO_URI", database.getUri("import_tests"));
  importer = await import("./obituaryImport");
  ads = await import("./ads");
  await (await import("./mongodb")).connectToDatabase();
  await ads.AdModel.init();
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await database?.stop();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("source archive", () => {
  it("extracts plain text, line breaks, full text and optional dates without guessing contact details", () => {
    const { ads: [ad], invalid } = importer.parseObituaryArchive(card());
    expect(invalid).toBe(0);
    expect(ad).toMatchObject({ name: "Mari Mets", birthYear: "1934-07-27", deathYear: "2026-10-23",
      poem: "Esimene & teine\nKolmas", bottomText: "", sourceUrl: "https://www.surmakuulutused.ee/kuulutused/mari-mets/" });
    expect(ad.topText.length).toBeGreaterThan(100);
    expect(ad).not.toHaveProperty("email");
    expect(importer.parseObituaryArchive(card("unknown", "")).ads[0].birthYear).toBeUndefined();
    expect(importer.parseObituaryArchive(card("legacy", "1934-07-27")).ads[0].birthYear).toBe("1934-07-27");
  });

  it("deduplicates canonical URLs and reports malformed cards", () => {
    const result = importer.parseObituaryArchive(card() + card() + card("invalid", "31.02.1934") + card("bad").replace('href="/', 'href="https://evil.test/'));
    expect(result.ads).toHaveLength(1);
    expect(result.invalid).toBe(2);
    expect(() => importer.parseObituaryArchive("<h1>Blocked</h1>")).toThrow();
    expect(() => importer.parseObituaryArchive(card().replace("o_sk_post_first_name", "changed"))).toThrow();
  });

  it("does not turn a source HTML newline after br into a blank poem line", () => {
    const html = card().replace("<br>Kolmas", "<br>\r\n   Kolmas<br>\n<br>\nNeljas");
    expect(importer.parseObituaryArchive(html).ads[0].poem).toBe("Esimene & teine\nKolmas\nNeljas");
  });

  it("rejects upstream HTTP errors and redirects", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("unavailable", { status: 503 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(importer.fetchObituaryArchive()).rejects.toThrow("unavailable");
    expect(fetchMock).toHaveBeenCalledWith(importer.archiveUrl, expect.objectContaining({ redirect: "error", cache: "no-store" }));
    fetchMock.mockResolvedValue(new Response(card(), { headers: { "content-type": "text/html" } }));
    await expect(importer.fetchObituaryArchive()).resolves.toMatchObject({ invalid: 0 });
    vi.unstubAllGlobals();
  });

  it.skipIf(!process.env.IMPORT_LIVE_HTML)("parses the downloaded live archive without database writes", async () => {
    const result = importer.parseObituaryArchive(await readFile(process.env.IMPORT_LIVE_HTML!, "utf8"));
    expect(result.ads.length).toBeGreaterThan(0);
    expect(result.invalid).toBe(0);
    console.info("Live archive:", result.ads.length, "valid notices");
  });
});

describe("database import", () => {
  beforeEach(async () => { await ads.AdModel.deleteMany({}); });
  it("is safe under concurrent imports, publishes publicly and preserves administrative changes and deletion", async () => {
    const batch = importer.parseObituaryArchive(card()).ads;
    const results = await Promise.all([importer.saveNextImportedAd(batch), importer.saveNextImportedAd(batch)]);
    expect(results.reduce((sum, result) => sum + result.created, 0)).toBe(1);
    expect(await ads.AdModel.countDocuments({ sourceUrl: batch[0].sourceUrl })).toBe(1);
    const saved = await ads.AdModel.findOne({ sourceUrl: batch[0].sourceUrl }).lean();
    expect(saved?.status).toBe("published");
    const publicAd = await ads.getAdBySlug(saved!.slug);
    expect(publicAd).not.toHaveProperty("sourceUrl");
    expect(publicAd).not.toHaveProperty("email");
    await ads.AdModel.updateOne({ _id: saved!._id }, { $set: { poem: "Esimene\n\n  \nTeine\r\n\r\nKolmas" } });
    const legacyPublicAd = await ads.getAdBySlug(saved!.slug);
    expect(legacyPublicAd?.poem).toBe("Esimene\nTeine\nKolmas");
    expect(legacyPublicAd).not.toHaveProperty("sourceUrl");
    await ads.AdModel.updateOne({ _id: saved!._id }, { $set: { name: "Muudetud nimi", deletedAt: new Date(), status: "rejected" } });
    expect(await importer.saveNextImportedAd(batch)).toEqual({ created: 0, existing: 1, remaining: 0 });
    const unchanged = await ads.AdModel.findById(saved!._id).lean();
    expect(unchanged?.name).toBe("Muudetud nimi");
    expect(unchanged?.deletedAt).toBeTruthy();
    expect(unchanged?.status).toBe("rejected");
    expect(await ads.getAdBySlug(saved!.slug)).toBeNull();
  });

  it("rejects an untrusted source URL before any writes", async () => {
    const [ad] = importer.parseObituaryArchive(card()).ads;
    await expect(importer.saveNextImportedAd([{ ...ad, sourceUrl: "https://evil.test/" }])).rejects.toThrow();
  });

  it("publishes only one notice per run and falls back through unpublished older notices", async () => {
    const batch = importer.parseObituaryArchive(card("newest") + card("older") + card("oldest")).ads;
    expect(await importer.saveNextImportedAd(batch)).toEqual({ created: 1, existing: 0, remaining: 2 });
    expect(await ads.AdModel.findOne({}).lean()).toMatchObject({ sourceUrl: batch[0].sourceUrl });
    expect(await importer.saveNextImportedAd(batch)).toEqual({ created: 1, existing: 1, remaining: 1 });
    expect(await ads.AdModel.exists({ sourceUrl: batch[1].sourceUrl })).toBeTruthy();
    expect(await ads.AdModel.exists({ sourceUrl: batch[2].sourceUrl })).toBeNull();
    expect(await importer.saveNextImportedAd(batch)).toEqual({ created: 1, existing: 2, remaining: 0 });
    expect(await importer.saveNextImportedAd(batch)).toEqual({ created: 0, existing: 3, remaining: 0 });
  });

  it("prioritizes a newly appearing notice ahead of the remaining older backlog", async () => {
    const oldBatch = importer.parseObituaryArchive(card("previous-newest") + card("backlog")).ads;
    await importer.saveNextImportedAd(oldBatch);
    const updated = importer.parseObituaryArchive(card("just-added") + card("previous-newest") + card("backlog")).ads;
    expect(await importer.saveNextImportedAd(updated)).toEqual({ created: 1, existing: 1, remaining: 1 });
    expect(await ads.AdModel.exists({ sourceUrl: updated[0].sourceUrl })).toBeTruthy();
    expect(await ads.AdModel.exists({ sourceUrl: oldBatch[1].sourceUrl })).toBeNull();
  });
});
