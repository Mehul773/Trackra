/**
 * Barrel file for shared types.
 * Import types from here: import { ExtractedJob } from '../types'
 */

import { FitRating } from '../enums/FitRating.enum';

/**
 * The shape Gemini returns after parsing a job description.
 * This is NOT a database model — it's the AI's raw output
 * before we save it as a Job record.
 */
export interface ExtractedJob {
  title: string;
  company: string;
  location: string | null;
  salary: string | null;
  url: string | null;
  skills: string[];
  fit: FitRating;
  experience: string | null;
  briefJD: string | null;
}
