import { getAdministrator } from "../../../../lib/adminAuth";
import { adminErrorResponse, adminJson } from "../../../../lib/adminHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    return adminJson({ authenticated: Boolean(await getAdministrator(request.headers)) });
  } catch (error) { return adminErrorResponse(error); }
}
