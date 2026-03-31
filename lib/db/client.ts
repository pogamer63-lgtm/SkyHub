/**
 * Prisma client singleton — server-side only.
 * Uses @prisma/adapter-pg for Prisma 7 direct PostgreSQL connection.
 * Prevents multiple PrismaClient instances in development (Next.js HMR).
 *
 * If DATABASE_URL is not set, the client is null and all db helpers
 * return early gracefully — the app works fully without a database.
 */

import { PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

type PrismaClientInstance = PrismaClient | null;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientInstance | undefined;
};

function createClient(): PrismaClientInstance {
  const url = process.env.DATABASE_URL;
  if (!url) return null;

  try {
    const adapter = new PrismaPg({ connectionString: url });
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    });
  } catch {
    return null;
  }
}

export const prisma: PrismaClientInstance =
  globalForPrisma.prisma !== undefined
    ? globalForPrisma.prisma
    : (globalForPrisma.prisma = createClient());
