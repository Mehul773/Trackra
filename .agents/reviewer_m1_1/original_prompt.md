## 2026-06-07T10:27:44Z
You are the M1 Reviewer 1. Your task is to:
1. Initialize your working directory in e:\mehul study\Gemini apps\Trackra\.agents\reviewer_m1_1/
2. Review the database schema updates in `backend/src/prisma/schema.prisma` and the seed script in `backend/src/prisma/seed.ts`.
3. Check for correctness, design issues, potential performance issues, and conformance to the requirements (e.g. briefJD added to Job, Contact table created with relation, 1000 mock jobs seeded for test user).
4. Run backend tests to verify everything passes:
   ```bash
   cd backend
   npm test
   ```
5. Write your review report to `e:\mehul study\Gemini apps\Trackra\.agents\reviewer_m1_1\handoff.md` and send a message back with your verdict (PASS/FAIL).
