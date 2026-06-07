# Handoff Report

## 1. Observation
- **File & Line Numbers:** `backend/src/services/extract.service.ts:73`
  ```typescript
  const parsed: unknown = JSON.parse(cleanedText);
  ```
  And `backend/src/services/extract.service.ts:82-86`:
  ```typescript
  if (error instanceof SyntaxError) {
    throw ApiError.internal(
      'AI returned invalid JSON. Please try again — AI responses can vary.'
    );
  }
  ```
- **File & Line Numbers:** `backend/src/tests/extract.test.ts:109-126` shows that `SyntaxError` from `JSON.parse` throws `500` and returns `"AI returned invalid JSON"`:
  ```typescript
  it('should handle invalid JSON from Gemini gracefully and return 500', async () => {
    ...
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('AI returned invalid JSON');
  });
  ```
- No pre-processing or regex fallback mechanism exists in the current codebase to handle trailing commas, unescaped raw newlines inside string values, or missing brackets/braces.

## 2. Logic Chain
- **Step 1 (Limitation identification):** Standard LLM JSON outputs often contain syntax glitches such as trailing commas in arrays/objects (e.g. `{"skills": ["React",],}`) and unescaped newlines in multi-line strings (e.g. `{"briefJD": "line 1\nline 2"}`).
- **Step 2 (Parser failure):** Since the current code uses `JSON.parse` directly on the substring (observed at `extract.service.ts:73`), these syntax glitches trigger a `SyntaxError` (observed at `extract.service.ts:82-86`).
- **Step 3 (Resilient Pre-processing):** Implementing a regex-based pre-processing utility can clean up trailing commas and unescaped control characters in double-quoted strings before passing them to `JSON.parse`.
- **Step 4 (Manual Regex Fallback):** For severely malformed responses where cleaning fails, a regex-based key-value extraction (`fallbackParse`) can still recover key-value pairs (like `title`, `company`, etc.) manually.
- **Step 5 (Unit Test Verification):** Adding tests for trailing commas, raw newlines, and highly malformed text in `extract.test.ts` verifies that the updated code parses resiliently and saves the job without raising a 500 error, while keeping a 500 fallback for entirely invalid (conversational) responses.

## 3. Caveats
- The regex fallback parser assumes a standard key-value layout (e.g. `key: value` or `"key": "value"`). If the LLM generates completely unstructured paragraph text with no recognizable key names, the fallback parser will yield default fields and might be rejected.
- Multi-line strings in JSON with nested unescaped quotes (e.g. `"briefJD": "He said "hello""`) could still disrupt the regex parser if they are highly complex.
- We assume that the workspace's tests run via Jest.

## 4. Conclusion
We have formulated a complete strategy to introduce:
1. A JSON cleaning function `cleanJsonString` to handle trailing commas and unescaped control characters inside strings.
2. A regex-based manual parser `fallbackParse` that runs if `JSON.parse` fails, extracting fields using robust field-specific regexes.
3. A set of unit test cases in `backend/src/tests/extract.test.ts` to cover trailing commas, unescaped newlines, highly malformed structures, and completely invalid responses.
This strategy is fully detailed in `analysis.md` in the agent's directory.

## 5. Verification Method
- **Implementation check:** An developer/implementer agent should implement the proposed methods in `backend/src/services/extract.service.ts` and add the suggested unit tests to `backend/src/tests/extract.test.ts`.
- **Execution of Tests:** Run tests via npm or jest in the `backend/` directory:
  ```bash
  npm test
  ```
  Or directly:
  ```bash
  npx jest backend/src/tests/extract.test.ts
  ```
  All tests (including the new resilience tests) must pass.
