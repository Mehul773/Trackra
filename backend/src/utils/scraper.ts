import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Scrapes text content from a job posting URL.
 *
 * Strategy:
 * 1. Fetch the page HTML with Axios
 * 2. Load it into Cheerio (server-side jQuery)
 * 3. Strip out script, style, nav, header, footer tags (noise)
 * 4. Extract the remaining text content
 * 5. Clean up whitespace
 *
 * This works for static pages (LinkedIn public posts, company career pages).
 * It will NOT work for heavily JS-rendered SPAs (the HTML will be empty shells).
 */
export const scrapeJobPage = async (url: string): Promise<string> => {
  const { data: html } = await axios.get<string>(url, {
    headers: {
      // Pretend to be a browser — some sites block requests without a User-Agent
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    timeout: 10000, // 10 second timeout — don't hang forever
    maxRedirects: 5,
  });

  const $ = cheerio.load(html);

  // Remove noise elements
  $('script, style, nav, header, footer, iframe, noscript, svg').remove();

  // Get cleaned text
  const text = $('body')
    .text()
    .replace(/\s+/g, ' ') // Collapse multiple spaces/newlines into one space
    .trim();

  if (!text || text.length < 50) {
    throw new Error(
      'Could not extract meaningful content from the URL. The page might be JavaScript-rendered or require authentication.'
    );
  }

  // Limit to ~8000 chars to stay within Gemini's sweet spot
  // (the model can handle more, but shorter = faster + cheaper)
  return text.slice(0, 8000);
};
