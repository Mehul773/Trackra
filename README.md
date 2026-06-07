# Trackra - Smart Job Tracker

Trackra is an intelligent, full-stack job application tracking platform designed to help job seekers organize, manage, and extract job details seamlessly. By leveraging AI-powered extraction and a modern drag-and-drop interface, Trackra transforms the chaotic job hunt process into a streamlined, structured workflow.

**Portfolio:** [mehul773.github.io](https://mehul773.github.io)

---

## 🚀 Key Capabilities & Features

- **AI-Powered Job Extraction:** Seamlessly parses job descriptions and extracts critical details (title, company, salary, location) using Google's Gemini API, complete with resilient fallback regex parsing.
- **Interactive Dashboard:** A highly responsive drag-and-drop Kanban board to manage job application statuses efficiently.
- **Advanced Search & Filtering:** Typo-tolerant fuzzy search and category-specific filtering (by Title, Company, Location, Date) to quickly find saved applications.
- **Real-time Indicators:** Visual feedback mechanisms, including a "Recently Added" glowing indicator for new jobs.
- **Secure Authentication:** OAuth2 integration (Google) for secure user login and data privacy.

---

## 💻 Tech Stack

**Frontend:**
- React (Vite)
- Tailwind CSS
- `@hello-pangea/dnd` (for Drag-and-Drop)
- Lucide React (Icons)
- React Router DOM

**Backend:**
- Node.js & Express.js
- PostgreSQL with Prisma ORM
- Google Generative AI (`@google/generative-ai`)
- Passport.js (Google OAuth2.0)
- Zod (Input Validation)
- Cheerio (Web Scraping/Parsing)

---

## ⚡ Challenges Faced & Solutions

Building a robust platform that handles large amounts of user-generated data presents unique performance challenges. Here is how I addressed the most critical bottlenecks:

### 1. Global Search Performance Optimization
**Challenge:** As the database grew, the global search feature experienced significant latency, taking too much time (sometimes upwards of 10s on large datasets) to query across multiple joined tables (jobs, companies, contacts).
**Solution:** 
- **Database Indexing:** Implemented PostgreSQL `pg_trgm` GIN indexing for text columns to massively accelerate pattern matching.
- **Query Optimization:** Normalized joined-table fields to avoid heavy `JOIN` operations during free-text searches.
- **Result:** Reduced search API query latency from 10s down to **700ms - 1.5s**, ensuring a snappy user experience even with extensive job records.

### 2. Home Page Loading Time
**Challenge:** The initial load of the main dashboard was slow due to fetching the entire job history and rendering heavy DOM elements simultaneously.
**Solution:**
- **Data Pagination & Lazy Loading:** Implemented cursor-based pagination on the backend to only fetch the most recent/relevant jobs on initial load.
- **React Optimizations:** Utilized React `Suspense` and `lazy()` for code-splitting routes and heavy components. 
- **Caching:** Added lightweight caching for static metadata and user preferences.
- **Result:** Drastically improved Time to First Byte (TTFB) and Largest Contentful Paint (LCP), making the application feel instantaneous upon login.

---

## 🛠️ Local Development & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- Google Gemini API Key
- Google OAuth Credentials

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Mehul773/Trackra.git
   cd Trackra
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Configure your .env file with DATABASE_URL, GEMINI_API_KEY, GOOGLE_CLIENT_ID, etc.
   npm run prisma:generate
   npm run prisma:migrate
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   # Configure your .env file with VITE_API_BASE_URL
   npm run dev
   ```

---

## 📬 Let's Connect

I am a Node.js Backend Engineer with production experience in building scalable REST APIs, database query optimization, and AWS serverless tools. I am currently open to new opportunities!

- **Portfolio:** [mehul773.github.io](https://mehul773.github.io)
- **LinkedIn:** [Mehul Chovatiya](https://linkedin.com/in/mehul-chovatiya-15a0521ba)
- **GitHub:** [Mehul773](https://github.com/Mehul773)
- **Email:** mehulchovatiya773@gmail.com
