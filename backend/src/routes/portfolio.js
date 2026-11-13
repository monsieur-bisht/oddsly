import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { authenticate } from "../middleware/auth.js";
import * as c from "../controllers/portfolioController.js";

const router = Router();
router.get("/", authenticate, h(c.get));
export default router;
