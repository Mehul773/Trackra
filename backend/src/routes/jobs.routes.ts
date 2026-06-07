import { Router } from 'express';
import * as jobsController from '../controllers/jobs.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createJobSchema,
  updateJobSchema,
} from '../validations/jobs.validation';

const router = Router();

// All job routes require authentication
router.use(authenticate);

/**
 * GET /api/jobs/export/csv
 * IMPORTANT: This route MUST be defined before /:id
 * Otherwise Express will treat "export" as an :id parameter!
 */
router.get('/export/csv', jobsController.exportCsv);

/**
 * GET /api/jobs?status=APPLIED
 * Get all jobs, optionally filtered by status.
 */
router.get('/', jobsController.getAllJobs);

/**
 * GET /api/jobs/:id
 * Get a single job by ID.
 */
router.get('/:id', jobsController.getJobById);

/**
 * POST /api/jobs
 * Create a new job manually.
 * Body is validated against createJobSchema.
 */
router.post('/', validate(createJobSchema), jobsController.createJob);

/**
 * PUT /api/jobs/:id
 * Update an existing job.
 * Body is validated against updateJobSchema.
 */
router.put('/:id', validate(updateJobSchema), jobsController.updateJob);

/**
 * DELETE /api/jobs/:id
 * Delete a job.
 */
router.delete('/:id', jobsController.deleteJob);

export default router;
