import Joi from 'joi';
import { JobStatus } from '../enums/JobStatus.enum';
import { FitRating } from '../enums/FitRating.enum';

/**
 * Joi validation schemas for job-related endpoints.
 *
 * These schemas define EXACTLY what the request body must look like.
 * If the body doesn't match, the validate middleware rejects the
 * request before it reaches the controller.
 */

/**
 * POST /api/jobs — Create a new job manually.
 * Title and company are required; everything else is optional.
 */
export const createJobSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Title is required',
    'string.max': 'Title must be 200 characters or less',
  }),
  company: Joi.string().trim().min(1).max(200).required().messages({
    'string.empty': 'Company is required',
    'string.max': 'Company must be 200 characters or less',
  }),
  location: Joi.string().trim().max(200).allow(null, '').optional(),
  salary: Joi.string().trim().max(100).allow(null, '').optional(),
  url: Joi.string().uri().allow(null, '').optional().messages({
    'string.uri': 'URL must be a valid URL',
  }),
  sourceUrl: Joi.string().uri().allow(null, '').optional(),
  skills: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .default([])
    .optional(),
  fit: Joi.string()
    .valid(...Object.values(FitRating))
    .allow(null)
    .optional()
    .messages({
      'any.only': `Fit must be one of: ${Object.values(FitRating).join(', ')}`,
    }),
  status: Joi.string()
    .valid(...Object.values(JobStatus))
    .default(JobStatus.NOT_APPLIED)
    .optional()
    .messages({
      'any.only': `Status must be one of: ${Object.values(JobStatus).join(', ')}`,
    }),
  notes: Joi.string().trim().max(5000).allow(null, '').optional(),
  rawJD: Joi.string().max(50000).allow(null, '').optional(),
  appliedOn: Joi.date().iso().allow(null).optional(),
  interviewOn: Joi.date().iso().allow(null).optional(),
});

/**
 * PUT /api/jobs/:id — Update a job.
 * Same fields as create, but nothing is required (partial update).
 */
export const updateJobSchema = Joi.object({
  title: Joi.string().trim().min(1).max(200).optional(),
  company: Joi.string().trim().min(1).max(200).optional(),
  location: Joi.string().trim().max(200).allow(null, '').optional(),
  salary: Joi.string().trim().max(100).allow(null, '').optional(),
  url: Joi.string().uri().allow(null, '').optional(),
  sourceUrl: Joi.string().uri().allow(null, '').optional(),
  skills: Joi.array()
    .items(Joi.string().trim().max(50))
    .max(10)
    .optional(),
  fit: Joi.string()
    .valid(...Object.values(FitRating))
    .allow(null)
    .optional(),
  status: Joi.string()
    .valid(...Object.values(JobStatus))
    .optional(),
  notes: Joi.string().trim().max(5000).allow(null, '').optional(),
  rawJD: Joi.string().max(50000).allow(null, '').optional(),
  appliedOn: Joi.date().iso().allow(null).optional(),
  interviewOn: Joi.date().iso().allow(null).optional(),
})
  .min(1) // At least one field must be provided for an update
  .messages({
    'object.min': 'At least one field must be provided for update',
  });
