import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import type { AdFormValues } from "./adValidation";
import { obituaryStatuses, positiveInteger, publishedAdFilter, type ObituaryStatus } from "./moderation";
import { normalizeSubmitterIp } from "./submitterIp.mjs";

export interface Ad {
  _id?: string;
  poem?: string;
  slug?: string;
  name: string;
  email: string;
  birthYear?: string | Date | null;
  deathYear?: string | Date | null;
  bottomText?: string;
  topText?: string;
  createdAt?: string | Date;
  aiGenerated?: boolean;
  aiGeneratedDate?: string;
  aiGenerationKey?: string;
  status?: ObituaryStatus;
  updatedAt?: string | Date;
  deletedAt?: string | Date | null;
  viewedBy?: string[];
  submitterIp?: string;
  /** Legacy metadata; ignored, private, and no longer written. */
  submitterIpExpiresAt?: string | Date;
}

export type PublicAd = Omit<Ad, "email" | "viewedBy" | "submitterIp" | "submitterIpExpiresAt">;

type PublicAdField = keyof PublicAd;

const publicAdFields = [
  "_id",
  "poem",
  "slug",
  "name",
  "birthYear",
  "deathYear",
  "bottomText",
  "topText",
  "createdAt",
] as const satisfies readonly PublicAdField[];

const publicAdProjection = publicAdFields.join(" ");

export interface AdsPageData {
  data: PublicAd[];
  totalPages: number;
  currentPage: number;
  totalAds: number;
}

export interface AdSitemapEntry {
  slug: string;
  createdAt?: string | Date;
}

export type AdsSortOrder = "newest" | "oldest";

export interface ListAdsOptions {
  page?: number;
  limit?: number;
  search?: string;
  sort?: AdsSortOrder;
}

const adSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    email: { type: String, required: true, select: false },
    birthYear: String,
    deathYear: String,
    poem: String,
    bottomText: String,
    topText: String,
    aiGenerated: { type: Boolean, default: false, select: false },
    aiGeneratedDate: { type: String, select: false },
    aiGenerationKey: { type: String, select: false },
    status: { type: String, enum: [...obituaryStatuses, "archived"], default: "published" },
    deletedAt: { type: Date, default: null },
    viewedBy: { type: [String], default: [], select: false },
    submitterIp: { type: String, select: false },
  },
  { timestamps: true },
);

adSchema.index({ createdAt: -1 });
adSchema.index({ name: 1 });
adSchema.index({ deletedAt: 1, status: 1, createdAt: -1, _id: -1 });
adSchema.index({ deletedAt: 1, aiGenerated: 1, createdAt: -1, _id: -1 });
adSchema.index({ submitterIp: 1 });
adSchema.index(
  { aiGenerationKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      aiGenerated: true,
      aiGenerationKey: { $exists: true },
    },
  },
);

export const AdModel = mongoose.models.Ad ?? mongoose.model("Ad", adSchema);
let aiGenerationIndexReady: Promise<void> | null = null;

function isMissingIndexError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "codeName" in error &&
    error.codeName === "IndexNotFound"
  );
}

async function ensureAiGenerationIndexes() {
  aiGenerationIndexReady ??= (async () => {
    const indexes = await AdModel.collection.indexes();
    const legacyDailyIndex = indexes.find(
      (index) =>
        index.unique === true &&
        index.key &&
        Object.keys(index.key).length === 1 &&
        index.key.aiGeneratedDate === 1,
    );

    if (legacyDailyIndex?.name) {
      try {
        await AdModel.collection.dropIndex(legacyDailyIndex.name);
      } catch (error) {
        if (!isMissingIndexError(error)) {
          throw error;
        }
      }
    }

    await AdModel.collection.createIndex(
      { aiGenerationKey: 1 },
      {
        unique: true,
        partialFilterExpression: {
          aiGenerated: true,
          aiGenerationKey: { $exists: true },
        },
      },
    );
  })();

  await aiGenerationIndexReady;
}

