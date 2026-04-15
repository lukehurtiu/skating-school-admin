-- ============================================================
-- Guardian Migration — run in Supabase SQL Editor
-- Adds guardian role and guardian_students junction table.
-- ============================================================

-- 1. Extend profiles role check to include 'guardian'
-- Drop any existing check constraint on the role column (handles auto-generated names)
DO $$
DECLARE c_name text;
BEGIN
  FOR c_name IN
    SELECT con.conname FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    WHERE rel.relname = 'profiles' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%role%'
  LOOP
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || quote_ident(c_name);
  END LOOP;
END;
$$;

ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'instructor', 'guardian'));

-- 2. Update trigger so guardian signups get the guardian role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'guardian' THEN 'guardian'
      ELSE 'instructor'
    END
  );
  RETURN NEW;
END;
$$;

-- 3. Create guardian_students junction table
CREATE TABLE IF NOT EXISTS guardian_students (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guardian_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id   uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (guardian_id, student_id)
);

ALTER TABLE guardian_students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guardian_students: guardian read own" ON guardian_students;
DROP POLICY IF EXISTS "guardian_students: admin full write" ON guardian_students;

CREATE POLICY "guardian_students: guardian read own" ON guardian_students
  FOR SELECT USING (guardian_id = auth.uid());

CREATE POLICY "guardian_students: admin full write" ON guardian_students
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
