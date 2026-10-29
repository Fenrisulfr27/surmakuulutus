import { timingSafeEqual } from "node:crypto";
import { fetchObituaryArchive, importObituaries } from "../../../lib/obituaryImport";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.OBITUARY_IMPORT_SECRET?.trim();
  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret ?? ""}`);
  const headers = { "Cache-Control": "private, no-store" };
  if (!secret || provided.length !== expected.length || !timingSafeEqual(provided, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401, headers });
  }
  try {
    if (new URL(request.url).searchParams.get("dryRun") === "true") {
      const { ads, invalid } = await fetchObituaryArchive();
      return Response.json({ dryRun: true, found: ads.length, invalid }, { headers });
    }
    const result = await importObituaries();
    return Response.json(result, { status: result.invalid ? 207 : 200, headers });
  } catch {
    console.error("obituary.import.failed");
    return Response.json({ error: "Kuulutuste import ebaõnnestus. Importi võib korrata." }, { status: 502, headers });
  }
}
