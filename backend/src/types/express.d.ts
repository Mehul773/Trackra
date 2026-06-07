/**
 * Declaration merging: extending Express's built-in Request type.
 *
 * By default, req.user doesn't exist on Express's Request type.
 * Our auth middleware sets req.user after JWT verification, but
 * TypeScript doesn't know about that — it would throw:
 *   "Property 'user' does not exist on type 'Request'"
 *
 * This file tells TypeScript: "Hey, Request also has a `user` property."
 * It MERGES with Express's existing Request interface.
 */

import { User } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// This export is required to make this file a module.
// Without it, TypeScript treats it as a script (not a module)
// and the `declare global` block won't work.
export {};
