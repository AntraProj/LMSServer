import { Router } from "express";
import { signup, login } from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { signupSchema, loginSchema } from "../schemas/auth.schema.js";

const router = Router();

// POST /api/auth/signup
router.post("/signup", validate(signupSchema), signup);

// POST /api/auth/login
router.post("/login", validate(loginSchema), login);

export default router;