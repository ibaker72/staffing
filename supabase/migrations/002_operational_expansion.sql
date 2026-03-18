-- ============================================
-- OPERATIONAL EXPANSION MIGRATION
-- Adds business fields, new enums, storage bucket
-- ============================================

-- New enums
CREATE TYPE company_status AS ENUM ('lead', 'active', 'inactive');
CREATE TYPE job_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE employment_type AS ENUM ('full_time', 'part_time', 'contract', 'temp_to_hire');
CREATE TYPE pay_type AS ENUM ('hourly', 'salary', 'per_diem');

-- ============================================
-- COMPANIES: add contact_name, contact_phone, notes, status
-- ============================================
ALTER TABLE companies ADD COLUMN contact_name TEXT;
ALTER TABLE companies ADD COLUMN contact_phone TEXT;
ALTER TABLE companies ADD COLUMN notes TEXT;
ALTER TABLE companies ADD COLUMN status company_status NOT NULL DEFAULT 'lead';

CREATE INDEX idx_companies_status ON companies (status);

-- ============================================
-- CANDIDATES: add source, years_experience, desired_salary, resume_url, last_contacted_at
-- ============================================
ALTER TABLE candidates ADD COLUMN source TEXT;
ALTER TABLE candidates ADD COLUMN years_experience INTEGER;
ALTER TABLE candidates ADD COLUMN desired_salary NUMERIC(12, 2);
ALTER TABLE candidates ADD COLUMN resume_url TEXT;
ALTER TABLE candidates ADD COLUMN last_contacted_at TIMESTAMPTZ;

CREATE INDEX idx_candidates_source ON candidates (source);

-- ============================================
-- JOBS: add priority, urgency_notes, employment_type, pay_type
-- ============================================
ALTER TABLE jobs ADD COLUMN priority job_priority NOT NULL DEFAULT 'medium';
ALTER TABLE jobs ADD COLUMN urgency_notes TEXT;
ALTER TABLE jobs ADD COLUMN employment_type employment_type NOT NULL DEFAULT 'full_time';
ALTER TABLE jobs ADD COLUMN pay_type pay_type NOT NULL DEFAULT 'salary';

CREATE INDEX idx_jobs_priority ON jobs (priority);

-- ============================================
-- PLACEMENTS: add hired_at, paid_at, start_date, notes
-- ============================================
ALTER TABLE placements ADD COLUMN hired_at TIMESTAMPTZ;
ALTER TABLE placements ADD COLUMN paid_at TIMESTAMPTZ;
ALTER TABLE placements ADD COLUMN start_date DATE;
ALTER TABLE placements ADD COLUMN notes TEXT;

-- ============================================
-- SUPABASE STORAGE: resumes bucket
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: authenticated users can upload/read/delete resumes
CREATE POLICY "Authenticated users can upload resumes"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can read resumes"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can delete resumes"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'resumes');

CREATE POLICY "Authenticated users can update resumes"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'resumes')
  WITH CHECK (bucket_id = 'resumes');
