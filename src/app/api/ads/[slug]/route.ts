import { NextResponse } from "next/server";
import { getAdBySlug } from "../../../../lib/ads";

export const runtime = "nodejs";

function publicErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Viga päringus";
  const status = message.includes("MONGO_URI is not defined") ? 503 : 400;

  return NextResponse.json({ error: "Viga päringus" }, { status });
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const ad = await getAdBySlug(slug);

    if (!ad) {
      return NextResponse.json(
        { error: "Kuulutust ei leitud" },
        { status: 404 },
      );
    }

    return NextResponse.json(ad);
  } catch (error) {
    return publicErrorResponse(error);
  }
}
