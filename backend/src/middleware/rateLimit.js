import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

const skip = () => env.NODE_ENV === "test";
const limited = (windowMs, limit) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip,
    message: { type: "https://oddsly.local/errors/rate-limited", title: "Too Many Requests", status: 429, detail: "Too many requests, slow down" },
  });

export const authLimiter = limited(15 * 60 * 1000, 20);
export const apiLimiter = limited(60 * 1000, 300);
export const tradeLimiter = limited(60 * 1000, 60);
