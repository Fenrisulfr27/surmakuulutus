import { z } from "zod";
import { listIpBans, setIpBan } from "../../../../lib/ipBans";
import { adminErrorResponse, adminJson, authorizeAdmin } from "../../../../lib/adminHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const commandSchema = z.object({ ip: z.string().max(45), blocked: z.boolean() }).strict();

export async function GET(request: Request) {
  try {
    await authorizeAdmin(request);
    return adminJson(await listIpBans(new URL(request.url).searchParams));
  } catch (error) { return adminErrorResponse(error); }
}

export async function POST(request: Request) {
  try {
    const administrator = await authorizeAdmin(request);
    if (!request.headers.get("content-type")?.includes("application/json")) return adminJson({ error: "JSON required" }, 415);
    const command = commandSchema.safeParse(await request.json().catch(() => null));
    if (!command.success) return adminJson({ error: "Vigane päring" }, 400);
    return adminJson(await setIpBan(command.data.ip, command.data.blocked, administrator.id));
  } catch (error) { return adminErrorResponse(error); }
}
