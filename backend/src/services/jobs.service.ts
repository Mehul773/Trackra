import { Job, Contact, Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import { JobStatus } from '../enums/JobStatus.enum';
import { ApiError } from '../utils/ApiError';

/**
 * Jobs service — all CRUD operations for job records.
 *
 * Every function takes a userId parameter to ensure users
 * can ONLY access their own jobs. This is the authorization layer.
 */

/**
 * Get all jobs for a user, optionally filtered by status.
 * Returns jobs sorted by newest first.
 */
export const getAllJobs = async (
  userId: string,
  status?: JobStatus
): Promise<(Job & { contacts: Contact[] })[]> => {
  const where: Prisma.JobWhereInput = { userId };

  if (status) {
    where.status = status;
  }

  return prisma.job.findMany({
    where,
    include: { contacts: true },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Get a single job by ID.
 * Throws 404 if the job doesn't exist or doesn't belong to this user.
 */
export const getJobById = async (
  jobId: string,
  userId: string
): Promise<Job & { contacts: Contact[] }> => {
  const job = await prisma.job.findFirst({
    where: {
      id: jobId,
      userId, // Ensures user can only see their own jobs
    },
    include: { contacts: true },
  });

  if (!job) {
    throw ApiError.notFound('Job not found');
  }

  return job;
};

/**
 * Create a new job for a user.
 * Used for both manual creation and AI-extracted jobs.
 */
export const createJob = async (
  userId: string,
  data: any
): Promise<Job & { contacts: Contact[] }> => {
  const { contacts, ...jobData } = data;
  return prisma.job.create({
    data: {
      ...jobData,
      user: {
        connect: { id: userId },
      },
      contacts: contacts ? {
        create: contacts.map((c: any) => ({
          name: c.name,
          email: c.email || null,
          phone: c.phone || null,
          role: c.role || null,
        }))
      } : undefined,
    },
    include: { contacts: true },
  });
};

/**
 * Update an existing job.
 * First verifies the job belongs to this user (authorization check).
 */
export const updateJob = async (
  jobId: string,
  userId: string,
  data: any
): Promise<Job & { contacts: Contact[] }> => {
  // First check that the job belongs to this user
  await getJobById(jobId, userId);

  const { contacts, ...jobData } = data;

  return prisma.$transaction(async (tx) => {
    // If contacts list is provided, delete old ones and create new ones
    if (contacts !== undefined) {
      await tx.contact.deleteMany({
        where: { jobId },
      });
      if (contacts && contacts.length > 0) {
        await tx.contact.createMany({
          data: contacts.map((c: any) => ({
            name: c.name,
            email: c.email || null,
            phone: c.phone || null,
            role: c.role || null,
            jobId,
          })),
        });
      }
    }

    return tx.job.update({
      where: { id: jobId },
      data: jobData,
      include: { contacts: true },
    });
  });
};

/**
 * Delete a job.
 * First verifies the job belongs to this user.
 */
export const deleteJob = async (
  jobId: string,
  userId: string
): Promise<Job> => {
  // First check that the job belongs to this user
  await getJobById(jobId, userId);

  return prisma.job.delete({
    where: { id: jobId },
  });
};

/**
 * Get all jobs for CSV export.
 * Same as getAllJobs but without status filter — exports everything.
 */
export const getJobsForExport = async (userId: string): Promise<(Job & { contacts: Contact[] })[]> => {
  return prisma.job.findMany({
    where: { userId },
    include: { contacts: true },
    orderBy: { createdAt: 'desc' },
  });
};
