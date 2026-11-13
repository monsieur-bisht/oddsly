import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectDB() {
  await mongoose.connect(env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName) {
    throw new Error(
      "MongoDB is running standalone. Transactions need a replica set (see README: replica set setup).",
    );
  }
  console.log(`MongoDB connected (replica set: ${hello.setName})`);
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
