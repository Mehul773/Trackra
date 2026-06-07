# Project: Trackra Enhancements
# Scope: All Requirements

## Architecture
- React frontend (Vite), Node.js/Express backend, Prisma ORM, PostgreSQL database.
- Kanban drag-and-drop UI with lazy-loaded columns.
- Relational Contact model linked to Job model.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Database Schema & Seed | Update Prisma schema (Contact model, briefJD in Job), run migrations, seed 1,000 jobs | none | PLANNED |
| 2 | Backend API Updates | Update job routes/services to handle multiple contacts and status PATCH | M1 | PLANNED |
| 3 | Kanban Board & UI Fixes | Drag-and-drop, card UI enhancements, portfolio link, mobile tabbed view | M2 | PLANNED |
| 4 | Job Detail Modal & Copy | Detail modal displaying brief JD and contacts, copy details to clipboard | M3 | PLANNED |
| 5 | Search, Scroll & Export | Global search, infinite scrolling for columns, filtered CSV export | M3, M4 | PLANNED |
| 6 | E2E Testing & Hardening | E2E test suite execution, adversarial hardening, integrity audit | M5 | PLANNED |

## Interface Contracts
### Job Creation / Update Payload
- Add list of contacts: `contacts: Array<{ name, email, phone, role }>`
- Update `briefJD: string`

### Job Status Update Payload
- PATCH `/api/jobs/:id` with `{ status: JobStatus }`
