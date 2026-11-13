import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { env } from "./config/env.js";
import routes from "./routes/index.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.disable("x-powered-by");
  // shortcut: assumes exactly one proxy hop and per-process rate-limit counts; use a shared store before running 2+ instances.
  if (env.NODE_ENV === "production") app.set("trust proxy", 1);
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN.split(","), methods: ["GET", "POST", "PATCH", "DELETE"] }));
  app.use(express.json({ limit: "10kb" }));
  app.use("/api/v1", apiLimiter, routes);
  app.use("/api", notFoundHandler); // unknown API paths must 404 as JSON, not fall into the SPA catch-all below

  // Production: serve the built frontend from the same origin (no CORS, one deploy).
  const dist = fileURLToPath(new URL("../../frontend/dist", import.meta.url));
  if (env.NODE_ENV === "production" && existsSync(dist)) {
    app.use(express.static(dist));
    app.get("/{*splat}", (_req, res) => res.sendFile(`${dist}/index.html`));
  }

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
