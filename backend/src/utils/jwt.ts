import jwt from 'jsonwebtoken';
import { env } from '../config/env';

/**
 * Payload that gets encoded inside the JWT.
 * Keep it minimal — JWTs travel with every request (in headers),
 * so large payloads waste bandwidth.
 */
export interface JwtPayload {
  userId: string;
  email: string;
}

/**
 * Sign a JWT with the user's ID and email.
 * Returns a token string like "eyJhbGciOi..."
 */
export const signToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

/**
 * Verify and decode a JWT.
 * Returns the decoded payload if valid, or throws if expired/tampered.
 */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};
