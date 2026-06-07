import Joi from 'joi';

/**
 * Validation schemas for AI extraction endpoints.
 */

/**
 * POST /api/extract/url
 * Validates that a valid URL is provided.
 */
export const extractUrlSchema = Joi.object({
  url: Joi.string().uri().required().messages({
    'string.uri': 'Please provide a valid URL',
    'any.required': 'URL is required',
    'string.empty': 'URL cannot be empty',
  }),
});

/**
 * POST /api/extract/text
 * Validates that job description text is provided.
 * Min 50 chars to ensure there's enough content for meaningful extraction.
 */
export const extractTextSchema = Joi.object({
  text: Joi.string().trim().min(50).max(50000).required().messages({
    'string.min':
      'Job description must be at least 50 characters for meaningful extraction',
    'string.max': 'Job description is too long (max 50,000 characters)',
    'any.required': 'Job description text is required',
    'string.empty': 'Job description text cannot be empty',
  }),
});
