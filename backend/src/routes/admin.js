import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { idParams } from "../validators/common.js";
import { resolveBody } from "../validators/market.js";
import * as c from "../controllers/marketController.js";

const router = Router();
router.use(authenticate, requireAdmin);
router.post("/markets/:id/close", validate({ params: idParams }), h(c.close));
router.post("/markets/:id/resolve", validate({ params: idParams, body: resolveBody }), h(c.resolve));
export default router;
