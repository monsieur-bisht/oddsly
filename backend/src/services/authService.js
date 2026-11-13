import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { Transaction } from "../models/Transaction.js";
import { JWT_OPTIONS } from "../middleware/auth.js";
import { conflict, unauthorized } from "../utils/errors.js";
import { STARTING_BALANCE } from "../utils/money.js";
import { withTransaction } from "../utils/transaction.js";

const SALT_ROUNDS = 12;
// Compared against when the email is unknown so login timing doesn't reveal which emails exist.
const DUMMY_HASH = bcrypt.hashSync("dummy-password-for-timing", SALT_ROUNDS);

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    algorithm: JWT_OPTIONS.algorithms[0],
    issuer: JWT_OPTIONS.issuer,
    audience: JWT_OPTIONS.audience,
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

export async function register({ email, username, password }) {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  try {
    const user = await withTransaction(async (session) => {
      // role and balance are set here by the server; request bodies can never provide them.
      const [created] = await User.create(
        [{ email, username, passwordHash, role: "user", balance: STARTING_BALANCE }],
        { session },
      );
      await Transaction.create(
        [{ user: created._id, type: "SIGNUP_BONUS", amount: STARTING_BALANCE, balanceAfter: STARTING_BALANCE }],
        { session },
      );
      return created;
    });
    return { user, token: signToken(user) };
  } catch (err) {
    if (err?.code === 11000) throw conflict("Email or username is already taken");
    throw err;
  }
}

export async function login({ email, password }) {
  const user = await User.findOne({ email }).select("+passwordHash");
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    console.warn(`[security] failed login for ${email}`);
    throw unauthorized("Invalid email or password");
  }
  return { user, token: signToken(user) };
}
