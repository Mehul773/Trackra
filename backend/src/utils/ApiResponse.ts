import { HttpStatus } from '../enums/HttpStatus.enum';

/**
 * Standardized API response wrapper.
 * Every response from this API has the EXACT same shape:
 * { success, statusCode, message, data }
 *
 * This makes life easy for frontend developers — they always know
 * what to expect, whether it's a success or error.
 */
export class ApiResponse<T> {
  public readonly success: boolean;
  public readonly statusCode: HttpStatus;
  public readonly message: string;
  public readonly data: T;

  constructor(statusCode: HttpStatus, message: string, data: T) {
    this.success = statusCode < 400;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  /**
   * Factory for success responses.
   * Usage: ApiResponse.success(HttpStatus.OK, 'Jobs fetched', jobs)
   */
  static ok<T>(data: T, message: string = 'Success'): ApiResponse<T> {
    return new ApiResponse(HttpStatus.OK, message, data);
  }

  static created<T>(data: T, message: string = 'Created successfully'): ApiResponse<T> {
    return new ApiResponse(HttpStatus.CREATED, message, data);
  }

  /**
   * Convert to plain object for res.json().
   * We define toJSON so JSON.stringify (which Express calls internally)
   * knows how to serialize this class.
   */
  toJSON(): { success: boolean; statusCode: number; message: string; data: T } {
    return {
      success: this.success,
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    };
  }
}
