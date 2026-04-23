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
  role text not null check (role in ('admin', 'instructor', 'student')),
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
    case
      when new.raw_user_meta_data->>'role' = 'student' then 'student'
      else 'instructor'  -- default; admins must be promoted manually
    end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- SKATING LEVELS
-- Named progression stages (Parent Tot, Tot 2, ..., Level 5).
-- Must be created before classes and students (FK dependency).
-- ============================================================
create table skating_levels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int  not null unique,
  created_at timestamptz not null default now()
);

alter table skating_levels enable row level security;

create policy "skating_levels: all authenticated can read" on skating_levels
  for select using (auth.role() = 'authenticated');

create policy "skating_levels: admin full write" on skating_levels
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

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
  skating_level_id uuid not null references skating_levels(id) on delete restrict,
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
-- CLASS INSTRUCTORS
-- Junction table for additional instructors on a class.
-- classes.instructor_id remains the primary/lead instructor.
-- ============================================================
create table class_instructors (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references classes(id) on delete cascade,
  instructor_id uuid not null references profiles(id) on delete restrict,
  assigned_at   timestamptz not null default now(),
  unique (class_id, instructor_id)
);

alter table class_instructors enable row level security;

create policy "class_instructors: all authenticated can read" on class_instructors
  for select using (auth.role() = 'authenticated');

create policy "class_instructors: admin full write" on class_instructors
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
  skating_level_id uuid not null references skating_levels(id) on delete restrict,
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
-- STUDENT LINKS
-- Links a student login account (profile) to their student record.
-- ============================================================
create table student_links (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  student_id   uuid not null references students(id) on delete cascade,
  created_at   timestamptz not null default now(),
  unique (profile_id, student_id)
);

alter table student_links enable row level security;

create policy "student_links: student read own" on student_links
  for select using (profile_id = auth.uid());

create policy "student_links: admin full write" on student_links
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
    or exists (
      select 1 from class_instructors ci
      where ci.class_id = class_id and ci.instructor_id = auth.uid()
    )
  );

create policy "attendance: instructor update own class" on attendance
  for update using (
    exists (
      select 1 from classes c
      where c.id = class_id and c.instructor_id = auth.uid()
    )
    or exists (
      select 1 from class_instructors ci
      where ci.class_id = class_id and ci.instructor_id = auth.uid()
    )
  );

