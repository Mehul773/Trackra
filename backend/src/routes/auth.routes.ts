import { Router } from 'express';
import passport from 'passport';
import * as authController from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/auth/google
 * Initiates Google OAuth flow — redirects user to Google's consent screen.
 * Passport handles everything here; no controller needed.
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false, // We use JWT, not sessions
  })
);

/**
 * GET /api/auth/google/callback
 * Google redirects here after the user approves.
 * Passport verifies the OAuth token, then our controller generates a JWT
 * and redirects to the frontend.
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/auth/google', // Retry on failure
  }),
  authController.googleCallback
);

/**
 * GET /api/auth/me
 * Returns the current user's profile.
 * Protected by JWT auth middleware.
 */
router.get('/me', authenticate, authController.getMe);

/**
 * POST /api/auth/logout
 * Logs the user out. Protected route.
 */
router.post('/logout', authenticate, authController.logout);

// Bypass login helper for local/CI test automation (disabled in production)
if (process.env['NODE_ENV'] !== 'production') {
  router.get('/bypass-login', authController.bypassLogin);
}

export default router;
