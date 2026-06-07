import { Router } from 'express';
import * as extractController from '../controllers/extract.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { extractLimiter } from '../middleware/rateLimiter';
import {
  extractUrlSchema,
  extractTextSchema,
} from '../validations/extract.validation';

const router = Router();

// All extract routes require authentication AND are rate-limited
router.use(authenticate);
router.use(extractLimiter);

/**
 * POST /api/extract/url
 * Body: { url: "https://..." }
 * Scrapes the URL → extracts via Gemini → saves to pipeline.
 */
router.post('/url', validate(extractUrlSchema), extractController.extractFromUrl);

/**
 * POST /api/extract/text
 * Body: { text: "We are hiring a Senior Node.js Developer..." }
 * Extracts from pasted text via Gemini → saves to pipeline.
 */
router.post(
  '/text',
  validate(extractTextSchema),
  extractController.extractFromText
);

export default router;
