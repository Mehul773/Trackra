import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import { env } from './config/env';
import { globalLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

// Import Passport config (side-effect: registers the Google strategy)
import './config/passport';

// Import routes
import authRoutes from './routes/auth.routes';
import jobsRoutes from './routes/jobs.routes';
import extractRoutes from './routes/extract.routes';

/**
 * Create and configure the Express application.
 *
 * This file is responsible for:
 * 1. Creating the Express app instance
 * 2. Registering global middleware (in the correct order!)
 * 3. Mounting route handlers
 * 4. Registering error handlers (must be LAST)
 *
 * It does NOT start the server — that's server.ts's job.
 * This separation makes the app testable (you can import app
 * without starting a server).
 */
const app = express();

// ──────────────────────────────────────────────────────────────
// Security middleware (MUST be first)
// ──────────────────────────────────────────────────────────────

// Helmet: Sets various HTTP security headers
// (X-Content-Type-Options, X-Frame-Options, etc.)
app.use(helmet());

// CORS: Only allow requests from our frontend
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true, // Allow cookies/auth headers
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Global rate limiter: 100 requests per 15 minutes per IP
app.use(globalLimiter);

// ──────────────────────────────────────────────────────────────
// Parsing middleware
// ──────────────────────────────────────────────────────────────

// Parse JSON request bodies (limit to 10MB to prevent DoS)
app.use(express.json({ limit: '10mb' }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Parse cookies
app.use(cookieParser());

// ──────────────────────────────────────────────────────────────
// Logging
// ──────────────────────────────────────────────────────────────

// Morgan: Log HTTP requests in dev mode
if (env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────────────────────
// Passport initialization (no sessions — we use JWT)
// ──────────────────────────────────────────────────────────────

app.use(passport.initialize());

// ──────────────────────────────────────────────────────────────
// API Routes
// ──────────────────────────────────────────────────────────────

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/extract', extractRoutes);

// Health check endpoint (useful for monitoring / load balancers)
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

// ──────────────────────────────────────────────────────────────
// Error handling (MUST be last)
// ──────────────────────────────────────────────────────────────

// Catch undefined routes
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
