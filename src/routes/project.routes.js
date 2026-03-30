import express from "express";
import {
  assignProjectToUser,
  updateProject,
} from "../controllers/project.controller.js";

const router = express.Router();

router.put("/:projectId/assign-user", assignProjectToUser);
router.put("/:projectId", updateProject);

export default router;
