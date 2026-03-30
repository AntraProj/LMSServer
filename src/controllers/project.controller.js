import {
  assignProjectToUser as assignProjectToUserService,
  updateProject as updateProjectService,
} from "../services/project.service.js";

export const assignProjectToUser = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "userId is required",
      });
    }

    const updatedProject = await assignProjectToUserService(projectId, userId);

    return res.status(200).json({
      message: "Project assigned to user successfully",
      data: updatedProject,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const updateData = req.body;

    const updatedProject = await updateProjectService(projectId, updateData);

    return res.status(200).json({
      message: "Project updated successfully",
      data: updatedProject,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      message: error.message || "Internal server error",
    });
  }
};
