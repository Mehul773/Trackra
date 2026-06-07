import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

/**
 * Singleton Gemini AI client.
 * Creates the client once and exports a proxy model instance
 * that implements fallback mechanics to prevent rate limit/quota errors.
 */
const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Ordered fallback list of free-tier models. If one is rate-limited or exhausted, try the next.
export const GEMINI_MODELS_FALLBACK = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

export const geminiModel = {
  /**
   * Generates content using the fallback list.
   * Keeps the same method signature so that callers and unit test mocks remain unaffected.
   */
  generateContent: async (promptArgs: any): Promise<any> => {
    let lastError: any = null;

    for (const modelName of GEMINI_MODELS_FALLBACK) {
      try {
        console.log(`🤖 Attempting Gemini extraction using model: ${modelName}`);
        const modelInstance = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            temperature: 0.1, // Low temperature = more deterministic output
            maxOutputTokens: 1024, // JD extraction won't need more than this
          },
        });
        const result = await modelInstance.generateContent(promptArgs);
        console.log(`✅ Extraction successful with model: ${modelName}`);
        return result;
      } catch (error: any) {
        lastError = error;
        console.warn(`⚠️ Model ${modelName} failed: ${error.message}. Trying next fallback...`);
      }
    }

    throw lastError || new Error('All Gemini fallback models failed.');
  }
};

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
