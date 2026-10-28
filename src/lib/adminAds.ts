import mongoose from "mongoose";
import { z } from "zod";
import { AdModel, type Ad } from "./ads";
import { connectToDatabase } from "./mongodb";
import { activeAdminAdFilter, effectiveStatus, obituaryStatuses, positiveInteger, statusTransitions, trashAdFilter, type ObituaryStatus } from "./moderation";
import { validateAdForm } from "./adValidation";
import { logAdminActivity } from "./adminAudit";
import { AdminError } from "./adminHttp";
import { normalizeSubmitterIp } from "./submitterIp.mjs";
import { cache } from "react";
import { blockedIpSet } from "./ipBans";

export type AdminAd = Omit<Ad, "viewedBy" | "submitterIpExpiresAt"> & {
  _id: string; status: ObituaryStatus; version: number; unviewed: boolean; ipBlocked?: boolean; trashed: boolean;
};

const managementProjection = "+email +aiGenerated +aiGeneratedDate +aiGenerationKey +viewedBy +submitterIp";

function toAdminAd(value: unknown, administrator: string): AdminAd {
  const ad = JSON.parse(JSON.stringify(value)) as Ad & { _id: string; __v?: number };
  const unviewed = !ad.viewedBy?.includes(administrator);
  delete ad.viewedBy;
  delete ad.submitterIpExpiresAt;
  return { ...ad, status: effectiveStatus(ad.status), version: ad.__v ?? 0, unviewed,
    trashed: Boolean(ad.deletedAt) || ad.status === "archived" };
}

async function toAdminAds(values: unknown[], administrator: string) {
  const rows = values.map((value) => toAdminAd(value, administrator));
  const blocked = await blockedIpSet(rows.flatMap((ad) => ad.submitterIp ? [ad.submitterIp] : []));
  return rows.map((ad) => ({ ...ad, ipBlocked: Boolean(ad.submitterIp && blocked.has(ad.submitterIp)) }));
}

export function adminListOptions(params: URLSearchParams) {
  const status = params.get("status");
  return {
    page: positiveInteger(params.get("page"), 1),
    search: (params.get("search") ?? "").trim().slice(0, 100),
    status: obituaryStatuses.find((value) => value === status),
    source: params.get("source") === "ai" ? "ai" : params.get("source") === "manual" ? "manual" : undefined,
    sort: params.get("sort") === "oldest" ? "oldest" : "newest",
    deleted: params.get("deleted") === "true",
    unviewed: params.get("unviewed") === "true",
    ip: (params.get("ip") ?? "").trim().slice(0, 45),
  };
}

export function adminAdFilter(options: ReturnType<typeof adminListOptions>, administrator: string) {
  return { $and: [options.deleted ? trashAdFilter : activeAdminAdFilter, {
    ...(options.status === "published" ? {
      $or: [{ status: "published" }, { status: { $exists: false } }],
    } : options.status ? { status: options.status } : {}),
    ...(options.source === "ai" ? { aiGenerated: true } : options.source === "manual" ? { aiGenerated: { $ne: true } } : {}),
    ...(options.search ? { name: { $regex: options.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" } } : {}),
    ...(options.unviewed ? { viewedBy: { $ne: administrator } } : {}),
    ...(options.ip ? { submitterIp: normalizeSubmitterIp(options.ip) ?? "invalid" } : {}),
  }] };
}

export async function listAdminAds(params: URLSearchParams, administrator: string) {
  await connectToDatabase();
  const options = adminListOptions(params);
  const filter = adminAdFilter(options, administrator);
  const total = await AdModel.countDocuments(filter);
  const pages = Math.max(1, Math.ceil(total / 20));
  const currentPage = Math.min(options.page, pages);
  const direction = options.sort === "oldest" ? 1 : -1;
  const rows = await AdModel.find(filter).select(managementProjection)
    .sort({ createdAt: direction, _id: direction }).skip((currentPage - 1) * 20).limit(20).lean();
  return { rows: await toAdminAds(rows, administrator), pages, currentPage, total };
}

export async function getAdminAd(id: string, administrator: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) return null;
  await connectToDatabase();
  const ad = await AdModel.findById(id).select(managementProjection).lean();
  return ad ? (await toAdminAds([ad], administrator))[0] : null;
}

export async function markAdminAdViewed(id: string, administrator: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new AdminError("Kuulutust ei leitud", 404);
  await connectToDatabase();
  // View metadata does not change content timestamps or invalidate in-flight edits.
  const result = await AdModel.updateOne({ _id: id }, { $addToSet: { viewedBy: administrator } }, { timestamps: false });
  if (!result.matchedCount) throw new AdminError("Kuulutust ei leitud", 404);
}

export const getPendingAdminCount = cache(async () => {
  await connectToDatabase();
  return AdModel.countDocuments({ status: "pending", deletedAt: null });
});

export async function getAdminDashboard(administrator: string) {
  await connectToDatabase();
  const groups = await AdModel.aggregate<{ _id: string; count: number; ai: number; unviewed: number }>([
    { $match: activeAdminAdFilter },
    { $group: {
      _id: { $ifNull: ["$status", "published"] }, count: { $sum: 1 },
      ai: { $sum: { $cond: ["$aiGenerated", 1, 0] } },
      unviewed: { $sum: { $cond: [{ $in: [administrator, { $ifNull: ["$viewedBy", []] }] }, 0, 1] } },
    } },
  ]);
  const recent = await AdModel.aggregate([
    { $match: activeAdminAdFilter },
    { $addFields: {
      _pending: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
      _unviewed: { $cond: [{ $in: [administrator, { $ifNull: ["$viewedBy", []] }] }, 0, 1] },
    } },
    { $sort: { _pending: -1, _unviewed: -1, createdAt: -1, _id: -1 } },
    { $limit: 8 },
    { $unset: ["_pending", "_unviewed"] },
  ]);
  return {
    total: groups.reduce((total, group) => total + group.count, 0),
    ai: groups.reduce((total, group) => total + group.ai, 0),
    unviewed: groups.reduce((total, group) => total + group.unviewed, 0),
    counts: Object.fromEntries(groups.map((group) => [group._id, group.count])),
    recent: await toAdminAds(recent, administrator),
  };
}

const commandSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("edit"), version: z.number().int().nonnegative(), values: z.unknown() }).strict(),
  z.object({ action: z.literal("status"), version: z.number().int().nonnegative(), status: z.enum(obituaryStatuses) }).strict(),
  z.object({ action: z.literal("delete"), version: z.number().int().nonnegative() }).strict(),
  z.object({ action: z.literal("restore"), version: z.number().int().nonnegative() }).strict(),
]);

