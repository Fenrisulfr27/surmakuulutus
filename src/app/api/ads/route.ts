import { NextResponse } from "next/server";
import { createAd, listAds } from "../../../lib/ads";
import { validateAdForm } from "../../../lib/adValidation";
import {
  getSecurityFields,
  getClientIp,
  protectObituarySubmission,
  stripSecurityFields,
} from "../../../lib/submissionSecurity";

export const runtime = "nodejs";

function publicErrorResponse(error: unknown, fallbackStatus = 500) {
  const message = error instanceof Error ? error.message : "Server error";
  const status = message.includes("MONGO_URI is not defined") ? 503 : fallbackStatus;

  return NextResponse.json({ error: "Server error" }, { status });
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 6, 50);
    const search = url.searchParams.get("search") ?? "";
    const sort = url.searchParams.get("sort") === "oldest" ? "oldest" : "newest";

    const result = await listAds({ page, limit, search, sort });
    return NextResponse.json(result);
  } catch (error) {
    return publicErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Server error" }, { status: 415 });
    }

    const body = await request.json();
    const parsed = validateAdForm(stripSecurityFields(body));

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.errorMessage,
          fieldErrors: parsed.fieldErrors,
        },
        { status: 400 },
      );
    }

    const protection = await protectObituarySubmission(
      request,
      parsed.data,
      getSecurityFields(body),
    );

    if (!protection.allowed) {
      return NextResponse.json(
        { error: protection.message },
        { status: protection.status },
      );
    }

    const ip = getClientIp(request);
    await createAd(parsed.data, ip === "unknown" ? undefined : ip);
    return NextResponse.json({ status: "published" }, { status: 201 });
  } catch (error) {
    return publicErrorResponse(error, 400);
  }
}
