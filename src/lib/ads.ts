import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import type { AdFormValues } from "./adValidation";

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
}

export type PublicAd = Omit<Ad, "email">;

export interface AdsPageData {
  data: PublicAd[];
  totalPages: number;
  currentPage: number;
  totalAds: number;
}

const adSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    email: { type: String, required: true },
    birthYear: String,
    deathYear: String,
    poem: String,
    bottomText: String,
    topText: String,
  },
  { timestamps: true },
);

adSchema.index({ createdAt: -1 });

const AdModel = mongoose.models.Ad ?? mongoose.model("Ad", adSchema);

function toPublicAd(ad: unknown): PublicAd {
  const plain = JSON.parse(JSON.stringify(ad)) as Ad;
  delete (plain as Partial<Ad>).email;
  return plain as PublicAd;
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

export async function listAds(page = 1, limit = 6): Promise<AdsPageData> {
  await connectToDatabase();

  const skip = (page - 1) * limit;

  const [totalAds, ads] = await Promise.all([
    AdModel.countDocuments(),
    AdModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return {
    data: ads.map(toPublicAd),
    totalPages: Math.ceil(totalAds / limit),
    currentPage: page,
    totalAds,
  };
}

export async function getAdBySlug(slug: string) {
  await connectToDatabase();
  const ad = await AdModel.findOne({ slug });
  return ad ? toPublicAd(ad) : null;
}

export async function createAd(payload: AdFormValues) {
  await connectToDatabase();

  const baseSlug = slugify(payload.name);
  let slug = baseSlug;
  let counter = 1;

  while (await AdModel.findOne({ slug })) {
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  const ad = new AdModel({
    ...payload,
    slug,
  });

  await ad.save();

  return toPublicAd(ad);
}
