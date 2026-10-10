import { NextResponse } from "next/server";
import { createAd, listAds } from "../../../lib/ads";
import { validateAdForm } from "../../../lib/adValidation";

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
    const body = await request.json();
    const parsed = validateAdForm(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.errorMessage,
          fieldErrors: parsed.fieldErrors,
        },
        { status: 400 },
      );
    }

    const ad = await createAd(parsed.data);
    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    return publicErrorResponse(error, 400);
  }
}
