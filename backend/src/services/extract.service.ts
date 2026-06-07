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
 * Pre-processes raw AI JSON response text to clean up markdown blocks,
 * trailing commas, and unescaped newlines/control characters.
 */
export const cleanJsonString = (str: string): string => {
  // Strip markdown fences if present
  str = str.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  
  const start = str.indexOf('{');
  const end = str.lastIndexOf('}');
  if (start === -1 || end === -1 || end < start) {
    return str;
  }
  
  const clean = str.substring(start, end + 1);
  
  // Character-by-character scanner to escape newlines inside double quotes
  let inString = false;
  let escaped = false;
  let result = '';
  
  for (let i = 0; i < clean.length; i++) {
    const char = clean[i]!;
    if (char === '"' && !escaped) {
      inString = !inString;
      result += char;
    } else if (inString) {
      if (char === '\n') {
        result += '\\n';
      } else if (char === '\r') {
        result += '\\r';
      } else if (char === '\t') {
        result += '\\t';
      } else if (char === '\\' && !escaped) {
        escaped = true;
        result += char;
      } else {
        escaped = false;
        result += char;
      }
    } else {
      result += char;
    }
  }

  // Remove trailing commas in objects and arrays before closed braces
  result = result.replace(/,\s*([}\]])/g, '$1');
  
  return result;
};

/**
 * Regex-based fallback parser to extract fields manually if JSON.parse fails.
 */
export const regexFallbackParse = (str: string): any => {
  const getField = (field: string): string | null => {
    // Match double quoted, single quoted, or unquoted values
    const regex = new RegExp(`"${field}"\\s*:\\s*(?:"([^"]*)"|'([^']*)'|([^,}\\n]+))`, 'i');
    const match = str.match(regex);
    if (!match) return null;
    const val = (match[1] || match[2] || match[3] || '').trim();
    if (val === 'null' || val === 'undefined') return null;
    return val.replace(/^["']|["']$/g, '');
  };

  const getSkills = (): string[] => {
    const regex = /"skills"\s*:\s*\[([^\]]*)\]/i;
    const match = str.match(regex);
    if (!match) return [];
    return match[1]!
      .split(',')
      .map((s) => s.trim().replace(/^["']|["']$/g, ''))
      .filter((s) => s.length > 0);
  };

  const title = getField('title') || 'Untitled Position';
  const company = getField('company') || 'Unknown Company';
  const location = getField('location');
  const salary = getField('salary');
  const url = getField('url');
  const skills = getSkills();
  const fit = getField('fit');
  const experience = getField('experience');
  const briefJD = getField('briefJD');

  return { title, company, location, salary, url, skills, fit, experience, briefJD };
};

const sendToGemini = async (jobDescriptionText: string): Promise<ExtractedJob> => {
  let responseText = '';
  try {
    const result = await geminiModel.generateContent([
      JD_EXTRACTION_PROMPT,
      `\n\nJob Description:\n${jobDescriptionText}`,
    ]);

    const response = result.response;
    responseText = response.text();

    const firstBrace = responseText.indexOf('{');
    let parsed: any;

    if (firstBrace === -1) {
      parsed = regexFallbackParse(responseText);
      if (parsed.title === 'Untitled Position' && parsed.company === 'Unknown Company') {
        throw new SyntaxError('No JSON object found in response');
      }
    } else {
      const cleanedText = cleanJsonString(responseText);
      try {
        parsed = JSON.parse(cleanedText);
      } catch (parseError) {
        console.warn('⚠️ JSON.parse failed, attempting regex fallback parsing:', parseError);
        parsed = regexFallbackParse(responseText);
      }
    }

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
