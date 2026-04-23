# Skating School Admin

A modern, role-based management platform for ice and figure skating schools. It replaces paper attendance sheets, scattered spreadsheets, and emailed class rosters with a single, secure web app where administrators manage schedules and rosters, and instructors take attendance and track skill progress from the rink-side.

## Demo

https://github.com/lukehurtiu/skating-school-admin/blob/main/i400-demo.mp4

<video src="./i400-demo.mp4" controls width="720">
  Your browser does not support embedded video. <a href="./i400-demo.mp4">Download the demo (MP4)</a>.
</video>

> If the video does not play inline, click the link above or open `i400-demo.mp4` from the repository root.

## Why this exists

Skating schools juggle recurring class schedules, rotating instructors, mixed skill levels, and weekly attendance — information that's usually spread across paper sign-in sheets, shared drives, and memory. **Skating School Admin** consolidates it:

- **For the front desk:** one place to see every class, every student, and every enrollment.
- **For instructors:** a fast, phone-friendly attendance workflow and structured skill tracking so progress reports write themselves.
- **For owners:** confidence that student data is protected, that only the right people can see the right records, and that no information walks out the door with a lost clipboard.

## Features

### For administrators
- **Class management** — create classes with day, time, location, skating level, and assigned instructor; view classes in a list or a weekly schedule grid.
- **Student roster** — add students, edit their details, track their current skating level, and filter/search the full roster.
- **Enrollment** — enroll students into classes in a few clicks; duplicates and conflicts are handled automatically.
- **Dashboard** — at-a-glance summary of today's classes and school totals.

### For instructors
- **Attendance in seconds** — pull up today's class, mark present/absent per student, done. Submitting again for the same day updates (not duplicates) the record.
- **Skill assessments** — log pass / in-progress / not-yet status against the standard skill list for each student's level, with optional comments.
- **Level advancement recommendations** — suggest a student move up a level, with a note for the administrator to review.

### For everyone
- **Secure, role-based access** — instructors only see the classes and students they're responsible for; administrators see everything. Enforced at both the database and the application layer.
- **Ask-AI assistant (optional)** — a floating assistant (bottom-right) that answers plain-English questions about your own data: "How many students are enrolled?", "What classes are on Monday?", "Who was absent last week?". See [Optional: AI Assistant](#optional-ai-assistant-rag) below.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Database & Auth | Supabase (PostgreSQL + Row-Level Security + Auth) |
| Styling | Tailwind CSS |
| AI (optional) | Groq API · Llama 3.3 70B |
| Testing | Jest + ts-jest |
| Deployment | Vercel |

## Security

Student data is sensitive. This app treats it that way:

- **Row-Level Security** on every table — the database itself refuses to return a record to a user who shouldn't see it.
- **Double-enforced permissions** — every write action re-checks the user's role in application code before touching the database, so a misconfigured policy alone can't leak data.
- **No service-role keys in the app** — only the public anon key ships to the browser; privileged keys live server-side only.
- **Secrets isolated** — `.env.local` is git-ignored; the optional Groq key is server-only and never exposed to the browser.
- **Parameterized queries everywhere** — all database access goes through the Supabase SDK; there is no raw SQL constructed from user input.
- **Hardened HTTP headers** — `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` are set globally.

## Data Model

| Table | Purpose |
|---|---|
| `profiles` | Users (admin, instructor, student), auto-created on signup |
| `classes` | Skating class sessions with schedule, location, and level |
| `students` | Student records |
| `enrollments` | Which students belong to which classes |
| `attendance` | Per-session present/absent records (unique per student/class/date) |
| `skills` | The skill checklist for each skating level |
| `skill_assessments` | Instructor-logged pass / in-progress / not-yet per skill per student |
| `student_links` | Optional link between a student record and a student-role login |
| `level_advancement_recommendations` | Instructor-proposed level promotions |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/lukehurtiu/skating-school-admin.git
cd skating-school-admin
npm install
```

### 2. Set up Supabase

Create a Supabase project, then in the project's **SQL Editor** run the contents of `supabase/schema.sql`. This creates every table, every RLS policy, and the trigger that auto-creates a profile row whenever a new user signs up.

### 3. Environment variables

Copy `.env.example` to `.env.local` and fill in the values from **Supabase → Settings → API**:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional — enables the in-app AI assistant
GROQ_API_KEY=gsk_your_key
```

`.env.local` is git-ignored by default — never commit it.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up to create an instructor account, or promote a user to admin in the `profiles` table to unlock administrator features.

### 5. Run tests

```bash
npm test
```

## Optional: AI Assistant (RAG)

A floating **Ask AI** button appears bottom-right on every authenticated page. Click it and ask questions about your own data in plain English — for example:

- "How many students are enrolled?"
- "What classes are on Monday?"
- "Who teaches the Level 3 class?"
- "Who was absent last week?"

### How it works

This is a deliberately simple retrieval-augmented-generation (RAG) design:

1. When a user asks a question, a server action pulls a bounded snapshot of the relevant tables (students, classes, enrollments, recent attendance — up to 50 rows each).
2. All queries run through the Supabase SSR client, so **the same row-level security that protects the app also scopes what the assistant can see** — an instructor's assistant only sees their own classes.
3. The snapshot is injected into a system prompt as JSON, with explicit instructions to answer only from that data and decline anything out-of-scope.
4. The prompt is sent to Groq's Llama 3.3 70B model, and the answer is returned to the widget.

No embeddings, no vector database, no model-driven DB queries. If the Groq key is not set, the widget returns a friendly error and the rest of the app is unaffected.

### Setup

1. Create a free API key at [console.groq.com/keys](https://console.groq.com/keys).
2. Add it to `.env.local` (server-only — **do not** prefix with `NEXT_PUBLIC_`):
   ```env
   GROQ_API_KEY=gsk_your_key_here
   ```
3. Restart `npm run dev`.

### Key files

- `lib/groq.ts` — Groq SDK wrapper
- `app/(protected)/assistant/actions.ts` — server action that builds the snapshot and calls Groq
- `components/AssistantWidget.tsx` — the floating UI

## Deployment

### Vercel (recommended)

1. Push the repository to GitHub (confirm `.env.local` is not included — it is git-ignored by default).
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Under **Settings → Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GROQ_API_KEY` *(optional — only if you want the AI assistant enabled)*
4. Deploy. Vercel auto-detects Next.js and builds with `npm run build`.

### Other platforms

```bash
npm run build
npm start
```

Set the same environment variables in your hosting environment before starting.

## Acknowledgements

Developed in the class **I400 — Vibe and AI Programming, Spring 2026, IUB**, with the assistance of [Claude](https://www.anthropic.com/claude) within [VS Code](https://code.visualstudio.com/).
