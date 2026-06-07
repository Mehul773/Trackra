import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';
import { geminiModel } from '../config/gemini';
import { scrapeJobPage } from '../utils/scraper';
import { signToken } from '../utils/jwt';
import { FitRating } from '../enums/FitRating.enum';
import { JobStatus } from '../enums/JobStatus.enum';

const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockJobCreate = prisma.job.create as jest.Mock;
const mockGenerateContent = geminiModel.generateContent as jest.Mock;
const mockScrapeJobPage = scrapeJobPage as jest.Mock;

describe('Extraction API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
  };
  const token = signToken({ userId: mockUser.id, email: mockUser.email });

  beforeEach(() => {
    jest.clearAllMocks();
    mockUserFindUnique.mockResolvedValue(mockUser);
  });

  const validText =
    'We are looking for a Senior Software Engineer at Vercel. Candidates must have 5+ years of experience with React, Node.js, and TypeScript. Salary is $150,000. Location is Remote, USA.';

  describe('POST /api/extract/text', () => {
    it('should return 401 if unauthorized', async () => {
      const res = await request(app).post('/api/extract/text').send({ text: validText });
      expect(res.status).toBe(401);
    });

    it('should return 400 if text is less than 50 characters', async () => {
      const res = await request(app)
        .post('/api/extract/text')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: 'Too short text' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('at least 50 characters');
    });

    it('should successfully extract job details from text and save to DB', async () => {
      const mockGeminiResponse = {
        response: {
          text: () =>
            JSON.stringify({
              title: 'Senior Software Engineer',
              company: 'Vercel',
              location: 'Remote',
              salary: '$150,000',
              skills: ['React', 'Node.js', 'TypeScript'],
              fit: 'STRONG',
              experience: '5+ years',
            }),
        },
      };

      const mockSavedJob = {
        id: 'job-1',
        title: 'Senior Software Engineer',
        company: 'Vercel',
        location: 'Remote',
        salary: '$150,000',
        skills: ['React', 'Node.js', 'TypeScript'],
        fit: FitRating.STRONG,
        status: JobStatus.NOT_APPLIED,
        userId: mockUser.id,
        rawJD: validText,
        createdAt: new Date(),
      };

      mockGenerateContent.mockResolvedValueOnce(mockGeminiResponse);
      mockJobCreate.mockResolvedValueOnce(mockSavedJob);

      const res = await request(app)
        .post('/api/extract/text')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: validText });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('job-1');
      expect(res.body.data.title).toBe('Senior Software Engineer');
      expect(mockGenerateContent).toHaveBeenCalled();
      expect(mockJobCreate).toHaveBeenCalledWith({
        data: {
          title: 'Senior Software Engineer',
          company: 'Vercel',
          location: 'Remote',
          salary: '$150,000',
          url: null,
          skills: ['React', 'Node.js', 'TypeScript'],
          fit: FitRating.STRONG,
          rawJD: validText,
          user: { connect: { id: mockUser.id } },
        },
      });
    });

    it('should handle invalid JSON from Gemini gracefully and return 500', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => 'This is not JSON text',
        },
      };

      mockGenerateContent.mockResolvedValueOnce(mockGeminiResponse);

      const res = await request(app)
        .post('/api/extract/text')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: validText });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('AI returned invalid JSON');
    });

    it('should successfully handle and parse Gemini output that has conversational wrappers and markdown blocks for a complex job description', async () => {
      const complexJD = `Sr Node.js (Backend) Developer
Mobile Programming
2.9516 Reviews
Company Logo
2 - 5 years
Not Disclosed
Remote
Hiring office located in Remote
Job description:-What You ll Do Design and implement high performance scale able data-centric server-less microservices Estimate engineering effort, plan implementation...`;

      const mockGeminiResponse = {
        response: {
          text: () =>
            `Here is the extracted JSON for the Sr Node.js Backend Developer role:
\`\`\`json
{
  "title": "Sr Node.js (Backend) Developer",
  "company": "Mobile Programming",
  "location": "Remote",
  "salary": "Not Disclosed",
  "url": "https://www.naukri.com/job-listings-sr-node-js-backend-developer-mobileprogramming-remote-2-to-5-years-250522501636",
  "skills": ["Backend", "Software development", "NoSQL", "Agile", "Javascript", "MongoDB", "microservices"],
  "fit": "STRONG",
  "experience": "2 - 5 years"
}
\`\`\`
Hope this helps!`,
        },
      };

      const mockSavedJob = {
        id: 'job-2',
        title: 'Sr Node.js (Backend) Developer',
        company: 'Mobile Programming',
        location: 'Remote',
        salary: 'Not Disclosed',
        url: 'https://www.naukri.com/job-listings-sr-node-js-backend-developer-mobileprogramming-remote-2-to-5-years-250522501636',
        skills: ["Backend", "Software development", "NoSQL", "Agile", "Javascript", "MongoDB", "microservices"],
        fit: FitRating.STRONG,
        status: JobStatus.NOT_APPLIED,
        userId: mockUser.id,
        rawJD: complexJD,
        createdAt: new Date(),
      };

      mockGenerateContent.mockResolvedValueOnce(mockGeminiResponse);
      mockJobCreate.mockResolvedValueOnce(mockSavedJob);

      const res = await request(app)
        .post('/api/extract/text')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: complexJD });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('job-2');
      expect(res.body.data.title).toBe('Sr Node.js (Backend) Developer');
      expect(mockGenerateContent).toHaveBeenCalled();
    });
  });

  describe('POST /api/extract/url', () => {
    const validUrl = 'https://vercel.com/jobs/engineer';

    it('should successfully scrape url, extract job details and save to DB', async () => {
      const mockScrapedText = 'Scraped job details text for Senior Software Engineer at Vercel';
      const mockGeminiResponse = {
        response: {
          text: () =>
            JSON.stringify({
              title: 'Senior Software Engineer',
              company: 'Vercel',
              location: 'Remote',
              salary: '$150,000',
              skills: ['React', 'Node.js', 'TypeScript'],
              fit: 'STRONG',
            }),
        },
      };

      const mockSavedJob = {
        id: 'job-1',
        title: 'Senior Software Engineer',
        company: 'Vercel',
        location: 'Remote',
        salary: '$150,000',
        skills: ['React', 'Node.js', 'TypeScript'],
        fit: FitRating.STRONG,
        status: JobStatus.NOT_APPLIED,
        userId: mockUser.id,
        url: validUrl,
        sourceUrl: validUrl,
        createdAt: new Date(),
      };

      mockScrapeJobPage.mockResolvedValueOnce(mockScrapedText);
      mockGenerateContent.mockResolvedValueOnce(mockGeminiResponse);
      mockJobCreate.mockResolvedValueOnce(mockSavedJob);

      const res = await request(app)
        .post('/api/extract/url')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: validUrl });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(mockScrapeJobPage).toHaveBeenCalledWith(validUrl);
      expect(mockJobCreate).toHaveBeenCalledWith({
        data: {
          title: 'Senior Software Engineer',
          company: 'Vercel',
          location: 'Remote',
          salary: '$150,000',
          url: validUrl,
          sourceUrl: validUrl,
          skills: ['React', 'Node.js', 'TypeScript'],
          fit: FitRating.STRONG,
          rawJD: undefined,
          user: { connect: { id: mockUser.id } },
        },
      });
    });

    it('should return 400 if scraping fails', async () => {
      mockScrapeJobPage.mockRejectedValueOnce(new Error('Network error'));

      const res = await request(app)
        .post('/api/extract/url')
        .set('Authorization', `Bearer ${token}`)
        .send({ url: validUrl });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Could not scrape URL');
    });
  });
});
