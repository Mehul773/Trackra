import request from 'supertest';
import app from '../app';
import { prisma } from '../config/database';
import { signToken } from '../utils/jwt';

// Cast prisma mocked methods so TypeScript knows they are jest mocks
const mockUserFindUnique = prisma.user.findUnique as jest.Mock;
const mockUserUpsert = prisma.user.upsert as jest.Mock;

describe('Authentication API & Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/auth/me', () => {
    it('should return 401 Unauthorized if no Authorization header is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No token provided');
    });

    it('should return 401 Unauthorized if the Authorization header does not start with Bearer', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Basic dGVzdDp0ZXN0');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('No token provided');
    });

    it('should return 401 Unauthorized if the token is invalid or expired', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtokenhere');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired token');
    });

    it('should return 401 Unauthorized if the token is valid but the user does not exist in the database', async () => {
      // Create a valid token
      const token = signToken({ userId: 'user-123', email: 'test@example.com' });

      // Mock DB lookup to return null
      mockUserFindUnique.mockResolvedValueOnce(null);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('User no longer exists');
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });

    it('should return 200 OK and user profile if the token is valid and user exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'http://avatar.url',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const token = signToken({ userId: mockUser.id, email: mockUser.email });

      mockUserFindUnique.mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('User profile fetched');
      expect(res.body.data.id).toBe(mockUser.id);
      expect(res.body.data.email).toBe(mockUser.email);
      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should return 200 OK and logged out message', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };
      const token = signToken({ userId: mockUser.id, email: mockUser.email });
      mockUserFindUnique.mockResolvedValueOnce(mockUser);

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');
    });
  });

  describe('GET /api/auth/bypass-login', () => {
    it('should create/find a mock user, generate a token, and redirect to the frontend callback', async () => {
      const mockUser = {
        id: 'mock-user-id',
        googleId: 'mock-test-id',
        email: 'test-user@example.com',
        name: 'Mock Test User',
        avatar: 'https://lh3.googleusercontent.com/a/mock-avatar',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockUserUpsert.mockResolvedValueOnce(mockUser);

      const res = await request(app).get('/api/auth/bypass-login');

      expect(res.status).toBe(302);
      expect(res.header.location).toContain('http://localhost:5173/auth/callback?token=');
      expect(mockUserUpsert).toHaveBeenCalledWith({
        where: { googleId: 'mock-test-id' },
        update: {
          name: 'Mock Test User',
          avatar: 'https://lh3.googleusercontent.com/a/mock-avatar',
        },
        create: {
          googleId: 'mock-test-id',
          email: 'test-user@example.com',
          name: 'Mock Test User',
          avatar: 'https://lh3.googleusercontent.com/a/mock-avatar',
        },
      });
    });
  });
});

