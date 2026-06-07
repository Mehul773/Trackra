import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

/**
 * Singleton Gemini AI client.
 * Creates the client once and exports the model instance
 * that all extraction calls will use.
 */
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Using Gemini 1.5 Flash — fast, cheap, and good enough for
 * structured data extraction from job descriptions.
 * Pro would be overkill (and slower) for this use case.
 */
export const geminiModel = genAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.1, // Low temperature = more deterministic output
    maxOutputTokens: 1024, // JD extraction won't need more than this
  },
});

/**
 * The system prompt that instructs Gemini on how to parse job descriptions.
 * Exported separately so it can be reused and tested.
 */
export const JD_EXTRACTION_PROMPT = `You are a job description parser. Extract structured data and return ONLY valid JSON with no markdown, no explanation:
{
  "title": "exact job title",
  "company": "company name",
  "location": "city or Remote",
  "salary": "salary as string e.g. 6-8 LPA or 50000/month",
  "url": "apply URL if found in text, else null",
  "skills": ["max 10 technical skills required"],
  "fit": "STRONG if Node.js/Express/PostgreSQL/Redis/AWS match well, STRETCH if partial match, WEAK if no match",
  "experience": "required experience e.g. 1-3 years"
}`;
