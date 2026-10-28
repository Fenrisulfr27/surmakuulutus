import mongoose from "mongoose";
import { connectToDatabase } from "./mongodb";
import { normalizeSubmitterIp } from "./submitterIp.mjs";
import { logAdminActivity } from "./adminAudit";
import { AdminError } from "./adminHttp";
import { positiveInteger } from "./moderation";

const ipBanSchema = new mongoose.Schema({
  ip: { type: String, required: true, unique: true },
  blocked: { type: Boolean, required: true, default: false },
}, { timestamps: true, collection: "ip_bans" });
ipBanSchema.index({ blocked: 1, updatedAt: -1, _id: -1 });
export const IpBanModel = mongoose.models.IpBan ?? mongoose.model("IpBan", ipBanSchema);

export async function blockedIpSet(ips: string[]) {
  if (!ips.length) return new Set<string>();
  await connectToDatabase();
  const bans = await IpBanModel.find({ ip: { $in: [...new Set(ips)] }, blocked: true }).select("ip").lean();
  return new Set<string>(bans.map((ban) => ban.ip as string));
}

export async function isIpBanned(ip: string) {
  const normalized = normalizeSubmitterIp(ip);
  if (!normalized) return false;
  return (await blockedIpSet([normalized])).has(normalized);
}

export async function setIpBan(ip: string, blocked: boolean, administrator: string) {
  const normalized = normalizeSubmitterIp(ip);
  if (!normalized) throw new AdminError("Sisesta kehtiv IP-aadress", 400);
  await connectToDatabase();
  await IpBanModel.init();
  // Reserve the unique address before the transaction; concurrent changes then update one record.
  await IpBanModel.updateOne({ ip: normalized }, { $setOnInsert: { ip: normalized, blocked: false } }, { upsert: true });
  const action = blocked ? "ip_ban" : "ip_unban";
  try {
    await mongoose.connection.transaction(async (session) => {
      const ban = await IpBanModel.findOneAndUpdate({ ip: normalized }, { $set: { blocked } }, {
        session, returnDocument: "after", runValidators: true,
      }).lean();
      if (!ban) throw new Error("IP ban record missing");
      await logAdminActivity({ action, ipBanId: String(ban._id), administrator, result: "success" }, session);
    });
    return { ip: normalized, blocked };
  } catch (error) {
    await logAdminActivity({ action, administrator, result: "failure" });
    throw error;
  }
}

export async function listIpBans(params: URLSearchParams) {
  await connectToDatabase();
  const ip = params.get("ip")?.trim();
  const filter = { blocked: true, ...(ip ? { ip: normalizeSubmitterIp(ip) ?? "invalid" } : {}) };
  const total = await IpBanModel.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / 20));
  const currentPage = Math.min(positiveInteger(params.get("page"), 1), pages);
  const rows = await IpBanModel.find(filter).select("ip createdAt updatedAt")
    .sort({ updatedAt: -1, _id: -1 }).skip((currentPage - 1) * 20).limit(20).lean();
  return { rows: JSON.parse(JSON.stringify(rows)) as Array<{ _id: string; ip: string; updatedAt: string }>, pages, currentPage, total };
}
