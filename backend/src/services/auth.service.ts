import { User } from '@prisma/client';
import { prisma } from '../config/database';
import { signToken } from '../utils/jwt';

/**
 * Auth service — handles user lookup and JWT token generation.
 *
 * This is the "business logic" layer. Controllers call services,
 * services call the database. Controllers NEVER talk to Prisma directly.
 *
 * Why separate controllers from services?
 * - Controllers handle HTTP (req, res) — they're tied to Express
 * - Services handle business logic — they're framework-agnostic
 * - If you ever switch from Express to Fastify, only controllers change
 */

/**
 * Find or create a user from Google OAuth profile data.
 * Called by the Passport callback after successful Google login.
 */
export const findOrCreateUser = async (profile: {
  googleId: string;
  email: string;
  name: string;
  avatar: string | null;
}): Promise<User> => {
  return prisma.user.upsert({
    where: { googleId: profile.googleId },
    update: {
      name: profile.name,
      avatar: profile.avatar,
    },
    create: {
      googleId: profile.googleId,
      email: profile.email,
      name: profile.name,
      avatar: profile.avatar,
    },
  });
};

/**
 * Generate a JWT token for an authenticated user.
 */
export const generateToken = (user: User): string => {
  return signToken({
    userId: user.id,
    email: user.email,
  });
};

/**
 * Get user by ID. Used by auth middleware to verify tokens.
 */
export const getUserById = async (id: string): Promise<User | null> => {
  return prisma.user.findUnique({
    where: { id },
  });
};
