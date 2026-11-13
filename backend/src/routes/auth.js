import { Router } from "express";
import { asyncHandler as h } from "../utils/asyncHandler.js";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimit.js";
import { loginBody, registerBody } from "../validators/auth.js";
import * as c from "../controllers/authController.js";

const router = Router();
router.post("/register", authLimiter, validate({ body: registerBody }), h(c.register));
router.post("/login", authLimiter, validate({ body: loginBody }), h(c.login));
router.get("/me", authenticate, h(c.me));
export default router;
