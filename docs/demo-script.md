# Bedrock Staffing — Demo Script & Assets Guide

---

## Demo Overview

**Duration**: 12–15 minutes
**Audience**: Staffing firm owner, ops lead, or recruiting manager
**Goal**: Show that Bedrock replaces their spreadsheets + email with one clean system — and can be live in under 10 minutes.

---

## Pre-Demo Setup

1. **Reset the environment**: Admin → Seed Data → Reset All Data
2. **Seed fresh demo data**: Admin → Seed Data → Insert Demo Data
3. **Ensure you have two browser profiles ready**:
   - Browser 1: Logged in as admin/recruiter (internal view)
   - Browser 2: Ready to show client portal (or use incognito)
4. **Close unrelated tabs** — keep the demo focused

---

## Recommended Demo Storyline

### The Scenario
> "You're a growing staffing firm called Bedrock Staffing. You have 3 active clients, 6 candidates in your pipeline, and 4 open jobs. Let's walk through a typical day."

---

## Act 1: The Dashboard (2 min)

**What to show**: Dashboard with personalized greeting, metrics, pipeline overview

**Talk track**:
> "When your team logs in, they see exactly what needs attention. Open jobs, active candidates, tasks due today, and upcoming follow-ups. No digging through spreadsheets."

**Key points to highlight**:
- Personalized greeting ("Good morning, Sarah")
- Metric cards: open jobs, active candidates, company count, revenue
- Overdue tasks section
- Onboarding checklist (show how it guides new users)

---

## Act 2: The Recruiting Workflow (4 min)

### 2a: Companies
**Navigate to**: Companies list

> "Here are your clients. You can see status, contacts, and follow-up dates at a glance."

- Click into **TechVentures Inc** — show the detail page with contact info, jobs, and activity
- Point out the follow-up date and status

### 2b: Candidates
**Navigate to**: Candidates list

> "Your candidate pipeline. Every candidate has skills, experience, salary expectations, and a full activity history."

- Click into **Emily Rodriguez** — show skills, experience, status
- Point out the activity timeline
- Show status filter: "I can filter by status to see just my new candidates or who's in interviews"

### 2c: Jobs
**Navigate to**: Jobs list

> "Open positions linked to your clients. Priority levels, pay ranges, employment type — all in one place."

- Click into **Senior React Developer** at TechVentures
- Show the job details, linked company, and submission list

### 2d: Submit a Candidate
**On the job detail page**: Submit Candidate

> "Now here's where it gets powerful. I submit Emily to this React role with one click."

- Click Submit Candidate
- Select Emily Rodriguez
- Add note: "Strong React/TypeScript background, 7 years experience, salary aligned"
- Submit

> "That submission is now visible to the client in their portal. No email needed."

---

## Act 3: The Client Portal (3 min)

**Switch to Browser 2**: Log in as a client user (or show the /portal route)

> "This is what your client sees. A clean, branded portal with just their submissions."

**Key points to highlight**:
- Branded header with Bedrock logo
- List of submitted candidates with status badges
- Click into a submission — show candidate details and feedback options

> "The client can approve, reject, or shortlist — and that feedback flows back to your recruiter in real time. No more 'did you get my email?' conversations."

**Switch back to Browser 1**: Show the updated submission status on the recruiter side.

---

## Act 4: Tasks & Automation (2 min)

**Navigate to**: Tasks page

> "Your team's task list. Priorities, due dates, and overdue tracking built in."

- Show overdue task highlighted in the list
- Show how to create a quick task

**Navigate to**: Admin → Automations

> "And for the things your team forgets — automation catches it. Stale jobs get flagged, overdue follow-ups create tasks automatically, data hygiene issues surface before they become problems."

- Click Run All Automations
- Show the results

---

## Act 5: Reporting & Admin (2 min)

**Navigate to**: Reports page

> "Revenue by client, time-to-fill, submission funnel — all the metrics your ops lead needs."

