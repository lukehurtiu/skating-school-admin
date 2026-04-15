-- ============================================================
-- Phase 1 Migration — run this in the Supabase SQL Editor
-- against your EXISTING database (not a fresh one).
-- schema.sql reflects the final desired state.
-- ============================================================

-- ------------------------------------------------------------
-- 1. skating_levels (new table)
-- ------------------------------------------------------------
create table if not exists skating_levels (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  sort_order int  not null unique,
  created_at timestamptz not null default now()
);

alter table skating_levels enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'skating_levels'
      and policyname = 'skating_levels: all authenticated can read'
  ) then
    create policy "skating_levels: all authenticated can read" on skating_levels
      for select using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'skating_levels'
      and policyname = 'skating_levels: admin full write'
  ) then
    create policy "skating_levels: admin full write" on skating_levels
      for all using (
        exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      );
  end if;
end $$;

-- ------------------------------------------------------------
-- 2. skills — drop old level text column, add level_id + sort_order
-- ------------------------------------------------------------
alter table skills drop column if exists level;
alter table skills add column if not exists level_id uuid references skating_levels(id) on delete restrict;
alter table skills add column if not exists sort_order int not null default 0;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'skills_level_sort_unique'
  ) then
    alter table skills add constraint skills_level_sort_unique unique (level_id, sort_order);
  end if;
end $$;

-- level_id is not yet NOT NULL (data may exist). After seeding levels and
-- backfilling skills, run: alter table skills alter column level_id set not null;

-- ------------------------------------------------------------
-- 3. skill_assessments — drop old shape, add new columns
-- ------------------------------------------------------------
-- Drop old unique constraint (student + skill uniqueness — we now keep history)
alter table skill_assessments drop constraint if exists skill_assessments_student_id_skill_id_key;

-- Drop old boolean column
alter table skill_assessments drop column if exists passed;

-- Add new columns
alter table skill_assessments add column if not exists class_id      uuid references classes(id) on delete cascade;
alter table skill_assessments add column if not exists assessed_on   date not null default current_date;
alter table skill_assessments add column if not exists status        text not null default 'not_assessed'
  check (status in ('not_assessed', 'in_progress', 'passed'));
alter table skill_assessments add column if not exists comment       text not null default '';

-- class_id is not yet NOT NULL (existing rows). After backfilling or
-- confirming table is empty, run: alter table skill_assessments alter column class_id set not null;

-- ------------------------------------------------------------
-- 4. class_instructors (new table)
-- ------------------------------------------------------------
create table if not exists class_instructors (
  id            uuid primary key default gen_random_uuid(),
  class_id      uuid not null references classes(id) on delete cascade,
  instructor_id uuid not null references profiles(id) on delete restrict,
  assigned_at   timestamptz not null default now(),
  unique (class_id, instructor_id)
);

alter table class_instructors enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'class_instructors'
      and policyname = 'class_instructors: all authenticated can read'
  ) then
    create policy "class_instructors: all authenticated can read" on class_instructors
      for select using (auth.role() = 'authenticated');
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'class_instructors'
      and policyname = 'class_instructors: admin full write'
  ) then
    create policy "class_instructors: admin full write" on class_instructors
      for all using (
        exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin')
      );
  end if;
end $$;

-- Update skill_assessments RLS: now safe because class_instructors exists
drop policy if exists "skill_assessments: instructor write" on skill_assessments;
drop policy if exists "skill_assessments: instructor update own" on skill_assessments;

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

-- Update attendance RLS to also allow class_instructors
drop policy if exists "attendance: instructor write own class" on attendance;
drop policy if exists "attendance: instructor update own class" on attendance;

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

-- ------------------------------------------------------------
-- 5. Seed skating levels
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 6. Seed skills
-- ------------------------------------------------------------

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
  ('Forward skating (width of rink)',                         '', (select id from skating_levels where name = 'Tot 3'), 1),
  ('Backward wiggles (1/2 width of rink)',                    '', (select id from skating_levels where name = 'Tot 3'), 2),
  ('Rocking horse (1 set)',                                   '', (select id from skating_levels where name = 'Tot 3'), 3),
  ('Snowplow stop in place',                                  '', (select id from skating_levels where name = 'Tot 3'), 4),
  ('Glide Turns or U-Turns (clockwise and counterclockwise)', '', (select id from skating_levels where name = 'Tot 3'), 5),
  ('Sequence: hop / swizzles / dip',                         '', (select id from skating_levels where name = 'Tot 3'), 6)
