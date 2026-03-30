const projects = [
  {
    id: 1,
    name: "LMS Project",
    description: "Demo project",
    workflow: "Default workflow",
    userId: null,
    adminId: 1,
  },
  {
    id: 2,
    name: "Backend Cleanup",
    description: "Cleanup tasks",
    workflow: "Kanban",
    userId: null,
    adminId: 1,
  },
];

export const findProjectById = async (projectId) => {
  return projects.find((project) => project.id === Number(projectId));
};

export const assignProjectToUser = async (projectId, userId) => {
  const project = projects.find((item) => item.id === Number(projectId));

  if (!project) {
    return null;
  }

  project.userId = Number(userId);
  return project;
};

export const updateProject = async (projectId, updateData) => {
  const project = projects.find((item) => item.id === Number(projectId));

  if (!project) {
    return null;
  }

  if (updateData.name !== undefined) {
    project.name = updateData.name;
  }

  if (updateData.description !== undefined) {
    project.description = updateData.description;
  }

  if (updateData.workflow !== undefined) {
    project.workflow = updateData.workflow;
  }

  if (updateData.adminId !== undefined) {
    project.adminId = Number(updateData.adminId);
  }

  return project;
};
