import { HttpStatus } from '../enums/HttpStatus.enum';

/**
 * Custom error class for operational errors (bad input, not found, unauthorized, etc.)
 * These are errors we EXPECT can happen and want to handle gracefully.
 *
 * Extends the built-in Error class so it works with `throw`, `instanceof`,
 * and stack traces just like any normal error.
 */
export class ApiError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly isOperational: boolean;

  constructor(
    statusCode: HttpStatus,
    message: string,
    isOperational: boolean = true
  ) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Fix prototype chain — required when extending built-in classes in TS
    Object.setPrototypeOf(this, ApiError.prototype);

    // Capture stack trace, excluding this constructor from it
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Factory methods for common errors.
   * Usage: throw ApiError.notFound('Job not found')
   * Much cleaner than: throw new ApiError(HttpStatus.NOT_FOUND, 'Job not found')
   */
  static badRequest(message: string = 'Bad request'): ApiError {
    return new ApiError(HttpStatus.BAD_REQUEST, message);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(HttpStatus.UNAUTHORIZED, message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(HttpStatus.FORBIDDEN, message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(HttpStatus.NOT_FOUND, message);
  }

  static conflict(message: string = 'Conflict'): ApiError {
    return new ApiError(HttpStatus.CONFLICT, message);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(HttpStatus.TOO_MANY_REQUESTS, message);
  }

  static internal(message: string = 'Internal server error'): ApiError {
    return new ApiError(HttpStatus.INTERNAL_SERVER_ERROR, message, false);
  }
}
