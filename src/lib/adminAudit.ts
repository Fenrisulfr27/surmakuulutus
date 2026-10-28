import mongoose, { type ClientSession } from "mongoose";
import { connectToDatabase } from "./mongodb";

const auditSchema = new mongoose.Schema({
  timestamp: { type: Date, required: true, default: Date.now },
  action: { type: String, required: true },
  obituaryId: String,
  administrator: { type: String, required: true },
  result: { type: String, enum: ["success", "failure"], required: true },
}, { collection: "admin_activity" });
auditSchema.index({ timestamp: -1, _id: -1 });

export const AdminActivity = mongoose.models.AdminActivity ?? mongoose.model("AdminActivity", auditSchema);

export async function logAdminActivity(
  entry: { action: string; obituaryId?: string; administrator: string; result: "success" | "failure" },
  session?: ClientSession,
) {
  await connectToDatabase();
  await AdminActivity.create([entry], { session });
}

export async function listAdminActivity(page: number) {
  await connectToDatabase();
  const total = await AdminActivity.countDocuments();
  const pages = Math.max(1, Math.ceil(total / 25));
  const currentPage = Math.min(page, pages);
  const rows = await AdminActivity.find().sort({ timestamp: -1, _id: -1 })
    .skip((currentPage - 1) * 25).limit(25).lean();
  return { rows: JSON.parse(JSON.stringify(rows)) as Array<{
    _id: string; timestamp: string; action: string; obituaryId?: string;
    administrator: string; result: string;
  }>, pages, currentPage };
}
