# Handoff Report - extract-service-resilience

## 1. Observation
- **File Paths and Lines Observed**:
  - `backend/src/services/extract.service.ts` (lines 52-92):
    ```typescript
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
    ```
  - `backend/src/tests/extract.test.ts` (lines 109-126):
    ```typescript
    it('should handle invalid JSON from Gemini gracefully and return 500', async () => {
      const mockGeminiResponse = {
        response: {
          text: () => 'This is not JSON text',
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

## 2. Logic Chain
1. **Current Vulnerability**: The current implementation of `sendToGemini` in `extract.service.ts` runs `JSON.parse` directly on the substring extracted between the first `{` and last `}` of the Gemini response. If Gemini generates trailing commas inside lists/objects, or places raw newlines inside string fields (e.g. `briefJD`), `JSON.parse` will throw a `SyntaxError` (Observation 1).
2. **Mitigation Layer 1 (JSON Cleaning Utility)**: By passing the substring through a state-machine-based pre-processing utility (`cleanRawJsonText`), trailing commas and raw control characters/newlines inside double-quoted string literals can be corrected before parsing.
3. **Mitigation Layer 2 (Regex-Based Fallback)**: If cleaning is insufficient (or no outer braces exist), parsing fails. Implementing a robust regex fallback (`getRawValue` and `getArrayValue`) allows extracting the requested fields (`title`, `company`, `location`, `salary`, `url`, `skills`, `fit`, `experience`, `briefJD`) even from markdown lists or partially corrupted JSON text.
4. **Validation and Safety**: The fallback results can be validated using the existing `validateExtraction` method, ensuring consistent return types and normalizations. An extra safeguard is introduced: if both `title` and `company` are null/missing in the regex fallback output, we raise a `SyntaxError` since the response is likely garbage or a system error message.
5. **Testing**: Adding test cases to `extract.test.ts` that mock malformed outputs (trailing commas, unescaped newlines, markdown lists) and asserting successful creation ensures correctness of the resilient parsing logic.

## 3. Caveats
- **Regex Limitations**: The regex-based fallback assumes simple alphanumeric key patterns (like `"title"`, `"company"`, `**title**`, `title:`) and may not handle nested arrays or complex nested objects beyond the schema definitions. However, since the Gemini prompt extracts a flat schema (except `skills` which is an array of strings), flat regex parsing is sufficient.
- **Verification Command Execution**: We did not run code compilation/tests because this is a read-only investigation task (constraint). The strategy must be validated dynamically after the implementer applies the changes.

## 4. Conclusion
The proposed architecture provides a multi-layered resilient parsing system:
- A state-machine-based JSON cleaning utility (`cleanRawJsonText`) to strip trailing commas and escape control characters in string values without false positives.
- A regex-based fallback parser to extract key-value fields and arrays directly from unstructured plain text or markdown tables/lists if `JSON.parse` fails.
- A comprehensive set of test cases for `extract.test.ts` validating success on trailing commas, unescaped newlines, and bulleted markdown lists, as well as safe failure on actual garbage/error text.

## 5. Verification Method
To verify the implementation once applied:
1. Run the test suite:
   ```powershell
   npm run test
   # or specifically:
   npx jest backend/src/tests/extract.test.ts
   ```
2. Verify all new test cases (nested inside `POST /api/extract/text`) pass.
3. Verify that the previous tests in `extract.test.ts` still pass without regressions.
