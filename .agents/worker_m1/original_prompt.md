## 2026-06-07T10:19:42Z

You are the M1 Worker. Your task is to:
1. Initialize your working directory in e:\mehul study\Gemini apps\Trackra\.agents\worker_m1/
2. Apply schema updates to `backend/src/prisma/schema.prisma` using the patch at `e:\mehul study\Gemini apps\Trackra\.agents\explorer_m1\schema.prisma.patch` (or manually adding the `briefJD` field on the `Job` model and the `Contact` model with standard relations).
3. Create `backend/src/prisma/seed.ts` containing the seeding script from `e:\mehul study\Gemini apps\Trackra\.agents\explorer_m1\proposed_seed.ts`.
4. Update `backend/package.json` to configure the prisma seed:
   ```json
   "prisma": {
     "seed": "ts-node src/prisma/seed.ts"
   }
   ```
5. Run schema migrations to update the database:
   ```bash
   npx prisma migrate dev --name add_briefjd_and_contacts --schema=src/prisma/schema.prisma
   ```
6. Run the seed script:
   ```bash
   npx prisma db seed
   ```
7. Verify that:
   - Migration runs successfully with zero errors.
   - Seed script executes successfully.
   - Run tests: `npm test` inside `backend/` to make sure we didn't break anything.
8. Write your handoff report to `e:\mehul study\Gemini apps\Trackra\.agents\worker_m1\handoff.md` and send a message back.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