create policy "attendance: admin full write" on attendance
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- SKILLS
-- Each skill belongs to exactly one skating level.
-- ============================================================
create table skills (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  level_id    uuid not null references skating_levels(id) on delete restrict,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  unique (level_id, sort_order)
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
-- One row per instructor evaluation of a student on a skill.
-- No unique constraint — history is preserved across sessions.
-- ============================================================
create table skill_assessments (
  id            uuid primary key default gen_random_uuid(),
  student_id    uuid not null references students(id) on delete cascade,
  skill_id      uuid not null references skills(id) on delete cascade,
  instructor_id uuid not null references profiles(id) on delete restrict,
  class_id      uuid not null references classes(id) on delete cascade,
  assessed_on   date not null default current_date,
  status        text not null default 'not_assessed'
                  check (status in ('not_assessed', 'in_progress', 'passed')),
  comment       text not null default '',
  assessed_at   timestamptz not null default now()
);

alter table skill_assessments enable row level security;

create policy "skill_assessments: all authenticated can read" on skill_assessments
  for select using (auth.role() = 'authenticated');

create policy "skill_assessments: instructor write" on skill_assessments
  for insert with check (
    instructor_id = auth.uid()
    and (
      exists (
        select 1 from classes c
        where c.id = class_id and c.instructor_id = auth.uid()
      )
      or exists (
        select 1 from class_instructors ci
        where ci.class_id = class_id and ci.instructor_id = auth.uid()
      )
    )
  );

create policy "skill_assessments: instructor update own" on skill_assessments
  for update using (instructor_id = auth.uid());

create policy "skill_assessments: admin full write" on skill_assessments
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- ============================================================
-- SEED: Skating Levels
-- ============================================================
insert into skating_levels (name, sort_order) values
  ('Parent Tot', 1),
  ('Tot 2',      2),
  ('Tot 3',      3),
  ('Level 1',    4),
  ('Level 2',    5),
  ('Level 3',    6),
  ('Level 4',    7),
  ('Level 5',    8)
on conflict do nothing;

-- ============================================================
-- SEED: Skills
-- ============================================================

-- Parent Tot (5 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Proper way to fall and recover', '', (select id from skating_levels where name = 'Parent Tot'), 1),
  ('March in place (10 steps)',      '', (select id from skating_levels where name = 'Parent Tot'), 2),
  ('March forward (8–10 steps)',     '', (select id from skating_levels where name = 'Parent Tot'), 3),
  ('Beginning two-foot glide',       '', (select id from skating_levels where name = 'Parent Tot'), 4),
  ('Dip in place',                   '', (select id from skating_levels where name = 'Parent Tot'), 5)
on conflict do nothing;

-- Tot 2 (5 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Forward two-foot glide',  '', (select id from skating_levels where name = 'Tot 2'), 1),
  ('Dip',                     '', (select id from skating_levels where name = 'Tot 2'), 2),
  ('Forward swizzles (3)',    '', (select id from skating_levels where name = 'Tot 2'), 3),
  ('Backward wiggles (6)',    '', (select id from skating_levels where name = 'Tot 2'), 4),
  ('Two-foot hop',            '', (select id from skating_levels where name = 'Tot 2'), 5)
on conflict do nothing;

-- Tot 3 (6 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Forward skating (width of rink)',                    '', (select id from skating_levels where name = 'Tot 3'), 1),
  ('Backward wiggles (1/2 width of rink)',               '', (select id from skating_levels where name = 'Tot 3'), 2),
  ('Rocking horse (1 set)',                              '', (select id from skating_levels where name = 'Tot 3'), 3),
  ('Snowplow stop in place',                             '', (select id from skating_levels where name = 'Tot 3'), 4),
  ('Glide Turns or U-Turns (clockwise and counterclockwise)', '', (select id from skating_levels where name = 'Tot 3'), 5),
  ('Sequence: hop / swizzles / dip',                    '', (select id from skating_levels where name = 'Tot 3'), 6)
on conflict do nothing;

-- Level 1 (11 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Proper way to fall and recover',    '', (select id from skating_levels where name = 'Level 1'), 1),
  ('March in place (10 steps)',         '', (select id from skating_levels where name = 'Level 1'), 2),
  ('March forward (width of rink)',     '', (select id from skating_levels where name = 'Level 1'), 3),
  ('Glide Turns or U-Turns',           '', (select id from skating_levels where name = 'Level 1'), 4),
  ('Forward two-foot glide',           '', (select id from skating_levels where name = 'Level 1'), 5),
  ('Dip in place',                     '', (select id from skating_levels where name = 'Level 1'), 6),
  ('Dip',                              '', (select id from skating_levels where name = 'Level 1'), 7),
  ('Forward swizzles (6)',             '', (select id from skating_levels where name = 'Level 1'), 8),
  ('Backward wiggles (1/2 width of rink)', '', (select id from skating_levels where name = 'Level 1'), 9),
  ('Rocking horse (1 set)',            '', (select id from skating_levels where name = 'Level 1'), 10),
  ('Snowplow stop in place',           '', (select id from skating_levels where name = 'Level 1'), 11)
on conflict do nothing;

-- Level 2 (8 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Forward skating (width of rink)',                   '', (select id from skating_levels where name = 'Level 2'), 1),
  ('One-foot glide (right and left)',                   '', (select id from skating_levels where name = 'Level 2'), 2),
  ('Forward swizzles (8)',                              '', (select id from skating_levels where name = 'Level 2'), 3),
  ('Rocking horse (3 sets)',                            '', (select id from skating_levels where name = 'Level 2'), 4),
  ('Backward swizzles (6)',                             '', (select id from skating_levels where name = 'Level 2'), 5),
  ('Forward alternating pumps / beginning slalom (6)', '', (select id from skating_levels where name = 'Level 2'), 6),
  ('Snowplow stop (moving)',                            '', (select id from skating_levels where name = 'Level 2'), 7),
  ('Two-foot hop',                                     '', (select id from skating_levels where name = 'Level 2'), 8)
on conflict do nothing;

-- Level 3 (5 skills)
insert into skills (name, description, level_id, sort_order) values
  ('T-position push (right and left)',              '', (select id from skating_levels where name = 'Level 3'), 1),
  ('Backward swizzles (8)',                         '', (select id from skating_levels where name = 'Level 3'), 2),
  ('Forward stroking (width of rink)',              '', (select id from skating_levels where name = 'Level 3'), 3),
  ('Forward slalom',                                '', (select id from skating_levels where name = 'Level 3'), 4),
  ('Forward pumping (clockwise and counterclockwise) (8)', '', (select id from skating_levels where name = 'Level 3'), 5)
on conflict do nothing;

-- Level 4 (7 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Backward two-foot glide',                           '', (select id from skating_levels where name = 'Level 4'), 1),
  ('Two-foot turn forward to backward in place',        '', (select id from skating_levels where name = 'Level 4'), 2),
  ('Lateral marching crossovers (both directions)',     '', (select id from skating_levels where name = 'Level 4'), 3),
  ('Forward outside edge on a circle (right and left)', '', (select id from skating_levels where name = 'Level 4'), 4),
  ('Forward inside edge on a circle (right and left)',  '', (select id from skating_levels where name = 'Level 4'), 5),
  ('Beginning two-foot spin',                           '', (select id from skating_levels where name = 'Level 4'), 6),
  ('Backward alternating pumps (6)',                    '', (select id from skating_levels where name = 'Level 4'), 7)
on conflict do nothing;

-- Level 5 (7 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Two-foot turn forward to backward (moving)',                '', (select id from skating_levels where name = 'Level 5'), 1),
  ('Beginning forward crossovers (5 clockwise and counterclockwise)', '', (select id from skating_levels where name = 'Level 5'), 2),
  ('Backward one-foot glide (right and left)',                  '', (select id from skating_levels where name = 'Level 5'), 3),
  ('Backward snowplow stop (moving)',                           '', (select id from skating_levels where name = 'Level 5'), 4),
  ('Side-toe hop / two-foot hop',                               '', (select id from skating_levels where name = 'Level 5'), 5),
  ('Backward stroking (width of rink)',                         '', (select id from skating_levels where name = 'Level 5'), 6),
  ('Two-foot spin',                                             '', (select id from skating_levels where name = 'Level 5'), 7)
on conflict do nothing;

-- ============================================================
-- LEVEL ADVANCEMENT RECOMMENDATIONS
-- Instructor's end-of-session judgment on what level a student
-- should move to next. History is preserved; most recent = current.
-- ============================================================
create table level_advancement_recommendations (
  id                   uuid primary key default gen_random_uuid(),
  student_id           uuid not null references students(id) on delete cascade,
  instructor_id        uuid not null references profiles(id) on delete restrict,
  class_id             uuid not null references classes(id) on delete cascade,
  recommended_level_id uuid not null references skating_levels(id) on delete restrict,
  comment              text not null default '',
  assessed_on          date not null default current_date,
  created_at           timestamptz not null default now()
);

alter table level_advancement_recommendations enable row level security;

create policy "lar: all authenticated can read" on level_advancement_recommendations
  for select using (auth.role() = 'authenticated');

create policy "lar: instructor write" on level_advancement_recommendations
  for insert with check (
    instructor_id = auth.uid()
    and (
      exists (select 1 from classes c where c.id = class_id and c.instructor_id = auth.uid())
      or exists (select 1 from class_instructors ci where ci.class_id = class_id and ci.instructor_id = auth.uid())
      or exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
    )
  );

create policy "lar: admin full write" on level_advancement_recommendations
  for all using (
    exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
  );
