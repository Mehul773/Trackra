import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { HttpStatus } from '../enums/HttpStatus.enum';

/**
 * Global error-handling middleware.
 *
 * Express recognizes this as an error handler because it has
 * FOUR parameters (err, req, res, next) instead of the usual three.
 * This is not a convention — it's how Express works internally.
 *
 * Every thrown ApiError and every unhandled exception ends up here.
 */
export const errorHandler: ErrorRequestHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // If it's our custom ApiError, use its status code and message
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
    });
    return;
  }

  // For unknown errors (programming bugs, library crashes, etc.)
  // Log the full error server-side, but send a generic message to the client
  console.error('❌ Unexpected error:', err);

  res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
    success: false,
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message:
      env.NODE_ENV === 'development'
        ? err.message
        : 'Something went wrong. Please try again later.',
    ...(env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};

/**
 * Catch-all for undefined routes.
 * This should be registered AFTER all real routes.
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
