import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';
import { verifyToken } from '../utils/jwt';
import { prisma } from '../config/database';

/**
 * JWT authentication middleware.
 *
 * Flow:
 * 1. Extract token from Authorization header ("Bearer <token>")
 * 2. Verify and decode the JWT
 * 3. Look up the user in the database (to ensure they still exist)
 * 4. Attach the user object to req.user
 * 5. Call next() to proceed to the controller
 *
 * If any step fails, throw an ApiError.unauthorized().
 *
 * Usage in routes:
 *   router.get('/jobs', authenticate, jobController.getAll);
 */
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ApiError.unauthorized('No token provided. Please log in.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw ApiError.unauthorized('Invalid token format.');
    }

    // 2. Verify and decode
    const decoded = verifyToken(token);

    // 3. Look up user in DB (they might have been deleted since the token was issued)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      throw ApiError.unauthorized('User no longer exists.');
    }

    // 4. Attach user to request
    req.user = user;

    // 5. Continue to next middleware/controller
    next();
  } catch (error) {
    // If it's already an ApiError, re-throw it
    if (error instanceof ApiError) {
      next(error);
      return;
    }

    // JWT verification errors (expired, malformed, etc.)
    next(ApiError.unauthorized('Invalid or expired token. Please log in again.'));
  }
};
