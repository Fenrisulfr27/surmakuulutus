import { markAdminAdViewed } from "../../../../../../lib/adminAds";
import { adminErrorResponse, adminJson, authorizeAdmin } from "../../../../../../lib/adminHttp";

export const runtime = "nodejs";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const administrator = await authorizeAdmin(request);
    await markAdminAdViewed((await params).id, administrator.id);
    return adminJson({ viewed: true });
  } catch (error) { return adminErrorResponse(error); }
}
