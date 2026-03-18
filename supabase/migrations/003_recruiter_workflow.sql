-- ============================================
-- PHASE 3: RECRUITER WORKFLOW INTELLIGENCE
-- Activity timeline, outreach fields, matching support
-- ============================================

-- ============================================
-- OUTREACH STATUS ENUM
-- ============================================
CREATE TYPE outreach_status AS ENUM ('none', 'initial_contact', 'follow_up', 'in_conversation', 'nurturing', 'closed');

-- ============================================
-- COMPANIES: add outreach fields
-- ============================================
ALTER TABLE companies ADD COLUMN outreach_status outreach_status NOT NULL DEFAULT 'none';
ALTER TABLE companies ADD COLUMN follow_up_date DATE;
ALTER TABLE companies ADD COLUMN last_contacted_at TIMESTAMPTZ;

-- ============================================
-- CANDIDATES: add outreach_status, follow_up_date
-- ============================================
ALTER TABLE candidates ADD COLUMN outreach_status outreach_status NOT NULL DEFAULT 'none';
ALTER TABLE candidates ADD COLUMN follow_up_date DATE;

-- ============================================
-- ACTIVITY EVENTS TABLE
-- Append-only timeline of all recruiter actions
-- ============================================
CREATE TABLE activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,           -- 'company', 'candidate', 'job', 'placement'
  entity_id UUID NOT NULL,
  event_type TEXT NOT NULL,            -- 'status_change', 'created', 'resume_upload', 'note_added', 'outreach_update'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_events_entity ON activity_events (entity_type, entity_id);
CREATE INDEX idx_activity_events_created_at ON activity_events (created_at DESC);
CREATE INDEX idx_activity_events_event_type ON activity_events (event_type);

-- RLS for activity_events
ALTER TABLE activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view activity_events"
  ON activity_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert activity_events"
  ON activity_events FOR INSERT TO authenticated WITH CHECK (true);