- Show the submission funnel (submitted → interview → placed)
- Show revenue by company chart

**Navigate to**: Admin page

> "Full admin panel: user management, system diagnostics, audit log, import history. You know exactly who did what, when."

- Show the audit log
- Show user management with role badges

---

## Act 6: Import & Close (2 min)

**Navigate to**: Import page

> "Already have data? Drop in a CSV and your candidates, companies, or jobs are imported in seconds."

- Show the CSV upload interface
- Show format requirements

**Close**:
> "That's Bedrock. One system for your entire staffing operation — candidates, jobs, clients, placements, tasks, and reporting. Set up in minutes. No consultants. No enterprise pricing. Just reliable recruiting software built for teams like yours."

> "We're accepting early access signups now. Want me to get you set up?"

---

## Key Sections to Screenshot for Sales Materials

1. **Dashboard** — with metrics populated and greeting visible
2. **Candidate detail page** — showing skills, activity timeline, status
3. **Job detail page** — with submissions list
4. **Client portal** — showing branded portal with candidate submissions
5. **Reports page** — showing submission funnel and revenue metrics
6. **Admin page** — showing user management and system diagnostics
7. **Login page** — showing branded auth page with logo
8. **Marketing page** — hero section for website/social assets

---

## Sample Data Storyline

The seeded demo data tells this story:

### Companies (5)
| Company | Industry | Status | Role |
|---------|----------|--------|------|
| TechVentures Inc | Technology | Active | Primary client, 2 open roles |
| Meridian Healthcare | Healthcare | Active | Growing relationship |
| Atlas Financial Group | Finance | Lead | New prospect |
| GreenField Energy | Energy | Lead | Early conversations |
| Pinnacle Consulting | Consulting | Active | Established client |

### Candidates (6)
| Candidate | Skills | Status | Storyline |
|-----------|--------|--------|-----------|
| Emily Rodriguez | React, TypeScript, Node.js | New | Perfect fit for TechVentures React role |
| David Kim | Product Management, Agile | Contacted | Exploring PM roles across clients |
| Jessica Patel | Python, ML, SQL | New | Strong data candidate for Meridian |
| Marcus Johnson | Finance, Bloomberg, Python | Interviewing | In process with Atlas Financial |
| Sophia Lee | UX, Figma, Design Systems | New | Ideal for TechVentures contract role |
| Andrew Martinez | AWS, Kubernetes, DevOps | Contacted | Infrastructure specialist, multiple fits |

### Jobs (4)
| Job | Company | Type | Priority |
|-----|---------|------|----------|
| Senior React Developer | TechVentures | Full-time | High |
| Data Analyst | Meridian Healthcare | Full-time | Medium |
| Financial Controller | Atlas Financial | Full-time | High |
| Contract UX Designer | TechVentures | Contract | Medium |

### Demo Narrative
> TechVentures is your biggest client with two open roles. Emily is a perfect fit for the React position — submit her during the demo. Sophia fits the UX contract. Marcus is already interviewing at Atlas. This creates a realistic, multi-stage pipeline to walk through.

---

## Objection Handling

| Objection | Response |
|-----------|----------|
| "We already use Bullhorn" | "Bullhorn is powerful but complex and expensive. Many of our users switched because they wanted something simpler that their whole team actually uses." |
| "We're fine with spreadsheets" | "Spreadsheets work until they don't — when a candidate falls through the cracks, when a client asks for a status update you can't find, when you can't report on revenue. Bedrock prevents those moments." |
| "What about integrations?" | "We support CSV import/export today and are building API integrations. Enterprise plans include custom integrations based on your needs." |
| "Is my data safe?" | "Yes — row-level security, role-based access control, full audit trail, and encryption in transit and at rest. We take data security seriously." |
| "What if we outgrow it?" | "That's exactly what our Professional and Enterprise tiers are for. Bedrock scales with you — from solo recruiter to 50-person firm." |
