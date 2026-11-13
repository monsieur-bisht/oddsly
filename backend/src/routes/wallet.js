import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { pageQuery } from "../validators/order.js";
import * as c from "../controllers/walletController.js";

const router = Router();
router.use(authenticate);
router.get("/", h(c.get));
router.get("/transactions", validate({ query: pageQuery }), h(c.transactions));
export default router;
