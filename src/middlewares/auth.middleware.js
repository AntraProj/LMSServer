import prisma from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyAuthToken } from "../utils/jwt.js";

// ─── Protect ──────────────────────────────────────────────────────────────────
// Verifies the Bearer token and attaches the user to req.user
// Add to any route that requires authentication
//
// JWT errors (invalid/expired) throw automatically and are caught
// by errorHandler which converts them into clean AppErrors

export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer")) {
    throw new AppError(
      "You are not logged in. Please log in to get access.",
      401
    );
  }

  const token = authHeader.split(" ")[1];

  // Throws JsonWebTokenError or TokenExpiredError on failure —
  // both are handled in errorHandler, no try/catch needed here
  const decoded = verifyAuthToken(token);

  // Confirm the user still exists — handles deleted accounts with live tokens
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: {
      id:       true,
      email:    true,
      fullName: true,
      roleId:   true,
      isActive: true,
    },
  });

  if (!user) {
    throw new AppError(
      "The user belonging to this token no longer exists.",
      401
    );
  }

  // Handle deactivated accounts that still have a valid token
  if (!user.isActive) {
    throw new AppError("Your account has been deactivated.", 403);
  }

  // Attach to request — available as req.user in all downstream handlers
  req.user = {
    id:       user.id,
    email:    user.email,
    fullName: user.fullName,
    roleId:   user.roleId,
  };

  next();
});