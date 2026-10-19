// lib/prisma.ts
// Singleton instance of Prisma Client for Next.js App Router (Node.js runtime)
// Prevents connection exhaustion during fast-refresh in development

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV !== "production") {
    const cached = globalForPrisma.prisma as Record<string, unknown> | undefined;
    if (cached && !("heroSlide" in cached)) {
      try {
        if (typeof cached.$disconnect === "function") {
          (cached.$disconnect as () => void)();
        }
      } catch {
      }
      globalForPrisma.prisma = undefined;
    }
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

export default prisma;
