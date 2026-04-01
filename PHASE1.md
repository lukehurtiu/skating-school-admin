# Skating School Admin — Phase 1 Blueprint

**By:** Luke Hurt

---

## 1. Project Concept

**Skating School Admin** is a role-based management platform for ice/figure skating schools. Administrators manage class schedules and student rosters, while instructors track attendance and log skill assessments — all in one dashboard replacing paper-based workflows.

### Technical Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router, TypeScript) — deployed on **Vercel** |
| Database & Auth | **Supabase** (PostgreSQL + Row Level Security + Supabase Auth) |
| Styling | Tailwind CSS |
| AI Agents Used | Claude Code (Cursor-style), GitHub Copilot |

---

## 2. Vibe-Coding Steps (Phase 2 Task Breakdown)

Each task is scoped small enough for an AI agent to execute without ambiguity.

---

**Task 1 — Student Management CRUD**

> "In my Next.js + Supabase app, build a `/students` page. It should list all students from the `students` table (first_name, last_name, date_of_birth, level columns). Add a `/students/new` page with a form to create a student (admin only, enforce via RLS). Use the existing Navbar and Tailwind styling that matches `/classes`."

*Test 1:* Admin can create a student and it appears in Supabase table editor. Non-admin (instructor) cannot access the create form.

---

**Task 2 — Enrollment Management**

> "Add enrollment functionality. On the `/classes/[id]` detail page, show a list of enrolled students by joining the `enrollments` table with `students`. Add an 'Enroll Student' button (admin only) that opens a dropdown of students not yet enrolled in this class, then inserts a row into `enrollments`."

*Test 2:* Enrolling a student creates a row in `enrollments`; the student appears in the class detail list immediately.

---

**Task 3 — Attendance Tracking UI**

> "Build an attendance sheet at `/classes/[id]/attendance`. Fetch all students enrolled in this class. Render a table where each row is a student and each column is a date. For today's date, show a 'Mark' button per student that toggles present/absent in the `attendance` table. Instructors can only mark attendance for classes assigned to them (use RLS — `instructor_id` must match `auth.uid()`)."

*Test 3:* Instructor marks a student present; row appears in `attendance` table with correct `status`, `class_id`, `student_id`, and `date`.

---

**Task 4 — Skill Assessment UI**

> "Create a `/students/[id]/skills` page. Fetch all skills from the `skills` table filtered by the student's level. For each skill, show the current assessment status from `skill_assessments` (passed: true/false or not yet assessed). Add a 'Mark Passed' button (instructor role only) that upserts a row in `skill_assessments` with `passed: true`, `instructor_id: auth.uid()`, and `assessed_at: now()`."

*Test 4:* Clicking 'Mark Passed' upserts the correct row in `skill_assessments`; page re-renders with updated status.

---

**Task 5 — Instructor Dashboard**

> "Update the `/dashboard` page. For users with role `instructor`, query `classes` where `instructor_id = auth.uid()` and display their assigned classes in a card grid. Show class name, day, time, and location. For admins, show a summary: total students count, total classes count, and total enrollments count."

*Test 5:* Instructor logs in and sees only their classes. Admin sees aggregate counts matching Supabase table row counts.

---

**Task 6 — Role-Based UI Guards**

> "Audit all pages for role-based UI. Any button or form that creates/edits data should be hidden from instructors (only admins can write students, classes, enrollments). Use a server-side role check in each page's server component — fetch the user's profile and pass `isAdmin` as a prop. Do not rely solely on RLS for UI visibility."

*Test 6:* Log in as instructor — no 'New Class', 'New Student', or 'Enroll' buttons are visible. Attempt to POST directly to the create endpoint; server action returns an authorization error.

---

**Task 7 — Unit Testing Setup**

> "Set up Jest with ts-jest in this Next.js 14 project. Write unit tests for the two most critical pure functions: (1) a helper that formats a class schedule string from `day_of_week`, `start_time`, and `end_time` fields, and (2) a role-check utility that returns `true` if a user's profile role is 'admin'. Tests must run with `npm test` and pass with no network calls or Supabase dependency."

*Test 7:* `npm test` runs successfully in the terminal, all assertions green, zero network calls required.

---

**Task 8 — AI Security Audit**

