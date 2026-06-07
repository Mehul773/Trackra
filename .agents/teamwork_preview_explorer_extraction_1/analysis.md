# Analysis & Strategy Report: Resilient AI JSON Extraction

## Overview
This report outlines the proposed strategy for improving the resilience of the AI extraction service in `backend/src/services/extract.service.ts` and adding verifying unit tests in `backend/src/tests/extract.test.ts`. Currently, the service expects strict JSON and throws a `500 Internal Server Error` if `JSON.parse` fails. The proposed updates will introduce an advanced JSON cleaning utility and a regex-based fallback parser, significantly reducing extraction failures caused by minor LLM syntax inconsistencies.

---

## 1. Analysis of Existing Code

### `backend/src/services/extract.service.ts`
- **Brace Extraction (Lines 62–70):** The service extracts the substring between the first `{` and the last `}` character. While this strips external markdown wrappers, it does not clean up malformed contents inside the braces.
- **Strict JSON Parsing (Line 73):** `const parsed: unknown = JSON.parse(cleanedText);` directly parses the substring. If the response contains trailing commas, raw newlines, or control characters, this immediately throws a `SyntaxError` and returns a `500` API response.
- **Validation (Lines 98–132):** `validateExtraction` normalizes the fields and provides safe defaults.

### `backend/src/tests/extract.test.ts`
- **Happy Path Testing:** Verifies standard JSON extraction from text and URL.
- **Conversational Wrapper Test (Lines 128–188):** Verifies that markdown code blocks (e.g., ` ```json ... ``` `) are successfully handled via the brace matching mechanism.
- **Failure Path Test (Lines 109–126):** Verifies that invalid JSON immediately returns `500` with the message `"AI returned invalid JSON"`.

---

## 2. Proposed Strategy

### Part 1: Resilient JSON Cleaning Utility
Implement a `cleanJsonString` function in `extract.service.ts` (or a helper utility) that performs the following sequence before passing the text to `JSON.parse`:

1. **Strip Markdown Fences:**
   LLMs sometimes wrap JSON in backticks. Although brace matching handles this if the fences are outside, we can clean them preemptively:
   ```typescript
   text = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
   ```

2. **Escape Raw Newlines/Control Characters in Strings:**
   JSON requires string literals containing newlines or tabs to escape them (as `\n` or `\t`). We can target double-quoted string values in the JSON and replace raw control characters with their escaped equivalents using a regex replacement:
   ```typescript
   text = text.replace(/"((?:[^"\\]|\\.)*)"/g, (match, p1) => {
     const escaped = p1
       .replace(/\n/g, '\\n')
       .replace(/\r/g, '\\r')
       .replace(/\t/g, '\\t');
     return `"${escaped}"`;
   });
   ```

3. **Strip Trailing Commas in Objects and Arrays:**
   To safely remove trailing commas from arrays and objects without corrupting string literals containing commas, we use a regex pattern that matches strings first (and returns them intact) or matches the trailing commas:
   ```typescript
   text = text.replace(/("(?:[^"\\]|\\.)*")|,\s*(?=[}\]])/g, (match, stringVal) => {
     if (stringVal !== undefined) {
       return stringVal; // Skip replacement for string contents
     }
     return ''; // Remove trailing comma
   });
   ```

---

### Part 2: Regex-Based Fallback Parser
If the cleaning utility is insufficient and `JSON.parse` still fails, the service should attempt a manual regex extraction on the raw text using the `fallbackParse` function.

