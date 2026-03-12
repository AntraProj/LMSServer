import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // Guard — fail immediately if required env vars are missing
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }
  if (!process.env.ADMIN_EMAIL) {
    throw new Error("ADMIN_EMAIL environment variable is not set");
  }
  if (!process.env.ADMIN_PASSWORD_HASH) {
    throw new Error("ADMIN_PASSWORD_HASH environment variable is not set");
  }
  if (!process.env.ADMIN_FULL_NAME) {
    throw new Error("ADMIN_FULL_NAME environment variable is not set");
  }

  await prisma.$transaction(
    async (tx) => {
      // -------------------- 1. Roles --------------------
      const adminRole = await tx.role.upsert({
        where: { name: "Admin" },
        update: {},
        create: { name: "Admin" },
      });

      const trainerRole = await tx.role.upsert({
        where: { name: "Trainer" },
        update: {},
        create: { name: "Trainer" },
      });

      const studentRole = await tx.role.upsert({
        where: { name: "Student" },
        update: {},
        create: { name: "Student" },
      });

      // -------------------- 2. Resources --------------------
      const createProjectResource = await tx.resource.upsert({
        where: { name: "Create Project" },
        update: {},
        create: { name: "Create Project" },
      });

      const manageTicketResource = await tx.resource.upsert({
        where: { name: "Manage Ticket" },
        update: {},
        create: { name: "Manage Ticket" },
      });

      // -------------------- 3. Role Permissions --------------------
      const permissionsMatrix = [
        { role: adminRole, resource: createProjectResource },
        { role: adminRole, resource: manageTicketResource },
        { role: trainerRole, resource: createProjectResource },
        { role: trainerRole, resource: manageTicketResource },
        { role: studentRole, resource: manageTicketResource },
      ];

      for (const { role, resource } of permissionsMatrix) {
        await tx.rolePermission.upsert({
          where: {
            roleId_resourceId: { roleId: role.id, resourceId: resource.id },
          },
          update: {},
          create: { roleId: role.id, resourceId: resource.id },
        });
      }

      // -------------------- 4. Admin User --------------------
      // Credentials are read from environment variables — never hardcoded
      await tx.user.upsert({
        where: { email: process.env.ADMIN_EMAIL },
        update: {
          roleId: adminRole.id,
          fullName: process.env.ADMIN_FULL_NAME,
          passwordHash: process.env.ADMIN_PASSWORD_HASH,
        },
        create: {
          roleId: adminRole.id,
          email: process.env.ADMIN_EMAIL,
          passwordHash: process.env.ADMIN_PASSWORD_HASH,
          fullName: process.env.ADMIN_FULL_NAME,
        },
      });

      // -------------------- 5. Default Workflow --------------------
      // Note: ensure this partial unique index exists in your migration:
      //   CREATE UNIQUE INDEX workflows_system_name_unique ON workflows (name) WHERE created_by IS NULL;
      const existingWorkflow = await tx.workflow.findFirst({
        where: { name: "Default Scrum Workflow", createdBy: null },
      });

      const workflow =
        existingWorkflow ??
        (await tx.workflow.create({
          data: {
            name: "Default Scrum Workflow",
            createdBy: null,
            isStandard: true,
          },
        }));

      // -------------------- 6. Workflow Columns --------------------
      const workflowColumnData = [
        { columnName: "To Do", position: 1 },
        { columnName: "In Progress", position: 2 },
        { columnName: "Done", position: 3 },
      ];

      for (const col of workflowColumnData) {
        await tx.workflowColumn.upsert({
          where: {
            workflowId_position: {
              workflowId: workflow.id,
              position: col.position,
            },
          },
          update: { columnName: col.columnName },
          create: { workflowId: workflow.id, ...col },
        });
      }

      // -------------------- 7. Ticket Types --------------------
      for (const name of ["Bug", "Story", "Task"]) {
        await tx.ticketType.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      }

      // -------------------- 8. Priorities --------------------
      for (const name of ["Critical", "High", "Medium", "Low"]) {
        await tx.priority.upsert({
          where: { name },
          update: {},
          create: { name },
        });
      }
    },
    {
      timeout: 30000,
    },
  );

  console.log("✅ Production seed completed successfully");
}

main()
  .catch((e) => {
    console.error("❌ Production seed failed, all changes rolled back:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
