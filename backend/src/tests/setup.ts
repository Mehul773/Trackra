/**
 * Jest Global Test Setup.
 *
 * This file is run automatically by Jest before executing any tests.
 * We use it to:
 * 1. Set dummy environment variables to pass the env validator without a real .env.
 * 2. Mock external services like Prisma (database) and Gemini (AI) globally.
 */

// 1. Set environment variables BEFORE importing any config
process.env['PORT'] = '3000';
process.env['NODE_ENV'] = 'test';
process.env['FRONTEND_URL'] = 'http://localhost:5173';
process.env['DATABASE_URL'] = 'postgresql://mock:mock@localhost:5432/mock';
process.env['GOOGLE_CLIENT_ID'] = 'mock_google_client_id';
process.env['GOOGLE_CLIENT_SECRET'] = 'mock_google_client_secret';
process.env['GOOGLE_CALLBACK_URL'] = 'http://localhost:3000/api/auth/google/callback';
process.env['JWT_SECRET'] = 'mock_jwt_secret_at_least_32_chars_long';
process.env['JWT_EXPIRES_IN'] = '1h';
process.env['GEMINI_API_KEY'] = 'mock_gemini_api_key';

// 2. Mock the Prisma client singleton
jest.mock('../config/database', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      upsert: jest.fn(),
    },
    job: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };
  return { prisma: mockPrisma };
});

// 3. Mock the Gemini API client
jest.mock('../config/gemini', () => {
  const mockModel = {
    generateContent: jest.fn(),
  };
  return {
    geminiModel: mockModel,
    JD_EXTRACTION_PROMPT: 'Mock prompt description',
  };
});

// 4. Mock the Web Scraper
jest.mock('../utils/scraper', () => {
  return {
    scrapeJobPage: jest.fn(),
  };
});
