import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

// Only the login limiter stays on under test, so a test can prove it really blocks.
const limited = (windowMs, limit, { skipInTest = true } = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => skipInTest && env.NODE_ENV === "test",
    message: { type: "https://oddsly.local/errors/rate-limited", title: "Too Many Requests", status: 429, detail: "Too many requests, slow down" },
  });

export const authLimiter = limited(15 * 60 * 1000, 20, { skipInTest: false });
export const apiLimiter = limited(60 * 1000, 300);
export const tradeLimiter = limited(60 * 1000, 60);
