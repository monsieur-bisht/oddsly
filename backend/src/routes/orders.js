import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { tradeLimiter } from "../middleware/rateLimit.js";
import { createOrderBody, pageQuery } from "../validators/order.js";
import * as c from "../controllers/orderController.js";

const router = Router();
router.use(authenticate);
router.post("/", tradeLimiter, validate({ body: createOrderBody }), h(c.create));
router.get("/", validate({ query: pageQuery }), h(c.list));
export default router;
