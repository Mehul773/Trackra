import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { ApiError } from '../utils/ApiError';
import { HttpStatus } from '../enums/HttpStatus.enum';
import { JobStatus } from '../enums/JobStatus.enum';
import * as jobsService from '../services/jobs.service';
import { jobsToCsv } from '../utils/csvExporter';

/**
 * Job controllers — CRUD operations for the user's job pipeline.
 * All routes are protected by auth middleware (req.user is guaranteed).
 */

/**
 * Helper to safely extract a string param from req.params.
 * Express 5 types params values as string | string[],
 * but route params like :id are always strings.
 */
const getParam = (req: Request, name: string): string => {
  const value = req.params[name];
  if (typeof value !== 'string') {
    throw ApiError.badRequest(`Missing or invalid parameter: ${name}`);
  }
  return value;
};

/**
 * GET /api/jobs?status=APPLIED
 * Get all jobs for the authenticated user.
 * Optional query param `status` filters by job status.
 */
export const getAllJobs = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const rawStatus = req.query['status'];
    const status = typeof rawStatus === 'string' ? rawStatus as JobStatus : undefined;

    // Validate status if provided
    if (status && !Object.values(JobStatus).includes(status)) {
      throw ApiError.badRequest(
        `Invalid status. Must be one of: ${Object.values(JobStatus).join(', ')}`
      );
    }

    const jobs = await jobsService.getAllJobs(userId, status);

    res.json(ApiResponse.ok(jobs, 'Jobs fetched successfully'));
  }
);

/**
 * GET /api/jobs/:id
 * Get a single job by ID (only if it belongs to the authenticated user).
 */
export const getJobById = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const jobId = getParam(req, 'id');

    const job = await jobsService.getJobById(jobId, userId);

    res.json(ApiResponse.ok(job, 'Job fetched successfully'));
  }
);

/**
 * POST /api/jobs
 * Create a new job manually.
 * Body is validated by Joi middleware before reaching here.
 */
export const createJob = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;

    const job = await jobsService.createJob(userId, req.body);

    res
      .status(HttpStatus.CREATED)
      .json(ApiResponse.created(job, 'Job created successfully'));
  }
);

/**
 * PUT /api/jobs/:id
 * Update an existing job (status, notes, any field).
 */
export const updateJob = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const jobId = getParam(req, 'id');

    const job = await jobsService.updateJob(jobId, userId, req.body);

    res.json(ApiResponse.ok(job, 'Job updated successfully'));
  }
);

/**
 * DELETE /api/jobs/:id
 * Delete a job from the pipeline.
 */
export const deleteJob = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const jobId = getParam(req, 'id');

    await jobsService.deleteJob(jobId, userId);

    res
      .status(HttpStatus.OK)
      .json(ApiResponse.ok(null, 'Job deleted successfully'));
  }
);

/**
 * GET /api/jobs/export/csv
 * Export all jobs as CSV.
 * Sets Content-Type to text/csv so the browser triggers a download,
 * but the raw CSV text is also visible/copyable in the response.
 */
export const exportCsv = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { search, category, dateFilter } = req.query;

    const jobs = await jobsService.getJobsForExport(
      userId,
      typeof search === 'string' ? search : undefined,
      typeof category === 'string' ? category : undefined,
      typeof dateFilter === 'string' ? dateFilter : undefined
    );

    if (jobs.length === 0) {
      throw ApiError.notFound('No jobs to export');
    }

    const csv = jobsToCsv(jobs);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="trackra-jobs.csv"'
    );
    res.send(csv);
  }
);
