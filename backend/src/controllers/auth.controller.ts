import { Request, Response } from 'express';
import { User } from '@prisma/client';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { HttpStatus } from '../enums/HttpStatus.enum';
import * as authService from '../services/auth.service';
import { env } from '../config/env';

/**
 * Auth controllers — handle HTTP layer for authentication.
 *
 * These are thin. They:
 * 1. Extract data from the request
 * 2. Call the appropriate service
 * 3. Send the response
 *
 * No business logic. No database calls. No try/catch (asyncHandler handles it).
 */

/**
 * GET /api/auth/google
 * Handled by Passport middleware in routes — this controller isn't needed.
 * Passport.authenticate('google') does the redirect automatically.
 */

/**
 * GET /api/auth/google/callback
 * Called by Google after the user approves the OAuth consent.
 * Passport runs first and attaches the user to req.user.
 * We generate a JWT and redirect to the frontend with the token.
 */
export const googleCallback = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user as User;

    if (!user) {
      throw ApiError.unauthorized('Authentication failed');
    }

    // Generate JWT for the authenticated user
    const token = authService.generateToken(user);

    // Redirect to frontend with token as query parameter
    // The frontend will extract this token and store it in localStorage
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

/**
 * GET /api/auth/me
 * Returns the current authenticated user's profile.
 * The auth middleware has already verified the JWT and attached req.user.
 */
export const getMe = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = req.user;

    if (!user) {
      throw ApiError.unauthorized('Not authenticated');
    }

    res.json(ApiResponse.ok(user, 'User profile fetched'));
  }
);

/**
 * POST /api/auth/logout
 * Clears the session. With JWT-based auth, the real logout happens
 * on the frontend (delete the token from localStorage).
 * This endpoint exists for completeness and future cookie-based tokens.
 */
export const logout = asyncHandler(
  async (_req: Request, res: Response): Promise<void> => {
    res
      .status(HttpStatus.OK)
      .json(ApiResponse.ok(null, 'Logged out successfully'));
  }
);

/**
 * GET /api/auth/bypass-login
 * Creates/Finds a mock user and generates a token, then redirects to the frontend callback.
 * Enabled only in non-production environments.
 */
export const bypassLogin = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const user = await authService.findOrCreateUser({
      googleId: 'mock-test-id',
      email: 'test-user@example.com',
      name: 'Mock Test User',
      avatar: 'https://lh3.googleusercontent.com/a/mock-avatar',
    });

    const token = authService.generateToken(user);
    res.redirect(`${env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