export function toPublicAd(ad: unknown): PublicAd {
  if (!ad) {
    throw new Error("Ad not found");
  }

  const plain = JSON.parse(JSON.stringify(ad)) as Ad;
  const publicAd = Object.fromEntries(
    publicAdFields
      .filter((field) => plain[field] !== undefined)
      .map((field) => [field, plain[field]]),
  );

  return publicAd as unknown as PublicAd;
}

export const slugify = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function listAds(options: ListAdsOptions = {}): Promise<AdsPageData> {
  await connectToDatabase();

  const page = positiveInteger(options.page, 1);
  const limit = positiveInteger(options.limit, 6, 50);
  const search = options.search?.trim();
  const sortOrder = options.sort === "oldest" ? 1 : -1;
  const filter = {
    ...publishedAdFilter,
    ...(search ? { name: { $regex: escapeRegExp(search), $options: "i" } } : {}),
  };

  const totalAds = await AdModel.countDocuments(filter);
  const totalPages = Math.ceil(totalAds / limit);
  const currentPage = totalPages > 0 ? Math.min(page, totalPages) : 1;
  const skip = (currentPage - 1) * limit;

  const ads = await AdModel.find(filter)
    .select(publicAdProjection)
    .sort({ createdAt: sortOrder, _id: sortOrder })
    .skip(skip)
    .limit(limit);

  return {
    data: ads.map(toPublicAd),
    totalPages,
    currentPage,
    totalAds,
  };
}

export async function getAdBySlug(slug: string) {
  await connectToDatabase();
  const ad = await AdModel.findOne({ ...publishedAdFilter, slug }).select(publicAdProjection);
  return ad ? toPublicAd(ad) : null;
}

export async function listAdSitemapEntries(): Promise<AdSitemapEntry[]> {
  await connectToDatabase();

  const ads = await AdModel.find(publishedAdFilter, { slug: 1, createdAt: 1 })
    .sort({ createdAt: -1, _id: -1 })
    .lean();

  return ads
    .filter((ad) => typeof ad.slug === "string" && ad.slug.length > 0)
    .map((ad) => ({
      slug: ad.slug,
      createdAt: ad.createdAt,
    }));
}

export async function createAd(payload: AdFormValues, submitterIp?: string) {
  await connectToDatabase();

  const baseSlug = slugify(payload.name) || "kuulutus";
  let slug = baseSlug;
  let counter = 1;

  while (await AdModel.findOne({ slug })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const normalizedIp = submitterIp ? normalizeSubmitterIp(submitterIp) : undefined;
  const ad = new AdModel({
    ...payload,
    slug,
    status: "published",
    ...(normalizedIp ? {
      submitterIp: normalizedIp,
    } : {}),
  });

  await ad.save();

  return toPublicAd(ad);
}

export async function findAiGeneratedAdByKey(aiGenerationKey: string) {
  await connectToDatabase();
  await ensureAiGenerationIndexes();

  const ad = await AdModel.findOne({
    aiGenerated: true,
    aiGenerationKey,
  }).select(publicAdProjection);

  return ad ? toPublicAd(ad) : null;
}

export async function createAiGeneratedAd(
  payload: AdFormValues,
  runDate: string,
  aiGenerationKey: string,
) {
  await connectToDatabase();
  await ensureAiGenerationIndexes();

  const dailyCount = await AdModel.countDocuments({
    aiGenerated: true,
    aiGeneratedDate: runDate,
  });

  if (dailyCount >= 2) {
    return { created: false as const, ad: null };
  }

  const slugSuffix = aiGenerationKey.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "");
  const baseSlug = `${slugify(payload.name) || "kuulutus"}-${slugSuffix}`;
  let slug = baseSlug;
  let counter = 1;

  while (await AdModel.findOne({ slug })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  try {
    const ad = new AdModel({
      ...payload,
      slug,
      aiGenerated: true,
      status: "published",
      aiGeneratedDate: runDate,
      aiGenerationKey,
    });

    await ad.save();

    return { created: true as const, ad: toPublicAd(ad) };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return { created: false as const, ad: null };
    }

    throw error;
  }
}
