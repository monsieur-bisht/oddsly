import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";
import { idParams } from "../validators/common.js";
import { createMarketBody, listMarketsQuery, updateMarketBody } from "../validators/market.js";
import * as c from "../controllers/marketController.js";

const router = Router();
router.get("/", validate({ query: listMarketsQuery }), h(c.list));
router.get("/:id", validate({ params: idParams }), h(c.get));
router.post("/", authenticate, requireAdmin, validate({ body: createMarketBody }), h(c.create));
router.patch("/:id", authenticate, requireAdmin, validate({ params: idParams, body: updateMarketBody }), h(c.update));
router.delete("/:id", authenticate, requireAdmin, validate({ params: idParams }), h(c.remove));
export default router;
