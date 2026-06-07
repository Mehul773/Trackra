import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils/ApiError';

/**
 * Global rate limiter: 100 requests per 15 minutes per IP.
 * Protects against brute-force attacks and accidental infinite loops
 * from a buggy frontend.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers (deprecated)
  handler: (_req, _res) => {
    throw ApiError.tooManyRequests(
      'Too many requests. Please try again in 15 minutes.'
    );
  },
});

/**
 * Strict rate limiter for AI extraction routes: 10 requests per 15 minutes.
 * Gemini API calls cost money (or have free-tier quotas).
 * This prevents a single user from burning through the quota.
 */
export const extractLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res) => {
    throw ApiError.tooManyRequests(
      'AI extraction limit reached. You can extract 10 jobs per 15 minutes.'
    );
  },
});
