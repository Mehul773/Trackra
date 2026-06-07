# Resilient JSON Parsing Strategy for Extract Service

This document proposes a detailed architecture and implementation plan for adding resilient JSON parsing capabilities to `extract.service.ts` and corresponding unit tests in `extract.test.ts`.

---

## 1. Context & Objectives

Currently, `sendToGemini` in `backend/src/services/extract.service.ts` extracts JSON content by searching for the first `{` and last `}` and running `JSON.parse` directly. If the AI response contains trailing commas, raw newlines within strings, or is formatted in plain text list style, `JSON.parse` fails with a `SyntaxError`, resulting in a `500 Internal Server Error` for the user.

To improve reliability, we propose a three-layer parsing strategy:
1. **Extraction Range**: Extract the JSON substring using first `{` and last `}`.
2. **Resilient JSON Cleaning**: A character-by-character cleaning utility to handle trailing commas and unescaped control characters/newlines within string literals.
3. **Regex-Based Fallback Parser**: A regex-based parser that extracts fields directly from the raw AI text response if JSON parsing still fails.

---

## 2. Part 1: Resilient JSON Cleaning Utility

The cleaning utility should run on the extracted JSON substring *before* passing it to `JSON.parse`. 

### State Machine Approach
A state-machine parser processes the string character-by-character. It handles context-aware corrections without risking false-positive regex matches (e.g., modifying commas inside string literals).

### Proposed Implementation Code
```typescript
/**
 * Pre-processes and cleans raw JSON string from AI response.
 * Resolves:
 * 1. Trailing commas in arrays and objects.
 * 2. Raw unescaped newlines/control characters inside string values.
 */
export const cleanRawJsonText = (jsonText: string): string => {
  let inString = false;
  let escaped = false;
  const result: string[] = [];
  let lastCommaIdx = -1;

  for (let i = 0; i < jsonText.length; i++) {
    const char = jsonText[i];

    if (inString) {
      if (escaped) {
        result.push(char);
        escaped = false;
      } else if (char === '\\') {
        result.push(char);
        escaped = true;
      } else if (char === '"') {
        result.push(char);
        inString = false;
      } else {
        // Control character check (ASCII < 32)
        const code = char.charCodeAt(0);
        if (code < 32) {
          // Escape standard control characters
          if (char === '\n') {
            result.push('\\n');
          } else if (char === '\r') {
            result.push('\\r');
          } else if (char === '\t') {
            result.push('\\t');
          } else if (char === '\b') {
            result.push('\\b');
          } else if (char === '\f') {
            result.push('\\f');
          } else {
            // Hex unicode representation for other control characters
            const hex = code.toString(16).padStart(4, '0');
            result.push(`\\u${hex}`);
          }
        } else {
          result.push(char);
        }
      }
    } else {
      // Outside double-quoted strings
      if (char === '"') {
        inString = true;
        result.push(char);
        lastCommaIdx = -1; // Reset comma tracking when string starts
      } else if (char === ',') {
        result.push(char);
        lastCommaIdx = result.length - 1;
      } else if (char === '}' || char === ']') {
        if (lastCommaIdx !== -1) {
          // Check if there are only whitespaces between lastCommaIdx and current position
          let onlyWhitespace = true;
          for (let k = lastCommaIdx + 1; k < result.length; k++) {
            if (result[k] !== ' ' && result[k] !== '\n' && result[k] !== '\r' && result[k] !== '\t') {
              onlyWhitespace = false;
              break;
            }
          }
          if (onlyWhitespace) {
            // Remove the trailing comma
            result.splice(lastCommaIdx, 1);
          }
          lastCommaIdx = -1;
        }
        result.push(char);
      } else if (char === ' ' || char === '\n' || char === '\r' || char === '\t') {
        result.push(char);
      } else {
        result.push(char);
        lastCommaIdx = -1; // Reset comma tracking when non-whitespace character appears
      }
    }
  }

  return result.join('');
};
```

---

## 3. Part 2: Regex-Based Fallback Parser

If `JSON.parse` fails even after cleaning (or if no braces are found at all), the service should fallback to manually extracting keys from the text using regex.

### Fields to Extract
`title`, `company`, `location`, `salary`, `url`, `skills`, `fit`, `experience`, `briefJD`.

### Regex Patterns
1. **Keys**: Supports quotes (optional), Markdown formatting like bold (`**`), and bullet symbols (`-`, `*`).
2. **Values**: Parses double-quoted values (unescaping newlines and internal quotes) or reads unquoted values until punctuation/newlines.
3. **Arrays (`skills`)**: Extracts JSON array strings `[...]` or falls back to splitting comma-separated items on a single line.

