import { Router } from "express";
import mongoose from "mongoose";
import auth from "./auth.js";
import markets from "./markets.js";
import orders from "./orders.js";
import wallet from "./wallet.js";
import portfolio from "./portfolio.js";
import admin from "./admin.js";

const router = Router();
router.get("/health", (_req, res) =>
  mongoose.connection.readyState === 1 ? res.json({ status: "ok" }) : res.status(503).json({ status: "db-down" }),
);
router.use("/auth", auth);
router.use("/markets", markets);
router.use("/orders", orders);
router.use("/wallet", wallet);
router.use("/portfolio", portfolio);
router.use("/admin", admin);
export default router;
