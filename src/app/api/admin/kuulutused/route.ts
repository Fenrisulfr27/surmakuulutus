import { listAdminAds } from "../../../../lib/adminAds";
import { adminErrorResponse, adminJson, authorizeAdmin } from "../../../../lib/adminHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await authorizeAdmin(request);
    return adminJson(await listAdminAds(new URL(request.url).searchParams));
  } catch (error) { return adminErrorResponse(error); }
}
