import { getAdministrator } from "./adminAuth";

export class AdminError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export const privateHeaders = { "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex, nofollow" };

export function adminJson(data: unknown, status = 200) {
  return Response.json(data, { status, headers: privateHeaders });
}

export function checkAdminOrigin(request: Request) {
  const configured = process.env.BETTER_AUTH_URL;
  if (!configured || request.headers.get("origin") !== new URL(configured).origin) {
    throw new AdminError("Keelatud päring", 403);
  }
}

export async function authorizeAdmin(request: Request) {
  if (!["GET", "HEAD"].includes(request.method)) checkAdminOrigin(request);
  const administrator = await getAdministrator(request.headers);
  if (!administrator) throw new AdminError("Palun logi sisse", 401);
  return administrator;
}

export function adminErrorResponse(error: unknown) {
  if (error instanceof AdminError) return adminJson({ error: error.message }, error.status);
  // Do not log request bodies, credentials, or database error contents.
  console.error("admin.operation_failed");
  return adminJson({ error: "Toiming ebaõnnestus. Proovi uuesti." }, 500);
}
