import { getAdminAd, mutateAdminAd } from "../../../../../lib/adminAds";
import { adminErrorResponse, adminJson, authorizeAdmin } from "../../../../../lib/adminHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Context) {
  try {
    await authorizeAdmin(request);
    const ad = await getAdminAd((await params).id);
    return ad ? adminJson(ad) : adminJson({ error: "Kuulutust ei leitud" }, 404);
  } catch (error) { return adminErrorResponse(error); }
}

export async function PATCH(request: Request, { params }: Context) {
  try {
    const administrator = await authorizeAdmin(request);
    if (!request.headers.get("content-type")?.includes("application/json")) return adminJson({ error: "JSON required" }, 415);
    const body = await request.json().catch(() => null);
    return adminJson(await mutateAdminAd((await params).id, body, administrator.id));
  } catch (error) { return adminErrorResponse(error); }
}
