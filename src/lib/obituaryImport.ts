import { createHash } from "node:crypto";
import { load } from "cheerio";
import { z } from "zod";
import { AdModel, slugify } from "./ads";
import { connectToDatabase } from "./mongodb";

export const sourceOrigin = "https://www.surmakuulutused.ee";
export const archiveUrl = `${sourceOrigin}/kuulutused/`;

const importedAdSchema = z.object({
  sourceUrl: z.url().refine((value) => {
    const url = new URL(value);
    return url.origin === sourceOrigin && /^\/kuulutused\/(?!lisa\/)[^/]+\/$/.test(url.pathname)
      && !url.search && !url.hash && !url.username && !url.password;
  }),
  name: z.string().min(1).max(100),
  poem: z.string().max(10000),
  topText: z.string().max(10000),
  bottomText: z.string().max(10000),
  birthYear: z.string().optional(),
  deathYear: z.string().optional(),
}).refine((ad) => !ad.birthYear || !ad.deathYear || ad.birthYear <= ad.deathYear);

export type ImportedAd = z.infer<typeof importedAdSchema>;

function parseDate(value: string) {
  if (!value) return undefined;
  const match = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(value);
  const iso = match ? `${match[3]}-${match[2]}-${match[1]}` : value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) throw new Error("Invalid source date");
  const date = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== iso) {
    throw new Error("Invalid source date");
  }
  return iso;
}

export function parseObituaryArchive(html: string) {
  const $ = load(html);
  const cards = $("a.project-item-anchor");
  if (!cards.length) throw new Error("Source archive structure changed or contains no notices");
  const ads = new Map<string, ImportedAd>();
  let invalid = 0;
  cards.each((_, element) => {
    try {
      const card = $(element);
      const text = (selector: string) => {
        const field = card.find(selector).first().clone();
        field.find("script, style, iframe").remove();
        field.find("br").replaceWith("\n");
        field.find("p, div").append("\n");
        return field.text().split("\n").map((line) => line.replace(/\s+/g, " ").trim()).join("\n").trim();
      };
      const url = new URL(card.attr("href") ?? "", sourceOrigin);
      if (url.origin !== sourceOrigin || !/^\/kuulutused\/(?!lisa\/)[^/]+\/$/.test(url.pathname)) {
        throw new Error("Invalid source link");
      }
      const requiredFields = [".o_sk_post_first_name", ".o_sk_post_last_name", ".o_sk_post_poem", ".o_sk_post_top_text", ".o_sk_post_bottom_text", ".o_sk_post_birth_date", ".o_sk_post_death_date"];
      if (requiredFields.some((selector) => !card.find(selector).length)) throw new Error("Missing source fields");
      const ad = importedAdSchema.parse({
        sourceUrl: `${sourceOrigin}${url.pathname}`,
        name: [text(".o_sk_post_first_name"), text(".o_sk_post_last_name")].filter(Boolean).join(" "),
        poem: text(".o_sk_post_poem"),
        topText: text(".o_sk_post_top_text"),
        bottomText: text(".o_sk_post_bottom_text"),
        birthYear: parseDate(text(".o_sk_post_birth_date")),
        deathYear: parseDate(text(".o_sk_post_death_date")),
      });
      ads.set(ad.sourceUrl, ad);
    } catch {
      invalid++;
    }
  });
  if (!ads.size) throw new Error("Source archive contains no valid notices");
  return { ads: [...ads.values()], invalid };
}

export async function fetchObituaryArchive() {
  const response = await fetch(archiveUrl, {
    headers: { "User-Agent": "Surmakuulutus.ee importer (+https://surmakuulutus.ee)", Accept: "text/html" },
    signal: AbortSignal.timeout(25000), cache: "no-store", redirect: "error",
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) {
    throw new Error("Source archive unavailable");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Empty source response");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > 8 * 1024 * 1024) throw new Error("Source archive too large");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
    reader.releaseLock();
  }
  return parseObituaryArchive(Buffer.concat(chunks).toString("utf8"));
}

export async function saveNextImportedAd(ads: ImportedAd[]) {
  // Validate the complete batch before opening the database or writing anything.
  const validated = ads.map((ad) => importedAdSchema.parse(ad));
  await connectToDatabase();
  // Wait for the unique index before concurrent upserts are possible, including on existing databases.
  await AdModel.collection.createIndex({ sourceUrl: 1 }, {
    unique: true, partialFilterExpression: { sourceUrl: { $type: "string" } },
  });
  const existing = await AdModel.find({ sourceUrl: { $in: validated.map((ad) => ad.sourceUrl) } })
    .select("sourceUrl").lean();
  const existingUrls = new Set(existing.map((ad) => ad.sourceUrl));
  // The archive is ordered newest first. Once newer notices exist locally, this
  // naturally falls back to the newest remaining older notice.
  const ad = validated.find((ad) => !existingUrls.has(ad.sourceUrl));
  let created = 0;
  if (ad) {
    const suffix = createHash("sha256").update(ad.sourceUrl).digest("hex").slice(0, 16);
    try {
      const result = await AdModel.updateOne({ sourceUrl: ad.sourceUrl }, { $setOnInsert: {
        ...ad, slug: `${slugify(ad.name) || "kuulutus"}-sk-${suffix}`,
        status: "published", deletedAt: null, createdAt: new Date(), updatedAt: new Date(),
      } }, { upsert: true, timestamps: false, runValidators: true });
      created = result.upsertedCount;
    } catch (error) {
      // Another importer may have inserted this URL after our upsert began.
      if (!(typeof error === "object" && error && "code" in error && error.code === 11000
        && await AdModel.exists({ sourceUrl: ad.sourceUrl }))) throw error;
    }
  }
  const known = existingUrls.size + (ad && !created ? 1 : 0);
  return { created, existing: known, remaining: validated.length - known - created };
}

export async function importObituaries() {
  const { ads, invalid } = await fetchObituaryArchive();
  return { ...await saveNextImportedAd(ads), invalid };
}
