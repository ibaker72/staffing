"use server";

import { createClient } from "@/lib/supabase/server";

export interface FieldCheck {
  field: string;
  label: string;
  present: boolean;
  severity: "critical" | "warning" | "info";
}

export interface HealthScore {
  score: number; // 0-100
  grade: "A" | "B" | "C" | "D" | "F";
  checks: FieldCheck[];
  missingCritical: number;
  missingWarning: number;
}

function computeScore(checks: FieldCheck[]): HealthScore {
  const critical = checks.filter((c) => c.severity === "critical");
  const warnings = checks.filter((c) => c.severity === "warning");
  const info = checks.filter((c) => c.severity === "info");

  const criticalPresent = critical.filter((c) => c.present).length;
  const warningPresent = warnings.filter((c) => c.present).length;
  const infoPresent = info.filter((c) => c.present).length;

  // Critical fields worth 60% of score, warnings 30%, info 10%
  const criticalScore =
    critical.length > 0 ? (criticalPresent / critical.length) * 60 : 60;
  const warningScore =
    warnings.length > 0 ? (warningPresent / warnings.length) * 30 : 30;
  const infoScore =
    info.length > 0 ? (infoPresent / info.length) * 10 : 10;

  const score = Math.round(criticalScore + warningScore + infoScore);

  let grade: "A" | "B" | "C" | "D" | "F";
  if (score >= 90) grade = "A";
  else if (score >= 75) grade = "B";
  else if (score >= 60) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  return {
    score,
    grade,
    checks,
    missingCritical: critical.length - criticalPresent,
    missingWarning: warnings.length - warningPresent,
  };
}

function hasValue(val: unknown): boolean {
  if (val === null || val === undefined) return false;
  if (typeof val === "string") return val.trim().length > 0;
  if (Array.isArray(val)) return val.length > 0;
  if (typeof val === "number") return true;
  return Boolean(val);
}

export async function getCompanyHealth(
  companyId: string
): Promise<HealthScore> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("id", companyId)
    .single();
  if (!data) return computeScore([]);

  const c = data as Record<string, unknown>;
  const checks: FieldCheck[] = [
    {
      field: "name",
      label: "Company name",
      present: hasValue(c.name),
      severity: "critical",
    },
    {
      field: "contact_email",
      label: "Contact email",
      present: hasValue(c.contact_email),
      severity: "critical",
    },
    {
      field: "contact_name",
      label: "Contact name",
      present: hasValue(c.contact_name),
      severity: "critical",
    },
    {
      field: "contact_phone",
      label: "Contact phone",
      present: hasValue(c.contact_phone),
      severity: "warning",
    },
    {
      field: "industry",
      label: "Industry",
      present: hasValue(c.industry),
      severity: "warning",
    },
    {
      field: "location",
      label: "Location",
      present: hasValue(c.location),
      severity: "warning",
    },
    {
      field: "website",
      label: "Website",
      present: hasValue(c.website),
      severity: "info",
    },
    {
      field: "owner_id",
      label: "Owner assigned",
      present: hasValue(c.owner_id),
      severity: "warning",
    },
    {
      field: "outreach_status",
      label: "Outreach status set",
      present: hasValue(c.outreach_status) && c.outreach_status !== "none",
      severity: "info",
    },
    {
      field: "notes",
      label: "Notes added",
      present: hasValue(c.notes),
      severity: "info",
    },
  ];

  return computeScore(checks);
}

export async function getCandidateHealth(
  candidateId: string
): Promise<HealthScore> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("candidates")
    .select("*")
    .eq("id", candidateId)
    .single();
  if (!data) return computeScore([]);

  const c = data as Record<string, unknown>;
  const checks: FieldCheck[] = [
    {
      field: "full_name",
      label: "Full name",
      present: hasValue(c.full_name),
      severity: "critical",
    },
    {
      field: "email",
      label: "Email",
      present: hasValue(c.email),
      severity: "critical",
    },
    {
      field: "phone",
      label: "Phone",
      present: hasValue(c.phone),
      severity: "warning",
    },
    {
      field: "title",
      label: "Job title",
      present: hasValue(c.title),
      severity: "warning",
    },
    {
      field: "location",
      label: "Location",
      present: hasValue(c.location),
      severity: "warning",
    },
    {
      field: "skills",
      label: "Skills listed",
      present: hasValue(c.skills),
      severity: "warning",
    },
    {
      field: "years_experience",
      label: "Years experience",
      present: hasValue(c.years_experience),
      severity: "info",
    },
    {
      field: "desired_salary",
      label: "Desired salary",
      present: hasValue(c.desired_salary),
      severity: "info",
    },
    {
      field: "resume_url",
      label: "Resume uploaded",
      present: hasValue(c.resume_url),
      severity: "warning",
    },
    {
      field: "owner_id",
      label: "Owner assigned",
      present: hasValue(c.owner_id),
      severity: "warning",
    },
  ];

  return computeScore(checks);
}

