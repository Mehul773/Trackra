## 2026-06-07T10:16:26Z

Enhance the Trackra job application pipeline by implementing a React-based drag-and-drop Kanban board, a detailed job modal view, infinite scrolling for large datasets (e.g., 1,000+ jobs), global search, filtered CSV exports, contacts schema updates, mock data generation, mobile responsiveness, and portfolio integration.

Working directory: e:\mehul study\Gemini apps\Trackra
Integrity mode: development

## Requirements

### R1. Kanban Drag and Drop & Visual UI Fixes
- Implement a smooth drag-and-drop system using a popular React library (such as `@hello-pangea/dnd` or `@dnd-kit/core`) to move job cards between status columns (Wishlist, Applied, Interviews, Offers, Rejected).
- Dragging a card to a new column must automatically trigger an API call to update the job status in the database.
- Improve the card UI based on [card_ui_analysis.md](file:///C:/Users/Pramukh/.gemini/antigravity/brain/fae2224b-1596-44d3-bfd4-6158b154b201/card_ui_analysis.md). Specifically, increase button targets, fix alignment, and prevent title clipping.

### R2. Detailed View Modal & Copy Functionality
- Clicking on a job card opens a detail modal displaying all fields (Brief JD, title, company, location, salary, posted date, fit rating, and contact details list).
- Include a "Copy Details" button that formats and copies all job details (Title, Company, Location, Salary, Brief JD, and Contacts) to the clipboard.

### R3. Global Search & Infinite Scrolling (1,000+ Jobs UX)
- Implement a global search bar to filter jobs. The search must dynamically filter by:
  - Job Title
  - Company Name
  - Location
  - Salary
  - Associated Contact details (matching Contact Name, Email, Phone, or Role).
- Implement infinite scroll or lazy loading for the Kanban board columns to handle large volumes of jobs (1,000+) without browser lag, loading more cards as the user scrolls.

### R4. Filtered CSV Export
- Modify the export functionality so that only the currently searched or filtered results are exported to the CSV file (instead of always exporting all jobs).

### R5. Database Schema: Brief JD & Multiple Contacts
- Update the Prisma schema to store a brief job description.
- Create a relational database table `Contact` with a one-to-many relationship with `Job` (fields: id, name, email, phone, role, jobId).
- Update the job creation/updating logic to allow adding and editing multiple contact persons.
- Write a database seed/migration script to add 1,000 mock jobs (with mock contacts) for the test user to test performance.

### R6. Mobile Responsiveness
- Ensure the application is fully responsive.
- On mobile viewports, the Kanban board columns must transition from a side-by-side layout to a horizontal tabbed layout (e.g. tabs for "Wishlist", "Applied", etc.) showing one active column at a time to prevent horizontal scrolling.

### R7. Portfolio Integration
- Add a link or button to the site owner's portfolio site (`https://mehul773.github.io/`) directly in the application header (nav bar) so visitors can connect with the owner.

## Acceptance Criteria

### Kanban and Drag-and-Drop
- [ ] Dragging a card to another column visually updates the board immediately.
- [ ] Card status change is successfully persisted in the Postgres database via a PATCH request.
- [ ] Card header action icons are updated to circular buttons with hover transitions and a minimum of `32px` clickable area.

### Detailed View and Export
- [ ] Clicking a job card opens a modal displaying the brief JD and all contact details.
- [ ] Clicking "Copy Details" puts a formatted string of the job's information onto the clipboard.
- [ ] Exporting to CSV triggers a file download containing only the jobs matching the active search query.

### Performance and Data Seeding
- [ ] Database seeding script generates exactly 1,000 mock jobs for the test user.
- [ ] Dashboard renders successfully with 1,000+ seeded jobs. Infinite scroll loads cards incrementally (e.g., 20 or 50 at a time) when scrolling down.
- [ ] Global search filters company, location, salary, and contact name/details instantly on the client side or via debounced API requests.

### Database updates
- [ ] Prisma model `Contact` is registered in `schema.prisma` with a foreign key pointing to `Job`.
- [ ] `npx prisma migrate dev` or database push runs successfully with zero schema errors.

### Mobile and Portfolio Link
- [ ] Kanban board switches to tabbed selection columns under mobile breakpoint (e.g., width <= 768px).
- [ ] Portfolio link pointing to `https://mehul773.github.io/` is visible and clickable in the application header.

## 2026-06-07T12:20:27Z

Enhance the Trackra application with the following requirements:

Working directory: e:\mehul study\Gemini apps\Trackra
Integrity mode: development

## Requirements

### R1. Resilient AI JSON Extraction
- Improve the AI extraction service in `backend/src/services/extract.service.ts` to be extremely robust against invalid or malformed JSON responses from Gemini/Ollama.
- Implement a cleaning utility that pre-processes the raw AI response text (e.g., stripping markdown code fences, removing trailing commas in arrays/objects, sanitizing raw unescaped newlines/control characters within string values).
- If standard `JSON.parse` still fails, implement a regex-based fallback parser that extracts key-value fields (`title`, `company`, `location`, `salary`, `url`, `skills`, `fit`, `experience`, `briefJD`) manually from the text block.

### R2. "Recently Added" Job Indicator
- Job cards created manually or via AI extraction within the last 1 minute must display a distinct visual highlight.
- Style constraint: Render BOTH a green 'New' badge next to the title and a subtle glowing green border around the card.
- The tag or highlight should automatically fade out or disappear after 1 minute, or when the user manually dismisses/clicks the card.

### R3. Date Filter Dropdown
- Add a dropdown or selector element to the main dashboard allowing users to filter jobs by their database creation date (`createdAt`).
- Options must include:
  - **All Time** (default)
  - **Today** (created within the calendar day)
  - **This Week** (created within the last 7 days)
  - **This Month** (created within the last 30 days)

### R4. Search Scoped Categories
- Add a filter dropdown selector next to or inside the global search bar to let users scope their search.
- Options:
  - **All Fields** (searches all job and contact attributes)
  - **Job Title**
  - **Company**
  - **Location**
  - **Salary**
  - **Contacts** (searches contact name, email, phone, or role)

### R5. Typo-Tolerant Fuzzy Search
- Enhance the search filtering in `useJobs.ts` to use a custom lightweight fuzzy search matching helper (such as checking character sequence matching, Levenshtein distance, or substring proximity) to tolerate minor typos without installing heavy external libraries.

---

## Acceptance Criteria

### AI Extraction
- [ ] AI extraction endpoint successfully parses responses containing trailing commas and raw newlines without throwing a `SyntaxError` (the `AI returned invalid JSON` error).
- [ ] Added unit tests in `extract.test.ts` to verify the resilient JSON parsing utility against mock malformed responses.

### Recently Added indicator
- [ ] New job cards display a green 'New' badge + glowing green border.
- [ ] The highlight/badge automatically disappears or fades out exactly 1 minute after creation.

### Date Filter & Scoped Search
- [ ] Selecting "Today", "This Week", or "This Month" correctly restricts the job cards displayed on the Kanban board.
- [ ] Search category dropdown correctly scopes search inputs to only the chosen field.

### Fuzzy Search
- [ ] Global search is typo-tolerant (e.g., searching "Gogle" or "Googl" still matches "Google").
- [ ] UI remains fully responsive and passes frontend building (`npm run build`).
