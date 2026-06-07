import { GoogleGenerativeAI } from '@google/generative-ai';
import axios from 'axios';
import { env } from './env';

/**
 * Singleton Gemini AI client.
 * Conditionally created based on API key availability.
 */
const genAI = env.GEMINI_API_KEY ? new GoogleGenerativeAI(env.GEMINI_API_KEY) : null;

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
   * Generates content using the configured provider (Gemini or Ollama).
   * Keeps the same method signature so that callers and unit test mocks remain unaffected.
   */
  generateContent: async (promptArgs: [string, string]): Promise<any> => {
    // 1. Route to Local Ollama if configured
    if (env.AI_PROVIDER === 'ollama') {
      console.log(`🤖 Routing to Local Ollama using model: ${env.OLLAMA_MODEL}`);
      try {
        const response = await axios.post(`${env.OLLAMA_HOST}/api/generate`, {
          model: env.OLLAMA_MODEL,
          prompt: `${promptArgs[0]}\n\n${promptArgs[1]}`,
          stream: false,
          format: 'json',
          options: {
            temperature: 0.1, // Ensure deterministic responses
          }
        });
        
        const responseText = response.data.response;
        console.log(`✅ Extraction successful with Ollama`);
        
        return {
          response: {
            text: () => responseText
          }
        };
      } catch (error: any) {
        console.error(`❌ Local Ollama request failed: ${error.message}`);
        throw new Error(`Ollama extraction failed: ${error.message}. Is Ollama running locally?`);
      }
    }

    // 2. Default: Route to Gemini Cloud with Fallbacks
    if (!genAI) {
      throw new Error('GEMINI_API_KEY is not defined but AI_PROVIDER is set to gemini.');
    }

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

export const JD_EXTRACTION_PROMPT = `You are a job description parser. Extract structured data and return ONLY valid JSON with no markdown, no explanation:
{
  "title": "exact job title",
  "company": "company name",
  "location": "city or Remote",
  "salary": "salary as string e.g. 6-8 LPA or 50000/month",
  "url": "apply URL if found in text, else null",
  "skills": ["max 10 technical skills required"],
  "fit": "STRONG if Node.js/Express/PostgreSQL/Redis/AWS match well, STRETCH if partial match, WEAK if no match",
  "experience": "required experience e.g. 1-3 years",
  "briefJD": "a brief 2-3 sentence summarized description of the role, key responsibilities, and requirements"
}`;
