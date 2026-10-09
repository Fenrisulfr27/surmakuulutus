import { NextResponse } from "next/server";
import { createAd, listAds, type Ad } from "../../../lib/ads";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page")) || 1, 1);
    const limit = Math.min(Number(url.searchParams.get("limit")) || 6, 50);

    const result = await listAds(page, limit);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status = message.includes("MONGO_URI is not defined") ? 503 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Ad;

    if (!body.name) {
      return NextResponse.json(
        { error: "Nimi on kohustuslik" },
        { status: 400 },
      );
    }

    if (!body.email) {
      return NextResponse.json(
        { error: "E-mail on kohustuslik" },
        { status: 400 },
      );
    }

    const ad = await createAd(body);
    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
