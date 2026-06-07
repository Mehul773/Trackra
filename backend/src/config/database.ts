import { PrismaClient } from '@prisma/client';
import { env } from './env';

/**
 * Singleton Prisma client.
 *
 * In development, hot-reloading (ts-node-dev, nodemon) re-executes
 * this file on every save. Without the global cache trick, each reload
 * creates a NEW PrismaClient → a new connection pool → you hit
 * Supabase's connection limit within minutes.
 *
 * In production, the module cache handles it — this file runs once.
 */

// Extend the global object to store our Prisma instance.
// This survives hot-reloads because `globalThis` persists across module re-evaluations.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

// Only cache in development (production module cache is enough)
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
