-- Phase 5: Authentication, Roles, and Security Hardening
-- Adds user profiles, role-based access, client user linkage, and proper RLS

-- ============================================
-- ROLE ENUM
-- ============================================

CREATE TYPE user_role AS ENUM ('admin', 'recruiter', 'client');

-- ============================================
-- USER PROFILES
-- Links to auth.users, stores app-level role and metadata
-- ============================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role user_role NOT NULL DEFAULT 'recruiter',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);

-- ============================================
-- CLIENT USERS
-- Links client-role users to their company
-- ============================================

CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES user_profiles(id),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

CREATE INDEX idx_client_users_user ON client_users(user_id);
CREATE INDEX idx_client_users_company ON client_users(company_id);

-- ============================================
-- CLIENT INVITATIONS
-- Pending invitations for client users
-- ============================================

CREATE TABLE client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES user_profiles(id),
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_client_invitations_token ON client_invitations(token) WHERE accepted_at IS NULL;
CREATE INDEX idx_client_invitations_email ON client_invitations(email);

-- ============================================
-- MIGRATE assigned_to FROM TEXT TO USER REFERENCE
-- Add owner_id (UUID FK) alongside existing text assigned_to
-- ============================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES user_profiles(id);
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES user_profiles(id);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES user_profiles(id);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES user_profiles(id);
ALTER TABLE activity_events ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES user_profiles(id);

CREATE INDEX idx_companies_owner ON companies(owner_id);
CREATE INDEX idx_candidates_owner ON candidates(owner_id);
CREATE INDEX idx_jobs_owner ON jobs(owner_id);
CREATE INDEX idx_tasks_owner ON tasks(owner_id);

-- ============================================
-- HELPER FUNCTION: get current user's role
-- ============================================

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;

-- Helper: check if current user is internal (admin or recruiter)
CREATE OR REPLACE FUNCTION public.is_internal_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'recruiter')
    AND is_active = true
  );
$$;

-- Helper: check if current user is a client for a given company
CREATE OR REPLACE FUNCTION public.is_client_for_company(target_company_id UUID)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.client_users cu
    JOIN public.user_profiles up ON up.id = cu.user_id
    WHERE cu.user_id = auth.uid()
    AND cu.company_id = target_company_id
    AND up.role = 'client'
    AND up.is_active = true
  );
$$;

-- ============================================
-- AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'recruiter'
    )
  );
  RETURN NEW;
END;
$$;

-- Drop if exists (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DROP OLD PERMISSIVE POLICIES
-- ============================================

-- Companies
DROP POLICY IF EXISTS "Authenticated users can view companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can insert companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can update companies" ON companies;
DROP POLICY IF EXISTS "Authenticated users can delete companies" ON companies;

-- Candidates
DROP POLICY IF EXISTS "Authenticated users can view candidates" ON candidates;
DROP POLICY IF EXISTS "Authenticated users can insert candidates" ON candidates;
DROP POLICY IF EXISTS "Authenticated users can update candidates" ON candidates;
DROP POLICY IF EXISTS "Authenticated users can delete candidates" ON candidates;

-- Jobs
DROP POLICY IF EXISTS "Authenticated users can view jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can insert jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can update jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can delete jobs" ON jobs;

-- Placements
DROP POLICY IF EXISTS "Authenticated users can view placements" ON placements;
DROP POLICY IF EXISTS "Authenticated users can insert placements" ON placements;
DROP POLICY IF EXISTS "Authenticated users can update placements" ON placements;
DROP POLICY IF EXISTS "Authenticated users can delete placements" ON placements;

-- Activity events
DROP POLICY IF EXISTS "Allow all on activity_events" ON activity_events;
DROP POLICY IF EXISTS "Authenticated users can view activity" ON activity_events;
DROP POLICY IF EXISTS "Authenticated users can insert activity" ON activity_events;

-- Submissions
DROP POLICY IF EXISTS "Allow all on candidate_submissions" ON candidate_submissions;

-- Tasks
DROP POLICY IF EXISTS "Allow all on tasks" ON tasks;

-- Portal tokens
DROP POLICY IF EXISTS "Allow all on client_portal_tokens" ON client_portal_tokens;

-- ============================================
-- NEW RLS POLICIES
-- ============================================

-- === user_profiles ===
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Internal users can view all profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (public.is_internal_user());

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON user_profiles FOR ALL TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

-- === client_users ===
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal users can manage client_users"
  ON client_users FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

CREATE POLICY "Clients can view own linkage"
  ON client_users FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- === client_invitations ===
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal users can manage invitations"
  ON client_invitations FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- Allow anon to read invitations by token (for accept flow)
CREATE POLICY "Anyone can read invitation by token"
  ON client_invitations FOR SELECT TO anon
  USING (true);

-- === companies ===
-- Internal users: full access
CREATE POLICY "Internal users full access to companies"
  ON companies FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- Client users: read-only on their company
CREATE POLICY "Clients can view own company"
  ON companies FOR SELECT TO authenticated
  USING (public.is_client_for_company(id));

-- === candidates ===
-- Internal users: full access
CREATE POLICY "Internal users full access to candidates"
  ON candidates FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- Clients cannot see candidates directly (only via submissions)

-- === jobs ===
-- Internal users: full access
CREATE POLICY "Internal users full access to jobs"
  ON jobs FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- Client users: read-only on their company's jobs
CREATE POLICY "Clients can view own company jobs"
  ON jobs FOR SELECT TO authenticated
  USING (public.is_client_for_company(company_id));

-- === placements ===
-- Internal users: full access
CREATE POLICY "Internal users full access to placements"
  ON placements FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- Clients can view their company's placements
CREATE POLICY "Clients can view own company placements"
  ON placements FOR SELECT TO authenticated
  USING (public.is_client_for_company(company_id));

-- === candidate_submissions ===
-- Internal users: full access
CREATE POLICY "Internal users full access to submissions"
  ON candidate_submissions FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- Client users: can view and update (feedback) submissions for their company's jobs
CREATE POLICY "Clients can view own company submissions"
  ON candidate_submissions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = candidate_submissions.job_id
      AND public.is_client_for_company(j.company_id)
    )
  );

CREATE POLICY "Clients can update own company submissions"
  ON candidate_submissions FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = candidate_submissions.job_id
      AND public.is_client_for_company(j.company_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM jobs j
      WHERE j.id = candidate_submissions.job_id
      AND public.is_client_for_company(j.company_id)
    )
  );

-- === tasks ===
-- Internal users: full access
CREATE POLICY "Internal users full access to tasks"
  ON tasks FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- === activity_events ===
-- Internal users: full access
CREATE POLICY "Internal users full access to activity"
  ON activity_events FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- === client_portal_tokens ===
-- Internal users: manage tokens
CREATE POLICY "Internal users can manage portal tokens"
  ON client_portal_tokens FOR ALL TO authenticated
  USING (public.is_internal_user())
  WITH CHECK (public.is_internal_user());

-- Anon can read active tokens (for legacy token portal)
CREATE POLICY "Anon can validate portal tokens"
  ON client_portal_tokens FOR SELECT TO anon
  USING (is_active = true AND expires_at > now());