on conflict do nothing;

-- Level 1 (11 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Proper way to fall and recover',       '', (select id from skating_levels where name = 'Level 1'), 1),
  ('March in place (10 steps)',            '', (select id from skating_levels where name = 'Level 1'), 2),
  ('March forward (width of rink)',        '', (select id from skating_levels where name = 'Level 1'), 3),
  ('Glide Turns or U-Turns',              '', (select id from skating_levels where name = 'Level 1'), 4),
  ('Forward two-foot glide',              '', (select id from skating_levels where name = 'Level 1'), 5),
  ('Dip in place',                        '', (select id from skating_levels where name = 'Level 1'), 6),
  ('Dip',                                 '', (select id from skating_levels where name = 'Level 1'), 7),
  ('Forward swizzles (6)',                '', (select id from skating_levels where name = 'Level 1'), 8),
  ('Backward wiggles (1/2 width of rink)','', (select id from skating_levels where name = 'Level 1'), 9),
  ('Rocking horse (1 set)',               '', (select id from skating_levels where name = 'Level 1'), 10),
  ('Snowplow stop in place',              '', (select id from skating_levels where name = 'Level 1'), 11)
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
  ('T-position push (right and left)',                      '', (select id from skating_levels where name = 'Level 3'), 1),
  ('Backward swizzles (8)',                                 '', (select id from skating_levels where name = 'Level 3'), 2),
  ('Forward stroking (width of rink)',                      '', (select id from skating_levels where name = 'Level 3'), 3),
  ('Forward slalom',                                        '', (select id from skating_levels where name = 'Level 3'), 4),
  ('Forward pumping (clockwise and counterclockwise) (8)', '', (select id from skating_levels where name = 'Level 3'), 5)
on conflict do nothing;

-- Level 4 (7 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Backward two-foot glide',                            '', (select id from skating_levels where name = 'Level 4'), 1),
  ('Two-foot turn forward to backward in place',         '', (select id from skating_levels where name = 'Level 4'), 2),
  ('Lateral marching crossovers (both directions)',      '', (select id from skating_levels where name = 'Level 4'), 3),
  ('Forward outside edge on a circle (right and left)',  '', (select id from skating_levels where name = 'Level 4'), 4),
  ('Forward inside edge on a circle (right and left)',   '', (select id from skating_levels where name = 'Level 4'), 5),
  ('Beginning two-foot spin',                            '', (select id from skating_levels where name = 'Level 4'), 6),
  ('Backward alternating pumps (6)',                     '', (select id from skating_levels where name = 'Level 4'), 7)
on conflict do nothing;

-- Level 5 (7 skills)
insert into skills (name, description, level_id, sort_order) values
  ('Two-foot turn forward to backward (moving)',                     '', (select id from skating_levels where name = 'Level 5'), 1),
  ('Beginning forward crossovers (5 clockwise and counterclockwise)', '', (select id from skating_levels where name = 'Level 5'), 2),
  ('Backward one-foot glide (right and left)',                       '', (select id from skating_levels where name = 'Level 5'), 3),
  ('Backward snowplow stop (moving)',                                '', (select id from skating_levels where name = 'Level 5'), 4),
  ('Side-toe hop / two-foot hop',                                    '', (select id from skating_levels where name = 'Level 5'), 5),
  ('Backward stroking (width of rink)',                              '', (select id from skating_levels where name = 'Level 5'), 6),
  ('Two-foot spin',                                                  '', (select id from skating_levels where name = 'Level 5'), 7)
on conflict do nothing;

-- ------------------------------------------------------------
-- After running this migration, enforce NOT NULL constraints
-- (once you've confirmed skill_assessments is empty or backfilled):
--
--   alter table skills alter column level_id set not null;
--   alter table skill_assessments alter column class_id set not null;
-- ------------------------------------------------------------
