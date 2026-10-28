import nextEnv from "@next/env";
import mongoose from "mongoose";
import { configureMongoDns } from "../src/lib/mongoDns.mjs";

nextEnv.loadEnvConfig(process.cwd());

try {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  configureMongoDns();
  await mongoose.connect(process.env.MONGO_URI);
  const collection = mongoose.connection.db.collection("ads");
  const filter = { status: { $exists: false } };
  const count = await collection.countDocuments(filter);
  console.log(`Obituaries without status: ${count}`);
  if (process.argv.includes("--apply")) {
    const result = await collection.updateMany(filter, { $set: { status: "published" } });
    await collection.createIndex({ deletedAt: 1, status: 1, createdAt: -1, _id: -1 });
    await collection.createIndex({ deletedAt: 1, aiGenerated: 1, createdAt: -1, _id: -1 });
    console.log(`Updated ${result.modifiedCount} obituaries. Existing statuses and timestamps preserved.`);
  } else {
    console.log("Dry run. Pass --apply to assign published to records without status and create moderation indexes.");
  }
} catch {
  console.error("Migration failed. Check MONGO_URI and database permissions.");
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
