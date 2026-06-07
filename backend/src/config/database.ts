import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { env } from './env';

/**
 * Singleton Prisma client with PostgreSQL adapter (Prisma 7 pattern).
 *
 * In Prisma 7, driver adapters are the standard way to connect.
 * We create a `pg` Pool (connection pool), wrap it in PrismaPg adapter,
 * and pass it to PrismaClient.
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

function createPrismaClient(): PrismaClient {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const adapter = new PrismaPg(pool);

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Only cache in development (production module cache is enough)
if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
