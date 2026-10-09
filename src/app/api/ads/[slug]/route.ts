import { NextResponse } from "next/server";
import { getAdBySlug } from "../../../../lib/ads";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  try {
    const ad = await getAdBySlug(params.slug);

    if (!ad) {
      return NextResponse.json(
        { error: "Kuulutust ei leitud" },
        { status: 404 },
      );
    }

    return NextResponse.json(ad);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Viga päringus";
    const status = message.includes("MONGO_URI is not defined") ? 503 : 400;

    return NextResponse.json({ error: message }, { status });
  }
}
