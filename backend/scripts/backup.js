// Dumps every collection to backups/<date>/<collection>.json (Atlas free tier has no scheduled backups).
// Run against production: set MONGODB_URI to the production string, then `bun run backup`.
// shortcut: loads whole collections into memory, fine up to ~100k documents; use mongodump beyond that.
import { mkdir, writeFile } from "node:fs/promises";
import mongoose from "mongoose";
import { connectDB, disconnectDB } from "../src/config/db.js";

await connectDB();
const dir = `backups/${new Date().toISOString().slice(0, 10)}`;
await mkdir(dir, { recursive: true });

for (const { name } of await mongoose.connection.db.listCollections().toArray()) {
  const docs = await mongoose.connection.db.collection(name).find().toArray();
  await writeFile(`${dir}/${name}.json`, JSON.stringify(docs, null, 2));
  console.log(`${name}: ${docs.length} documents`);
}
await disconnectDB();
