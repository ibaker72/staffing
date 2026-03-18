-- Phase 4: Client-facing staffing workflow
-- Candidate submissions, internal tasks, client portal tokens, and workflow fields

-- Submission status enum
CREATE TYPE submission_status AS ENUM (
  'internal_review',
  'submitted',
  'client_review',
  'interview',
  'offer',
  'hired',
  'rejected'
);

-- Task priority enum
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Candidate submissions: track candidate-to-job submission workflow
CREATE TABLE candidate_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  status submission_status NOT NULL DEFAULT 'internal_review',
  submitted_at TIMESTAMPTZ,
  client_reviewed_at TIMESTAMPTZ,
  interview_at TIMESTAMPTZ,
  offered_at TIMESTAMPTZ,
  decided_at TIMESTAMPTZ,
  internal_notes TEXT,
  client_feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, job_id)
);

CREATE INDEX idx_submissions_job ON candidate_submissions(job_id);
CREATE INDEX idx_submissions_candidate ON candidate_submissions(candidate_id);
CREATE INDEX idx_submissions_status ON candidate_submissions(status);

-- Internal tasks / reminders
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  priority task_priority NOT NULL DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  entity_type TEXT,
  entity_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tasks_due ON tasks(due_date) WHERE completed_at IS NULL;
CREATE INDEX idx_tasks_entity ON tasks(entity_type, entity_id);

-- Client portal tokens: company-scoped access tokens
CREATE TABLE client_portal_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '30 days'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_portal_token ON client_portal_tokens(token) WHERE is_active = true;

-- Add workflow fields to existing tables
ALTER TABLE companies ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE candidates ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE candidates ADD COLUMN IF NOT EXISTS due_date DATE;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS assigned_to TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS next_action TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS due_date DATE;

-- RLS policies (permissive, single-tenant)
ALTER TABLE candidate_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on candidate_submissions" ON candidate_submissions FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on tasks" ON tasks FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE client_portal_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on client_portal_tokens" ON client_portal_tokens FOR ALL USING (true) WITH CHECK (true);
