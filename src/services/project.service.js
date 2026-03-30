import {
  findProjectById,
  assignProjectToUser as assignProjectToUserRepo,
  updateProject as updateProjectRepo,
} from "../repositories/project.repository.js";
import { findUserById } from "../repositories/user.repository.js";

export const assignProjectToUser = async (projectId, userId) => {
  const project = await findProjectById(projectId);

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  const user = await findUserById(userId);

  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  return assignProjectToUserRepo(projectId, userId);
};

export const updateProject = async (projectId, updateData) => {
  const project = await findProjectById(projectId);

  if (!project) {
    const error = new Error("Project not found");
    error.statusCode = 404;
    throw error;
  }

  return updateProjectRepo(projectId, updateData);
};
