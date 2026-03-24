import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { env, isProd } from "../config/env.js"
import { logger } from "../config/logger.js"

if (!env.databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set')
}

const globalForPrisma = globalThis

const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.databaseUrl })
});

if (!isProd) {
    globalForPrisma.prisma = prisma
}

export const disconnectPrisma = async () => {
    await prisma.$disconnect();
    logger.info("Prisma disconnected");
};


export default prisma