import { NextResponse } from "next/server";
import { generateDailyAiObituary } from "../../../lib/aiObituary";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.AI_GENERATION_SECRET?.trim();
  const authHeader = request.headers.get("authorization")?.trim();

  return Boolean(secret && authHeader === `Bearer ${secret}`);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateDailyAiObituary(
      request.headers.get("x-github-run-id")?.trim() || undefined,
    );
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("MONGO_URI")
        ? 503
        : 500;

    return NextResponse.json({ error: "Server error" }, { status });
  }
}
