import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { forbidden, unauthorized } from "../utils/errors.js";

export const JWT_OPTIONS = { algorithms: ["HS256"], issuer: "oddsly", audience: "oddsly-api" };

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, JWT_OPTIONS);
  } catch {
    throw unauthorized("Invalid or expired token");
  }

  // Always load the user fresh so role changes / deletions take effect immediately.
  const user = await User.findById(payload.sub);
  if (!user) throw unauthorized("Invalid or expired token");
  req.user = user;
  next();
});

export const requireAdmin = (req, _res, next) =>
  req.user?.role === "admin" ? next() : next(forbidden());
