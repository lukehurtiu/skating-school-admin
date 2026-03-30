-- ============================================================
-- Skating School Admin — Database Schema
-- Run this in the Supabase SQL Editor (supabase.com dashboard)
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES
-- One row per auth user. Created automatically on signup.
-- ============================================================
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  role text not null check (role in ('admin', 'instructor')),
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

-- Users can read their own profile; admins can read all
create policy "profiles: read own" on profiles
  for select using (auth.uid() = id);

create policy "profiles: admin read all" on profiles
  for select using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

create policy "profiles: admin update all" on profiles
  for update using (
    exists (
      select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- Auto-create a profile row when a new user signs up
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'instructor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- CLASSES
-- ============================================================
create table classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  day_of_week text not null check (day_of_week in ('monday','tuesday','wednesday','thursday','friday','saturday','sunday')),
  start_time time not null,
  end_time time not null,
  location text not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  instructor_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

alter table classes enable row level security;

create policy "classes: all authenticated can read" on classes
  for select using (auth.role() = 'authenticated');

create policy "classes: admin full write" on classes
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- STUDENTS
-- ============================================================
create table students (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  date_of_birth date not null,
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

alter table students enable row level security;

create policy "students: all authenticated can read" on students
  for select using (auth.role() = 'authenticated');

create policy "students: admin full write" on students
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- ENROLLMENTS
-- ============================================================
create table enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (student_id, class_id)
);

alter table enrollments enable row level security;

create policy "enrollments: all authenticated can read" on enrollments
  for select using (auth.role() = 'authenticated');

create policy "enrollments: admin full write" on enrollments
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- ATTENDANCE
-- ============================================================
create table attendance (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references enrollments(id) on delete cascade,
  class_id uuid not null references classes(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  date date not null,
  status text not null check (status in ('present', 'absent')),
  created_at timestamptz not null default now(),
  unique (student_id, class_id, date)
);

alter table attendance enable row level security;

create policy "attendance: all authenticated can read" on attendance
  for select using (auth.role() = 'authenticated');

create policy "attendance: instructor write own class" on attendance
  for insert with check (
    exists (
      select 1 from classes c
      where c.id = class_id and c.instructor_id = auth.uid()
    )
  );

create policy "attendance: admin full write" on attendance
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- SKILLS
-- ============================================================
create table skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  level text not null check (level in ('beginner', 'intermediate', 'advanced')),
  created_at timestamptz not null default now()
);

alter table skills enable row level security;

create policy "skills: all authenticated can read" on skills
  for select using (auth.role() = 'authenticated');

create policy "skills: admin full write" on skills
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- SKILL ASSESSMENTS
-- ============================================================
create table skill_assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(id) on delete cascade,
  skill_id uuid not null references skills(id) on delete cascade,
  instructor_id uuid not null references profiles(id) on delete restrict,
  passed boolean not null default false,
  assessed_at timestamptz not null default now(),
  unique (student_id, skill_id)
);

alter table skill_assessments enable row level security;

create policy "skill_assessments: all authenticated can read" on skill_assessments
  for select using (auth.role() = 'authenticated');

create policy "skill_assessments: instructor write" on skill_assessments
  for insert with check (instructor_id = auth.uid());

create policy "skill_assessments: instructor update own" on skill_assessments
  for update using (instructor_id = auth.uid());

create policy "skill_assessments: admin full write" on skill_assessments
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
