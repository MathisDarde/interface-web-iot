import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

// Reuse PrismaClient across function invocations / dev reloads.
globalForPrisma.prisma = prisma;

export default prisma;