### Proposed Implementation Code
```typescript
/**
 * Extracts a single key-value field from raw AI text using robust regex matches.
 */
export const getRawValue = (text: string, key: string): string | null => {
  const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

  // Regex pattern matching:
  // 1. Optional bullet characters (- or *) and spaces
  // 2. Optional double asterisks (markdown bolding) or double quotes around key
  // 3. The key name (case-insensitive)
  // 4. Optional double asterisks or double quotes after key
  // 5. Separator: colon (:), dash (-), or equals (=)
  
  // Try matching a quoted value first (handles escaped quotes and multiline values)
  const quotedRegex = new RegExp(
    `[\\-*\\s]*(?:\\*\\*|"?)${escapedKey}(?:\\*\\*|"?)\\s*[:\\-=]\\s*"([^"\\\\]*(?:\\\\.[^"\\\\]*)*)"`,
    'i'
  );
  const quotedMatch = text.match(quotedRegex);
  if (quotedMatch) {
    return quotedMatch[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t');
  }

  // Fallback to unquoted values (terminated by comma, closing brace/bracket, or newline)
  const unquotedRegex = new RegExp(
    `[\\-*\\s]*(?:\\*\\*|"?)${escapedKey}(?:\\*\\*|"?)\\s*[:\\-=]\\s*([^,\\}\\n\\r]+)`,
    'i'
  );
  const unquotedMatch = text.match(unquotedRegex);
  if (unquotedMatch) {
    const val = unquotedMatch[1].trim();
    const cleaned = val.replace(/^["']|["']$/g, '');
    if (cleaned.toLowerCase() === 'null') {
      return null;
    }
    return cleaned;
  }

  return null;
};

/**
 * Extracts array value (specifically for skills) from raw AI text.
 */
export const getArrayValue = (text: string, key: string): string[] => {
  const escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  // Try matching JSON format array: [ "item1", "item2" ]
  const arrayRegex = new RegExp(
    `[\\-*\\s]*(?:\\*\\*|"?)${escapedKey}(?:\\*\\*|"?)\\s*[:\\-=]\\s*\\[([^\\]]*)\\]`,
    'i'
  );
  const arrayMatch = text.match(arrayRegex);
  if (arrayMatch) {
    const arrayContent = arrayMatch[1];
    const itemRegex = /"([^"\\]*(?:\\.[^"\\]*)*)"/g;
    const items: string[] = [];
    let itemMatch;
    while ((itemMatch = itemRegex.exec(arrayContent)) !== null) {
      items.push(itemMatch[1].replace(/\\"/g, '"'));
    }
    
    // If no quotes, split by comma directly
    if (items.length === 0 && arrayContent.trim().length > 0) {
      return arrayContent
        .split(',')
        .map(s => s.trim().replace(/^["']|["']$/g, ''))
        .filter(s => s.length > 0 && s.toLowerCase() !== 'null');
    }
    return items;
  }

  // Fallback: match comma-separated values on the same line
  // e.g. **Skills**: React, Node.js, TypeScript
  const commaSeparatedRegex = new RegExp(
    `[\\-*\\s]*(?:\\*\\*|"?)${escapedKey}(?:\\*\\*|"?)\\s*[:\\-=]\\s*([^\\n\\r]+)`,
    'i'
  );
  const commaMatch = text.match(commaSeparatedRegex);
  if (commaMatch) {
    const content = commaMatch[1].trim();
    return content
      .split(',')
      .map(s => s.trim().replace(/^["']|["']$/g, ''))
      .filter(s => s.length > 0 && s.toLowerCase() !== 'null');
  }

  return [];
};
```

---

## 4. Integration Strategy in `extract.service.ts`

Replace the core parsing block in `sendToGemini` (lines 62-76 in the current code) with a parser function that runs the cleaner first, then executes the fallback parser if needed.