> "Act as a security consultant for this Next.js + Supabase app. Review the following areas and identify any vulnerabilities: (1) server actions in `/app/(protected)/` — can a non-admin bypass role checks? (2) RLS policies in `schema.sql` — are there any gaps where a user could read or write another user's data? (3) The auth middleware — can an unauthenticated request reach a protected route? For each finding, describe the vulnerability, its worst-case impact, and the fix."

*Test 8:* Document the agent's findings, apply any confirmed fixes, and record what was already secure (to satisfy Phase 2's security analysis requirement).

---

## 3. Economic Forecast

**Assumptions:**
- 10 requests/user/month (admin tooling — low traffic by nature)
- Average request size: ~50 KB (HTML/JSON responses)
- Average student photo/document: ~200 KB per student record
- Users = instructors + admin staff

### Cost Table

| Metric | 500 Users | 5,000 Users | 50,000 Users |
|---|---|---|---|
| Monthly Requests | 5,000 | 50,000 | 500,000 |
| Est. Bandwidth | ~250 MB | ~2.5 GB | ~25 GB |
| Student Record Storage | ~100 MB | ~1 GB | ~10 GB |
| **Vercel** | $0 (Hobby) | $0 (Hobby) | $20 (Pro) |
| **Supabase** | $0 (Free) | $0 (Free) | $25 (Pro) |
| **Total** | **$0 / mo** | **$0 / mo** | **$45 / mo** |

### Free Tier Limits (Key Constraints)

**Vercel Hobby (Free):**
- 100 GB bandwidth/month — 25 GB at 50k users is within limits
- 6,000 build minutes/month — sufficient for this project
- Upgrades to Pro ($20/mo) are recommended at ~30k+ users for team access and SLA guarantees

**Supabase Free Tier:**
- 500 MB database — sufficient up to ~5k users
- 5 GB file storage — sufficient up to ~25k students with photos
- **50,000 Monthly Active Users (MAU)** — the binding constraint; 50k users hits this ceiling
- At 50k users, upgrade to Pro ($25/mo) is required for 100k MAU and 8 GB database

**Critical Note on Storage Scaling:**
50,000 students each with a profile photo at 200 KB = ~10 GB storage. This fits within Supabase Pro's included 100 GB storage. However, if schools upload class videos or documents, costs increase: additional Supabase storage is billed at **$0.021/GB/month** beyond the included quota.

### Cost References
- Vercel pricing: https://vercel.com/pricing
- Supabase pricing: https://supabase.com/pricing

---

## 4. Testing Roadmap

### Auth & Connectivity

| Test | Method | Pass Criteria |
|---|---|---|
| Supabase connection | Load `/login` page, check browser console for errors | No connection errors; `NEXT_PUBLIC_SUPABASE_URL` resolves |
| Admin sign-up | Register via Supabase Auth email/password | Row auto-created in `profiles` table via trigger |
| Instructor sign-up | Register second account, manually set `role = instructor` in Supabase dashboard | Profile row has `role: instructor` |
| Admin login redirect | Sign in as admin at `/login` | Redirected to `/dashboard` |
| Instructor login redirect | Sign in as instructor at `/login` | Redirected to `/dashboard` (sees only their classes) |
| Protected route guard | Visit `/dashboard` while logged out | Redirected to `/login` |
| RLS enforcement | As instructor, POST to create-class server action directly | Server action returns 401/forbidden |
| Sign-out | Click sign-out in Navbar | Session cleared; redirected to `/login` |

### Manual Integration Tests (Phase 1 Scope)
1. Sign up a new user — verify profile row appears in Supabase `profiles` table
2. Sign in — verify JWT session cookie is set in browser DevTools
3. Create a class as admin — verify row in `classes` table with correct `instructor_id`
4. View class detail — verify `instructor` name resolves via foreign key join

---

## 5. Security Notes

- `.env.local` is in `.gitignore` — Supabase URL and anon key are never committed
- Service role key is never used client-side or committed to the repo
- All database mutations enforce RLS — server actions check `auth.uid()` against role
- No raw SQL is constructed from user input — all queries use the Supabase JS SDK with parameterized calls

---

## 6. GitHub Repository

**Repo:** https://github.com/lukehurtiu/skating-school-admin

Secrets management:
- `.env.local` is in `.gitignore` — no secrets committed
- Only `NEXT_PUBLIC_` prefixed keys are used client-side (anon key, safe to expose per [Supabase docs](https://supabase.com/docs/guides/api/api-keys))
- Service role key is never referenced in the codebase
