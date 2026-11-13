import bcrypt from "bcrypt";
import { connectDB, disconnectDB } from "../src/config/db.js";
import { User } from "../src/models/User.js";

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;
if (!email || !password || password.length < 10) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD (min 10 chars) in .env");
  process.exit(1);
}
if (process.env.NODE_ENV === "production" && password.includes("ChangeMe")) {
  console.error("Refusing to seed the default admin password in production");
  process.exit(1);
}
await connectDB();
const passwordHash = await bcrypt.hash(password, 12);
await User.updateOne(
  { email: email.toLowerCase() },
  // Admins don't trade, so balance 0 keeps the wallet ledger consistent (no signup bonus transaction).
  { $set: { role: "admin", passwordHash, balance: 0 }, $setOnInsert: { username: "admin" } },
  { upsert: true },
);
console.log(`Admin ready: ${email}`);
await disconnectDB();
