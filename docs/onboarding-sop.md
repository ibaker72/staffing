# Bedrock Staffing — Onboarding & Standard Operating Procedures

---

## 1. First-Day Setup Checklist

### For the Account Owner / Admin

- [ ] **Create your account** at /signup with your work email
- [ ] **Complete your profile** — go to Settings → Profile and add your full name
- [ ] **Seed demo data** (optional) — go to Admin → Seed Data → Insert Demo Data to explore with sample records
- [ ] **Add your first company** — go to Companies → New Company and add a real client
- [ ] **Add your first candidate** — go to Candidates → New Candidate with a real candidate
- [ ] **Create your first job** — go to Jobs → New Job, link it to your company
- [ ] **Invite your team** — go to Admin → User Management → Invite User
  - Assign roles: `admin` for ops leads, `recruiter` for team members, `client` for external contacts
- [ ] **Invite a client** — invite a client-role user so they can access the Client Portal
- [ ] **Review Settings** — check notification preferences and system status

### For New Recruiters (Invited Users)

- [ ] Accept your email invitation and set your password
- [ ] Go to Settings → Profile and update your name
- [ ] Review the Dashboard — check your assigned tasks, follow-ups, and pipeline metrics
- [ ] Browse existing Companies, Candidates, and Jobs to get oriented
- [ ] Create your first Task to practice the workflow

### For New Client Users

- [ ] Accept your email invitation and set your password
- [ ] Access the Client Portal at /portal
- [ ] Review any submitted candidates
- [ ] Leave feedback on a candidate submission (approve, reject, or comment)

---

## 2. Operator Workflow (Admin / Ops Lead)

### Daily
1. **Check Dashboard** — review overdue tasks, stale jobs, and follow-ups due today
2. **Review data hygiene warnings** — fix candidates missing skills, companies missing contacts
3. **Check automation results** — review Admin → Automations for any auto-created tasks

### Weekly
1. **Review Reports** — check time-to-fill, submission funnel, and revenue metrics
2. **Run automations** — go to Admin → Automations → Run All to flag stale items
3. **Audit new users** — check Admin → User Management for any pending invites
4. **Export data** — use the Export button on any list page to pull reports for stakeholders

### Monthly
1. **Review placement revenue** — use Reports page for revenue-by-company breakdown
2. **Clean up closed jobs** — archive or mark filled jobs as complete
3. **Review audit log** — Admin → Audit Log for security review
4. **Update saved views** — create or refine saved views for common queries

### As Needed
- **Import data** — use Import page to bulk-load candidates, companies, or jobs via CSV
- **Reset demo environment** — Admin → Seed Data → Reset All Data (sandbox only)
- **Manage user roles** — promote, demote, or deactivate users in Admin → User Management

---

## 3. Recruiter Workflow

### The core loop: Source → Screen → Submit → Place

#### Step 1: Source Candidates
- Add new candidates via Candidates → New Candidate
- Or bulk-import via the Import page (CSV)
- Set status to `new` for fresh candidates

#### Step 2: Screen & Qualify
- Update candidate status: `new` → `contacted` → `interviewing`
- Add skills, experience, salary expectations, and notes
- Log activity (calls, emails, interviews) — activity timeline tracks everything

#### Step 3: Submit to Jobs
- Go to a Job detail page → Submit Candidate
- Select a qualified candidate and add submission notes
- The submission appears in the client's portal automatically
- Track submission status: `submitted` → `client_review` → `interview` → `offered` → `placed`

#### Step 4: Track Placement
- When a candidate is placed, create a Placement record
- Enter fee, start date, and salary
- Placement revenue flows into Reports automatically

#### Step 5: Follow Up
- Set follow-up dates on companies and candidates
- Use Tasks for ad-hoc reminders (e.g., "Call client re: feedback")
- Dashboard surfaces overdue tasks and upcoming follow-ups

### Tips for Recruiters
- Use **Saved Views** to create filtered lists (e.g., "My Active Candidates", "High-Priority Jobs")
- Use the **Export** button to pull candidate lists for client presentations
- Check the **Dashboard** daily — it shows your personal pipeline at a glance

---

## 4. Client Invitation Workflow

### How to Invite a Client

1. Go to **Admin → User Management**
2. Click **Invite User**
3. Enter the client's email address
4. Select role: **client**
5. Optionally specify their associated company
6. Click **Send Invitation**

### What the Client Experiences

1. Client receives a branded email invitation from Bedrock Staffing
2. They click the link and create their password at /invite/accept
3. They are redirected to the **Client Portal** (/portal)
4. In the portal, they see:
   - Candidate submissions for their jobs
   - Status of each submission
   - Ability to leave feedback (approve, reject, shortlist)
5. Clients **cannot** access the internal app — they only see their portal

### Managing Client Access
- Deactivate a client: Admin → User Management → toggle Active status
- Client role users are automatically routed to /portal on login
- Clients only see submissions linked to their company (enforced by RLS)

---

## 5. Admin Workflow

### User Management
- **Invite users**: Admin → User Management → Invite User
- **Change roles**: Update a user's role (admin, recruiter, client) from the user list
- **Deactivate users**: Toggle active status to revoke access without deleting data
- **View all users**: See full user list with roles, status, and join dates

### System Administration
- **System diagnostics**: Admin → Diagnostics shows database health, table counts, and environment status
- **Audit log**: Admin → Audit Log shows all significant system actions with timestamps and user attribution
- **Automation**: Admin → Automations → Run All executes automated task creation for stale items
- **Import history**: Admin → Import History shows all CSV imports with row counts and errors

### Data Management
- **Seed demo data**: Insert sample companies, candidates, jobs, and tasks for training/demos
- **Reset all data**: Delete all operational data while preserving user accounts and audit logs
- **Re-seed after reset**: After resetting, insert fresh demo data for a clean demo environment

### Security Practices
- Review the audit log weekly for unusual activity
- Deactivate users who leave the organization promptly
- Use the client role (not recruiter) for external contacts
- Never share admin credentials — create individual admin accounts instead
