# Skating School Admin — Project Tasks

## Phase 1 — Complete

### Setup & Infrastructure
- [x] Initialize project structure
- [x] Create README.md
- [x] Set up package.json with dependencies
- [x] Set up `.env.local` with Supabase keys
- [x] Set up Next.js config + Tailwind CSS

### Supabase / Database
- [x] Create `profiles` table (with auto-creation trigger on signup)
- [x] Create `classes` table
- [x] Create `students` table
- [x] Create `enrollments` table
- [x] Create `attendance` table
- [x] Create `skills` table
- [x] Create `skill_assessments` table
- [x] Set up Row Level Security (RLS) policies for all tables

### Auth
- [x] Login page
- [x] Middleware for protected routes
- [x] Sign-out
- [x] Role-based access (admin vs instructor) via RLS

### Class Management
- [x] Class list page (`/classes`)
- [x] Create class form (`/classes/new`) — admin only
- [x] Class detail view (`/classes/[id]`)

---

## Phase 2 — Upcoming

### Student Management
- [ ] Student list page (`/students`)
- [ ] Add student form (`/students/new`) — admin only

### Enrollment Management
- [ ] Show enrolled students on class detail page
- [ ] Enroll student into class — admin only

### Attendance Tracking
- [ ] Attendance sheet per class (`/classes/[id]/attendance`)
- [ ] Mark present / absent per student per session (instructor)

### Skill Feedback
- [ ] Student skills page (`/students/[id]/skills`)
- [ ] Mark skill passed / not passed (instructor)

### Dashboard
- [ ] Instructor dashboard — show assigned classes only
- [ ] Admin dashboard — show aggregate counts

### Role Guards
- [ ] Server-side role check on all write actions
- [ ] Hide admin-only UI elements from instructor role

### Testing
- [ ] Set up Jest + ts-jest
- [ ] Unit test: schedule formatting helper
- [ ] Unit test: admin role-check utility

### Security Audit
- [ ] Run AI security audit (server actions, RLS, middleware)
- [ ] Document findings and fixes

---

## Phase 3 — Group Integration (upcoming)

- [ ] Sync with group project
- [ ] Integration endpoints / shared schema

## Phase 4 — Final Documentation

- [ ] Personal documentation
- [ ] Group documentation