#### Field Extraction Helpers
```typescript
/**
 * Extract a single string value from key-value pairs in raw text.
 */
const extractStringField = (text: string, fieldName: string): string | null => {
  // 1. Double quotes value format: "fieldName": "value"
  const doubleQuoteRegex = new RegExp(
    `["']?${fieldName}["']?\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)"`,
    'i'
  );
  let match = text.match(doubleQuoteRegex);
  if (match) {
    return match[1]
      .replace(/\\"/g, '"')
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .trim();
  }

  // 2. Single quotes value format: "fieldName": 'value'
  const singleQuoteRegex = new RegExp(
    `["']?${fieldName}["']?\\s*:\\s*'((?:[^'\\\\]|\\\\.)*)'`,
    'i'
  );
  match = text.match(singleQuoteRegex);
  if (match) {
    return match[1]
      .replace(/\\'/g, "'")
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .trim();
  }

  // 3. Fallback: Unquoted value up to comma, newline, or closing brace
  const fallbackRegex = new RegExp(
    `["']?${fieldName}["']?\\s*:\\s*([^,\\n}]+)`,
    'i'
  );
  const fallbackMatch = text.match(fallbackRegex);
  if (fallbackMatch) {
    const val = fallbackMatch[1].trim();
    return val.replace(/^["']|["']$/g, '').trim();
  }

  return null;
};

/**
 * Extract an array field (e.g. skills) from raw text.
 */
const extractArrayField = (text: string, fieldName: string): string[] => {
  const arrayRegex = new RegExp(
    `["']?${fieldName}["']?\\s*:\\s*\\[([^\\]]*)\\]`,
    'i'
  );
  const match = text.match(arrayRegex);
  if (match) {
    const arrayContent = match[1];
    const items: string[] = [];
    
    // Double quotes items
    const dqRegex = /"((?:[^"\\]|\\.)*)"/g;
    let itemMatch;
    while ((itemMatch = dqRegex.exec(arrayContent)) !== null) {
      items.push(itemMatch[1].replace(/\\"/g, '"').trim());
    }
    
    // Single quotes items (fallback if no double quotes found)
    if (items.length === 0) {
      const sqRegex = /'((?:[^'\\]|\\.)*)'/g;
      while ((itemMatch = sqRegex.exec(arrayContent)) !== null) {
        items.push(itemMatch[1].replace(/\\'/g, "'").trim());
      }
    }

    if (items.length > 0) {
      return items;
    }

    // Split by comma fallback (unquoted array elements)
    return arrayContent
      .split(',')
      .map(item => item.trim().replace(/^["']|["']$/g, '').trim())
      .filter(item => item.length > 0);
  }

  return [];
};
```

#### Fallback Parsing Logic
```typescript
export const fallbackParse = (text: string): ExtractedJob => {
  const title = extractStringField(text, 'title') || 'Untitled Position';
  const company = extractStringField(text, 'company') || 'Unknown Company';
  const location = extractStringField(text, 'location');
  const salary = extractStringField(text, 'salary');
  const url = extractStringField(text, 'url');
  
  let skills = extractArrayField(text, 'skills');
  if (skills.length === 0) {
    const skillsString = extractStringField(text, 'skills');
    if (skillsString) {
      skills = skillsString.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
  }

  const rawFit = extractStringField(text, 'fit') || '';
  const fitValue = rawFit.toUpperCase();
  const fit: FitRating =
    fitValue === 'STRONG'
      ? FitRating.STRONG
      : fitValue === 'STRETCH'
        ? FitRating.STRETCH
        : FitRating.WEAK;

  const experience = extractStringField(text, 'experience');
  const briefJD = extractStringField(text, 'briefJD');

  return {
    title,
    company,
    location,
    salary,
    url,
    skills: skills.slice(0, 10),
    fit,
    experience,
    briefJD,
  };
};
```

#### Integration into `sendToGemini`
Replace line 62–91 with a resilient try-catch sequence:
1. Extract braces, trim, and apply `cleanJsonString(cleanedText)`.
2. Try `JSON.parse` and validation.
3. If it fails, capture the error, execute `fallbackParse(responseText)`.
4. If the fallback parser successfully extracts any meaningful field (e.g. `title` != 'Untitled Position', `company` != 'Unknown Company', or `skills` has elements), return the parsed object.
5. If fallback parsing also fails or yields no meaningful fields, raise the original syntax/validation error.

---

## 3. Recommended Unit Test Cases in `extract.test.ts`

To verify resilient parsing, the following `it` blocks should be added within `POST /api/extract/text`:

1. **Resilient parsing of trailing commas:**
   Mock response:
   ```json
   {
     "title": "Senior Developer",
     "company": "Trackra Corp",
     "skills": ["TypeScript", "Node.js",],
     "fit": "STRONG",
   }
   ```
   *Expected behavior:* Status 201, successful saving of job to DB with fields matching the mock.

2. **Resilient parsing of unescaped newlines in string fields:**
   Mock response:
   ```json
   {
     "title": "Backend Dev",
     "company": "Trackra Corp",
     "skills": ["Go", "Docker"],
     "briefJD": "First line of brief description.
     Second line of brief description.",
     "fit": "STRETCH"
   }
   ```
   *Expected behavior:* Status 201, successful extraction and escape of raw newlines inside `briefJD`.

3. **Fallback regex parsing for highly malformed JSON:**
   Mock response:
   ```text
   Here is the extraction:
   title: Lead Architect
   company: Tech Giants
   location: "San Francisco, CA"
   skills: React, Node, AWS
   fit: STRONG
   experience: 8+ years
   ```
   *Expected behavior:* Status 201, successful extraction of title, company, location, skills, fit, and experience.

4. **Preservation of 500 error for totally invalid non-JSON outputs:**
   Mock response:
   ```text
   Sorry, I couldn't find any job information in the provided text. Please check the content.
   ```
   *Expected behavior:* Status 500, responding with the error message `"AI returned invalid JSON"`.
