# Project Overview

Role-based admin panel for an ice/figure skating school. Admins manage classes, students, and enrollments; instructors mark attendance. Built as a Next.js 14 App Router app backed by Supabase (Postgres + Auth + Row-Level Security).

# Tech Stack

- **Framework:** Next.js 14 (App Router, server actions, server components)
- **Language:** TypeScript (strict mode)
- **Database / Auth:** Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- **Styling:** Tailwind CSS v3
- **Testing:** Jest + ts-jest (unit tests only)
- **Package manager:** npm
- **Deployment target:** Vercel

# Repository Structure

```
app/
  (auth)/login/        # Public login page + login server action
  (protected)/         # All authenticated routes; layout includes Navbar + signOut
    dashboard/         # Summary view
    classes/           # List, detail, new class, enrollment
    classes/[id]/attendance/  # Mark attendance for a class session
    students/          # List, new student
  auth/callback/       # Supabase OAuth callback route
components/            # Shared UI (Navbar, NavLinks — both are client components)
lib/
  supabase/
    server.ts          # Server-side Supabase client (use in server components + actions)
    client.ts          # Browser-side Supabase client (use in client components only)
  types.ts             # All shared TypeScript interfaces (Profile, SkatingClass, Student, …)
  utils.ts             # Pure helpers: formatSchedule(), isAdmin()
supabase/
  schema.sql           # Full DB schema with RLS policies — source of truth for the DB
__tests__/
  utils.test.ts        # Jest unit tests for lib/utils.ts functions
middleware.ts          # Session refresh + route protection (redirects to /login if unauth)
```

# Common Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # ESLint (next lint, default config)
npm test         # Jest unit tests
```

# Coding Conventions

- **@/ alias** maps to the project root; always use `@/lib/...`, `@/components/...` etc.
- **Types** live in `lib/types.ts`; import from there rather than defining inline.
- **Server actions** are co-located with their route in `actions.ts` files; mark with `"use server"` at the top.
- **Client components** must have `"use client"` and use `lib/supabase/client.ts`.
- **Server components / actions** use `lib/supabase/server.ts` (cookie-based SSR client).
- **Validation** happens in the server action before any DB call; return early with a string error message on failure.
- **Redirects** use Next.js `redirect()` from `next/navigation` after a successful mutation.
- **revalidatePath** is called after mutations that should refresh cached server component data.
- Every action file stays under one route directory; no shared action files across routes.

# Architecture Notes

- **Route groups:** `(auth)` is public; `(protected)` is guarded. Middleware enforces the boundary — unauthenticated users are sent to `/login`, authenticated users on `/login` are sent to `/dashboard`.
- **Two Supabase clients:** `lib/supabase/server.ts` reads/writes cookies and must be used in all server-side code. `lib/supabase/client.ts` is for browser context only. Mixing them causes session bugs.
- **Dual-layer auth:** RLS policies on every table are the DB-level enforcement. Server actions perform a second role check (`isAdmin(profile.role)`) before admin-only mutations. Both layers are required — never remove either.
- **Roles:** `admin` and `instructor`. New signups auto-create a profile with role `instructor` via a Postgres trigger on `auth.users`.
- **Attendance unique constraint:** `(student_id, class_id, date)` — attendance upserts use `onConflict` to handle re-marking.
- **Security headers** are set globally in `next.config.mjs` (X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy).

# Common Workflows

<!-- Workflows extracted to skills — invoke with the slash command listed below. -->
<!-- @reference .claude/skills/add-protected-page/SKILL.md -->
<!-- @reference .claude/skills/add-server-action/SKILL.md -->
<!-- @reference .claude/skills/modify-db-schema/SKILL.md -->
<!-- @reference .claude/skills/run-write-tests/SKILL.md -->

# Decision Rules

- **Server vs client Supabase client:** If the code runs on the server (server component, server action, route handler, middleware) → use `lib/supabase/server.ts`. If the code runs in the browser → use `lib/supabase/client.ts`.
- **When to call revalidatePath:** After any server action that mutates data shown in a server component (create, update, delete, attendance). Skip for redirects that navigate away from the current page.
- **Admin-only actions:** Always verify `isAdmin(profile.role)` in the server action AND rely on RLS. Never trust one layer alone.
- **Adding a new public route:** Add its path to the `publicPaths` check in `middleware.ts` so unauthenticated users can reach it.
- **Adding a new type:** Add it to `lib/types.ts`, not inline in a component or action file.

# Gotchas

- **No `.env.example`:** Required env vars are `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Get values from the Supabase project settings → API tab.
- **No Prettier config:** There is no autoformatter configured; do not assume consistent spacing in generated code.
- **Profile auto-creation trigger:** A Postgres trigger inserts a row into `profiles` when a user signs up via `auth.users`. If you recreate the DB, the trigger must also be recreated (it is in `schema.sql`).
- **Attendance upserts:** The unique constraint on `(student_id, class_id, date)` means re-submitting an attendance form for the same day updates rather than errors. This is intentional.
- **Server action error returns:** Actions return a plain string on error (no thrown exceptions). Calling components must check the return value to display errors — no try/catch boundary at the route level.
- **Enrollment duplicate handling:** The `enrollStudent` action handles Postgres error code `23505` (unique violation) explicitly; preserve that check when editing enrollment logic.
- **`@supabase/ssr` version pinned:** The SSR helper API changed between minor versions. Check `package.json` before upgrading Supabase packages.

# Available Skills

- `add-protected-page` — Add a new authenticated page under `app/(protected)/`
- `add-server-action` — Create a Supabase-backed server action in `actions.ts`
- `modify-db-schema` — Update `schema.sql`, apply changes, and sync `lib/types.ts`
- `run-write-tests` — Run or write Jest unit tests in `__tests__/`
