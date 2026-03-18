-- Staffing Engine MVP Schema
-- Single-tenant for now, structured for future multi-tenant expansion

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE candidate_status AS ENUM ('new', 'contacted', 'interviewing', 'placed', 'rejected');
CREATE TYPE job_status AS ENUM ('open', 'closed');
CREATE TYPE placement_status AS ENUM ('pending', 'hired', 'paid');

-- ============================================
-- COMPANIES
-- ============================================

CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  location TEXT,
  contact_email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_companies_name ON companies (name);
CREATE INDEX idx_companies_industry ON companies (industry);

-- ============================================
-- CANDIDATES
-- ============================================

CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  location TEXT,
  skills TEXT[] DEFAULT '{}',
  notes TEXT,
  status candidate_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_candidates_status ON candidates (status);
CREATE INDEX idx_candidates_full_name ON candidates (full_name);
CREATE INDEX idx_candidates_skills ON candidates USING GIN (skills);

-- ============================================
-- JOBS
-- ============================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  salary_range TEXT,
  status job_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_jobs_company_id ON jobs (company_id);
CREATE INDEX idx_jobs_status ON jobs (status);

-- ============================================
-- PLACEMENTS
-- ============================================

CREATE TABLE placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  placement_fee NUMERIC(12, 2) DEFAULT 0,
  status placement_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_placements_candidate_id ON placements (candidate_id);
CREATE INDEX idx_placements_job_id ON placements (job_id);
CREATE INDEX idx_placements_company_id ON placements (company_id);
CREATE INDEX idx_placements_status ON placements (status);

-- ============================================
-- ROW LEVEL SECURITY
-- Single-tenant: full access for authenticated users
-- Structured for future multi-tenant (add org_id column + policies)
-- ============================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE placements ENABLE ROW LEVEL SECURITY;

-- Companies policies
CREATE POLICY "Authenticated users can view companies"
  ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert companies"
  ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update companies"
  ON companies FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete companies"
  ON companies FOR DELETE TO authenticated USING (true);

-- Candidates policies
CREATE POLICY "Authenticated users can view candidates"
  ON candidates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert candidates"
  ON candidates FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update candidates"
  ON candidates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete candidates"
  ON candidates FOR DELETE TO authenticated USING (true);

-- Jobs policies
CREATE POLICY "Authenticated users can view jobs"
  ON jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert jobs"
  ON jobs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update jobs"
  ON jobs FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete jobs"
  ON jobs FOR DELETE TO authenticated USING (true);

-- Placements policies
CREATE POLICY "Authenticated users can view placements"
  ON placements FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert placements"
  ON placements FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update placements"
  ON placements FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can delete placements"
  ON placements FOR DELETE TO authenticated USING (true);
