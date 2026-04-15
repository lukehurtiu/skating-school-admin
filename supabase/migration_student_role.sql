-- ============================================================
-- Student Role Migration — run in Supabase SQL Editor
-- Renames 'guardian' role to 'student' and
-- renames guardian_students table to student_links.
-- ============================================================

-- 1. Drop old role check constraint
DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%role%'
  LOOP
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT ' || quote_ident(c);
  END LOOP;
END;
$$;

-- 2. Migrate existing guardian/student rows (now unconstrained)
UPDATE profiles SET role = 'student' WHERE role IN ('guardian', 'student');

-- 3. Add new constraint
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'instructor', 'student'));

-- 3. Update trigger to use 'student' role
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'role' = 'student' THEN 'student'
      ELSE 'instructor'
    END
  );
  RETURN NEW;
END;
$$;

-- 4. Rename table and column
ALTER TABLE guardian_students RENAME TO student_links;
ALTER TABLE student_links RENAME COLUMN guardian_id TO profile_id;

-- 5. Recreate RLS policies with new names
DROP POLICY IF EXISTS "guardian_students: guardian read own" ON student_links;
DROP POLICY IF EXISTS "guardian_students: admin full write" ON student_links;

CREATE POLICY "student_links: student read own" ON student_links
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "student_links: admin full write" ON student_links
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'admin')
  );
