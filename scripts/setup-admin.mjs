import nextEnv from "@next/env";
import mongoose from "mongoose";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { configureMongoDns } from "../src/lib/mongoDns.mjs";

nextEnv.loadEnvConfig(process.cwd());

try {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!email || !password || password.length < 12 || password.length > 128 || !secret || secret.length < 32 || !process.env.BETTER_AUTH_URL || !process.env.MONGO_URI) {
    throw new Error("Set ADMIN_EMAIL, ADMIN_PASSWORD (12–128 characters), BETTER_AUTH_SECRET (32+ characters), BETTER_AUTH_URL, and MONGO_URI.");
  }
  configureMongoDns();
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  // Enforce uniqueness before creating accounts or accepting concurrent logins.
  await db.collection("user").createIndex({ email: 1 }, { unique: true });
  await db.collection("session").createIndex({ token: 1 }, { unique: true });
  await db.collection("rateLimit").createIndex({ key: 1 }, { unique: true });
  await db.collection("session").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  const existing = await db.collection("user").findOne({ email });
  if (existing) {
    console.log("Administrator already exists; credentials unchanged. Indexes ready.");
  } else {
    if (await db.collection("user").countDocuments() > 0) throw new Error("An account already exists. This installation supports one administrator.");
    const auth = betterAuth({
      baseURL: process.env.BETTER_AUTH_URL,
      secret,
      database: mongodbAdapter(db, { client: mongoose.connection.getClient() }),
      emailAndPassword: { enabled: true, minPasswordLength: 12, maxPasswordLength: 128 },
    });
    const result = await auth.api.signUpEmail({ body: { email, password, name: "Administrator" } });
    // Bootstrap is local-only; do not leave the session created by sign-up active.
    await db.collection("session").deleteMany({ userId: new mongoose.Types.ObjectId(result.user.id) });
    console.log("Administrator created. Remove ADMIN_PASSWORD from the environment; sign in at /admin.");
  }
} catch (error) {
  // Driver/API errors can contain sensitive configuration; never print their contents.
  console.error(error instanceof Error && (error.message.startsWith("Set ADMIN_") || error.message.startsWith("An account"))
    ? error.message : "Administrator setup failed. Check configuration and database access.");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
