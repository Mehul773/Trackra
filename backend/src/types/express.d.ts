/**
 * Declaration merging: extending Express's built-in Request type.
 *
 * By default, req.user is typed as Express.User (which is an empty interface).
 * Our auth middleware sets req.user to a Prisma User object.
 * This file tells TypeScript what shape req.user actually has.
 *
 * Note: Passport.js already declares `user?: User` on Request.
 * We override Express.User to match our Prisma User shape instead
 * of redeclaring `user` on Request (which would cause a conflict).
 */

import { User as PrismaUser } from '@prisma/client';

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends PrismaUser {}
  }
}

// This export is required to make this file a module.
// Without it, TypeScript treats it as a script (not a module)
// and the `declare global` block won't work.
export {};
