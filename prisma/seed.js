import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, BoardType, SprintStatus, TicketAction } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.$transaction(async (tx) => {

    // -------------------- 1. Roles --------------------
    const adminRole = await tx.role.upsert({
      where: { name: 'Admin' },
      update: {},
      create: { name: 'Admin' },
    });

    const trainerRole = await tx.role.upsert({
      where: { name: 'Trainer' },
      update: {},
      create: { name: 'Trainer' },
    });

    const studentRole = await tx.role.upsert({
      where: { name: 'Student' },
      update: {},
      create: { name: 'Student' },
    });

    // -------------------- 2. Resources --------------------
    const createProjectResource = await tx.resource.upsert({
      where: { name: 'Create Project' },
      update: {},
      create: { name: 'Create Project' },
    });

    const manageTicketResource = await tx.resource.upsert({
      where: { name: 'Manage Ticket' },
      update: {},
      create: { name: 'Manage Ticket' },
    });

    // -------------------- 3. Role Permissions --------------------
    // Admin — full access to all resources
    await tx.rolePermission.upsert({
      where: { roleId_resourceId: { roleId: adminRole.id, resourceId: createProjectResource.id } },
      update: {},
      create: { roleId: adminRole.id, resourceId: createProjectResource.id },
    });

    await tx.rolePermission.upsert({
      where: { roleId_resourceId: { roleId: adminRole.id, resourceId: manageTicketResource.id } },
      update: {},
      create: { roleId: adminRole.id, resourceId: manageTicketResource.id },
    });

    // Trainer — can create projects
    await tx.rolePermission.upsert({
      where: { roleId_resourceId: { roleId: trainerRole.id, resourceId: createProjectResource.id } },
      update: {},
      create: { roleId: trainerRole.id, resourceId: createProjectResource.id },
    });

    // Trainer — can Manage tickets
    await tx.rolePermission.upsert({
      where: { roleId_resourceId: { roleId: trainerRole.id, resourceId: manageTicketResource.id } },
      update: {},
      create: { roleId: trainerRole.id, resourceId: manageTicketResource.id },
    });

    // Student — can Manage tickets only
    await tx.rolePermission.upsert({
      where: { roleId_resourceId: { roleId: studentRole.id, resourceId: manageTicketResource.id } },
      update: {},
      create: { roleId: studentRole.id, resourceId: manageTicketResource.id },
    });

    // -------------------- 4. Users --------------------
    const adminUser = await tx.user.upsert({
      where: { email: 'admin@example.com' },
      update: { roleId: adminRole.id, fullName: 'Admin User', passwordHash: 'AdminHashedPassword' },
      create: {
        roleId: adminRole.id,
        email: 'admin@example.com',
        passwordHash: 'AdminHashedPassword', // ⚠️ Dev only — never use plaintext strings in production seed
        fullName: 'Admin User',
      },
    });

    const trainerUser = await tx.user.upsert({
      where: { email: 'trainer@example.com' },
      update: { roleId: trainerRole.id, fullName: 'Trainer User', passwordHash: 'TrainerHashedPassword' },
      create: {
        roleId: trainerRole.id,
        email: 'trainer@example.com',
        passwordHash: 'TrainerHashedPassword',
        fullName: 'Trainer User',
      },
    });

    const studentUser = await tx.user.upsert({
      where: { email: 'student@example.com' },
      update: { roleId: studentRole.id, fullName: 'Student User', passwordHash: 'StudentHashedPassword' },
      create: {
        roleId: studentRole.id,
        email: 'student@example.com',
        passwordHash: 'StudentHashedPassword',
        fullName: 'Student User',
      },
    });

    // -------------------- 5. Workflow (system default) --------------------
    // Note: ensure this partial unique index exists in your migration:
    //   CREATE UNIQUE INDEX workflows_system_name_unique ON workflows (name) WHERE created_by IS NULL;
    const existingWorkflow = await tx.workflow.findFirst({
      where: { name: 'Default Scrum Workflow', createdBy: null },
    });

    const workflow = existingWorkflow ?? await tx.workflow.create({
      data: {
        name: 'Default Scrum Workflow',
        createdBy: null,
        isStandard: true,
      },
    });

    // -------------------- 6. Workflow Columns (template) --------------------
    const workflowColumnData = [
      { columnName: 'To Do', position: 1 },
      { columnName: 'In Progress', position: 2 },
      { columnName: 'Done', position: 3 },
    ];

    for (const col of workflowColumnData) {
      await tx.workflowColumn.upsert({
        where: { workflowId_position: { workflowId: workflow.id, position: col.position } },
        update: { columnName: col.columnName },
        create: { workflowId: workflow.id, ...col },
      });
    }

    // -------------------- 7. Project --------------------
    // Only trainers can create projects
    const project = await tx.project.upsert({
      where: { key: 'PROJECT' },
      update: { name: 'React Project 1', workflowId: workflow.id },
      create: {
        key: 'PROJECT',
        name: 'React Project 1',
        createdBy: trainerUser.id,
        workflowId: workflow.id,
        nextTicketNumber: 1,
      },
    });

    // -------------------- 8. Project Users --------------------
    // Trainer in project
    await tx.projectUser.upsert({
      where: { userId_projectId: { userId: trainerUser.id, projectId: project.id } },
      update: {},
      create: { userId: trainerUser.id, projectId: project.id },
    });

    // Student in project
    await tx.projectUser.upsert({
      where: { userId_projectId: { userId: studentUser.id, projectId: project.id } },
      update: {},
      create: { userId: studentUser.id, projectId: project.id },
    });

    // -------------------- 9. Board --------------------
    const existingBoard = await tx.board.findFirst({
      where: { projectId: project.id, type: BoardType.SCRUM },
    });

    const board = existingBoard ?? await tx.board.create({
      data: {
        projectId: project.id,
        type: BoardType.SCRUM,
        name: 'Scrum Board',
      },
    });

    // -------------------- 10. Board Columns (copied from workflow template) --------------------
    const boardColumnData = [
      { columnName: 'To Do', position: 1 },
      { columnName: 'In Progress', position: 2 },
      { columnName: 'Done', position: 3 },
    ];

    const boardColumns = {};

    for (const col of boardColumnData) {
      const boardCol = await tx.boardColumn.upsert({
        where: { boardId_position: { boardId: board.id, position: col.position } },
        update: { columnName: col.columnName },
        create: { boardId: board.id, ...col },
      });
      boardColumns[col.columnName] = boardCol;
    }

    // -------------------- 11. Sprint --------------------
    const existingSprint = await tx.sprint.findFirst({
      where: { boardId: board.id, name: 'Sprint 1' },
    });

    const sprint = existingSprint ?? await tx.sprint.create({
      data: {
        boardId: board.id,
        name: 'Sprint 1',
        status: SprintStatus.ACTIVE,
        startDate: new Date(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // -------------------- 12. Ticket Types --------------------
    const bugType = await tx.ticketType.upsert({
      where: { name: 'Bug' },
      update: {},
      create: { name: 'Bug' },
    });

    await tx.ticketType.upsert({
      where: { name: 'Story' },
      update: {},
      create: { name: 'Story' },
    });

    await tx.ticketType.upsert({
      where: { name: 'Task' },
      update: {},
      create: { name: 'Task' },
    });

    // -------------------- 13. Priorities --------------------
    await tx.priority.upsert({
      where: { name: 'Critical' },
      update: {},
      create: { name: 'Critical' },
    });

    const highPriority = await tx.priority.upsert({
      where: { name: 'High' },
      update: {},
      create: { name: 'High' },
    });

    await tx.priority.upsert({
      where: { name: 'Medium' },
      update: {},
      create: { name: 'Medium' },
    });

    await tx.priority.upsert({
      where: { name: 'Low' },
      update: {},
      create: { name: 'Low' },
    });

    // -------------------- 14. Ticket --------------------
    const ticket = await tx.ticket.upsert({
      where: { projectId_keyNumber: { projectId: project.id, keyNumber: 1 } },
      update: {
        boardId: board.id,
        sprintId: sprint.id,
        typeId: bugType.id,
        statusId: boardColumns['To Do'].id,
        title: 'Fix UI Bug',
        description: 'UI is not responsive on mobile devices',
        priorityId: highPriority.id,
        reporterId: studentUser.id,
        assigneeId: null,
        storyPointEstimate: 3,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
      create: {
        keyNumber: 1,
        projectId: project.id,
        boardId: board.id,
        sprintId: sprint.id,
        parentTicketId: null,
        typeId: bugType.id,
        statusId: boardColumns['To Do'].id,
        title: 'Fix UI Bug',
        description: 'UI is not responsive on mobile devices',
        priorityId: highPriority.id,
        reporterId: studentUser.id,
        assigneeId: null,
        storyPointEstimate: 3,
        startDate: new Date(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    });

    // -------------------- 15. Label --------------------
    const label = await tx.label.upsert({
      where: { name: 'UI Design' },
      update: {},
      create: { name: 'UI Design' },
    });

    // -------------------- 16. Ticket Label --------------------
    await tx.ticketLabel.upsert({
      where: { ticketId_labelId: { ticketId: ticket.id, labelId: label.id } },
      update: {},
      create: { ticketId: ticket.id, labelId: label.id },
    });

    // -------------------- 17. Ticket Comment --------------------
    const existingComment = await tx.ticketComment.findFirst({
      where: { ticketId: ticket.id, userId: studentUser.id, message: 'UI bug noticed on mobile view.' },
    });

    if (!existingComment) {
      await tx.ticketComment.create({
        data: {
          ticketId: ticket.id,
          userId: studentUser.id,
          message: 'UI bug noticed on mobile view.',
        },
      });
    }

    // -------------------- 18. Ticket History --------------------
    const existingHistory = await tx.ticketHistory.findFirst({
      where: { ticketId: ticket.id, action: TicketAction.CREATED },
    });

    if (!existingHistory) {
      await tx.ticketHistory.create({
        data: {
          ticketId: ticket.id,
          action: TicketAction.CREATED,
          oldValue: null,
          newValue: { title: 'Fix UI Bug', status: 'To Do' },
          updatedBy: studentUser.id,
        },
      });
    }

    // -------------------- 19. Attachment --------------------
    const existingAttachment = await tx.attachment.findFirst({
      where: { ticketId: ticket.id, fileName: 'bug-snapshot.png' },
    });

    if (!existingAttachment) {
      await tx.attachment.create({
        data: {
          ticketId: ticket.id,
          uploadedBy: studentUser.id,
          fileUrl: 'https://example.com/screenshot.png',
          fileName: 'bug-snapshot.png',
          fileSize: BigInt(245 * 1024),
          mimeType: 'image/png',
        },
      });
    }

  }, {
    timeout: 30000,
  });

  console.log('🌱 Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed, all changes rolled back:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });