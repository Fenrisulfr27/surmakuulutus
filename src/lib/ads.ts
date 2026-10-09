import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";

export interface Ad {
  _id?: string;
  poem?: string;
  slug?: string;
  name: string;
  email: string;
  birthYear?: string;
  deathYear?: string;
  bottomText?: string;
  topText?: string;
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

export async function listAds(page = 1, limit = 6) {
  await connectToDatabase();

  const skip = (page - 1) * limit;

  const [totalAds, ads] = await Promise.all([
    AdModel.countDocuments(),
    AdModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
  ]);

  return {
    data: ads,
    totalPages: Math.ceil(totalAds / limit),
    currentPage: page,
    totalAds,
  };
}

export async function getAdBySlug(slug: string) {
  await connectToDatabase();
  return AdModel.findOne({ slug });
}

export async function createAd(payload: Ad) {
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

  return ad;
}