export function parseAdminCommand(body: unknown) {
  const parsed = commandSchema.safeParse(body);
  if (!parsed.success) throw new AdminError("Vigane toiming", 400);
  const command = parsed.data;
  if (command.action === "edit") {
    const values = validateAdForm(command.values);
    if (!values.success) throw new AdminError(values.errorMessage, 400);
    return { ...command, values: values.data };
  }
  return command;
}

export async function mutateAdminAd(id: string, body: unknown, administrator: string) {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new AdminError("Kuulutust ei leitud", 404);
  await connectToDatabase();
  let action = "invalid_command";
  try {
    const command = parseAdminCommand(body);
    action = command.action;
    const updatedAd = await mongoose.connection.transaction(async (session) => {
      const ad = await AdModel.findById(id).select(managementProjection).session(session).lean();
      if (!ad) throw new AdminError("Kuulutust ei leitud", 404);
      const current = toAdminAd(ad, administrator);
      if (current.version !== command.version) throw new AdminError("Kuulutust on muudetud. Laadi leht uuesti.", 409);
      if (current.trashed && command.action !== "restore") throw new AdminError("Kuulutus on prügikastis", 409);
      const changes: Record<string, unknown> = {};
      if (command.action === "edit") {
        Object.assign(changes, command.values, {
          birthYear: command.values.birthYear || "",
          deathYear: command.values.deathYear || "",
        });
      } else if (command.action === "status") {
        if (!statusTransitions[current.status].includes(command.status)) throw new AdminError("Olekumuutus ei ole lubatud", 409);
        changes.status = command.status;
        action = command.status === "published" ? "approve" : command.status === "rejected" ? "reject" : "reopen";
      } else if (command.action === "delete") {
        changes.deletedAt = new Date();
      } else {
        if (!current.trashed) throw new AdminError("Kuulutus ei ole prügikastis", 409);
        changes.deletedAt = null;
        changes.status = "published";
      }
      const versionFilter = command.version === 0
        ? { $or: [{ __v: 0 }, { __v: { $exists: false } }] }
        : { __v: command.version };
      const updated = await AdModel.findOneAndUpdate({ _id: id, ...versionFilter }, {
        $set: changes, $inc: { __v: 1 },
      }, { returnDocument: "after", runValidators: true, session }).select(managementProjection).lean();
      if (!updated) throw new AdminError("Kuulutust on muudetud. Laadi leht uuesti.", 409);
      await logAdminActivity({ action, obituaryId: id, administrator, result: "success" }, session);
      return updated;
    });
    return (await toAdminAds([updatedAd], administrator))[0];
  } catch (error) {
    await logAdminActivity({ action, obituaryId: id, administrator, result: "failure" });
    throw error;
  }
}
