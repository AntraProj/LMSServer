import { asyncHandler } from "../utils/asyncHandler.js";
import { authService } from "../services/auth.service.js";

// POST /api/auth/signup
export const signup = asyncHandler(async (req, res) => {
  const { fullName, email, password } = req.body;

  const user = await authService.signup({ fullName, email, password });

  res.status(201).json({
    success: true,
    message: "Account created successfully.",
    user
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const {token, user} = await authService.login({ email, password });

  res.status(200).json({
    success: true,
    message: "Logged in successfully.",
    token,
    user
  });
});