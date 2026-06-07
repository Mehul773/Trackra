/**
 * Prisma 7 configuration file.
 *
 * In Prisma 7, the database URL was removed from schema.prisma.
 * Connection details now live here in prisma.config.ts.
 * This gives us more control — we can use TypeScript logic,
 * different URLs for different environments, etc.
 */
import 'dotenv/config';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: 'src/prisma/schema.prisma',
  datasource: {
    url: process.env['DATABASE_URL']!,
  },
  migrations: {
    path: 'src/prisma/migrations',
  },
});
