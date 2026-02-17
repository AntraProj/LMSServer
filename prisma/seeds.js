require("dotenv").config();
const {
  PrismaClient,
  BoardType,
  SprintStatus,
  TicketAction,
} = require("@prisma/client");
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  //1. Seed Role
  const adminRole = await prisma.role.upsert({
    where: { name: "Admin" },
    update: { name: "Admin" },
    create: { name: "Admin" },
  });

  const userRole = await prisma.role.upsert({
    where: { name: "User" },
    update: { name: "User" },
    create: { name: "User" },
  });

  const trainerRole = await prisma.role.upsert({
    where: { name: "Trainer" },
    update: { name: "Trainer" },
    create: { name: "Trainer" },
  });

  //2. seed Resources

  // Check if resources already exist before creating them, avoid duplicate entries for the same resources.
  const existingViewOnlyResource = await prisma.resource.findFirst({
    where: { name: "View Only" },
  });

  const viewOnlyResource = existingViewOnlyResource
    ? existingViewOnlyResource
    : await prisma.resource.create({
        data: {
          name: "View Only",
        },
      });

  const existingProjectResource = await prisma.resource.findFirst({
    where: { name: "Create Project" },
  });

  const projectResource = existingProjectResource
    ? existingProjectResource
    : await prisma.resource.create({
        data: {
          name: "Create Project",
        },
      });

  const existingSprintResource = await prisma.resource.findFirst({
    where: { name: "Create Sprint" },
  });

  const sprintResource = existingSprintResource
    ? existingSprintResource
    : await prisma.resource.create({
        data: {
          name: "Create Sprint",
        },
      });

  const existingTicketResource = await prisma.resource.findFirst({
    where: { name: "Create Ticket" },
  });

  const ticketResource = existingTicketResource
    ? existingTicketResource
    : await prisma.resource.create({
        data: {
          name: "Create Ticket",
        },
      });

  const existingAssignTicketResource = await prisma.resource.findFirst({
    where: { name: "Assign Ticket" },
  });
  const assignTicketResource = existingAssignTicketResource
    ? existingAssignTicketResource
    : await prisma.resource.create({
        data: {
          name: "Assign Ticket",
        },
      });

  const existingAdminResource = await prisma.resource.findFirst({
    where: { name: "All Access" },
  });
  const adminResource = existingAdminResource
    ? existingAdminResource
    : await prisma.resource.create({
        data: {
          name: "All Access",
        },
      });

  const existingNotAllowResource = await prisma.resource.findFirst({
    where: { name: "None" },
  });
  const notAllowResource = existingNotAllowResource
    ? existingNotAllowResource
    : await prisma.resource.create({
        data: {
          name: "None",
        },
      });

  //3. Seed User

  //Creating an admin user.
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {
      roleId: adminRole.id,
      email: "admin@example.com",
      passwordHash: "AdminHashedpassword",
      fullName: "Admin User",
    },
    create: {
      roleId: adminRole.id,
      email: "admin@example.com",
      passwordHash: "AdminHashedpassword",
      fullName: "Admin User",
    },
  });

  //Creating a normal user.
  const user = await prisma.user.upsert({
    where: { email: "john.doe@example.com" },
    update: {
      roleId: userRole.id,
      email: "john.doe@example.com",
      passwordHash: "Hashedpassword",
      fullName: "John Doe",
    },
    create: {
      roleId: userRole.id,
      email: "john.doe@example.com",
      passwordHash: "Hashedpassword",
      fullName: "John Doe",
    },
  });

  //4. seed role-resource mapping

  // Admin has access to all resources
  const adminPermisssion = await prisma.rolePermission.upsert({
    where: {
      roleId_resourceId: { roleId: adminRole.id, resourceId: adminResource.id },
    },
    update: { roleId: adminRole.id, resourceId: adminResource.id },
    create: { roleId: adminRole.id, resourceId: adminResource.id },
  });

  // User has access to ticket resource.
  const userPermission = await prisma.rolePermission.upsert({
    where: {
      roleId_resourceId: {
        roleId: userRole.id,
        resourceId: ticketResource.id,
      },
    },
    update: {
      roleId: userRole.id,
      resourceId: ticketResource.id,
    },
    create: {
      roleId: userRole.id,
      resourceId: ticketResource.id,
    },
  });

  //5. seed Project
  const project = await prisma.project.upsert({
    where: { key: "PROJECT1" },
    update: {
      key: "PROJECT1",
      name: "React Project 1",
      createdBy: adminUser.id,
    },
    create: {
      key: "PROJECT1",
      name: "React Project 1",
      createdBy: adminUser.id,
    },
  });

  //6. seed project-user mapping
  const projectUser = await prisma.projectUser.upsert({
    where: {
      userId_projectId: { userId: user.id, projectId: project.id },
    },
    update: {
      userId: user.id,
      projectId: project.id,
    },
    create: {
      userId: user.id,
      projectId: project.id,
    },
  });

  //7. seed Board
  const existingBoard = await prisma.board.findFirst({
    where: {
      projectId: project.id,
      type: BoardType.SCRUM,
    },
  });

  const board = existingBoard
    ? existingBoard
    : await prisma.board.create({
        data: {
          projectId: project.id,
          type: BoardType.SCRUM,
          name: "Scrum Board",
        },
      });

  //8. seed Board Columns
  const boardColumn1 = await prisma.boardColumn.upsert({
    where: {
      boardId_position: { boardId: board.id, position: 1 },
    },
    update: {
      boardId: board.id,
      name: "Backlog",
      position: 1,
    },
    create: {
      boardId: board.id,
      name: "Backlog",
      position: 1,
    },
  });

  //9. seed Sprint
  const existingSprint = await prisma.sprint.findFirst({
    where: { boardId: board.id, name: "Sprint 1" },
  });
  const sprint = existingSprint
    ? existingSprint
    : await prisma.sprint.create({
        data: {
          boardId: board.id,
          name: "Sprint 1",
          status: SprintStatus.ACTIVE,
          startDate: new Date(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week later
        },
      });

  //10. seed TicketType
  const ticketType = await prisma.ticketType.upsert({
    where: { name: "Bug" },
    update: { name: "Bug" },
    create: { name: "Bug" },
  });

  //11. seed Priority
  const criticalPriority = await prisma.priority.upsert({
    where: { name: "Critical" },
    update: { name: "Critical" },
    create: { name: "Critical" },
  });

  const highPriority = await prisma.priority.upsert({
    where: { name: "High" },
    update: { name: "High" },
    create: { name: "High" },
  });

  const mediumPriority = await prisma.priority.upsert({
    where: { name: "Medium" },
    update: { name: "Medium" },
    create: { name: "Medium" },
  });

  const lowPriority = await prisma.priority.upsert({
    where: { name: "Low" },
    update: { name: "Low" },
    create: { name: "Low" },
  });

  //12. seed Ticket
  const ticket = await prisma.ticket.upsert({
    where: {
      projectId_keyNumber: {
        projectId: project.id,
        keyNumber: 1,
      },
    },
    update: {
      keyNumber: 1,
      projectId: project.id,
      boardId: board.id,
      sprintId: sprint.id,
      parentTicketId: null,
      typeId: ticketType.id,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      statusId: 1, // Assuming 1 is the ID for "To Do" status
      title: "Fix UI Bug",
      description: "UI is not responsive on Mobile devices",
      priorityId: highPriority.id,
      reporterId: user.id,
      assigneeId: null,
      storyPointEstimate: 3,
    },
    create: {
      keyNumber: 1,
      projectId: project.id,
      boardId: board.id,
      sprintId: sprint.id,
      parentTicketId: null,
      typeId: ticketType.id,
      startDate: new Date(),
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days later
      statusId: 1, // Assuming 1 is the ID for "To Do" status
      title: "Fix UI Bug",
      description: "UI is not responsive on Mobile devices",
      priorityId: highPriority.id,
      reporterId: user.id,
      assigneeId: null,
      storyPointEstimate: 3,
    },
  });

  //13. seed label
  const label = await prisma.label.upsert({
    where: { name: "UI Design" },
    update: { name: "UI Design" },
    create: { name: "UI Design" },
  });

  //14. seed ticket-label mapping
  const ticketLabel = await prisma.ticketLabel.upsert({
    where: {
      ticketId_labelId: {
        ticketId: ticket.id,
        labelId: label.id,
      },
    },
    update: {
      ticketId: ticket.id,
      labelId: label.id,
    },
    create: {
      ticketId: ticket.id,
      labelId: label.id,
    },
  });

  //15. seed ticket comment
  const ticketComment = await prisma.ticketComment.create({
    data: {
      ticketId: ticket.id,
      userId: user.id,
      message: "UI bug noticed on mobile view.",
    },
  });

  //16. seed ticket history
  const ticketHistory = await prisma.ticketHistory.create({
    data: {
      ticketId: ticket.id,
      action: TicketAction.CREATED,
      oldValue: null,
      newValue: "Ticket created with title 'Fix UI Bug'",
      updatedBy: user.id,
    },
  });

  //17. seed attachment
  const attachment = await prisma.attachment.create({
    data: {
      ticketId: ticket.id,
      uploadedBy: user.id,
      fileUrl: "https://example.com/screenshot.png",
      fileName: "bug-snapshot.png",
      fileSize: 245, //in kb
      mimeType: "image/png",
    },
  });

  console.log("🌱 Data seeded successfully");
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
