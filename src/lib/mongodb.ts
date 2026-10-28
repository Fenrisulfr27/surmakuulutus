import mongoose from "mongoose";
import { configureMongoDns } from "./mongoDns.mjs";

const MONGO_URI = process.env.MONGO_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached = globalThis.mongooseCache ??= { conn: null, promise: null };

export async function connectToDatabase() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    configureMongoDns();
    cached.promise = mongoose.connect(MONGO_URI).catch((error: unknown) => {
      cached.promise = null;
      throw error;
    });
  }

  cached.conn = await cached.promise;
  globalThis.mongooseCache = cached;

  return cached.conn;
}
