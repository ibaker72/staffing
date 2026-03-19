-- Allow authenticated users to self-heal missing user_profiles rows.
-- Restrict role creation to non-privileged roles only.

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (
    id = auth.uid()
    AND role IN ('recruiter', 'client')
  );
