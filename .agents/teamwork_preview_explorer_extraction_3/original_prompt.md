## 2026-06-07T12:21:31Z
You are teamwork_preview_explorer_extraction_3.
Your working directory is: e:\mehul study\Gemini apps\Trackra\.agents\teamwork_preview_explorer_extraction_3
Your task is to analyze backend/src/services/extract.service.ts and backend/src/tests/extract.test.ts.
Propose a detailed strategy to:
1. Implement a cleaning utility that pre-processes raw AI JSON response text. It must handle stripping markdown code fences, trailing commas in objects and arrays, and raw unescaped newlines/control characters in string values.
2. Implement a regex-based fallback parser to extract key-value fields manually (title, company, location, salary, url, skills, fit, experience, briefJD) if JSON.parse fails.
3. Suggest unit test cases in extract.test.ts to verify the resilient JSON parsing utility against mock malformed responses.

Write your findings to e:\mehul study\Gemini apps\Trackra\.agents\teamwork_preview_explorer_extraction_3\analysis.md and reply with your handoff message. Do not make any code changes.