export async function getJobHealth(jobId: string): Promise<HealthScore> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .single();
  if (!data) return computeScore([]);

  const j = data as Record<string, unknown>;
  const hasSalary = hasValue(j.salary_min) || hasValue(j.salary_max);

  const checks: FieldCheck[] = [
    {
      field: "title",
      label: "Job title",
      present: hasValue(j.title),
      severity: "critical",
    },
    {
      field: "company_id",
      label: "Company linked",
      present: hasValue(j.company_id),
      severity: "critical",
    },
    {
      field: "description",
      label: "Description",
      present: hasValue(j.description),
      severity: "critical",
    },
    {
      field: "location",
      label: "Location",
      present: hasValue(j.location),
      severity: "warning",
    },
    {
      field: "salary",
      label: "Salary range",
      present: hasSalary,
      severity: "warning",
    },
    {
      field: "employment_type",
      label: "Employment type",
      present: hasValue(j.employment_type),
      severity: "warning",
    },
    {
      field: "pay_type",
      label: "Pay type",
      present: hasValue(j.pay_type),
      severity: "info",
    },
    {
      field: "priority",
      label: "Priority set",
      present: hasValue(j.priority),
      severity: "info",
    },
    {
      field: "owner_id",
      label: "Owner assigned",
      present: hasValue(j.owner_id),
      severity: "warning",
    },
    {
      field: "next_action",
      label: "Next action noted",
      present: hasValue(j.next_action),
      severity: "info",
    },
  ];

  return computeScore(checks);
}

// Bulk health summary for dashboard/admin
export async function getOverallDataQuality(): Promise<{
  companies: { total: number; avgScore: number; criticalMissing: number };
  candidates: { total: number; avgScore: number; criticalMissing: number };
  jobs: { total: number; avgScore: number; criticalMissing: number };
}> {
  const supabase = await createClient();

  // Companies - check critical fields
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, contact_email, contact_name");
  const companyList = companies ?? [];
  const companyCriticalMissing = companyList.filter(
    (c) => !c.contact_email || !c.contact_name
  ).length;
  // Estimate average: companies with all 3 critical fields get ~85+, missing 1 gets ~65, missing 2 gets ~40
  const companyScores = companyList.map((c) => {
    let s = 100;
    if (!c.contact_email) s -= 20;
    if (!c.contact_name) s -= 20;
    return Math.max(s - 15, 30); // approximate, accounting for missing non-critical
  });
  const companyAvg =
    companyScores.length > 0
      ? Math.round(
          companyScores.reduce((a, b) => a + b, 0) / companyScores.length
        )
      : 0;

  // Candidates - check critical fields
  const { data: candidates } = await supabase
    .from("candidates")
    .select("id, full_name, email");
  const candidateList = candidates ?? [];
  const candidateCriticalMissing = candidateList.filter(
    (c) => !c.email
  ).length;
  const candidateScores = candidateList.map((c) => {
    let s = 100;
    if (!c.email) s -= 20;
    if (!c.full_name) s -= 20;
    return Math.max(s - 15, 30);
  });
  const candidateAvg =
    candidateScores.length > 0
      ? Math.round(
          candidateScores.reduce((a, b) => a + b, 0) / candidateScores.length
        )
      : 0;

  // Jobs - check critical fields
  const { data: jobs } = await supabase
    .from("jobs")
    .select("id, title, company_id, description");
  const jobList = jobs ?? [];
  const jobCriticalMissing = jobList.filter((j) => !j.description).length;
  const jobScores = jobList.map((j) => {
    let s = 100;
    if (!j.description) s -= 20;
    if (!j.company_id) s -= 20;
    if (!j.title) s -= 20;
    return Math.max(s - 15, 30);
  });
  const jobAvg =
    jobScores.length > 0
      ? Math.round(jobScores.reduce((a, b) => a + b, 0) / jobScores.length)
      : 0;

  return {
    companies: {
      total: companyList.length,
      avgScore: companyAvg,
      criticalMissing: companyCriticalMissing,
    },
    candidates: {
      total: candidateList.length,
      avgScore: candidateAvg,
      criticalMissing: candidateCriticalMissing,
    },
    jobs: {
      total: jobList.length,
      avgScore: jobAvg,
      criticalMissing: jobCriticalMissing,
    },
  };
}
