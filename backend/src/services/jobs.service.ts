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
    select: {
      id: true,
      title: true,
      company: true,
      location: true,
      salary: true,
      url: true,
      skills: true,
      fit: true,
      status: true,
      appliedOn: true,
      createdAt: true,
      contacts: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
        }
      }
    },
    orderBy: { createdAt: 'desc' },
  }) as any;
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
export const getJobsForExport = async (
  userId: string,
  search?: string,
  category?: string,
  dateFilter?: string
): Promise<(Job & { contacts: Contact[] })[]> => {
  const where: Prisma.JobWhereInput = { userId };

  // 1. Filter by Date
  if (dateFilter && dateFilter !== 'all') {
    const now = new Date();
    if (dateFilter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      where.createdAt = { gte: todayStart };
    } else if (dateFilter === 'week') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: sevenDaysAgo };
    } else if (dateFilter === 'month') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      where.createdAt = { gte: thirtyDaysAgo };
    }
  }

  // 2. Filter by Scoped Search Query
  if (search && search.trim()) {
    const query = search.trim();
    const cat = category || 'all';

    const titleCond = { title: { contains: query, mode: 'insensitive' } as Prisma.StringFilter };
    const companyCond = { company: { contains: query, mode: 'insensitive' } as Prisma.StringFilter };
    const locationCond = { location: { contains: query, mode: 'insensitive' } as Prisma.StringNullableFilter };
    const salaryCond = { salary: { contains: query, mode: 'insensitive' } as Prisma.StringNullableFilter };
    const briefJdCond = { briefJD: { contains: query, mode: 'insensitive' } as Prisma.StringNullableFilter };
    const contactsCond: Prisma.JobWhereInput = {
      contacts: {
        some: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query, mode: 'insensitive' } },
            { role: { contains: query, mode: 'insensitive' } },
          ],
        },
      },
    };

    if (cat === 'title') {
      where.title = titleCond.title;
    } else if (cat === 'company') {
      where.company = companyCond.company;
    } else if (cat === 'location') {
      where.location = locationCond.location;
    } else if (cat === 'salary') {
      where.salary = salaryCond.salary;
    } else if (cat === 'contacts') {
      where.contacts = contactsCond.contacts;
    } else {
      where.OR = [
        titleCond,
        companyCond,
        locationCond,
        salaryCond,
        briefJdCond,
        contactsCond,
      ];
    }
  }

  return prisma.job.findMany({
    where,
    include: { contacts: true },
    orderBy: { createdAt: 'desc' },
  });
};
