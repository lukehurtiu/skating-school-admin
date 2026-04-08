# Skating School Admin

A role-based management platform for ice/figure skating schools. Admins manage class schedules and student rosters; instructors track attendance and log skill assessments — replacing paper-based workflows.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) |
| Database & Auth | Supabase (PostgreSQL + RLS + Auth) |
| Styling | Tailwind CSS |
| Testing | Jest + ts-jest |
| Deployment | Vercel |

## Project Status

### Phase 1 — Complete
| Feature | Status |
|---|---|
| Project scaffold, TypeScript types, config | Done |
| Supabase browser + server clients | Done |
| Session refresh middleware | Done |
| Database schema (7 tables) + RLS policies | Done |
| Auth — login, route protection, sign-out | Done |
| Class management — list, create, detail | Done |

### Phase 2 — Complete
| Feature | Status |
|---|---|
| Student management — list, create | Done |
| Enrollment — enroll students into classes | Done |
| Attendance tracking — mark present/absent per session | Done |
| Role-based dashboard — instructor vs admin views | Done |
| Role guards — server-side + UI for all write actions | Done |
| Unit testing — Jest + ts-jest, 8 passing tests | Done |
| Security audit | Done |

### Phase 3 — Upcoming
| Feature | Status |
|---|---|
| Group sync / integration endpoints | Upcoming |
| Shared schema alignment | Upcoming |

### Phase 4 — Upcoming
| Feature | Status |
|---|---|
| Full personal + group documentation | Upcoming |

## Database Schema

| Table | Purpose |
|---|---|
| `profiles` | Users (admin / instructor), auto-created on signup |
| `classes` | Skating class sessions with schedule and level |
| `students` | Student records |
| `enrollments` | Student ↔ class assignments |
| `attendance` | Per-session present/absent records |
| `skills` | Skills list per level |
| `skill_assessments` | Instructor pass/not-pass per student per skill |

Row Level Security is enabled on all tables. Instructors can only write data for their own classes.

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/lukehurtiu/skating-school-admin.git
cd skating-school-admin
npm install
```

### 2. Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Never commit `.env.local` — it is in `.gitignore`.

### 3. Database

Run `supabase/schema.sql` in your Supabase project's SQL editor to create all tables, RLS policies, and the profile auto-creation trigger.

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Run tests

```bash
npm test
```

8 unit tests covering `formatSchedule` and `isAdmin` utility functions. Zero network calls or Supabase dependency.

## Security

- `.env.local` excluded via `.gitignore`
- Only `NEXT_PUBLIC_` prefixed Supabase keys used client-side (anon key — safe to expose)
- Service role key never referenced in codebase
- All mutations enforce RLS at the database level
- Server actions independently verify auth + role before any DB write (double enforcement)
- Supabase JS SDK used throughout — no raw SQL constructed from user input

## Deployment

Deployed on Vercel. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in Vercel project settings.
