import { env } from "./config/env.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { createApp } from "./app.js";
import mongoose from "mongoose";

await connectDB();
// Build every index (unique email, unique payout...) before serving traffic. createApp() loads all models.
const app = createApp();
await Promise.all(Object.values(mongoose.models).map((m) => m.init()));

const server = app.listen(env.PORT, () =>
  console.log(`Oddsly API on http://localhost:${env.PORT}/api/v1`),
);

const shutdown = async () => {
  server.close();
  await disconnectDB();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
