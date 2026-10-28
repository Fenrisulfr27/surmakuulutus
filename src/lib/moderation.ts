export const obituaryStatuses = ["pending", "published", "rejected", "archived"] as const;
export type ObituaryStatus = (typeof obituaryStatuses)[number];

export const statusLabels: Record<ObituaryStatus, string> = {
  pending: "Ootel",
  published: "Avaldatud",
  rejected: "Tagasi lükatud",
  archived: "Arhiveeritud",
};

export const statusTransitions: Record<ObituaryStatus, readonly ObituaryStatus[]> = {
  pending: ["published", "rejected"],
  published: ["archived"],
  rejected: ["pending"],
  archived: ["published", "pending"],
};

// Missing status belongs only to records created before moderation was introduced.
export const publishedAdFilter = {
  deletedAt: null,
  $or: [{ status: "published" }, { status: { $exists: false } }],
};

export function effectiveStatus(status?: ObituaryStatus): ObituaryStatus {
  return status ?? "published";
}

export function positiveInteger(value: unknown, fallback: number, max = Number.MAX_SAFE_INTEGER) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? Math.min(number, max) : fallback;
}
