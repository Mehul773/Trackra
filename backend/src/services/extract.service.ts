import { geminiModel, JD_EXTRACTION_PROMPT } from '../config/gemini';
import { scrapeJobPage } from '../utils/scraper';
import { ApiError } from '../utils/ApiError';
import { ExtractedJob } from '../types';
import { FitRating } from '../enums/FitRating.enum';

/**
 * Extract service — handles AI-powered job description parsing.
 *
 * Two entry points:
 * 1. extractFromUrl — scrapes the URL first, then sends text to Gemini
 * 2. extractFromText — sends raw text directly to Gemini
 */

/**
 * Extract job details from a URL.
 * Scrapes the page → cleans the HTML → sends to Gemini → returns structured data.
 */
export const extractFromUrl = async (url: string): Promise<ExtractedJob> => {
  let pageText: string;

  try {
    pageText = await scrapeJobPage(url);
  } catch (error) {
    throw ApiError.badRequest(
      `Could not scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}. Try pasting the job description text instead.`
    );
  }

  const extracted = await sendToGemini(pageText);

  // If the scraped page had a URL but Gemini didn't extract one, use the source URL
  if (!extracted.url) {
    extracted.url = url;
  }

  return extracted;
};

/**
 * Extract job details from raw text.
 * Sends the text directly to Gemini without scraping.
 */
export const extractFromText = async (text: string): Promise<ExtractedJob> => {
  return sendToGemini(text);
};

/**
 * Internal: Send job description text to Gemini and parse the response.
 * This is the core AI logic.
 */
const sendToGemini = async (jobDescriptionText: string): Promise<ExtractedJob> => {
  try {
    const result = await geminiModel.generateContent([
      JD_EXTRACTION_PROMPT,
      `\n\nJob Description:\n${jobDescriptionText}`,
    ]);

    const response = result.response;
    const responseText = response.text();

    // Extract only the outermost JSON object by finding the first '{' and last '}'
    const firstBrace = responseText.indexOf('{');
    const lastBrace = responseText.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
      throw new SyntaxError('No JSON object found in response');
    }

    const cleanedText = responseText.substring(firstBrace, lastBrace + 1).trim();

    // Parse the JSON response
    const parsed: unknown = JSON.parse(cleanedText);

    // Validate the parsed data has the expected shape
    return validateExtraction(parsed);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw ApiError.internal(
        'AI returned invalid JSON. Please try again — AI responses can vary.'
      );
    }

    throw ApiError.internal(
      `AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
};

/**
 * Validate and sanitize the raw Gemini output.
 * The AI can return unexpected shapes — we need to handle that.
 */
const validateExtraction = (data: unknown): ExtractedJob => {
  // Type guard: ensure data is an object
  if (!data || typeof data !== 'object') {
    throw ApiError.internal('AI returned invalid data format');
  }

  const raw = data as Record<string, unknown>;

  // Validate and sanitize the fit rating
  const fitValue = String(raw['fit'] ?? '').toUpperCase();
  const validFit: FitRating =
    fitValue === 'STRONG'
      ? FitRating.STRONG
      : fitValue === 'STRETCH'
        ? FitRating.STRETCH
        : FitRating.WEAK;

  // Validate skills is an array of strings, capped at 10
  const rawSkills = Array.isArray(raw['skills']) ? raw['skills'] : [];
  const skills = rawSkills
    .filter((s): s is string => typeof s === 'string')
    .slice(0, 10);

  return {
    title: String(raw['title'] ?? 'Untitled Position'),
    company: String(raw['company'] ?? 'Unknown Company'),
    location: raw['location'] ? String(raw['location']) : null,
    salary: raw['salary'] ? String(raw['salary']) : null,
    url: raw['url'] ? String(raw['url']) : null,
    skills,
    fit: validFit,
    experience: raw['experience'] ? String(raw['experience']) : null,
    briefJD: raw['briefJD'] ? String(raw['briefJD']) : null,
  };
};