### Proposed Flow
1. Check for `{` and `}` braces in the AI response:
   - **Braces found**:
     - Extract text between first `{` and last `}`.
     - Call `cleanRawJsonText` to clean syntax errors (trailing commas, unescaped newlines).
     - Attempt `JSON.parse`.
     - On success: pass parsed object to `validateExtraction(parsed)`.
     - On `SyntaxError`: print warning/log error and continue to the regex-based fallback parsing path.
   - **Braces not found** (or `JSON.parse` failed):
     - Log a warning about JSON parsing failure.
     - Use `getRawValue` and `getArrayValue` to parse fields directly from the raw `responseText`.
     - **Safeguard**: If *both* `title` and `company` are null/missing in the regex results, the response is likely garbage or a system error message. Throw a `SyntaxError` to notify the system.
     - Build a raw object:
       ```typescript
       const rawFallback = {
         title: getRawValue(responseText, 'title'),
         company: getRawValue(responseText, 'company'),
         location: getRawValue(responseText, 'location'),
         salary: getRawValue(responseText, 'salary'),
         url: getRawValue(responseText, 'url'),
         skills: getArrayValue(responseText, 'skills'),
         fit: getRawValue(responseText, 'fit'),
         experience: getRawValue(responseText, 'experience'),
         briefJD: getRawValue(responseText, 'briefJD'),
       };
       ```
     - Pass `rawFallback` to `validateExtraction(rawFallback)` to ensure proper sanitization, enum coercion, array slicing, and default fallbacks.

---

## 5. Part 3: Suggested Unit Tests for `extract.test.ts`

Add test cases in `backend/src/tests/extract.test.ts` to mock various malformed Gemini outputs and verify they successfully parse and save to the database.

### Proposed Test Code Snippets
Add these cases inside the `describe('POST /api/extract/text', ...)` block:

```typescript
    it('should successfully parse and extract when JSON contains trailing commas and unescaped newlines', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => `{
            "title": "Senior React Developer",
            "company": "Tech Corp",
            "skills": ["React", "TypeScript", ],
            "fit": "STRONG",
            "briefJD": "We are looking for a developer.
Must have experience with React.
Apply now.",
          }`,
        },
      };

      const mockSavedJob = {
        id: 'job-trailing-newlines',
        title: 'Senior React Developer',
        company: 'Tech Corp',
        skills: ['React', 'TypeScript'],
        fit: FitRating.STRONG,
        briefJD: 'We are looking for a developer.\nMust have experience with React.\nApply now.',
        status: JobStatus.NOT_APPLIED,
        userId: mockUser.id,
        createdAt: new Date(),
      };

      mockGenerateContent.mockResolvedValueOnce(mockGeminiResponse);
      mockJobCreate.mockResolvedValueOnce(mockSavedJob);

      const res = await request(app)
        .post('/api/extract/text')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: validText });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Senior React Developer');
      expect(res.body.data.skills).toEqual(['React', 'TypeScript']);
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should fall back to regex parsing if JSON contains syntax errors and is completely unparseable', async () => {
      // JSON is completely broken (missing brackets, missing quotation separators)
      const mockGeminiResponse = {
        response: {
          text: () => `
            Here is the job description analysis:
            - **title**: Lead DevOps Engineer
            - **company**: CloudTech Solutions
            - **location**: Remote, USA
            - **salary**: $160,000 - $180,000
            - **skills**: Docker, Kubernetes, AWS, CI/CD
            - **fit**: STRETCH
            - **experience**: 5+ years
          `,
        },
      };

      const mockSavedJob = {
        id: 'job-regex-fallback',
        title: 'Lead DevOps Engineer',
        company: 'CloudTech Solutions',
        location: 'Remote, USA',
        salary: '$160,000 - $180,000',
        skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
        fit: FitRating.STRETCH,
        experience: '5+ years',
        status: JobStatus.NOT_APPLIED,
        userId: mockUser.id,
        createdAt: new Date(),
      };

      mockGenerateContent.mockResolvedValueOnce(mockGeminiResponse);
      mockJobCreate.mockResolvedValueOnce(mockSavedJob);

      const res = await request(app)
        .post('/api/extract/text')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: validText });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Lead DevOps Engineer');
      expect(res.body.data.company).toBe('CloudTech Solutions');
      expect(res.body.data.skills).toEqual(['Docker', 'Kubernetes', 'AWS', 'CI/CD']);
      expect(mockGenerateContent).toHaveBeenCalled();
    });

    it('should throw an error and return 500 if the AI response is garbage and cannot be parsed at all', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => 'I apologize, but I could not analyze the text you provided. Please provide a valid job description.',
        },
      };

      mockGenerateContent.mockResolvedValueOnce(mockGeminiResponse);

      const res = await request(app)
        .post('/api/extract/text')
        .set('Authorization', `Bearer ${token}`)
        .send({ text: validText });

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('AI returned invalid JSON');
    });
```
