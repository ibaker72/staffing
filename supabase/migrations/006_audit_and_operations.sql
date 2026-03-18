-- Audit log with before/after tracking
CREATE TABLE IF NOT EXISTS audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id),
  actor_email text,
  entity_type text NOT NULL, -- 'company', 'candidate', 'job', 'task', 'submission', 'placement'
  entity_id uuid,
  action text NOT NULL, -- 'status_change', 'create', 'update', 'delete', 'bulk_update', 'bulk_delete', 'import', 'task_complete', 'task_reopen', 'submission_transition', 'invitation_accept', 'automation_run'
  previous_value jsonb,
  new_value jsonb,
  metadata jsonb, -- extra context like bulk count, import file name, etc.
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_log_action ON audit_log(action);
CREATE INDEX idx_audit_log_created ON audit_log(created_at DESC);

-- Automation run history
CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_by uuid REFERENCES auth.users(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  dry_run boolean DEFAULT false,
  results jsonb, -- { follow_up_tasks: {found: N, created: N, items: [...]}, stale_submissions: {...}, ... }
  total_found integer DEFAULT 0,
  total_created integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_automation_runs_created ON automation_runs(created_at DESC);

-- Import logs
CREATE TABLE IF NOT EXISTS import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  file_name text,
  total_rows integer DEFAULT 0,
  imported_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  errors jsonb, -- array of {row, message}
  duplicate_count integer DEFAULT 0,
  imported_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_import_logs_created ON import_logs(created_at DESC);

-- RLS for all new tables (internal users only)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Internal users can view audit log"
  ON audit_log FOR SELECT
  USING (is_internal_user());

CREATE POLICY "Internal users can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (is_internal_user());

CREATE POLICY "Internal users can view automation runs"
  ON automation_runs FOR SELECT
  USING (is_internal_user());

CREATE POLICY "Internal users can insert automation runs"
  ON automation_runs FOR INSERT
  WITH CHECK (is_internal_user());

CREATE POLICY "Internal users can view import logs"
  ON import_logs FOR SELECT
  USING (is_internal_user());

CREATE POLICY "Internal users can insert import logs"
  ON import_logs FOR INSERT
  WITH CHECK (is_internal_user());
