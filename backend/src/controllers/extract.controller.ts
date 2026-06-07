import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiResponse } from '../utils/ApiResponse';
import { HttpStatus } from '../enums/HttpStatus.enum';
import * as extractService from '../services/extract.service';
import * as jobsService from '../services/jobs.service';

/**
 * Extract controllers — handle AI-powered job description extraction.
 * These routes are rate-limited (10 req/15min) in addition to auth.
 */

/**
 * POST /api/extract/url
 * Body: { url: string }
 * Scrapes the URL, extracts job details via Gemini, and saves to the user's pipeline.
 */
export const extractFromUrl = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { url } = req.body as { url: string };

    // 1. Extract job details from the URL
    const extracted = await extractService.extractFromUrl(url);

    // 2. Save to database
    const job = await jobsService.createJob(userId, {
      title: extracted.title,
      company: extracted.company,
      location: extracted.location,
      salary: extracted.salary,
      url: extracted.url,
      sourceUrl: url,
      skills: extracted.skills,
      fit: extracted.fit,
      rawJD: undefined, // We didn't get the raw JD text from URL scraping
    });

    res
      .status(HttpStatus.CREATED)
      .json(ApiResponse.created(job, 'Job extracted and saved successfully'));
  }
);

/**
 * POST /api/extract/text
 * Body: { text: string }
 * Extracts job details from pasted JD text via Gemini and saves to pipeline.
 */
export const extractFromText = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const userId = req.user!.id;
    const { text } = req.body as { text: string };

    // 1. Extract job details from the text
    const extracted = await extractService.extractFromText(text);

    // 2. Save to database, including the raw JD text for reference
    const job = await jobsService.createJob(userId, {
      title: extracted.title,
      company: extracted.company,
      location: extracted.location,
      salary: extracted.salary,
      url: extracted.url,
      skills: extracted.skills,
      fit: extracted.fit,
      rawJD: text,
    });

    res
      .status(HttpStatus.CREATED)
      .json(ApiResponse.created(job, 'Job extracted and saved successfully'));
  }
);
