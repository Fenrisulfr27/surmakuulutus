import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { connectToDatabase } from "./mongodb";

export function adminEmail() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!email) throw new Error("ADMIN_EMAIL is not configured");
  return email;
}

let authPromise: ReturnType<typeof createAuth> | undefined;

async function createAuth() {
  const secret = process.env.BETTER_AUTH_SECRET;
  const baseURL = process.env.BETTER_AUTH_URL;
  if (!secret || secret.length < 32 || !baseURL) throw new Error("Admin authentication is not configured");
  const origin = new URL(baseURL).origin;
  if (process.env.NODE_ENV === "production" && !origin.startsWith("https://")) {
    throw new Error("Admin authentication requires HTTPS in production");
  }
  adminEmail();
  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database unavailable");
  // Enforce uniqueness before serving concurrent authentication requests.
  await Promise.all([
    db.collection("user").createIndex({ email: 1 }, { unique: true }),
    db.collection("session").createIndex({ token: 1 }, { unique: true }),
    db.collection("rateLimit").createIndex({ key: 1 }, { unique: true }),
  ]);

  return betterAuth({
    appName: "Surmakuulutus admin",
    baseURL: origin,
    basePath: "/api/admin/auth",
    secret,
    database: mongodbAdapter(db, { client: mongoose.connection.getClient() }),
    trustedOrigins: [origin],
    emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12, maxPasswordLength: 128 },
    session: {
      expiresIn: 8 * 60 * 60,
      disableSessionRefresh: true,
      cookieCache: { enabled: false },
    },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production",
      defaultCookieAttributes: { httpOnly: true, sameSite: "strict", path: "/" },
      // One administrator: a shared bucket prevents spoofed IP headers bypassing login limits.
      ipAddress: { ipAddressHeaders: [] },
    },
    rateLimit: {
      enabled: true,
      storage: "database",
      customRules: { "/sign-in/email": { window: 15 * 60, max: 5 } },
    },
    databaseHooks: {
      session: { create: { before: async (session) => {
        const user = await db.collection("user").findOne({ _id: new mongoose.Types.ObjectId(session.userId) });
        if (user?.email !== adminEmail()) return false;
        return { data: { ...session, expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000) } };
      } } },
    },
  });
}

export function getAdminAuth() {
  authPromise ??= createAuth().catch((error: unknown) => {
    authPromise = undefined;
    throw error;
  });
  return authPromise;
}

export async function getAdministrator(headers: Headers) {
  if (!headers.get("cookie")) return null;
  const auth = await getAdminAuth();
  const session = await auth.api.getSession({ headers });
  if (!session || session.user.email.toLowerCase() !== adminEmail() ||
      new Date(session.session.expiresAt).getTime() <= Date.now()) return null;
  return { id: session.user.id };
}
