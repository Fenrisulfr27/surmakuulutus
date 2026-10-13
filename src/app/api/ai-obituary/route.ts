import { NextResponse } from "next/server";
import { generateDailyAiObituary } from "../../../lib/aiObituary";

export const runtime = "nodejs";

function isAuthorized(request: Request) {
  const secret = process.env.AI_GENERATION_SECRET?.trim();
  const authHeader = request.headers.get("authorization")?.trim();

  return Boolean(secret && authHeader === `Bearer ${secret}`);
}

function logAiGenerationEvent(
  request: Request,
  outcome: "accepted" | "rejected" | "error",
  details: Record<string, unknown> = {},
) {
  console.info("security.submission", {
    timestamp: new Date().toISOString(),
    endpoint: new URL(request.url).pathname,
    source: "ai",
    outcome,
    ...details,
  });
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    logAiGenerationEvent(request, "rejected", { reason: "unauthorized" });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateDailyAiObituary(
      request.headers.get("x-github-run-id")?.trim() || undefined,
    );
    logAiGenerationEvent(request, "accepted", {
      created: result.created,
      reason: result.created ? "created" : "duplicate_or_daily_limit",
    });
    return NextResponse.json(result, { status: result.created ? 201 : 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Server error";
    const status =
      message.includes("OPENAI_API_KEY") || message.includes("MONGO_URI")
        ? 503
        : 500;

    logAiGenerationEvent(request, "error", { status });
    return NextResponse.json({ error: "Server error" }, { status });
  }
}
