import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from backend root (one level up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * Zod schema that defines AND validates every environment variable
 * our app needs. If any value is missing or wrong-typed, the app
 * crashes immediately at startup with a clear error message.
 */
const envSchema = z.object({
  // Server
  PORT: z
    .string()
    .default('3000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(1).max(65535)),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Frontend (for CORS)
  FRONTEND_URL: z.string().url({ message: 'FRONTEND_URL must be a valid URL' }),

  // Database
  DATABASE_URL: z
    .string()
    .min(1, { message: 'DATABASE_URL is required' }),

  // Google OAuth
  GOOGLE_CLIENT_ID: z
    .string()
    .min(1, { message: 'GOOGLE_CLIENT_ID is required' }),

  GOOGLE_CLIENT_SECRET: z
    .string()
    .min(1, { message: 'GOOGLE_CLIENT_SECRET is required' }),

  GOOGLE_CALLBACK_URL: z
    .string()
    .url({ message: 'GOOGLE_CALLBACK_URL must be a valid URL' }),

  // JWT
  JWT_SECRET: z
    .string()
    .min(32, { message: 'JWT_SECRET must be at least 32 characters' }),

  JWT_EXPIRES_IN: z.string().default('7d'),

  // Gemini AI
  GEMINI_API_KEY: z
    .string()
    .min(1, { message: 'GEMINI_API_KEY is required' }),
});

/**
 * Parse and validate. If this fails, the app NEVER starts.
 * safeParse returns { success, data, error } instead of throwing.
 */
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error(
    '❌ Invalid environment variables:\n',
    parsed.error.flatten().fieldErrors
  );
  process.exit(1);
}

/**
 * Frozen, validated config object.
 * Every other file imports `env` from here — never reads process.env directly.
 */
export const env = Object.freeze(parsed.data);

/**
 * Export the inferred type so other files can reference it
 * without duplicating the shape.
 */
export type Env = z.infer<typeof envSchema>;
