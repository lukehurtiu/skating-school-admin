# ⛸️ Skating School Admin

A web application to help local skating schools move away from paper tracking and manage their daily operations digitally.

## 🎯 Problem

Local skating schools struggle with paper-based tracking of attendance, student skill progression, and class management — leading to lost records and slow feedback loops for parents and instructors.

## ✅ MVP Features

- **Auth** — Secure login for admins and instructors (Supabase Auth)
- **Class Management** — Create and view classes with time, day, ice location, and level
- **Student Management** — Add students and assign them to classes
- **Attendance Tracking** — Mark students present or absent per session
- **Skill Feedback** — Instructors mark pass/not-pass per skill at end of session

## 🛠️ Tech Stack

- [Next.js 14](https://nextjs.org/) — Fullstack React framework
- [Supabase](https://supabase.com/) — Database, Auth, and API
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [TypeScript](https://www.typescriptlang.org/) — Type safety

## 📦 Project Status

| Area | Status |
|---|---|
| Project scaffold & config | ✅ Done |
| TypeScript domain types | ✅ Done |
| Supabase browser + server clients | ✅ Done |
| Session refresh middleware | ✅ Done |
| Database schema & RLS | ✅ Done |
| Auth (login, route protection, sign out) | ✅ Done |
| Class management UI | ✅ Done |
| Student management UI | 🔲 Next |
| Attendance tracking UI | 🔲 Upcoming |
| Skill feedback UI | 🔲 Upcoming |

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/skating-school-admin.git
cd skating-school-admin
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create `.env.local` and fill in your Supabase project credentials from your [Supabase dashboard](https://app.supabase.com):

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🗃️ Database Schema

Tables:

- `profiles` — Users (admins, instructors)
- `classes` — Skating class sessions
- `students` — Student records
- `enrollments` — Student ↔ class assignments
- `attendance` — Per-session attendance records
- `skills` — Skills per level
- `skill_assessments` — Instructor feedback per student per skill

## 🌐 Deployment

Deployed on [Vercel](https://vercel.com). Add your environment variables in the Vercel project settings.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## 📋 Assumptions to Validate

- Instructors will adopt a tablet/phone workflow during sessions
- Admins manage student registration (no self-signup for parents in MVP)
- One primary instructor per class is sufficient for MVP

## 🧪 How to Give Feedback

After testing, please note:
- Any flows that felt confusing or slow
- Missing information you'd expect to see
- Anything that broke