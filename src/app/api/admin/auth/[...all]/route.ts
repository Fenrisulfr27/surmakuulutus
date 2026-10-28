import { getAdminAuth } from "../../../../../lib/adminAuth";
import { logAdminActivity } from "../../../../../lib/adminAudit";
import { adminErrorResponse, adminJson, checkAdminOrigin, privateHeaders } from "../../../../../lib/adminHttp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(request: Request) {
  const path = new URL(request.url).pathname;
  const login = path === "/api/admin/auth/sign-in/email" && request.method === "POST";
  const logout = path === "/api/admin/auth/sign-out" && request.method === "POST";
  if (!login && !logout) return adminJson({ error: "Not found" }, 404);
  try {
    checkAdminOrigin(request);
    // Fail closed if the attempt cannot be recorded. Never record supplied email/password.
    await logAdminActivity({ action: login ? "login_attempt" : "logout_attempt", administrator: "admin", result: "success" });
    const auth = await getAdminAuth();
    const response = await auth.handler(request);
    await logAdminActivity({ action: login ? "login" : "logout", administrator: "admin", result: response.ok ? "success" : "failure" });
    for (const [key, value] of Object.entries(privateHeaders)) response.headers.set(key, value);
    // Authentication stays in HTTP-only cookies; do not return the provider's session token in JSON.
    return Response.json(response.ok ? { ok: true } : { error: "Sisselogimine ebaõnnestus." }, {
      status: response.status, headers: response.headers,
    });
  } catch (error) {
    return adminErrorResponse(error);
  }
}

export const POST = handle;
