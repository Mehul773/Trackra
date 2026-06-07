import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ApiError } from '../utils/ApiError';

/**
 * Creates a validation middleware for a given Joi schema.
 *
 * Usage in routes:
 *   router.post('/jobs', validate(createJobSchema), jobController.create);
 *
 * The middleware runs BEFORE the controller. If validation fails,
 * it throws an ApiError with a detailed message and the controller
 * never executes. If validation passes, the sanitized data replaces
 * req.body and the request continues to the controller.
 */
export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return ALL errors, not just the first one
      stripUnknown: true, // Remove fields not defined in the schema
      errors: {
        wrap: {
          label: false, // Don't wrap field names in quotes in error messages
        },
      },
    });

    if (error) {
      // Join all error messages into one readable string
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join('; ');

      throw ApiError.badRequest(errorMessage);
    }

    // Replace req.body with the validated + sanitized data
    req.body = value;
    next();
  };
};
