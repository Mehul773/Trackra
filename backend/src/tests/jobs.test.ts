import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';
import { signToken } from '../utils/jwt';
import { JobStatus } from '../enums/JobStatus.enum';
import { FitRating } from '../enums/FitRating.enum';

// Cast prisma mock functions
const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockJobFindMany = prisma.job.findMany as jest.Mock;
const mockJobFindFirst = prisma.job.findFirst as jest.Mock;
const mockJobCreate = prisma.job.create as jest.Mock;
const mockJobUpdate = prisma.job.update as jest.Mock;
const mockJobDelete = prisma.job.delete as jest.Mock;

describe('Jobs API (CRUD)', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };
  const token = signToken({ userId: mockUser.id, email: mockUser.email });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default auth middleware to succeed
    mockUserFindUnique.mockResolvedValue(mockUser);
  });

  describe('GET /api/jobs', () => {
    it('should return 401 if unauthorized', async () => {
      const res = await request(app).get('/api/jobs');
      expect(res.status).toBe(401);
    });

    it('should return 200 with all user jobs', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Software Engineer',
          company: 'Google',
          status: JobStatus.APPLIED,
          userId: mockUser.id,
          createdAt: new Date(),
        },
        {
          id: 'job-2',
          title: 'Full Stack Developer',
          company: 'Meta',
          status: JobStatus.INTERVIEW,
          userId: mockUser.id,
          createdAt: new Date(),
        },
      ];

      mockJobFindMany.mockResolvedValueOnce(mockJobs);

      const res = await request(app)
        .get('/api/jobs')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(mockJobFindMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
        include: { contacts: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should filter jobs by status if valid status query is provided', async () => {
      mockJobFindMany.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/jobs?status=APPLIED')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(mockJobFindMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id, status: JobStatus.APPLIED },
        include: { contacts: true },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return 400 Bad Request if invalid status is provided', async () => {
      const res = await request(app)
        .get('/api/jobs?status=INVALID_STATUS')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid status');
    });
  });

  describe('GET /api/jobs/:id', () => {
    it('should return 200 and the job details if it exists and belongs to the user', async () => {
      const mockJob = {
        id: 'job-1',
        title: 'Backend Developer',
        company: 'Stripe',
        status: JobStatus.OFFER,
        userId: mockUser.id,
      };

      mockJobFindFirst.mockResolvedValueOnce(mockJob);

      const res = await request(app)
        .get('/api/jobs/job-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.title).toBe('Backend Developer');
      expect(mockJobFindFirst).toHaveBeenCalledWith({
        where: { id: 'job-1', userId: mockUser.id },
        include: { contacts: true },
      });
    });

    it('should return 404 if the job does not exist or does not belong to the user', async () => {
      mockJobFindFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/jobs/job-not-found')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/jobs', () => {
    it('should create a job and return 201 Created on valid input', async () => {
      const inputJob = {
        title: 'Backend Engineer',
        company: 'Vercel',
        location: 'Remote',
        salary: '$120k',
        url: 'https://vercel.com/jobs',
        skills: ['Node.js', 'TypeScript'],
        fit: FitRating.STRONG,
        status: JobStatus.NOT_APPLIED,
      };

      const createdJob = {
        id: 'job-1',
        ...inputJob,
        userId: mockUser.id,
        createdAt: new Date(),
      };

      mockJobCreate.mockResolvedValueOnce(createdJob);

      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send(inputJob);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('job-1');
      expect(mockJobCreate).toHaveBeenCalledWith({
        data: {
          ...inputJob,
          contacts: undefined,
          user: { connect: { id: mockUser.id } },
        },
        include: { contacts: true },
      });
    });

    it('should return 400 Bad Request if required fields (title, company) are missing', async () => {
      const res = await request(app)
        .post('/api/jobs')
        .set('Authorization', `Bearer ${token}`)
        .send({ location: 'Remote' }); // missing title and company

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message.toLowerCase()).toContain('title is required');
    });
  });

  describe('PUT /api/jobs/:id', () => {
    const updateInput = {
      status: JobStatus.INTERVIEW,
      notes: 'Got an interview next week!',
    };

    it('should update the job and return 200 on valid input', async () => {
      const existingJob = { id: 'job-1', userId: mockUser.id, title: 'Engineer' };
      const updatedJob = { ...existingJob, ...updateInput };

      mockJobFindFirst.mockResolvedValueOnce(existingJob);
      mockJobUpdate.mockResolvedValueOnce(updatedJob);

      const res = await request(app)
        .put('/api/jobs/job-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateInput);

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe(JobStatus.INTERVIEW);
      expect(mockJobFindFirst).toHaveBeenCalledWith({
        where: { id: 'job-1', userId: mockUser.id },
        include: { contacts: true },
      });
      expect(mockJobUpdate).toHaveBeenCalledWith({
        where: { id: 'job-1' },
        data: updateInput,
        include: { contacts: true },
      });
    });

    it('should return 404 if trying to update a job that does not exist', async () => {
      mockJobFindFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .put('/api/jobs/job-1')
        .set('Authorization', `Bearer ${token}`)
        .send(updateInput);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/jobs/:id', () => {
    it('should delete the job and return 200 on success', async () => {
      const existingJob = { id: 'job-1', userId: mockUser.id, title: 'Engineer' };

      mockJobFindFirst.mockResolvedValueOnce(existingJob);
      mockJobDelete.mockResolvedValueOnce(existingJob);

      const res = await request(app)
        .delete('/api/jobs/job-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockJobDelete).toHaveBeenCalledWith({
        where: { id: 'job-1' },
      });
    });

    it('should return 404 if trying to delete a job that does not exist', async () => {
      mockJobFindFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .delete('/api/jobs/job-1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/jobs/export/csv', () => {
    it('should return 200 and CSV text if jobs exist', async () => {
      const mockJobs = [
        {
          id: 'job-1',
          title: 'Software Engineer',
          company: 'Google',
          status: JobStatus.APPLIED,
          fit: FitRating.STRONG,
          skills: ['JS', 'TS'],
          location: 'NY',
          salary: '$150k',
          url: 'http://google.com',
          notes: 'nice role',
          appliedOn: new Date(),
          interviewOn: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: mockUser.id,
        },
      ];

      mockJobFindMany.mockResolvedValueOnce(mockJobs);

      const res = await request(app)
        .get('/api/jobs/export/csv')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.header['content-type']).toContain('text/csv');
      expect(res.text).toContain('"Title","Company","Location","Salary","Status"');
      expect(res.text).toContain('"Software Engineer","Google"');
    });

    it('should return 404 if there are no jobs to export', async () => {
      mockJobFindMany.mockResolvedValueOnce([]);

      const res = await request(app)
        .get('/api/jobs/export/csv')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
