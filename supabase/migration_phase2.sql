-- ============================================================
-- Phase 2 Migration — run in Supabase SQL Editor
-- Replaces classes.level and students.level text columns with
-- proper FK references to skating_levels.
-- ============================================================

-- 1. Add nullable FK columns alongside old text columns
ALTER TABLE classes  ADD COLUMN IF NOT EXISTS skating_level_id uuid REFERENCES skating_levels(id) ON DELETE RESTRICT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS skating_level_id uuid REFERENCES skating_levels(id) ON DELETE RESTRICT;

-- 2. Backfill from old enum values
UPDATE classes SET skating_level_id = (SELECT id FROM skating_levels WHERE name = 'Level 1') WHERE level = 'beginner'     AND skating_level_id IS NULL;
UPDATE classes SET skating_level_id = (SELECT id FROM skating_levels WHERE name = 'Level 3') WHERE level = 'intermediate' AND skating_level_id IS NULL;
UPDATE classes SET skating_level_id = (SELECT id FROM skating_levels WHERE name = 'Level 5') WHERE level = 'advanced'     AND skating_level_id IS NULL;

UPDATE students SET skating_level_id = (SELECT id FROM skating_levels WHERE name = 'Level 1') WHERE level = 'beginner'     AND skating_level_id IS NULL;
UPDATE students SET skating_level_id = (SELECT id FROM skating_levels WHERE name = 'Level 3') WHERE level = 'intermediate' AND skating_level_id IS NULL;
UPDATE students SET skating_level_id = (SELECT id FROM skating_levels WHERE name = 'Level 5') WHERE level = 'advanced'     AND skating_level_id IS NULL;

-- 3. Enforce NOT NULL
ALTER TABLE classes  ALTER COLUMN skating_level_id SET NOT NULL;
ALTER TABLE students ALTER COLUMN skating_level_id SET NOT NULL;

-- 4. Drop old columns (removes CHECK constraints automatically)
ALTER TABLE classes  DROP COLUMN IF EXISTS level;
ALTER TABLE students DROP COLUMN IF EXISTS level;
