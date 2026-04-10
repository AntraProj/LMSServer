import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

router.use("/auth", authRoutes);

// Future routes registered here:
// router.use("/users",    userRoutes);
// router.use("/projects", projectRoutes);
// router.use("/tickets",  ticketRoutes);

export default router;