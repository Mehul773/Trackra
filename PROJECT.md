# Project: Trackra Enhancements

## Architecture
- Backend: Express, Node.js, Prisma (PostgreSQL), Gemini API.
  - Job extraction service: `backend/src/services/extract.service.ts`
  - Integration/Unit tests: `backend/src/tests/extract.test.ts`
- Frontend: React, Vite, Tailwind CSS.
  - Main Dashboard: `frontend/src/pages/DashboardPage.tsx`
  - Job Cards: `frontend/src/components/JobCard.tsx`
  - Custom state/jobs hook: `frontend/src/hooks/useJobs.ts`

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | R1. Resilient AI JSON Extraction | Cleaning utility & regex fallback parser in extract.service.ts. Unit tests in extract.test.ts. | None | PLANNED |
| 2 | R2. Recently Added Job Indicator | Green 'New' badge + glowing green border on JobCard.tsx. Automatically fades out after 1 minute, or on click. | None | PLANNED |
| 3 | R3, R4, R5. Filters & Search Scoped Categories & Fuzzy Search | Main dashboard date filter dropdown. Search categories dropdown. Typo-tolerant fuzzy search in useJobs.ts. | None | PLANNED |
| 4 | Final E2E and Build Verification | Ensure all requirements pass, verify with audit, and run npm run build for frontend. | M1, M2, M3 | PLANNED |

## Interface Contracts
### AI JSON Parser & Clean Helper
- `cleanJsonText(text: string): string`
- `regexFallbackParse(text: string): ExtractedJob`
- `extractFromText(text: string): Promise<ExtractedJob>`

### Recently Added Indicator
- `createdAt` checked against current time.
- If `Date.now() - createdAt < 60000`, show visual badge & glowing border.
- Highlight fades out/disappears after 1 minute, or when clicked.

### Date Filter & Fuzzy Search
- `createdAt` filter options: 'all', 'today', 'week', 'month'.
- Search categories: 'all', 'title', 'company', 'location', 'salary', 'contacts'.
- Custom typo-tolerant fuzzy search check function in hook.
